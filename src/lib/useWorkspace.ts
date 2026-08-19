import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DEMO_BUSINESS_ID,
  type ActionDef,
  type ActionRun,
  type AgentRow,
  type Business,
  type PlanSection,
  type Schedule,
  type Signal,
} from "./clarity";

export function useActiveBusinessId() {
  const { data } = useQuery({
    queryKey: ["active-business"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        const { data: mine } = await supabase
          .from("businesses")
          .select("id")
          .eq("user_id", session.session.user.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (mine && mine.length) return mine[0]!.id as string;
      }
      return DEMO_BUSINESS_ID;
    },
    staleTime: 60_000,
  });
  return data ?? DEMO_BUSINESS_ID;
}

export function useBusiness(businessId: string) {
  return useQuery({
    queryKey: ["business", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, tagline, industry, stage, location, is_demo, user_id")
        .eq("id", businessId)
        .maybeSingle();
      if (error) throw error;
      return data as Business | null;
    },
  });
}

export function usePlanSections(businessId: string) {
  return useQuery({
    queryKey: ["plan-sections", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_sections")
        .select("*")
        .eq("business_id", businessId)
        .order("ordinal");
      if (error) throw error;
      return (data ?? []) as unknown as PlanSection[];
    },
  });
}

export function useActions(businessId: string) {
  return useQuery({
    queryKey: ["actions", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .eq("business_id", businessId)
        .order("ordinal");
      if (error) throw error;
      return (data ?? []) as unknown as ActionDef[];
    },
  });
}

export function useRuns(businessId: string) {
  return useQuery({
    queryKey: ["runs", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_runs")
        .select("*")
        .eq("business_id", businessId)
        .order("started_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []) as unknown as ActionRun[];
    },
  });
}

export function useSchedules(businessId: string) {
  return useQuery({
    queryKey: ["schedules", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_schedules")
        .select("*")
        .eq("business_id", businessId)
        .order("next_run_at");
      if (error) throw error;
      return (data ?? []) as unknown as Schedule[];
    },
  });
}

export function useSignals(businessId: string) {
  return useQuery({
    queryKey: ["signals", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []) as unknown as Signal[];
    },
  });
}

export function useAgents(businessId: string) {
  return useQuery({
    queryKey: ["agents", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as AgentRow[];
    },
  });
}
