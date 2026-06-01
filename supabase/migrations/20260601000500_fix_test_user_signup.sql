-- PostgreSQL trigger to automatically synchronize auth.users entries to public profiles (chws or mothers)
-- Recreated to remove the '.test' and '.local' bypass check so sandbox and test users can successfully register and log in.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
  user_name text;
  user_clinic_code text;
  chw_union text := 'Shibpur Union';
  chw_upazila text := 'Narsingdi Sadar';
  gestational_weeks integer;
begin
  user_role := lower(coalesce(new.raw_user_meta_data->>'role', 'mother'));
  user_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));
  user_clinic_code := new.raw_user_meta_data->>'clinic_code';

  if user_role = 'chw' then
    -- Basic parsing of entered clinic code to associate with known unions/upazilas
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

    insert into public.chws (auth_user_id, name, union_name, upazila, is_active)
    values (new.id, user_name, chw_union, chw_upazila, true)
    on conflict (auth_user_id) do nothing;

  else
    -- Default to mother role
    gestational_weeks := coalesce((new.raw_user_meta_data->>'gestational_age_weeks')::integer, 12);
    if gestational_weeks not between 1 and 45 then
      gestational_weeks := 12;
    end if;

    insert into public.mothers (auth_user_id, name, phone, gestational_age_weeks, is_active)
    values (
      new.id,
      user_name,
      new.raw_user_meta_data->>'phone',
      gestational_weeks,
      true
    )
    on conflict (auth_user_id) do nothing;
  end if;

  return new;
end;
$$;
