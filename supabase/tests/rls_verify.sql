-- Run after migrations and seed data against the linked live Supabase project.
-- Expected:
--   1. CHW_A can see only CHW_A patients.
--   2. CHW_A direct query for CHW_B patients returns 0.
--   3. CHW_A insert using CHW_B chw_id is rejected by RLS.
--   4. A mother can review only her currently assigned CHW.
--   5. CHWs can read reviews for themselves but not removed reviews.
--   6. A mother can create only one pending reassignment request.
--   7. public.spatial_ref_sys has RLS enabled when PostGIS creates it.

begin;

create temporary table rls_verify_results (
  check_name text not null,
  result_value text not null,
  evidence text
) on commit drop;

grant insert, select on rls_verify_results to authenticated;

do $$
declare
  rahima_auth_user_id uuid;
  rahima_mother_id uuid;
  duplicate_reassignment_rejected boolean := false;
  duplicate_reassignment_message text := null;
  cross_chw_review_rejected boolean := false;
  cross_chw_review_message text := null;
  removed_visible_count integer := 0;
begin
  if to_regclass('public.spatial_ref_sys') is not null and not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'spatial_ref_sys'
      and c.relrowsecurity
  ) then
    raise exception 'RLS failure: public.spatial_ref_sys does not have RLS enabled';
  end if;

  select m.auth_user_id, m.id
  into rahima_auth_user_id, rahima_mother_id
  from public.mothers m
  where m.patient_id = '11111111-1111-1111-1111-111111111102'
  limit 1;

  if rahima_auth_user_id is null or rahima_mother_id is null then
    raise exception 'RLS verification seed mother Rahima was not found';
  end if;

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', rahima_auth_user_id::text, true);

  insert into public.chw_reviews (
    id,
    mother_id,
    chw_id,
    rating,
    review_text
  )
  values (
    '99999999-9999-9999-9999-999999999921',
    rahima_mother_id,
    '00000000-0000-0000-0000-0000000000a1',
    5,
    'RLS own CHW review probe'
  );

  insert into rls_verify_results (check_name, result_value, evidence)
  values (
    'mother_can_review_assigned_chw',
    'true',
    'Rahima inserted a review for her assigned CHW_A under authenticated role'
  );

  begin
    insert into public.chw_reviews (
      id,
      mother_id,
      chw_id,
      rating,
      review_text
    )
    values (
      '99999999-9999-9999-9999-999999999922',
      rahima_mother_id,
      '00000000-0000-0000-0000-0000000000b2',
      1,
      'RLS cross CHW review probe'
    );
  exception
    when insufficient_privilege or check_violation or unique_violation then
      cross_chw_review_rejected := true;
      cross_chw_review_message := sqlerrm;
  end;

  insert into rls_verify_results (check_name, result_value, evidence)
  values (
    'mother_cross_chw_review_rejected',
    cross_chw_review_rejected::text,
    coalesce(cross_chw_review_message, 'cross-CHW review unexpectedly succeeded')
  );

  if not cross_chw_review_rejected then
    raise exception 'RLS failure: mother inserted review for unassigned CHW';
  end if;

  insert into public.chw_reassignment_requests (
    id,
    mother_id,
    current_chw_id,
    reason,
    note
  )
  values (
    '99999999-9999-9999-9999-999999999931',
    rahima_mother_id,
    '00000000-0000-0000-0000-0000000000a1',
    'not_responding',
    'RLS pending reassignment probe'
  );

  begin
    insert into public.chw_reassignment_requests (
      id,
      mother_id,
      current_chw_id,
      reason,
      note
    )
    values (
      '99999999-9999-9999-9999-999999999932',
      rahima_mother_id,
      '00000000-0000-0000-0000-0000000000a1',
      'other',
      'RLS duplicate reassignment probe'
    );
  exception
    when unique_violation then
      duplicate_reassignment_rejected := true;
      duplicate_reassignment_message := sqlerrm;
  end;

  insert into rls_verify_results (check_name, result_value, evidence)
  values (
    'mother_duplicate_pending_reassignment_rejected',
    duplicate_reassignment_rejected::text,
    coalesce(duplicate_reassignment_message, 'duplicate pending request unexpectedly succeeded')
  );

  if not duplicate_reassignment_rejected then
    raise exception 'RLS failure: mother inserted duplicate pending reassignment request';
  end if;

  reset role;

  update public.chw_reviews
  set status = 'removed',
      moderation_reason = 'RLS removed review visibility probe',
      moderated_at = now()
  where id = '99999999-9999-9999-9999-999999999921';

  set local role authenticated;
  perform set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

  select count(*) into removed_visible_count
  from public.chw_reviews
  where id = '99999999-9999-9999-9999-999999999921';

  insert into rls_verify_results (check_name, result_value, evidence)
  values (
    'removed_review_hidden_from_chw',
    removed_visible_count::text,
    'CHW_A visible count for a removed review under authenticated role'
  );

  if removed_visible_count <> 0 then
    raise exception 'RLS failure: CHW can see removed review';
  end if;

  reset role;
end $$;

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
