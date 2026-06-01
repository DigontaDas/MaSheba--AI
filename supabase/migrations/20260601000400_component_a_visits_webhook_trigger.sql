-- Migration: 20260601000400_component_a_visits_webhook_trigger.sql
-- Enable pg_net extension to support database-level asynchronous HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create high-risk visit trigger function
CREATE OR REPLACE FUNCTION public.handle_high_risk_visit_sms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    patient_name TEXT;
    mother_phone TEXT;
    backend_url TEXT;
    sms_message TEXT;
    request_id BIGINT;
BEGIN
    -- Only trigger for HIGH risk level visits
    IF NEW.risk_level = 'HIGH' THEN
        -- Resolve patient name
        SELECT name INTO patient_name 
        FROM public.patients 
        WHERE id = NEW.patient_id;

        -- Resolve mother's phone number
        SELECT phone INTO mother_phone 
        FROM public.mothers 
        WHERE patient_id = NEW.patient_id
        LIMIT 1;

        -- Fallback if no phone is found
        IF mother_phone IS NULL OR mother_phone = '' THEN
            mother_phone := '01700000000';
        END IF;

        -- Determine backend webhook URL dynamically with fallback
        -- Allows local development to override setting via 'app.settings.backend_url'
        backend_url := COALESCE(
            NULLIF(current_setting('app.settings.backend_url', true), ''),
            'https://maasheba-backend.onrender.com/api/v1/alerts/sms'
        );

        -- Construct standard Bangla alert message
        sms_message := 'মাশেবা সতর্কবার্তা: গর্ভবতী মা ' || COALESCE(patient_name, 'রোগী') || 
                       ' এর রক্তচাপ বা অন্য কোনো ঝুঁকিপূর্ণ লক্ষণ অত্যন্ত বিপজ্জনক পর্যায়ে রয়েছে। অনুগ্রহ করে দ্রুত চিকিৎসকের পরামর্শ নিন বা হাসপাতালে যোগাযোগ করুন।';

        -- Asynchronously dispatch via pg_net http_post
        BEGIN
            SELECT net.http_post(
                url := backend_url,
                headers := '{"Content-Type": "application/json"}'::jsonb,
                body := json_build_object(
                    'visit_id', NEW.id,
                    'phone_number', mother_phone,
                    'message', sms_message
                )::jsonb
            ) INTO request_id;

            RAISE NOTICE 'Scheduled high-risk SMS notification for patient %, phone %, request id %', 
                         patient_name, mother_phone, request_id;
        EXCEPTION WHEN OTHERS THEN
            -- Defensively catch errors if pg_net is not fully configured, so database insertions do not fail
            RAISE WARNING 'Failed to dispatch high-risk visit SMS webhook: %', SQLERRM;
        END;
    END IF;
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_high_risk_visit_insert ON public.visits;
CREATE TRIGGER on_high_risk_visit_insert
AFTER INSERT ON public.visits
FOR EACH ROW
EXECUTE FUNCTION public.handle_high_risk_visit_sms();
