# GradedBR — Guia de Administração

## Visão Geral

GradedBR é um marketplace brasileiro para cartas Pokémon graduadas. Este guia cobre as operações administrativas do dia a dia.

---

## Acesso ao Painel Admin

1. Faça login com uma conta que tenha `role = 'admin'` no banco de dados
2. Acesse `/admin` no navegador
3. O painel tem 3 abas: **Pedidos**, **Vendedores** e **Disputas**

---

## Fluxo de um Pedido

```
Comprador clica "Comprar"
  → Pedido criado (Aguardando Pagamento)
  → Anúncio reservado (não aparece mais no marketplace)
  → Comprador tem 20 minutos para pagar via Mercado Pago
  → Se não pagar: pedido cancelado automaticamente, anúncio volta a ficar ativo

Pagamento confirmado (webhook do Mercado Pago)
  → Status muda para "Pago"
  → Anúncio marcado como "Vendido"
  → Vendedor vê campo para código de rastreamento

Vendedor marca como enviado (insere código de rastreamento)
  → Status muda para "Enviado"
  → Comprador e admin podem ver o código

Comprador confirma recebimento
  → Status muda para "Entregue"

Admin libera pagamento ao vendedor
  → Status muda para "Concluído"
  → Venda registrada no histórico (confirmed_sales)
```

---

## Operações do Admin

### Aba Pedidos
- **Ver todos os pedidos** com status, comprador, vendedor, valor e data
- **Liberar pagamento**: quando o comprador confirma o recebimento, clique em "Liberar pagamento" para mover o pedido para "Concluído"
- Os detalhes do pagamento Mercado Pago (ID do pagamento) aparecem no card do pedido

### Aba Vendedores
- **Lista de vendedores** com nome da loja, total de vendas, nota e status de verificação
- **Verificar vendedor**: marque vendedores confiáveis como verificados (selo de confiança)
- Vendedores **não verificados** têm limites de antifraude:
  - Máximo de anúncios ativos (padrão: 5)
  - Preço máximo por anúncio (padrão: R$ 500,00)

### Aba Disputas
- **Badge com contagem** de disputas abertas aparece na aba
- **Ver detalhes** da disputa: motivo, descrição, quem abriu
- **Resolver disputa**: escolha entre "A favor do comprador" ou "A favor do vendedor", adicione notas do admin

---

## Configurações da Plataforma

As configurações ficam na tabela `platform_config` no Supabase:

| Chave | Valor Padrão | Descrição |
|-------|-------------|-----------|
| `commission_rate` | `10.00` | Taxa de comissão (%) cobrada do vendedor |
| `auto_complete_days` | `7` | Dias para auto-completar após entrega |
| `new_seller_max_listings` | `5` | Máx. anúncios ativos para vendedores novos |
| `new_seller_max_price` | `50000` | Preço máximo (centavos) para vendedores novos |

Para alterar, edite diretamente no Supabase Dashboard → Table Editor → `platform_config`.

---

## Frete

O frete é calculado automaticamente com base no CEP de origem (vendedor) e destino (comprador):

| Distância | Valor |
|-----------|-------|
| Mesma região | R$ 15,00 |
| Região vizinha | R$ 25,00 |
| Região distante | R$ 35,00 |

Anúncios com "frete grátis" não cobram frete do comprador.

---

## Sessão e Segurança

- **Timeout por inatividade**: 3 horas sem interação = logout automático
- **Expiração de pedidos**: pedidos não pagos são cancelados automaticamente após 20 minutos
- **Antifraude**: vendedores novos (não verificados) têm limites de preço e quantidade de anúncios

---

## Supabase — Estrutura do Banco

### Tabelas Principais
- `profiles` — usuários (buyer, seller, admin)
- `seller_profiles` — dados adicionais do vendedor (loja, verificação, nota)
- `card_bases` — cartas Pokémon (nome, set, número, tipo)
- `listings` — anúncios de cartas à venda
- `orders` — pedidos (com status, rastreamento, pagamento)
- `confirmed_sales` — histórico de vendas confirmadas (imutável)
- `reviews` — avaliações do comprador + resposta do vendedor
- `questions` — perguntas públicas nos anúncios
- `messages` — mensagens privadas entre comprador e vendedor
- `disputes` — disputas abertas por compradores

### Storage
- Bucket `listing-images` (público) — fotos dos anúncios
- Organização: `{user_id}/{listing_id}/{index}_{timestamp}.{ext}`

---

## Mercado Pago

- **Ambiente**: configurado via variável `MERCADO_PAGO_SANDBOX=true/false`
- **Webhook**: `/api/webhooks/mercado-pago` — recebe notificações de pagamento
- **Fluxo**: criação de preferência → pagamento no MP → webhook confirma → admin libera

### Variáveis de Ambiente
```
MERCADO_PAGO_ACCESS_TOKEN=       # Token de acesso do MP
MERCADO_PAGO_SANDBOX=true        # true para testes, false para produção
NEXT_PUBLIC_APP_URL=             # URL da aplicação (para callbacks)
NEXT_PUBLIC_SUPABASE_URL=        # URL do projeto Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Chave anônima do Supabase
SUPABASE_SERVICE_ROLE_KEY=       # Chave de serviço (apenas servidor)
```

---

## Deploy

1. Faça push do código para o repositório Git
2. Conecte o repositório ao Vercel
3. Configure as variáveis de ambiente no Vercel
4. Conecte o domínio personalizado no Vercel
5. Atualize `NEXT_PUBLIC_APP_URL` para o domínio final
6. Mude `MERCADO_PAGO_SANDBOX=false` para produção
