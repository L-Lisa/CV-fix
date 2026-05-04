-- Allow Layout 4 (Harvard / Ivy League) on cvs.
-- The original constraint was inline in 20260314_initial_schema.sql:
--   check (layout in (1, 2, 3))
-- Postgres auto-named it cvs_layout_check. Drop and re-add with the
-- new value list. No data migration needed — all existing rows have
-- layout in (1, 2, 3) which remains valid.

alter table cvs drop constraint cvs_layout_check;
alter table cvs add constraint cvs_layout_check check (layout in (1, 2, 3, 4));
