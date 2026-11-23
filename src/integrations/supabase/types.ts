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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_activity: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          ended_at: string | null
          last_seen: string
          session_id: string
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          last_seen?: string
          session_id: string
          user_id: string
        }
        Update: {
          ended_at?: string | null
          last_seen?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          currency: string
          id: boolean
          idle_minutes: number
          notification_preferences: Json
          require_mfa: boolean
          timezone: string
          updated_by: string | null
        }
        Insert: {
          currency?: string
          id?: boolean
          idle_minutes?: number
          notification_preferences?: Json
          require_mfa?: boolean
          timezone?: string
          updated_by?: string | null
        }
        Update: {
          currency?: string
          id?: boolean
          idle_minutes?: number
          notification_preferences?: Json
          require_mfa?: boolean
          timezone?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      customer_notifications: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          shipment_id: string | null
          title: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          shipment_id?: string | null
          title: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          shipment_id?: string | null
          title?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notifications_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_sessions: {
        Row: {
          first_seen: string
          last_seen: string
          session_id: string
          user_id: string
        }
        Insert: {
          first_seen?: string
          last_seen?: string
          session_id: string
          user_id: string
        }
        Update: {
          first_seen?: string
          last_seen?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_assignments: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          notes: string
          shipment_id: string
          status: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          notes?: string
          shipment_id: string
          status?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          notes?: string
          shipment_id?: string
          status?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "delivery_personnel"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_personnel: {
        Row: {
          active: boolean
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      master_admin_reservation: {
        Row: {
          email: string
          id: boolean
        }
        Insert: {
          email?: string
          id?: boolean
        }
        Update: {
          email?: string
          id?: boolean
        }
        Relationships: []
      }
      payment_records: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          provider: string
          provider_reference: string
          shipment_id: string | null
          status: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          id?: string
          provider: string
          provider_reference: string
          shipment_id?: string | null
          status: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_reference?: string
          shipment_id?: string | null
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          address: string
          avatar_path: string
          city: string
          country: string
          created_at: string
          customer_id: string
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string
          notification_preferences: Json
          phone: string
          postal_code: string
          state: string
          suspension_reason: string
          updated_by: string | null
        }
        Insert: {
          account_status?: string
          address?: string
          avatar_path?: string
          city?: string
          country?: string
          created_at?: string
          customer_id?: string
          date_of_birth?: string | null
          first_name?: string
          id: string
          last_name?: string
          notification_preferences?: Json
          phone?: string
          postal_code?: string
          state?: string
          suspension_reason?: string
          updated_by?: string | null
        }
        Update: {
          account_status?: string
          address?: string
          avatar_path?: string
          city?: string
          country?: string
          created_at?: string
          customer_id?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notification_preferences?: Json
          phone?: string
          postal_code?: string
          state?: string
          suspension_reason?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          created_at: string
          details: Json
          email: string
          id: string
          kind: string
          name: string
          phone: string
          status: string
          subject: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          email: string
          id?: string
          kind: string
          name?: string
          phone?: string
          status?: string
          subject?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          email?: string
          id?: string
          kind?: string
          name?: string
          phone?: string
          status?: string
          subject?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shipment_events: {
        Row: {
          delivery_verified: boolean
          description: string
          id: string
          location: string
          occurred_at: string
          proof_path: string | null
          shipment_id: string
          status: string
          updated_by: string | null
        }
        Insert: {
          delivery_verified?: boolean
          description?: string
          id?: string
          location: string
          occurred_at?: string
          proof_path?: string | null
          shipment_id: string
          status: string
          updated_by?: string | null
        }
        Update: {
          delivery_verified?: boolean
          description?: string
          id?: string
          location?: string
          occurred_at?: string
          proof_path?: string | null
          shipment_id?: string
          status?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          cancelled_at: string | null
          created_at: string
          currency: string
          destination: string
          estimated_delivery: string | null
          id: string
          latest_location: string | null
          origin: string
          parcel_description: string
          parcel_weight: number
          recipient_address: string
          recipient_city: string
          recipient_country: string
          recipient_email: string
          recipient_name: string | null
          recipient_phone: string
          recipient_state: string
          sender_address: string
          sender_city: string
          sender_country: string
          sender_email: string
          sender_name: string | null
          sender_phone: string
          sender_state: string
          shipment_type: string
          shipping_cost: number
          status: string
          tracking_id: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          destination: string
          estimated_delivery?: string | null
          id?: string
          latest_location?: string | null
          origin: string
          parcel_description?: string
          parcel_weight?: number
          recipient_address?: string
          recipient_city?: string
          recipient_country?: string
          recipient_email?: string
          recipient_name?: string | null
          recipient_phone?: string
          recipient_state?: string
          sender_address?: string
          sender_city?: string
          sender_country?: string
          sender_email?: string
          sender_name?: string | null
          sender_phone?: string
          sender_state?: string
          shipment_type?: string
          shipping_cost?: number
          status?: string
          tracking_id?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          destination?: string
          estimated_delivery?: string | null
          id?: string
          latest_location?: string | null
          origin?: string
          parcel_description?: string
          parcel_weight?: number
          recipient_address?: string
          recipient_city?: string
          recipient_country?: string
          recipient_email?: string
          recipient_name?: string | null
          recipient_phone?: string
          recipient_state?: string
          sender_address?: string
          sender_city?: string
          sender_country?: string
          sender_email?: string
          sender_name?: string | null
          sender_phone?: string
          sender_state?: string
          shipment_type?: string
          shipping_cost?: number
          status?: string
          tracking_id?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_replies: {
        Row: {
          created_at: string
          id: string
          message: string
          request_id: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          request_id: string
          updated_by: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          request_id?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_replies_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      website_content: {
        Row: {
          draft: Json
          id: boolean
          published: Json
          published_at: string | null
          updated_by: string | null
        }
        Insert: {
          draft?: Json
          id?: boolean
          published?: Json
          published_at?: string | null
          updated_by?: string | null
        }
        Update: {
          draft?: Json
          id?: boolean
          published?: Json
          published_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_operational_stats: { Args: never; Returns: Json }
      admin_tracking_event: {
        Args: {
          p_actor: string
          p_description: string
          p_event_id?: string
          p_location: string
          p_occurred_at: string
          p_proof_path?: string
          p_shipment_id: string
          p_status: string
          p_verified: boolean
        }
        Returns: string
      }
      get_published_website_content: { Args: never; Returns: Json }
      is_active_customer: { Args: never; Returns: boolean }
      is_master_admin: { Args: never; Returns: boolean }
      manage_customer_notification: {
        Args: { p_action?: string; p_id?: string }
        Returns: undefined
      }
      record_customer_session: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      track_shipment: { Args: { p_tracking_id: string }; Returns: Json }
      update_customer_avatar: { Args: { p_path: string }; Returns: undefined }
      update_customer_preferences: {
        Args: { p_preferences: Json }
        Returns: undefined
      }
      update_customer_profile: { Args: { p_details: Json }; Returns: undefined }
    }
    Enums: {
      app_role: "master_admin"
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
      app_role: ["master_admin"],
    },
  },
} as const
