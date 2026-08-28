GRANT EXECUTE ON FUNCTION public.can_read_business(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_write_business(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_business(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_tenant_admin(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.tenant_role_of(uuid, uuid) TO anon, authenticated, service_role;