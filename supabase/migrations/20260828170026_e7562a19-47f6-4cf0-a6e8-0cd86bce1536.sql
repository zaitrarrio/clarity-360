REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_tenant_admin(uuid, uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_read_business(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_write_business(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_business(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_platform_admin(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tenant_role_of(uuid, uuid) FROM anon, authenticated;