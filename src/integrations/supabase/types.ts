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
      profiles: {
        Row: {
          act: number | null
          budget: string | null
          countries: string[] | null
          created_at: string
          eca: string | null
          education_level: string | null
          email: string | null
          hear_about: string | null
          hsc_board: string | null
          hsc_gpa: number | null
          hsc_subjects: string | null
          id: string
          ielts: number | null
          intake: string | null
          medium: string | null
          name: string | null
          program: string | null
          sat: number | null
          scholarship_need: string | null
          ssc_board: string | null
          ssc_gpa: number | null
          ssc_subjects: string | null
          toefl: number | null
          updated_at: string
        }
        Insert: {
          act?: number | null
          budget?: string | null
          countries?: string[] | null
          created_at?: string
          eca?: string | null
          education_level?: string | null
          email?: string | null
          hear_about?: string | null
          hsc_board?: string | null
          hsc_gpa?: number | null
          hsc_subjects?: string | null
          id: string
          ielts?: number | null
          intake?: string | null
          medium?: string | null
          name?: string | null
          program?: string | null
          sat?: number | null
          scholarship_need?: string | null
          ssc_board?: string | null
          ssc_gpa?: number | null
          ssc_subjects?: string | null
          toefl?: number | null
          updated_at?: string
        }
        Update: {
          act?: number | null
          budget?: string | null
          countries?: string[] | null
          created_at?: string
          eca?: string | null
          education_level?: string | null
          email?: string | null
          hear_about?: string | null
          hsc_board?: string | null
          hsc_gpa?: number | null
          hsc_subjects?: string | null
          id?: string
          ielts?: number | null
          intake?: string | null
          medium?: string | null
          name?: string | null
          program?: string | null
          sat?: number | null
          scholarship_need?: string | null
          ssc_board?: string | null
          ssc_gpa?: number | null
          ssc_subjects?: string | null
          toefl?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      shortlist: {
        Row: {
          created_at: string
          id: string
          item_data: Json
          item_id: string
          item_name: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_data?: Json
          item_id: string
          item_name: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_data?: Json
          item_id?: string
          item_name?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      universities_catalog: {
        Row: {
          country: string
          created_at: string
          domains: string[] | null
          has_curated_data: boolean
          id: string
          name: string
          qs_rank: number | null
          region: string | null
          state_province: string | null
          website: string | null
        }
        Insert: {
          country: string
          created_at?: string
          domains?: string[] | null
          has_curated_data?: boolean
          id: string
          name: string
          qs_rank?: number | null
          region?: string | null
          state_province?: string | null
          website?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          domains?: string[] | null
          has_curated_data?: boolean
          id?: string
          name?: string
          qs_rank?: number | null
          region?: string | null
          state_province?: string | null
          website?: string | null
        }
        Relationships: []
      }
      universities_detail: {
        Row: {
          about: string | null
          acceptance_rate: string | null
          admission_reqs: Json | null
          application_steps: string[] | null
          application_url: string | null
          campus_image_url: string | null
          campus_life: string | null
          catalog_id: string | null
          city: string | null
          country: string
          country_flag: string | null
          created_at: string
          deadlines: Json | null
          exams: Json | null
          fee_waivers: string | null
          financial_aid: string | null
          founded_year: number | null
          international_pct: string | null
          living_cost_monthly: number | null
          logo_url: string | null
          maps_query: string | null
          name: string
          notable_alumni: string[] | null
          official_url: string | null
          processing_time: string | null
          programs_detail: Json | null
          qs_rank: number | null
          required_docs: string[] | null
          scholarships: Json | null
          slug: string
          student_faculty_ratio: string | null
          subject_rankings: Json | null
          total_students: string | null
          tuition: Json | null
          updated_at: string
          work_permit: string | null
        }
        Insert: {
          about?: string | null
          acceptance_rate?: string | null
          admission_reqs?: Json | null
          application_steps?: string[] | null
          application_url?: string | null
          campus_image_url?: string | null
          campus_life?: string | null
          catalog_id?: string | null
          city?: string | null
          country: string
          country_flag?: string | null
          created_at?: string
          deadlines?: Json | null
          exams?: Json | null
          fee_waivers?: string | null
          financial_aid?: string | null
          founded_year?: number | null
          international_pct?: string | null
          living_cost_monthly?: number | null
          logo_url?: string | null
          maps_query?: string | null
          name: string
          notable_alumni?: string[] | null
          official_url?: string | null
          processing_time?: string | null
          programs_detail?: Json | null
          qs_rank?: number | null
          required_docs?: string[] | null
          scholarships?: Json | null
          slug: string
          student_faculty_ratio?: string | null
          subject_rankings?: Json | null
          total_students?: string | null
          tuition?: Json | null
          updated_at?: string
          work_permit?: string | null
        }
        Update: {
          about?: string | null
          acceptance_rate?: string | null
          admission_reqs?: Json | null
          application_steps?: string[] | null
          application_url?: string | null
          campus_image_url?: string | null
          campus_life?: string | null
          catalog_id?: string | null
          city?: string | null
          country?: string
          country_flag?: string | null
          created_at?: string
          deadlines?: Json | null
          exams?: Json | null
          fee_waivers?: string | null
          financial_aid?: string | null
          founded_year?: number | null
          international_pct?: string | null
          living_cost_monthly?: number | null
          logo_url?: string | null
          maps_query?: string | null
          name?: string
          notable_alumni?: string[] | null
          official_url?: string | null
          processing_time?: string | null
          programs_detail?: Json | null
          qs_rank?: number | null
          required_docs?: string[] | null
          scholarships?: Json | null
          slug?: string
          student_faculty_ratio?: string | null
          subject_rankings?: Json | null
          total_students?: string | null
          tuition?: Json | null
          updated_at?: string
          work_permit?: string | null
        }
        Relationships: []
      }
      university_hacks: {
        Row: {
          created_at: string
          hack_text: string
          id: string
          source_type: string
          source_url: string | null
          uni_id: string
          upvotes: number
        }
        Insert: {
          created_at?: string
          hack_text: string
          id?: string
          source_type?: string
          source_url?: string | null
          uni_id: string
          upvotes?: number
        }
        Update: {
          created_at?: string
          hack_text?: string
          id?: string
          source_type?: string
          source_url?: string | null
          uni_id?: string
          upvotes?: number
        }
        Relationships: []
      }
      university_hacks_ai: {
        Row: {
          content_md: string
          generated_at: string
          uni_id: string
        }
        Insert: {
          content_md: string
          generated_at?: string
          uni_id: string
        }
        Update: {
          content_md?: string
          generated_at?: string
          uni_id?: string
        }
        Relationships: []
      }
      university_tips: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          posted_at: string | null
          source_platform: string
          source_upvotes: number | null
          source_url: string | null
          submitted_by: string | null
          tag: string
          tip_text: string
          uni_slug: string
          verified: boolean
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          posted_at?: string | null
          source_platform: string
          source_upvotes?: number | null
          source_url?: string | null
          submitted_by?: string | null
          tag: string
          tip_text: string
          uni_slug: string
          verified?: boolean
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          posted_at?: string | null
          source_platform?: string
          source_upvotes?: number | null
          source_url?: string | null
          submitted_by?: string | null
          tag?: string
          tip_text?: string
          uni_slug?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "university_tips_uni_slug_fkey"
            columns: ["uni_slug"]
            isOneToOne: false
            referencedRelation: "universities_detail"
            referencedColumns: ["slug"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
