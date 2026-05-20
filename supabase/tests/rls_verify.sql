-- Run after migrations and seed data against the linked live Supabase project.
-- Expected:
--   1. CHW_A can see only CHW_A patients.
--   2. CHW_A direct query for CHW_B patients returns 0.
--   3. CHW_A insert using CHW_B chw_id is rejected by RLS.

begin;

create temporary table rls_verify_results (
  check_name text not null,
  result_value text not null,
  evidence text
) on commit drop;

grant insert, select on rls_verify_results to authenticated;

set local role authenticated;

select set_config(
  'request.jwt.claim.sub',
  '956b1219-aff5-42d4-bcca-75c4251b601d',
  true
);

insert into rls_verify_results (check_name, result_value, evidence)
select
  'chw_a_visible_patient_count',
  count(*)::text,
  'Rows visible to CHW_A under authenticated role'
from public.patients;

insert into rls_verify_results (check_name, result_value, evidence)
select
  'chw_a_visible_chw_b_patient_count',
  count(*)::text,
  'Rows with CHW_B chw_id visible to CHW_A under authenticated role'
from public.patients
where chw_id = '00000000-0000-0000-0000-0000000000b2';

do $$
declare
  insert_rejected boolean := false;
  rejection_message text := null;
begin
  set local role authenticated;
  perform set_config('request.jwt.claim.sub', '956b1219-aff5-42d4-bcca-75c4251b601d', true);

  begin
    insert into public.patients (
      id,
      chw_id,
      name,
      age,
      gestational_age_weeks,
      last_risk_level
    )
    values (
      '99999999-9999-9999-9999-999999999991',
      '00000000-0000-0000-0000-0000000000b2',
      'RLS Cross CHW Insert Probe',
      24,
      28,
      'LOW'
    );
  exception
    when insufficient_privilege or check_violation then
      insert_rejected := true;
      rejection_message := sqlerrm;
  end;

  reset role;

  insert into rls_verify_results (check_name, result_value, evidence)
  values (
    'chw_a_cross_chw_insert_rejected',
    insert_rejected::text,
    coalesce(rejection_message, 'insert unexpectedly succeeded')
  );

  if not insert_rejected then
    raise exception 'RLS failure: CHW_A inserted a CHW_B patient row';
  end if;
end $$;

select check_name, result_value, evidence
from rls_verify_results
order by check_name;

rollback;
