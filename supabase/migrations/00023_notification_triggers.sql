-- ============================================
-- Notification event wiring (4.1, Phase 3).
--
-- Triggers create in-app notifications when the relevant state changes. Using
-- triggers (rather than editing each RPC) means notifications fire no matter
-- where the change came from: client RPC, the Mercado Pago webhook, or an
-- admin action. Each calls create_notification() from migration 00022.
-- ============================================

-- ── Orders: new order, payment, shipping, delivery, completion, cancel ──
create or replace function notify_order_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card text;
  v_link text;
begin
  select coalesce(cb.name, 'sua carta') into v_card
    from listings l
    join card_bases cb on cb.id = l.card_base_id
   where l.id = new.listing_id;
  v_link := '/checkout/' || new.id::text;

  if (tg_op = 'INSERT') then
    -- A buyer started a purchase of the seller's card.
    perform create_notification(
      new.seller_id, 'new_order', 'Novo pedido',
      'Você recebeu um novo pedido de ' || v_card || '.', v_link,
      jsonb_build_object('order_id', new.id)
    );
    return null;
  end if;

  -- UPDATE: only act on a real status transition.
  if (new.status is distinct from old.status) then
    if (new.status = 'payment_confirmed') then
      perform create_notification(new.buyer_id, 'payment_confirmed', 'Pagamento confirmado',
        'Seu pagamento de ' || v_card || ' foi confirmado.', v_link, jsonb_build_object('order_id', new.id));
      perform create_notification(new.seller_id, 'payment_confirmed', 'Pagamento confirmado',
        'O pagamento de ' || v_card || ' foi confirmado. Prepare o envio.', v_link, jsonb_build_object('order_id', new.id));

    elsif (new.status = 'shipped') then
      perform create_notification(new.buyer_id, 'order_shipped', 'Pedido enviado',
        'Seu pedido de ' || v_card || ' foi enviado.', v_link, jsonb_build_object('order_id', new.id));

    elsif (new.status = 'delivered') then
      -- In the current flow the BUYER sets 'delivered' by confirming receipt,
      -- so we confirm it back to the buyer and notify the seller it happened.
      perform create_notification(new.buyer_id, 'order_delivered', 'Recebimento confirmado',
        'Você confirmou o recebimento de ' || v_card || '. Obrigado!', v_link, jsonb_build_object('order_id', new.id));
      perform create_notification(new.seller_id, 'receipt_confirmed', 'Comprador confirmou o recebimento',
        'O comprador confirmou o recebimento de ' || v_card || '.', v_link, jsonb_build_object('order_id', new.id));

    elsif (new.status = 'completed') then
      perform create_notification(new.seller_id, 'funds_available', 'Saldo liberado',
        'O valor de ' || v_card || ' foi liberado para saque.', v_link, jsonb_build_object('order_id', new.id));

    elsif (new.status = 'cancelled') then
      perform create_notification(new.buyer_id, 'order_cancelled', 'Pedido cancelado',
        'Seu pedido de ' || v_card || ' foi cancelado.', v_link, jsonb_build_object('order_id', new.id));
      perform create_notification(new.seller_id, 'order_cancelled', 'Pedido cancelado',
        'O pedido de ' || v_card || ' foi cancelado.', v_link, jsonb_build_object('order_id', new.id));
    end if;
    -- 'disputed' is handled by the disputes trigger to include context.
  end if;

  return null;
end;
$$;

drop trigger if exists trg_notify_order on orders;
create trigger trg_notify_order
  after insert or update on orders
  for each row execute function notify_order_event();

-- ── Questions: new question to seller, answer to asker ──
create or replace function notify_question_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_card_id uuid;
  v_link text;
begin
  select l.seller_id, l.card_base_id into v_seller, v_card_id
    from listings l where l.id = new.listing_id;
  v_link := '/card/' || coalesce(v_card_id::text, '');

  if (tg_op = 'INSERT') then
    perform create_notification(v_seller, 'question_received', 'Nova pergunta',
      'Você recebeu uma nova pergunta em um anúncio.', v_link, jsonb_build_object('listing_id', new.listing_id));
  elsif (tg_op = 'UPDATE' and old.answer is null and new.answer is not null) then
    perform create_notification(new.user_id, 'question_answered', 'Pergunta respondida',
      'O vendedor respondeu sua pergunta.', v_link, jsonb_build_object('listing_id', new.listing_id));
  end if;

  return null;
end;
$$;

drop trigger if exists trg_notify_question on questions;
create trigger trg_notify_question
  after insert or update on questions
  for each row execute function notify_question_event();

-- ── Messages: notify the other order participant ──
create or replace function notify_message_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_seller uuid;
  v_recipient uuid;
begin
  select buyer_id, seller_id into v_buyer, v_seller from orders where id = new.order_id;
  v_recipient := case when new.sender_id = v_buyer then v_seller else v_buyer end;

  perform create_notification(v_recipient, 'order_message', 'Nova mensagem',
    'Você recebeu uma nova mensagem em um pedido.', '/checkout/' || new.order_id::text,
    jsonb_build_object('order_id', new.order_id));

  return null;
end;
$$;

drop trigger if exists trg_notify_message on messages;
create trigger trg_notify_message
  after insert on messages
  for each row execute function notify_message_event();

-- ── Disputes: opened (to seller), updated/resolved (to both) ──
create or replace function notify_dispute_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer uuid;
  v_seller uuid;
  v_link text;
begin
  select buyer_id, seller_id into v_buyer, v_seller from orders where id = new.order_id;
  v_link := '/checkout/' || new.order_id::text;

  if (tg_op = 'INSERT') then
    perform create_notification(v_seller, 'dispute_opened', 'Disputa aberta',
      'Uma disputa foi aberta em um dos seus pedidos.', v_link, jsonb_build_object('order_id', new.order_id, 'dispute_id', new.id));
  elsif (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    if (new.status in ('resolved_buyer', 'resolved_seller', 'closed')) then
      perform create_notification(v_buyer, 'dispute_updated', 'Disputa resolvida',
        'A disputa do seu pedido foi resolvida.', v_link, jsonb_build_object('order_id', new.order_id, 'dispute_id', new.id));
      perform create_notification(v_seller, 'dispute_updated', 'Disputa resolvida',
        'A disputa do seu pedido foi resolvida.', v_link, jsonb_build_object('order_id', new.order_id, 'dispute_id', new.id));
    else
      perform create_notification(v_buyer, 'dispute_updated', 'Disputa atualizada',
        'Houve uma atualização na disputa do seu pedido.', v_link, jsonb_build_object('order_id', new.order_id, 'dispute_id', new.id));
      perform create_notification(v_seller, 'dispute_updated', 'Disputa atualizada',
        'Houve uma atualização na disputa do seu pedido.', v_link, jsonb_build_object('order_id', new.order_id, 'dispute_id', new.id));
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_notify_dispute on disputes;
create trigger trg_notify_dispute
  after insert or update on disputes
  for each row execute function notify_dispute_event();

-- ── Withdrawals: paid or rejected ──
create or replace function notify_withdrawal_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount text;
begin
  if (new.status is distinct from old.status) then
    v_amount := 'R$ ' || trim(to_char(new.amount_paid_centavos / 100.0, '999999990.00'));
    if (new.status = 'completed') then
      perform create_notification(new.seller_id, 'withdrawal_paid', 'Saque pago',
        'Seu saque de ' || v_amount || ' foi processado.', '/me', jsonb_build_object('withdrawal_id', new.id));
    elsif (new.status = 'rejected') then
      perform create_notification(new.seller_id, 'withdrawal_rejected', 'Saque rejeitado',
        'Seu pedido de saque foi rejeitado.', '/me', jsonb_build_object('withdrawal_id', new.id));
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists trg_notify_withdrawal on withdrawals;
create trigger trg_notify_withdrawal
  after update on withdrawals
  for each row execute function notify_withdrawal_event();
