create or replace function public.process_outbox_batch(events jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  event_item jsonb;
  event_key text;
  event_type_value text;
  event_payload jsonb;
  event_device_id text;
  event_chw_id uuid;
  patient_id_value uuid;
  visit_id_value uuid;
  status_value text;
  error_value text;
  affected_count integer;
  results jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(events) <> 'array' then
    raise exception 'events must be a JSON array';
  end if;

  for event_item in select value from jsonb_array_elements(events)
  loop
    event_key := event_item->>'idempotency_key';
    event_type_value := event_item->>'event_type';
    event_payload := coalesce(event_item->'payload', '{}'::jsonb);
    event_device_id := coalesce(event_item->>'device_id', event_payload->>'device_id');
    event_chw_id := null;
    affected_count := 0;
    status_value := null;
    error_value := null;

    begin
      if event_key is null or length(trim(event_key)) = 0 then
        raise exception 'idempotency_key is required';
      end if;

      if exists (select 1 from public.outbox_events where idempotency_key = event_key) then
        status_value := 'DUPLICATE';
      else
        event_chw_id := nullif(event_payload->>'chw_id', '')::uuid;

        if event_chw_id is null then
          raise exception 'payload.chw_id is required';
        end if;

        if event_device_id is null or length(trim(event_device_id)) = 0 then
          raise exception 'device_id is required';
        end if;

        if event_type_value = 'patient_upsert' then
          patient_id_value := nullif(event_payload->>'patient_id', '')::uuid;

          insert into public.patients (
            id,
            chw_id,
            name,
            age,
            gestational_age_weeks,
            last_risk_level
          )
          values (
            coalesce(patient_id_value, gen_random_uuid()),
            event_chw_id,
            event_payload->>'name',
            (event_payload->>'age')::integer,
            (event_payload->>'gestational_age_weeks')::integer,
            (event_payload->>'last_risk_level')::public.risk_level
          )
          on conflict (id) do update set
            name = excluded.name,
            age = excluded.age,
            gestational_age_weeks = excluded.gestational_age_weeks,
            last_risk_level = excluded.last_risk_level
          where public.patients.chw_id = excluded.chw_id;

          get diagnostics affected_count = row_count;
          if affected_count = 0 then
            raise exception 'patient does not belong to CHW';
          end if;

        elsif event_type_value = 'visit_create' then
          patient_id_value := nullif(event_payload->>'patient_id', '')::uuid;
          visit_id_value := coalesce(nullif(event_payload->>'visit_id', '')::uuid, gen_random_uuid());

          if event_payload ? 'patient' then
            insert into public.patients (
              id,
              chw_id,
              name,
              age,
              gestational_age_weeks,
              last_risk_level
            )
            values (
              patient_id_value,
              event_chw_id,
              event_payload->'patient'->>'name',
              (event_payload->'patient'->>'age')::integer,
              (event_payload->'patient'->>'gestational_age_weeks')::integer,
              coalesce(event_payload->'patient'->>'last_risk_level', event_payload->>'risk_level')::public.risk_level
            )
            on conflict (id) do update set
              name = excluded.name,
              age = excluded.age,
              gestational_age_weeks = excluded.gestational_age_weeks,
              last_risk_level = excluded.last_risk_level
            where public.patients.chw_id = excluded.chw_id;

            get diagnostics affected_count = row_count;
            if affected_count = 0 then
              raise exception 'patient does not belong to CHW';
            end if;
          end if;

          insert into public.visits (
            id,
            patient_id,
            chw_id,
            bp_systolic,
            bp_diastolic,
            weight_kg,
            hemoglobin,
            swelling_present,
            symptom_flags,
            risk_level,
            visited_at,
            device_id
          )
          values (
            visit_id_value,
            patient_id_value,
            event_chw_id,
            (event_payload->>'bp_systolic')::integer,
            (event_payload->>'bp_diastolic')::integer,
            (event_payload->>'weight_kg')::numeric,
            (event_payload->>'hemoglobin')::numeric,
            coalesce((event_payload->>'swelling_present')::boolean, false),
            coalesce(event_payload->'symptom_flags', '{}'::jsonb),
            (event_payload->>'risk_level')::public.risk_level,
            (event_payload->>'visited_at')::timestamptz,
            event_device_id
          )
          on conflict (id) do nothing;

          update public.patients
          set last_risk_level = (event_payload->>'risk_level')::public.risk_level
          where id = patient_id_value
            and chw_id = event_chw_id;
        else
          raise exception 'unsupported event_type %', event_type_value;
        end if;

        insert into public.outbox_events (
          idempotency_key,
          chw_id,
          device_id,
          event_type,
          payload,
          status,
          synced_at
        )
        values (
          event_key,
          event_chw_id,
          event_device_id,
          event_type_value,
          event_payload,
          'SYNCED',
          now()
        );

        status_value := 'SYNCED';
      end if;
    exception
      when others then
        status_value := 'FAILED';
        error_value := left(sqlerrm, 500);

        if event_key is not null
          and length(trim(event_key)) > 0
          and event_chw_id is not null
          and exists (select 1 from public.chws where id = event_chw_id)
        then
          insert into public.outbox_events (
            idempotency_key,
            chw_id,
            device_id,
            event_type,
            payload,
            status,
            error_message
          )
          values (
            event_key,
            event_chw_id,
            coalesce(event_device_id, 'unknown'),
            coalesce(event_type_value, 'patient_upsert'),
            coalesce(event_payload, '{}'::jsonb),
            'FAILED',
            error_value
          )
          on conflict (idempotency_key) do update set
            status = 'FAILED',
            error_message = excluded.error_message;
        end if;
    end;

    results := results || jsonb_build_array(
      jsonb_strip_nulls(
        jsonb_build_object(
          'idempotency_key', event_key,
          'status', status_value,
          'error', error_value
        )
      )
    );
  end loop;

  return results;
end;
$$;

grant execute on function public.process_outbox_batch(jsonb) to service_role;
