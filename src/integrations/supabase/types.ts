export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_runs: {
        Row: {
          action_id: string | null
          action_key: string
          agent_key: string | null
          artifact_body: string | null
          artifact_title: string | null
          business_id: string
          completed_at: string | null
          error: string | null
          id: string
          started_at: string
          status: string
          title: string
        }
        Insert: {
          action_id?: string | null
          action_key: string
          agent_key?: string | null
          artifact_body?: string | null
          artifact_title?: string | null
          business_id: string
          completed_at?: string | null
          error?: string | null
          id?: string
          started_at?: string
          status?: string
          title: string
        }
        Update: {
          action_id?: string | null
          action_key?: string
          agent_key?: string | null
          artifact_body?: string | null
          artifact_title?: string | null
          business_id?: string
          completed_at?: string | null
          error?: string | null
          id?: string
          started_at?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_runs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_runs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          action_key: string
          agent_key: string | null
          business_id: string
          created_at: string
          description: string | null
          domain_key: string | null
          id: string
          kind: string
          ordinal: number
          title: string
        }
        Insert: {
          action_key: string
          agent_key?: string | null
          business_id: string
          created_at?: string
          description?: string | null
          domain_key?: string | null
          id?: string
          kind?: string
          ordinal?: number
          title: string
        }
        Update: {
          action_key?: string
          agent_key?: string | null
          business_id?: string
          created_at?: string
          description?: string | null
          domain_key?: string | null
          id?: string
          kind?: string
          ordinal?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_schedules: {
        Row: {
          action_id: string | null
          action_key: string
          active: boolean
          agent_key: string | null
          business_id: string
          cadence: string
          created_at: string
          id: string
          last_run_at: string | null
          next_run_at: string
        }
        Insert: {
          action_id?: string | null
          action_key: string
          active?: boolean
          agent_key?: string | null
          business_id: string
          cadence?: string
          created_at?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string
        }
        Update: {
          action_id?: string | null
          action_key?: string
          active?: boolean
          agent_key?: string | null
          business_id?: string
          cadence?: string
          created_at?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_schedules_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_schedules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          agent_key: string
          business_id: string
          created_at: string
          description: string | null
          domain_key: string | null
          id: string
          name: string
          status: string
        }
        Insert: {
          agent_key: string
          business_id: string
          created_at?: string
          description?: string | null
          domain_key?: string | null
          id?: string
          name: string
          status?: string
        }
        Update: {
          agent_key?: string
          business_id?: string
          created_at?: string
          description?: string | null
          domain_key?: string | null
          id?: string
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["business_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["business_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["business_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_readiness_items: {
        Row: {
          business_id: string
          category: string
          created_at: string
          description: string | null
          help_kind: string
          help_target: string | null
          id: string
          item_key: string
          priority: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          category: string
          created_at?: string
          description?: string | null
          help_kind?: string
          help_target?: string | null
          id?: string
          item_key: string
          priority?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string
          created_at?: string
          description?: string | null
          help_kind?: string
          help_target?: string | null
          id?: string
          item_key?: string
          priority?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_readiness_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          industry: string | null
          is_demo: boolean
          location: string | null
          name: string
          stage: string | null
          tagline: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          industry?: string | null
          is_demo?: boolean
          location?: string | null
          name: string
          stage?: string | null
          tagline?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          industry?: string | null
          is_demo?: boolean
          location?: string | null
          name?: string
          stage?: string | null
          tagline?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          business_id: string
          created_at: string
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          title?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_responses: {
        Row: {
          answer: string | null
          business_id: string
          created_at: string
          id: string
          ordinal: number
          question: string
          question_key: string
          stage: string
        }
        Insert: {
          answer?: string | null
          business_id: string
          created_at?: string
          id?: string
          ordinal?: number
          question: string
          question_key: string
          stage: string
        }
        Update: {
          answer?: string | null
          business_id?: string
          created_at?: string
          id?: string
          ordinal?: number
          question?: string
          question_key?: string
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          business_id: string
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          business_id: string
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          business_id?: string
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_progress: {
        Row: {
          created_at: string
          id: string
          mode: string
          payload: Json
          seed_name: string
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode: string
          payload?: Json
          seed_name: string
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          payload?: Json
          seed_name?: string
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_sections: {
        Row: {
          business_id: string
          decisions: Json
          domain_key: string
          findings: Json
          id: string
          kicker: string | null
          metrics: Json
          ordinal: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          decisions?: Json
          domain_key: string
          findings?: Json
          id?: string
          kicker?: string | null
          metrics?: Json
          ordinal?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          decisions?: Json
          domain_key?: string
          findings?: Json
          id?: string
          kicker?: string | null
          metrics?: Json
          ordinal?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_sections_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_versions: {
        Row: {
          business_id: string
          change_note: string | null
          created_at: string
          created_by: string | null
          id: string
          sections: Json
          summary: string | null
          version: number
        }
        Insert: {
          business_id: string
          change_note?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          sections?: Json
          summary?: string | null
          version: number
        }
        Update: {
          business_id?: string
          change_note?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          sections?: Json
          summary?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_versions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          agent_key: string | null
          body: string | null
          business_id: string
          created_at: string
          domain_key: string | null
          id: string
          severity: string
          status: string
          suggested_action_key: string | null
          title: string
        }
        Insert: {
          agent_key?: string | null
          body?: string | null
          business_id: string
          created_at?: string
          domain_key?: string | null
          id?: string
          severity?: string
          status?: string
          suggested_action_key?: string | null
          title: string
        }
        Update: {
          agent_key?: string | null
          body?: string | null
          business_id?: string
          created_at?: string
          domain_key?: string | null
          id?: string
          severity?: string
          status?: string
          suggested_action_key?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          created_at: string
          host: string
          id: string
          is_primary: boolean
          tenant_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          host: string
          id?: string
          is_primary?: boolean
          tenant_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          host?: string
          id?: string
          is_primary?: boolean
          tenant_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          branding: Json
          created_at: string
          email_from_address: string | null
          email_from_name: string | null
          id: string
          is_default: boolean
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          branding?: Json
          created_at?: string
          email_from_address?: string | null
          email_from_name?: string | null
          id?: string
          is_default?: boolean
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          branding?: Json
          created_at?: string
          email_from_address?: string | null
          email_from_name?: string | null
          id?: string
          is_default?: boolean
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_business: { Args: { _business_id: string }; Returns: boolean }
      can_write_business: { Args: { _business_id: string }; Returns: boolean }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_admin: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      owns_business: { Args: { _business_id: string }; Returns: boolean }
      tenant_role_of: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["tenant_role"]
      }
    }
    Enums: {
      business_role: "owner" | "editor" | "viewer"
      tenant_role: "owner" | "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      business_role: ["owner", "editor", "viewer"],
      tenant_role: ["owner", "admin", "member"],
    },
  },
} as const
