-- Migration: auto-create confirmed_sale when order status transitions to 'completed'

create or replace function fn_create_confirmed_sale()
returns trigger as $$
declare
  v_listing listings%rowtype;
begin
  -- Only fire when transitioning into 'completed' for the first time
  if NEW.status = 'completed' and (OLD.status is null or OLD.status != 'completed') then
    select * into v_listing from listings where id = NEW.listing_id;

    insert into confirmed_sales (
      card_base_id,
      order_id,
      buyer_id,
      seller_id,
      grade,
      grade_company,
      pristine,
      language,
      sale_price,
      sold_at
    ) values (
      v_listing.card_base_id,
      NEW.id,
      NEW.buyer_id,
      NEW.seller_id,
      v_listing.grade,
      v_listing.grade_company,
      v_listing.pristine,
      v_listing.language,
      NEW.price,
      coalesce(NEW.completed_at, now())
    )
    on conflict (order_id) do nothing;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger tr_orders_create_confirmed_sale
  after update on orders
  for each row
  execute function fn_create_confirmed_sale();
