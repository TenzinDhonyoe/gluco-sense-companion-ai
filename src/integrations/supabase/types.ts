export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          average_heart_rate: number | null
          calories_burned: number | null
          created_at: string
          duration_minutes: number
          exercise_name: string
          exercise_type: string
          id: string
          intensity: Database["public"]["Enums"]["exercise_intensity"]
          max_heart_rate: number | null
          notes: string | null
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          average_heart_rate?: number | null
          calories_burned?: number | null
          created_at?: string
          duration_minutes: number
          exercise_name: string
          exercise_type: string
          id?: string
          intensity: Database["public"]["Enums"]["exercise_intensity"]
          max_heart_rate?: number | null
          notes?: string | null
          timestamp?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          average_heart_rate?: number | null
          calories_burned?: number | null
          created_at?: string
          duration_minutes?: number
          exercise_name?: string
          exercise_type?: string
          id?: string
          intensity?: Database["public"]["Enums"]["exercise_intensity"]
          max_heart_rate?: number | null
          notes?: string | null
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      food_items: {
        Row: {
          barcode: string | null
          brand: string | null
          calories_per_unit: number | null
          carbs_per_unit: number | null
          category: Database["public"]["Enums"]["food_category"] | null
          created_at: string
          fat_per_unit: number | null
          fiber_per_unit: number | null
          food_name: string
          id: string
          meal_id: string
          protein_per_unit: number | null
          quantity: number
          unit: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calories_per_unit?: number | null
          carbs_per_unit?: number | null
          category?: Database["public"]["Enums"]["food_category"] | null
          created_at?: string
          fat_per_unit?: number | null
          fiber_per_unit?: number | null
          food_name: string
          id?: string
          meal_id: string
          protein_per_unit?: number | null
          quantity: number
          unit?: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calories_per_unit?: number | null
          carbs_per_unit?: number | null
          category?: Database["public"]["Enums"]["food_category"] | null
          created_at?: string
          fat_per_unit?: number | null
          fiber_per_unit?: number | null
          food_name?: string
          id?: string
          meal_id?: string
          protein_per_unit?: number | null
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      glucose_events: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: string
          glucose_reading_id: string
          id: string
          notes: string | null
          time_relative_to_event: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type: string
          glucose_reading_id: string
          id?: string
          notes?: string | null
          time_relative_to_event?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_type?: string
          glucose_reading_id?: string
          id?: string
          notes?: string | null
          time_relative_to_event?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glucose_events_glucose_reading_id_fkey"
            columns: ["glucose_reading_id"]
            isOneToOne: false
            referencedRelation: "glucose_readings"
            referencedColumns: ["id"]
          },
        ]
      }
      glucose_readings: {
        Row: {
          calibration_offset: number | null
          created_at: string
          data_quality_score: number | null
          id: string
          is_sensor_reading: boolean
          notes: string | null
          sensor_id: string | null
          source: string
          tag: Database["public"]["Enums"]["glucose_tag"] | null
          timestamp: string
          unit: string
          updated_at: string
          user_id: string
          value: number
          value_mg_dl: number | null
          value_mmol_l: number | null
        }
        Insert: {
          calibration_offset?: number | null
          created_at?: string
          data_quality_score?: number | null
          id?: string
          is_sensor_reading?: boolean
          notes?: string | null
          sensor_id?: string | null
          source?: string
          tag?: Database["public"]["Enums"]["glucose_tag"] | null
          timestamp?: string
          unit?: string
          updated_at?: string
          user_id: string
          value: number
          value_mg_dl?: number | null
          value_mmol_l?: number | null
        }
        Update: {
          calibration_offset?: number | null
          created_at?: string
          data_quality_score?: number | null
          id?: string
          is_sensor_reading?: boolean
          notes?: string | null
          sensor_id?: string | null
          source?: string
          tag?: Database["public"]["Enums"]["glucose_tag"] | null
          timestamp?: string
          unit?: string
          updated_at?: string
          user_id?: string
          value?: number
          value_mg_dl?: number | null
          value_mmol_l?: number | null
        }
        Relationships: []
      }
      meals: {
        Row: {
          created_at: string
          glycemic_index: number | null
          id: string
          meal_name: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes: string | null
          photo_url: string | null
          timestamp: string
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_fiber: number | null
          total_protein: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          glycemic_index?: number | null
          id?: string
          meal_name: string
          meal_type: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          photo_url?: string | null
          timestamp?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          glycemic_index?: number | null
          id?: string
          meal_name?: string
          meal_type?: Database["public"]["Enums"]["meal_type"]
          notes?: string | null
          photo_url?: string | null
          timestamp?: string
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_fiber?: number | null
          total_protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      insert_sample_glucose_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      exercise_intensity: "low" | "moderate" | "high" | "very_high"
      food_category:
        | "grains"
        | "vegetables"
        | "fruits"
        | "dairy"
        | "protein"
        | "fats"
        | "sweets"
        | "beverages"
        | "processed"
        | "fast_food"
        | "other"
      glucose_tag:
        | "fasting"
        | "post-meal"
        | "before-sleep"
        | "random"
        | "pre-meal"
        | "bedtime"
        | "exercise"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack" | "other"
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
    Enums: {
      exercise_intensity: ["low", "moderate", "high", "very_high"],
      food_category: [
        "grains",
        "vegetables",
        "fruits",
        "dairy",
        "protein",
        "fats",
        "sweets",
        "beverages",
        "processed",
        "fast_food",
        "other",
      ],
      glucose_tag: [
        "fasting",
        "post-meal",
        "before-sleep",
        "random",
        "pre-meal",
        "bedtime",
        "exercise",
      ],
      meal_type: ["breakfast", "lunch", "dinner", "snack", "other"],
    },
  },
} as const
