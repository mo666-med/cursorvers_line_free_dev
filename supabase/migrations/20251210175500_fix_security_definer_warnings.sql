-- Migration: Fix SECURITY DEFINER warnings for broadcast stats views
-- Description: Explicitly set SECURITY INVOKER for broadcast statistics views to resolve Supabase Advisor warnings.

ALTER VIEW public.line_card_broadcasts_daily_stats 
SET (security_invoker = on);

ALTER VIEW public.line_card_broadcasts_theme_stats 
SET (security_invoker = on);
