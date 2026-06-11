CREATE POLICY "mothers_insert_own_requests" ON public.connection_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mothers
      WHERE id = connection_requests.mother_id
        AND auth_user_id = auth.uid()
    )
  );
