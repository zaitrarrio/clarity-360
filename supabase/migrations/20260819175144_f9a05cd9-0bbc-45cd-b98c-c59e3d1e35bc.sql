-- ============ tables ============
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  tagline text,
  industry text,
  stage text,
  location text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.intake_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  stage text NOT NULL,
  question_key text NOT NULL,
  question text NOT NULL,
  answer text,
  ordinal int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.plan_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  domain_key text NOT NULL,
  title text NOT NULL,
  kicker text,
  ordinal int NOT NULL DEFAULT 0,
  summary text,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  decisions jsonb NOT NULL DEFAULT '[]'::jsonb,
  metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  agent_key text NOT NULL,
  name text NOT NULL,
  domain_key text,
  description text,
  status text NOT NULL DEFAULT 'idle',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  domain_key text,
  action_key text NOT NULL,
  title text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'one_shot',
  agent_key text,
  ordinal int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.action_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  action_id uuid REFERENCES public.actions(id) ON DELETE SET NULL,
  action_key text NOT NULL,
  title text NOT NULL,
  agent_key text,
  status text NOT NULL DEFAULT 'running',
  artifact_title text,
  artifact_body text,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.agent_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  action_id uuid REFERENCES public.actions(id) ON DELETE CASCADE,
  action_key text NOT NULL,
  agent_key text,
  cadence text NOT NULL DEFAULT 'daily',
  next_run_at timestamptz NOT NULL DEFAULT now() + interval '1 day',
  last_run_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  agent_key text,
  domain_key text,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  suggested_action_key text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid,
  title text NOT NULL DEFAULT 'Clara',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON public.plan_sections (business_id, ordinal);
CREATE INDEX ON public.actions (business_id, ordinal);
CREATE INDEX ON public.action_runs (business_id, started_at DESC);
CREATE INDEX ON public.signals (business_id, created_at DESC);
CREATE INDEX ON public.messages (conversation_id, created_at);

-- ============ access helper ============
CREATE OR REPLACE FUNCTION public.can_read_business(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = _business_id AND (b.is_demo OR b.user_id = auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_business(_business_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = _business_id AND b.user_id = auth.uid()
  );
$$;

-- ============ grants + RLS ============
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT SELECT ON public.businesses TO anon;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own or demo business" ON public.businesses FOR SELECT USING (is_demo OR user_id = auth.uid());
CREATE POLICY "insert own business" ON public.businesses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND NOT is_demo);
CREATE POLICY "update own business" ON public.businesses FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete own business" ON public.businesses FOR DELETE TO authenticated USING (user_id = auth.uid());

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['intake_responses','plan_sections','agents','actions','action_runs','agent_schedules','signals','conversations','messages']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

CREATE POLICY "read" ON public.intake_responses FOR SELECT USING (public.can_read_business(business_id));
CREATE POLICY "write" ON public.intake_responses FOR ALL TO authenticated USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));
CREATE POLICY "read" ON public.plan_sections FOR SELECT USING (public.can_read_business(business_id));
CREATE POLICY "write" ON public.plan_sections FOR ALL TO authenticated USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));
CREATE POLICY "read" ON public.agents FOR SELECT USING (public.can_read_business(business_id));
CREATE POLICY "write" ON public.agents FOR ALL TO authenticated USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));
CREATE POLICY "read" ON public.actions FOR SELECT USING (public.can_read_business(business_id));
CREATE POLICY "write" ON public.actions FOR ALL TO authenticated USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));
CREATE POLICY "read" ON public.action_runs FOR SELECT USING (public.can_read_business(business_id));
CREATE POLICY "write" ON public.action_runs FOR ALL TO authenticated USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));
CREATE POLICY "read" ON public.agent_schedules FOR SELECT USING (public.can_read_business(business_id));
CREATE POLICY "write" ON public.agent_schedules FOR ALL TO authenticated USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));
CREATE POLICY "read" ON public.signals FOR SELECT USING (public.can_read_business(business_id));
CREATE POLICY "write" ON public.signals FOR ALL TO authenticated USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));
CREATE POLICY "read" ON public.conversations FOR SELECT USING (public.can_read_business(business_id));
CREATE POLICY "write" ON public.conversations FOR ALL TO authenticated USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));
CREATE POLICY "read" ON public.messages FOR SELECT USING (public.can_read_business(business_id));
CREATE POLICY "write" ON public.messages FOR ALL TO authenticated USING (public.owns_business(business_id)) WITH CHECK (public.owns_business(business_id));

-- ============ seed: Little Live Oak ============
INSERT INTO public.businesses (id, name, tagline, industry, stage, location, is_demo)
VALUES ('11111111-1111-1111-1111-111111111111', 'Little Live Oak',
  'A 29-child early learning house built around slow mornings and real food.',
  'Early childhood education', 'Operating · pre-expansion', 'Austin, Texas', true);

INSERT INTO public.plan_sections (business_id, domain_key, title, kicker, ordinal, summary, findings, decisions, metrics) VALUES
('11111111-1111-1111-1111-111111111111','market','The Market','Report 01',1,
 'Austin''s under-five care market is structurally short of licensed seats, but the shortage is concentrated in infant rooms — the rooms with the worst unit economics. Your advantage is not price; it is the waitlist you already hold.',
 '["Licensed infant capacity within a 4-mile radius covers roughly 38% of demand; preschool capacity covers 91%.","Six of the eleven competing centers raised tuition in the last twelve months, averaging 7.4%.","Parents in this ZIP code choose on commute time first, philosophy second, price third — price only becomes primary above a ~15% gap.","Your 41-family waitlist is the single most valuable asset on the balance sheet and is currently unmonetized."]'::jsonb,
 '["Compete on infant seats, not preschool seats, even though infant rooms carry the thinner margin.","Hold price within 12% of the local median rather than chasing the premium tier."]'::jsonb,
 '[{"label":"Addressable families (4mi)","value":"2,140"},{"label":"Infant seat shortfall","value":"62%"},{"label":"Waitlist depth","value":"41 families"}]'::jsonb),
('11111111-1111-1111-1111-111111111111','offer','The Offer','Report 02',2,
 'You sell one thing today — a seat — and it is priced as a commodity. The plan splits the offer into a seat, an enrollment moment, and an ongoing relationship, each of which can carry its own price.',
 '["Average tuition of $1,480/month sits 6% under local median while your staff-to-child ratio is 22% better than median.","Enrollment fee of $150 is materially below the $400 median and is the least price-sensitive line you have.","Nothing is sold to families after enrollment; summer camp and extended care are given away informally."]'::jsonb,
 '["Raise the enrollment fee to $375 before touching monthly tuition.","Formalize extended care as a paid add-on rather than an unbilled courtesy."]'::jsonb,
 '[{"label":"Monthly tuition","value":"$1,480"},{"label":"vs. local median","value":"-6%"},{"label":"Attach rate, add-ons","value":"0%"}]'::jsonb),
('11111111-1111-1111-1111-111111111111','growth','Growth','Report 03',3,
 'Growth here is not lead generation — it is waitlist conversion and referral velocity. Every family already wants in; the plan is about the sequence that turns wanting into signing.',
 '["Waitlist-to-enrollment conversion is 31%; centers with a structured tour-to-deposit sequence run 55-70%.","78% of current families came from another current family. Paid channels contributed nothing measurable.","No follow-up exists between the tour and the decision — the average gap is nine days of silence."]'::jsonb,
 '["Build the enrollment sequence before spending a dollar on acquisition.","Make referral an explicit, rewarded program instead of an accident."]'::jsonb,
 '[{"label":"Waitlist conversion","value":"31%"},{"label":"Referral share","value":"78%"},{"label":"Tour-to-decision gap","value":"9 days"}]'::jsonb),
('11111111-1111-1111-1111-111111111111','operations','Operations','Report 04',4,
 'The operation is run on memory. It works because you are in the building every day — which is exactly why it cannot expand.',
 '["Staff scheduling lives in a paper binder; two coverage gaps in the last month were caught by chance.","Licensing documentation is complete but stored in three places, none of them backed up.","Ratios are met, but with no slack: a single call-out puts the infant room out of compliance."]'::jsonb,
 '["Hire a floating aide before hiring a second lead teacher — slack beats headcount.","Move licensing documentation into one system this quarter, before the next inspection window."]'::jsonb,
 '[{"label":"Children enrolled","value":"29"},{"label":"Staff","value":"7"},{"label":"Coverage slack","value":"0.0 FTE"}]'::jsonb),
('11111111-1111-1111-1111-111111111111','finance','Finance','Report 05',5,
 'The business is profitable and fragile at the same time. Margin is real; the cash buffer is not.',
 '["Monthly revenue $42,920 against $38,100 of cost — an 11.2% operating margin.","Operating cash covers 3.1 weeks. Any center of this size should hold 8-12.","Two families represent 9% of revenue and are both on month-to-month terms.","Food costs rose 14% year over year and were never repriced into tuition."]'::jsonb,
 '["Rebuild the cash buffer to eight weeks before funding any expansion.","Reprice food inflation into tuition at the next enrollment cycle, not mid-year."]'::jsonb,
 '[{"label":"Monthly revenue","value":"$42,920"},{"label":"Operating margin","value":"11.2%"},{"label":"Cash runway","value":"3.1 weeks"}]'::jsonb),
('11111111-1111-1111-1111-111111111111','brand','Brand & Story','Report 06',6,
 'The thing parents repeat about you is not in any of your marketing. They talk about the mornings. You talk about the curriculum.',
 '["Nine of twelve reviews mention the unhurried drop-off; zero mention curriculum framework.","Your website leads with accreditation language; parents decode that as generic.","No consistent presence anywhere — last social post was fourteen weeks ago."]'::jsonb,
 '["Lead with the morning, not the method. The method is proof, not the promise.","Commit to a two-post weekly rhythm run by an agent, reviewed by you."]'::jsonb,
 '[{"label":"Reviews","value":"4.9 / 12"},{"label":"Posting cadence","value":"none"},{"label":"Message-to-review fit","value":"low"}]'::jsonb),
('11111111-1111-1111-1111-111111111111','risk','Risk & Compliance','Report 07',7,
 'Three exposures are material. One of them can close the center.',
 '["Liability coverage of $1M per occurrence is below the $2M that most Texas centers of this size now carry.","Owner-dependency: no documented process survives your absence for more than four days.","Next licensing inspection window opens in seven weeks; two documentation items are stale.","Lease renews in fourteen months with no negotiated cap on escalation."]'::jsonb,
 '["Raise liability coverage to $2M before expansion, not after.","Start lease renegotiation nine months early, from the position of a full waitlist."]'::jsonb,
 '[{"label":"Open exposures","value":"3 material"},{"label":"Inspection window","value":"7 weeks"},{"label":"Lease runway","value":"14 months"}]'::jsonb);

INSERT INTO public.agents (business_id, agent_key, name, domain_key, description, status) VALUES
('11111111-1111-1111-1111-111111111111','clara','Clara',NULL,'The central agent. Holds the whole plan, routes work to the domain agents, and assembles your daily agenda.','active'),
('11111111-1111-1111-1111-111111111111','market','Scout','market','Watches competitors, pricing, and local demand signals.','active'),
('11111111-1111-1111-1111-111111111111','offer','Ledgerline','offer','Tests offer structure, pricing tiers, and add-on attach.','idle'),
('11111111-1111-1111-1111-111111111111','growth','Current','growth','Runs the enrollment sequence, referral loops, and content cadence.','active'),
('11111111-1111-1111-1111-111111111111','operations','Keel','operations','Tracks staffing, ratios, coverage, and documentation.','active'),
('11111111-1111-1111-1111-111111111111','finance','Tally','finance','Monitors margin, runway, and concentration risk.','idle'),
('11111111-1111-1111-1111-111111111111','brand','Ember','brand','Writes in your voice: posts, pages, decks, and story.','active'),
('11111111-1111-1111-1111-111111111111','risk','Warden','risk','Watches compliance dates, coverage, and single points of failure.','active');

INSERT INTO public.actions (business_id, domain_key, action_key, title, description, kind, agent_key, ordinal) VALUES
('11111111-1111-1111-1111-111111111111','market','competitor_price_watch','Watch competitor pricing','Check the eleven local centers weekly and raise a signal whenever one prices below you.','recurring','market',1),
('11111111-1111-1111-1111-111111111111','market','market_brief','Write a local market brief','A one-page read on demand, capacity, and where the seats actually are.','one_shot','market',2),
('11111111-1111-1111-1111-111111111111','offer','pricing_experiment','Design a pricing change','Model the enrollment-fee increase and write the parent-facing explanation.','one_shot','offer',3),
('11111111-1111-1111-1111-111111111111','growth','daily_post','Create today''s post','One post in your voice, drawn from what is actually happening this week.','recurring','brand',4),
('11111111-1111-1111-1111-111111111111','growth','enrollment_sequence','Build the enrollment sequence','The tour-to-deposit follow-up: five touches, written and scheduled.','one_shot','growth',5),
('11111111-1111-1111-1111-111111111111','growth','build_website','Create my website','Full site copy and structure, led by the morning, not the method.','one_shot','brand',6),
('11111111-1111-1111-1111-111111111111','growth','pitch_deck','Generate a pitch deck','Twelve slides for the expansion conversation with a lender or partner.','one_shot','finance',7),
('11111111-1111-1111-1111-111111111111','operations','coverage_check','Check coverage and ratios','Scan next week''s schedule for any ratio the plan cannot absorb.','recurring','operations',8),
('11111111-1111-1111-1111-111111111111','finance','cash_forecast','Forecast cash','Thirteen-week cash view with the buffer target marked.','recurring','finance',9),
('11111111-1111-1111-1111-111111111111','brand','prototype_brief','Draft a prototype brief','Spec the smallest testable version of a new offer before you build it.','one_shot','brand',10),
('11111111-1111-1111-1111-111111111111','risk','compliance_sweep','Sweep compliance dates','Every date, coverage line, and document that expires in the next ninety days.','recurring','risk',11);

INSERT INTO public.action_runs (business_id, action_key, title, agent_key, status, artifact_title, artifact_body, started_at, completed_at) VALUES
('11111111-1111-1111-1111-111111111111','daily_post','Create today''s post','brand','complete','Post — the long goodbye at the door',
 E'**Draft post**\n\nThere is a particular kind of morning here where nobody is rushed. A parent kneels down at the cubby, ties a shoe that did not need tying, and takes the extra ninety seconds.\n\nWe build the schedule around those ninety seconds. It is the whole philosophy, really — the curriculum is just what happens after.\n\n*Suggested image: the front hallway at 8:10am.*',
 now() - interval '19 hours', now() - interval '19 hours' + interval '38 seconds'),
('11111111-1111-1111-1111-111111111111','competitor_price_watch','Watch competitor pricing','market','complete','Weekly price scan — 11 centers',
 E'**Scan complete.** Two centers moved this week.\n\n- Oak & Ivy Learning: infant tuition $1,395 → **$1,340** (now $140 under you)\n- Brightpath South: preschool $1,210 → $1,265\n\nNine centers unchanged. One signal raised.',
 now() - interval '2 days', now() - interval '2 days' + interval '51 seconds'),
('11111111-1111-1111-1111-111111111111','compliance_sweep','Sweep compliance dates','risk','complete','Ninety-day compliance sweep',
 E'**Three items need attention.**\n\n1. Licensing inspection window opens in 7 weeks — two documentation items stale (emergency drill log, staff CPR renewals).\n2. Liability coverage $1M — below the $2M peer norm.\n3. Two staff CPR certifications expire within 40 days.',
 now() - interval '5 days', now() - interval '5 days' + interval '44 seconds');

INSERT INTO public.agent_schedules (business_id, action_key, agent_key, cadence, next_run_at, last_run_at, active) VALUES
('11111111-1111-1111-1111-111111111111','competitor_price_watch','market','weekly', now() + interval '5 days', now() - interval '2 days', true),
('11111111-1111-1111-1111-111111111111','daily_post','brand','daily', now() + interval '5 hours', now() - interval '19 hours', true),
('11111111-1111-1111-1111-111111111111','compliance_sweep','risk','monthly', now() + interval '25 days', now() - interval '5 days', true);

INSERT INTO public.signals (business_id, agent_key, domain_key, severity, title, body, suggested_action_key, status, created_at) VALUES
('11111111-1111-1111-1111-111111111111','market','market','alert','Oak & Ivy dropped infant tuition below yours','Oak & Ivy Learning moved infant tuition from $1,395 to $1,340 — $140 under your rate and inside the 12% band you decided to hold. They are 1.8 miles away and share your commute corridor.','pricing_experiment','new', now() - interval '2 days'),
('11111111-1111-1111-1111-111111111111','risk','risk','alert','Two CPR certifications expire in 40 days','Both are infant-room staff. Losing either certification puts the infant room out of ratio compliance the same day.','compliance_sweep','new', now() - interval '5 days'),
('11111111-1111-1111-1111-111111111111','finance','finance','warning','Cash buffer fell below four weeks','Operating cash now covers 3.1 weeks against an 8-week target. The June food invoice landed 14% above forecast.','cash_forecast','new', now() - interval '1 day'),
('11111111-1111-1111-1111-111111111111','growth','growth','info','Waitlist crossed forty families','Three families joined the waitlist this week. Conversion is still 31% — the sequence has not been built yet.','enrollment_sequence','new', now() - interval '6 hours'),
('11111111-1111-1111-1111-111111111111','brand','brand','info','Fourteen weeks since the last post','Nine of twelve reviews mention the unhurried mornings. Nothing you publish says that back to them.','daily_post','acknowledged', now() - interval '3 days');

INSERT INTO public.intake_responses (business_id, stage, question_key, question, answer, ordinal) VALUES
('11111111-1111-1111-1111-111111111111','the_work','what_you_do','What do you actually do, in the words you would use with a neighbour?','We look after twenty-nine small children in a converted house, and we do it slowly.',1),
('11111111-1111-1111-1111-111111111111','the_work','who_for','Who is it for, specifically?','Working parents within about four miles who want their kid somewhere small.',2),
('11111111-1111-1111-1111-111111111111','the_work','stage','Where are you today?','Operating, profitable, and thinking about a second location.',3),
('11111111-1111-1111-1111-111111111111','the_money','revenue','What does money look like right now?','About $43k a month in, $38k out.',4),
('11111111-1111-1111-1111-111111111111','the_money','pricing','How do you price, and how did you land there?','$1,480 a month. Honestly, we matched what the place down the road charged in 2021.',5),
('11111111-1111-1111-1111-111111111111','the_reconciliation','constraint','What is the one constraint that decides everything else?','Ratios. Every good idea dies or lives on whether we can staff it.',6),
('11111111-1111-1111-1111-111111111111','the_reconciliation','tradeoff','If growth and quality conflict, which one gives?','Quality never gives. That is the whole business.',7),
('11111111-1111-1111-1111-111111111111','the_reconciliation','horizon','What has to be true in twelve months for this to have worked?','Eight weeks of cash in the bank and a second building under lease.',8);