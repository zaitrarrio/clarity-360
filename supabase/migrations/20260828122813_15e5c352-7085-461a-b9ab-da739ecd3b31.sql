UPDATE public.agents SET name = CASE agent_key
  WHEN 'market' THEN 'Market Agent'
  WHEN 'offer' THEN 'Offer Agent'
  WHEN 'growth' THEN 'Growth Agent'
  WHEN 'operations' THEN 'Operations Agent'
  WHEN 'finance' THEN 'Finance Agent'
  WHEN 'brand' THEN 'Messaging Agent'
  WHEN 'risk' THEN 'Risk Agent'
  ELSE name
END;
UPDATE public.agents SET status = 'inactive', description = 'Monitors margin, runway, and concentration risk. Activates when finance tools are connected.' WHERE agent_key = 'finance';