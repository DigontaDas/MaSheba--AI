-- Fix: Set NULL columns in auth.users to empty strings.
-- GoTrue's DB scanner throws "Database error querying schema" if these nullable string columns contain NULL.

UPDATE auth.users SET
  confirmation_token = COALESCE(confirmation_token, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  recovery_token = COALESCE(recovery_token, '');
