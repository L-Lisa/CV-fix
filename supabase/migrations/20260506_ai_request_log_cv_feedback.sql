-- v1.4 adds /api/ai/cv-feedback. Extend the ai_request_log.route CHECK
-- constraint to accept the new value so the per-user rate limiter
-- (lib/ai/rate-limit.ts) can persist calls under it. Same shape as the
-- 20260505_layout_4 pattern: drop and re-add the constraint with the
-- expanded value list. No data migration needed.

alter table ai_request_log drop constraint ai_request_log_route_check;
alter table ai_request_log
  add constraint ai_request_log_route_check
  check (route in ('profile', 'description', 'skills', 'keywords', 'cv-feedback'));
