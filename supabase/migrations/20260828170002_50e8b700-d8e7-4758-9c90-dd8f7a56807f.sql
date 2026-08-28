INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users
WHERE lower(email) IN ('zaitrarrio@gmail.com', 'zcollier@advancedai.ai')
ON CONFLICT (user_id) DO NOTHING;