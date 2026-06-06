-- Migration: Backfill missing public.chws rows from auth.users
do $$
declare
  r record;
  user_name text;
  chw_union text;
  chw_upazila text;
  user_clinic_code text;
begin
  for r in (
    select id, email, raw_user_meta_data
    from auth.users
    where lower(coalesce(raw_user_meta_data->>'role', '')) in ('chw', 'health_worker')
  ) loop
    -- Only insert if not already present in public.chws
    if not exists (select 1 from public.chws where auth_user_id = r.id) then
      user_name := coalesce(r.raw_user_meta_data->>'name', split_part(r.email, '@', 1));
      chw_union := coalesce(r.raw_user_meta_data->>'working_area', 'Shibpur Union');
      chw_upazila := 'Narsingdi Sadar';
      user_clinic_code := r.raw_user_meta_data->>'clinic_code';

      if user_clinic_code is not null then
        if lower(user_clinic_code) like '%palash%' then
          chw_union := 'Palash Union';
          chw_upazila := 'Palash';
        elsif lower(user_clinic_code) like '%putia%' or lower(user_clinic_code) like '%shibpur%' then
          chw_union := 'Putia Union';
          chw_upazila := 'Shibpur';
        elsif lower(user_clinic_code) like '%radhanagar%' or lower(user_clinic_code) like '%raipura%' then
          chw_union := 'Radhanagar Union';
          chw_upazila := 'Raipura';
        end if;
      end if;

      insert into public.chws (
        auth_user_id,
        name,
        union_name,
        upazila,
        is_active,
        organization_name,
        worker_type,
        years_of_experience,
        certificate_url,
        verification_status
      )
      values (
        r.id,
        user_name,
        chw_union,
        chw_upazila,
        true, -- For existing auth users backfilled, set as active
        r.raw_user_meta_data->>'organization_name',
        r.raw_user_meta_data->>'worker_type',
        coalesce((r.raw_user_meta_data->>'years_of_experience')::integer, 0),
        r.raw_user_meta_data->>'certificate_url',
        'APPROVED' -- For existing auth users backfilled, set as approved
      )
      on conflict (auth_user_id) do nothing;
    end if;
  end loop;
end $$;
