-- ============================================
-- Add columns to remember the rejected PIX key value
-- so sellers can see what was rejected (not just the reason).
-- ============================================

alter table seller_pix
  add column if not exists rejected_pix_key text,
  add column if not exists rejected_pix_key_type pix_key_type;
