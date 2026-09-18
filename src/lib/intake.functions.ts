import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getLatestSavedIntake = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: businesses, error: businessError } = await context.supabase
      .from("businesses")
      .select("id, name, industry, stage")
      .eq("user_id", context.userId)
      .eq("is_demo", false)
      .order("created_at", { ascending: false })
      .limit(1);
    if (businessError) throw new Error(businessError.message);

    const business = businesses?.[0];
    if (!business) return null;

    const { data: responses, error: responseError } = await context.supabase
      .from("intake_responses")
      .select("question_key, question, answer, ordinal")
      .eq("business_id", business.id)
      .order("ordinal", { ascending: true });
    if (responseError) throw new Error(responseError.message);

    return { business, responses: responses ?? [] };
  });