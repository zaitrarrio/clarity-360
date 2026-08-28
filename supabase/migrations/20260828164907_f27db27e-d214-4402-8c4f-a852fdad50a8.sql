insert into public.tenants (slug, name, status, is_default, branding, email_from_name)
values (
  'mercury',
  'Mercury',
  'active',
  false,
  jsonb_build_object(
    'productName', 'Clarity 360',
    'logoText', 'Clarity 360',
    'colorScheme', 'dark',
    'fontDisplay', '"Inter", ui-sans-serif, system-ui, sans-serif',
    'fontSans', '"Inter", ui-sans-serif, system-ui, sans-serif',
    'fontLinkHref', 'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600&display=swap',
    'heroTitle', 'Orchestrate your growth',
    'heroBody', 'Clarity 360 turns an idea into a living seven-domain operating plan — held by Clara, worked by agents that run actions and watch for change.',
    'footerText', 'Clarity 360 — powered by the Mercury design system',
    'colors', jsonb_build_object(
      'background', 'oklch(0.235 0.033 288)',
      'foreground', 'oklch(0.955 0.01 90)',
      'card', 'oklch(0.272 0.036 288)',
      'primary', 'oklch(0.681 0.172 283)',
      'primary-foreground', 'oklch(0.16 0.03 288)',
      'muted-foreground', 'oklch(0.72 0.03 288)',
      'border', 'oklch(0.37 0.035 288)',
      'ember', 'oklch(0.681 0.172 283)',
      'ember-soft', 'oklch(0.75 0.15 285)',
      'ember-deep', 'oklch(0.566 0.188 283)',
      'ink', 'oklch(0.16 0.03 288)',
      'parchment', 'oklch(0.31 0.038 288)',
      'linen', 'oklch(0.272 0.036 288)'
    )
  ),
  'Clarity 360'
)
on conflict (slug) do update set branding = excluded.branding, name = excluded.name;