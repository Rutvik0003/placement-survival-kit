-- Placement Survival Kit — Phase 5 fix
-- Marking a company "Ghosted" is the *absence* of contact, so it must not reset
-- last_contact_at (the graveyard's "days of silence" counts from it).
create or replace function public.companies_before_update()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  if new.status is distinct from old.status then
    new.status_changed_at := now();
    if new.status <> 'ghosted' then
      new.last_contact_at := now();
    end if;
  end if;
  return new;
end $$;
