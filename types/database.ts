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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      coach_links: {
        Row: {
          coach_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          coach_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          coach_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coach_links_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coach_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_comments: {
        Row: {
          coach_id: string
          comment: string
          created_at: string
          cv_id: string
          id: string
          is_resolved: boolean
          item_id: string | null
          resolved_at: string | null
          section_type: string
        }
        Insert: {
          coach_id: string
          comment: string
          created_at?: string
          cv_id: string
          id?: string
          is_resolved?: boolean
          item_id?: string | null
          resolved_at?: string | null
          section_type: string
        }
        Update: {
          coach_id?: string
          comment?: string
          created_at?: string
          cv_id?: string
          id?: string
          is_resolved?: boolean
          item_id?: string | null
          resolved_at?: string | null
          section_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cv_comments_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cv_comments_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_educations: {
        Row: {
          cv_id: string
          description: string | null
          end_year: number | null
          id: string
          institution: string | null
          is_current: boolean
          level: string | null
          program: string | null
          sort_order: number
          start_year: number | null
        }
        Insert: {
          cv_id: string
          description?: string | null
          end_year?: number | null
          id?: string
          institution?: string | null
          is_current?: boolean
          level?: string | null
          program?: string | null
          sort_order?: number
          start_year?: number | null
        }
        Update: {
          cv_id?: string
          description?: string | null
          end_year?: number | null
          id?: string
          institution?: string | null
          is_current?: boolean
          level?: string | null
          program?: string | null
          sort_order?: number
          start_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_educations_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_experiences: {
        Row: {
          city: string | null
          country: string | null
          cv_id: string
          description: string | null
          employer: string | null
          end_month: number | null
          end_year: number | null
          id: string
          is_current: boolean
          job_title: string | null
          sort_order: number
          start_month: number | null
          start_year: number | null
          type: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          cv_id: string
          description?: string | null
          employer?: string | null
          end_month?: number | null
          end_year?: number | null
          id?: string
          is_current?: boolean
          job_title?: string | null
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          type?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          cv_id?: string
          description?: string | null
          employer?: string | null
          end_month?: number | null
          end_year?: number | null
          id?: string
          is_current?: boolean
          job_title?: string | null
          sort_order?: number
          start_month?: number | null
          start_year?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_experiences_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_hobbies: {
        Row: {
          cv_id: string
          text: string | null
        }
        Insert: {
          cv_id: string
          text?: string | null
        }
        Update: {
          cv_id?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_hobbies_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: true
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_languages: {
        Row: {
          cv_id: string
          id: string
          language: string | null
          level: string | null
          sort_order: number
        }
        Insert: {
          cv_id: string
          id?: string
          language?: string | null
          level?: string | null
          sort_order?: number
        }
        Update: {
          cv_id?: string
          id?: string
          language?: string | null
          level?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "cv_languages_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_other: {
        Row: {
          cv_id: string
          id: string
          label: string | null
          sort_order: number
          text: string | null
        }
        Insert: {
          cv_id: string
          id?: string
          label?: string | null
          sort_order?: number
          text?: string | null
        }
        Update: {
          cv_id?: string
          id?: string
          label?: string | null
          sort_order?: number
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_other_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_personal_info: {
        Row: {
          city: string | null
          cv_id: string
          driving_license: string | null
          email: string | null
          first_name: string | null
          github_url: string | null
          headline: string | null
          last_name: string | null
          linkedin_url: string | null
          other_url: string | null
          phone: string | null
          photo_url: string | null
          portfolio_url: string | null
          region: string | null
        }
        Insert: {
          city?: string | null
          cv_id: string
          driving_license?: string | null
          email?: string | null
          first_name?: string | null
          github_url?: string | null
          headline?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          other_url?: string | null
          phone?: string | null
          photo_url?: string | null
          portfolio_url?: string | null
          region?: string | null
        }
        Update: {
          city?: string | null
          cv_id?: string
          driving_license?: string | null
          email?: string | null
          first_name?: string | null
          github_url?: string | null
          headline?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          other_url?: string | null
          phone?: string | null
          photo_url?: string | null
          portfolio_url?: string | null
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_personal_info_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: true
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_profile: {
        Row: {
          cv_id: string
          summary: string | null
        }
        Insert: {
          cv_id: string
          summary?: string | null
        }
        Update: {
          cv_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_profile_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: true
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_skills: {
        Row: {
          category: string | null
          cv_id: string
          id: string
          level: number | null
          name: string | null
          sort_order: number
        }
        Insert: {
          category?: string | null
          cv_id: string
          id?: string
          level?: number | null
          name?: string | null
          sort_order?: number
        }
        Update: {
          category?: string | null
          cv_id?: string
          id?: string
          level?: number | null
          name?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "cv_skills_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cv_volunteering: {
        Row: {
          cv_id: string
          description: string | null
          end_year: number | null
          id: string
          is_current: boolean
          organisation: string | null
          role: string | null
          sort_order: number
          start_year: number | null
        }
        Insert: {
          cv_id: string
          description?: string | null
          end_year?: number | null
          id?: string
          is_current?: boolean
          organisation?: string | null
          role?: string | null
          sort_order?: number
          start_year?: number | null
        }
        Update: {
          cv_id?: string
          description?: string | null
          end_year?: number | null
          id?: string
          is_current?: boolean
          organisation?: string | null
          role?: string | null
          sort_order?: number
          start_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cv_volunteering_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      cvs: {
        Row: {
          accent_color: string
          created_at: string
          has_been_exported: boolean
          id: string
          language: string
          layout: number
          status: string
          title: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          has_been_exported?: boolean
          id?: string
          language?: string
          layout?: number
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          has_been_exported?: boolean
          id?: string
          language?: string
          layout?: number
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cvs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cvs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
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
