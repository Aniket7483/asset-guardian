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
      asset_conditions: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      asset_history: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          asset_id: string
          created_at: string
          details: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          asset_id: string
          created_at?: string
          details?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          asset_id?: string
          created_at?: string
          details?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      assets: {
        Row: {
          archived: boolean
          asset_code: string
          asset_type: string | null
          assigned_at: string | null
          assigned_employee_id: string | null
          brand: string | null
          building_id: string | null
          category_id: string | null
          condition: string
          created_at: string
          created_by: string | null
          description: string | null
          expected_return_date: string | null
          floor_id: string | null
          id: string
          invoice_number: string | null
          model: string | null
          name: string
          notes: string | null
          ownership: string | null
          photo_url: string | null
          purchase_date: string | null
          purchase_price: number | null
          quantity: number
          room_id: string | null
          serial_number: string | null
          specific_location: string | null
          status: string
          updated_at: string
          vendor: string | null
          warranty_end: string | null
          warranty_start: string | null
        }
        Insert: {
          archived?: boolean
          asset_code: string
          asset_type?: string | null
          assigned_at?: string | null
          assigned_employee_id?: string | null
          brand?: string | null
          building_id?: string | null
          category_id?: string | null
          condition?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_return_date?: string | null
          floor_id?: string | null
          id?: string
          invoice_number?: string | null
          model?: string | null
          name: string
          notes?: string | null
          ownership?: string | null
          photo_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          room_id?: string | null
          serial_number?: string | null
          specific_location?: string | null
          status?: string
          updated_at?: string
          vendor?: string | null
          warranty_end?: string | null
          warranty_start?: string | null
        }
        Update: {
          archived?: boolean
          asset_code?: string
          asset_type?: string | null
          assigned_at?: string | null
          assigned_employee_id?: string | null
          brand?: string | null
          building_id?: string | null
          category_id?: string | null
          condition?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_return_date?: string | null
          floor_id?: string | null
          id?: string
          invoice_number?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          ownership?: string | null
          photo_url?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          room_id?: string | null
          serial_number?: string | null
          specific_location?: string | null
          status?: string
          updated_at?: string
          vendor?: string | null
          warranty_end?: string | null
          warranty_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          asset_id: string
          assigned_date: string
          created_at: string
          employee_id: string
          expected_return_date: string | null
          id: string
          notes: string | null
          returned_date: string | null
        }
        Insert: {
          asset_id: string
          assigned_date?: string
          created_at?: string
          employee_id: string
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          returned_date?: string | null
        }
        Update: {
          asset_id?: string
          assigned_date?: string
          created_at?: string
          employee_id?: string
          expected_return_date?: string | null
          id?: string
          notes?: string | null
          returned_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          archived: boolean
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          active: boolean
          created_at: string
          department: string | null
          designation: string | null
          email: string | null
          employee_code: string
          id: string
          name: string
          phone: string | null
          room_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_code: string
          id?: string
          name: string
          phone?: string | null
          room_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_code?: string
          id?: string
          name?: string
          phone?: string | null
          room_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          building_id: string
          created_at: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          building_id: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          building_id?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "floors_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          asset_id: string
          created_at: string
          description: string | null
          employee_id: string | null
          id: string
          location: string | null
          notes: string | null
          reported_by: string | null
          reported_date: string
          resolution_status: string
          type: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          reported_by?: string | null
          reported_date?: string
          resolution_status?: string
          type?: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          description?: string | null
          employee_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          reported_by?: string | null
          reported_date?: string
          resolution_status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          asset_id: string
          completion_date: string | null
          cost: number | null
          created_at: string
          description: string | null
          expected_completion: string | null
          id: string
          maintenance_date: string
          notes: string | null
          problem: string | null
          service_provider: string | null
          status: string
        }
        Insert: {
          asset_id: string
          completion_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          expected_completion?: string | null
          id?: string
          maintenance_date?: string
          notes?: string | null
          problem?: string | null
          service_provider?: string | null
          status?: string
        }
        Update: {
          asset_id?: string
          completion_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          expected_completion?: string | null
          id?: string
          maintenance_date?: string
          notes?: string | null
          problem?: string | null
          service_provider?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          area: string | null
          created_at: string
          floor_id: string
          id: string
          name: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          floor_id: string
          id?: string
          name: string
        }
        Update: {
          area?: string | null
          created_at?: string
          floor_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_items: {
        Row: {
          asset_id: string
          id: string
          result: string
          scanned_at: string
          verification_id: string
        }
        Insert: {
          asset_id: string
          id?: string
          result?: string
          scanned_at?: string
          verification_id: string
        }
        Update: {
          asset_id?: string
          id?: string
          result?: string
          scanned_at?: string
          verification_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_items_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_items_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      verifications: {
        Row: {
          building_id: string | null
          completed_at: string | null
          created_by: string | null
          floor_id: string | null
          id: string
          name: string
          room_id: string | null
          started_at: string
          status: string
        }
        Insert: {
          building_id?: string | null
          completed_at?: string | null
          created_by?: string | null
          floor_id?: string | null
          id?: string
          name: string
          room_id?: string | null
          started_at?: string
          status?: string
        }
        Update: {
          building_id?: string | null
          completed_at?: string | null
          created_by?: string | null
          floor_id?: string | null
          id?: string
          name?: string
          room_id?: string | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "verifications_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verifications_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "staff"
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
      app_role: ["super_admin", "admin", "staff"],
    },
  },
} as const
