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
    PostgrestVersion: "14.15"
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
          user_id?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
