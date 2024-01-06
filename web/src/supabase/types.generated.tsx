export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      alert: {
        Row: {
          created_at: string
          id: number
          metadata: Json
          org_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          metadata: Json
          org_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          metadata?: Json
          org_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          }
        ]
      }
      alert_receiver: {
        Row: {
          created_at: string | null
          id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
        }
        Update: {
          created_at?: string | null
          id?: number
        }
        Relationships: []
      }
      alert_rule: {
        Row: {
          applied_at: string | null
          created_at: string
          id: number
          org_id: number
          rule: Json
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          id?: number
          org_id: number
          rule: Json
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          id?: number
          org_id?: number
          rule?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_rule_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          }
        ]
      }
      country: {
        Row: {
          continent: Database["public"]["Enums"]["continents"] | null
          id: number
          iso2: string
          iso3: string | null
          local_name: string | null
          name: string | null
        }
        Insert: {
          continent?: Database["public"]["Enums"]["continents"] | null
          id?: number
          iso2: string
          iso3?: string | null
          local_name?: string | null
          name?: string | null
        }
        Update: {
          continent?: Database["public"]["Enums"]["continents"] | null
          id?: number
          iso2?: string
          iso3?: string | null
          local_name?: string | null
          name?: string | null
        }
        Relationships: []
      }
      device: {
        Row: {
          coordinate: unknown | null
          created_at: string
          hub_id: string
          id: number
          key: string | null
          last_seen: string | null
          location_id: number | null
          name: string | null
          notes: string | null
          org_id: number
        }
        Insert: {
          coordinate?: unknown | null
          created_at?: string
          hub_id: string
          id?: number
          key?: string | null
          last_seen?: string | null
          location_id?: number | null
          name?: string | null
          notes?: string | null
          org_id: number
        }
        Update: {
          coordinate?: unknown | null
          created_at?: string
          hub_id?: string
          id?: number
          key?: string | null
          last_seen?: string | null
          location_id?: number | null
          name?: string | null
          notes?: string | null
          org_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "device_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: true
            referencedRelation: "decrypted_hub"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: true
            referencedRelation: "hub"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          }
        ]
      }
      hub: {
        Row: {
          created_at: string | null
          id: string
          machine_id: string
          machine_secret_hash: string
          metadata: Json | null
          password: string
          root_password: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          machine_id: string
          machine_secret_hash: string
          metadata?: Json | null
          password: string
          root_password?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          machine_id?: string
          machine_secret_hash?: string
          metadata?: Json | null
          password?: string
          root_password?: string | null
        }
        Relationships: []
      }
      instance: {
        Row: {
          created_at: string | null
          domain: string | null
          id: number
          stub: string
        }
        Insert: {
          created_at?: string | null
          domain?: string | null
          id?: number
          stub: string
        }
        Update: {
          created_at?: string | null
          domain?: string | null
          id?: number
          stub?: string
        }
        Relationships: []
      }
      location: {
        Row: {
          archived_at: string | null
          created_at: string
          deleted_at: string | null
          id: number
          name: string
          org_id: number
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          name: string
          org_id: number
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          name?: string
          org_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          }
        ]
      }
      modbus_device: {
        Row: {
          created_at: string
          id: number
          interface_id: number
          product_id: number
          slave_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          interface_id: number
          product_id: number
          slave_id: number
        }
        Update: {
          created_at?: string
          id?: number
          interface_id?: number
          product_id?: number
          slave_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "modbus_device_interface_id_fkey"
            columns: ["interface_id"]
            isOneToOne: false
            referencedRelation: "modbus_interface"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modbus_device_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "modbus_product"
            referencedColumns: ["id"]
          }
        ]
      }
      modbus_interface: {
        Row: {
          config: Json
          created_at: string
          device_id: number
          id: number
        }
        Insert: {
          config: Json
          created_at?: string
          device_id: number
          id?: number
        }
        Update: {
          config?: Json
          created_at?: string
          device_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "modbus_interface_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "device"
            referencedColumns: ["id"]
          }
        ]
      }
      modbus_product: {
        Row: {
          created_at: string
          id: number
          manufacturer: string | null
          name: string | null
          schema: Json
          version: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          manufacturer?: string | null
          name?: string | null
          schema: Json
          version?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          manufacturer?: string | null
          name?: string | null
          schema?: Json
          version?: string | null
        }
        Relationships: []
      }
      notification: {
        Row: {
          created_at: string
          details: string | null
          id: number
          link: string | null
          org_id: number
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: number
          link?: string | null
          org_id: number
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: number
          link?: string | null
          org_id?: number
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      org: {
        Row: {
          abn: string | null
          billing_email: string
          created_at: string | null
          id: number
          instance_id: number | null
          key: string | null
          name: string
          owner_id: string
          phone: string
        }
        Insert: {
          abn?: string | null
          billing_email: string
          created_at?: string | null
          id?: number
          instance_id?: number | null
          key?: string | null
          name: string
          owner_id: string
          phone: string
        }
        Update: {
          abn?: string | null
          billing_email?: string
          created_at?: string | null
          id?: number
          instance_id?: number | null
          key?: string | null
          name?: string
          owner_id?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "instance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      org_invite: {
        Row: {
          created_at: string
          email: string
          id: number
          org_id: number
          role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          org_id: number
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          org_id?: number
          role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "org_invite_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          }
        ]
      }
      org_member: {
        Row: {
          created_at: string
          id: number
          org_id: number
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          org_id: number
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          org_id?: number
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_member_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_member_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      phone_mfa: {
        Row: {
          factor: string
          phone_number: string
          user: string
        }
        Insert: {
          factor: string
          phone_number: string
          user: string
        }
        Update: {
          factor?: string
          phone_number?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_mfa_factor_fkey"
            columns: ["factor"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_mfa_user_fkey"
            columns: ["user"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      decrypted_hub: {
        Row: {
          created_at: string | null
          decrypted_root_password: string | null
          id: string | null
          machine_id: string | null
          machine_secret_hash: string | null
          metadata: Json | null
          password: string | null
          root_password: string | null
        }
        Insert: {
          created_at?: string | null
          decrypted_root_password?: never
          id?: string | null
          machine_id?: string | null
          machine_secret_hash?: string | null
          metadata?: Json | null
          password?: string | null
          root_password?: string | null
        }
        Update: {
          created_at?: string | null
          decrypted_root_password?: never
          id?: string | null
          machine_id?: string | null
          machine_secret_hash?: string | null
          metadata?: Json | null
          password?: string | null
          root_password?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_device: {
        Args: {
          serial: string
          password: string
          org_id: number
        }
        Returns: boolean
      }
      check_org_membership: {
        Args: {
          org_id: number
          user_id: string
        }
        Returns: boolean
      }
      check_user_access:
        | {
            Args: {
              user_id: string
              org_id: number
              required_role: Database["public"]["Enums"]["user_role"]
            }
            Returns: boolean
          }
        | {
            Args: {
              user_id: string
              required_role: Database["public"]["Enums"]["user_role"]
            }
            Returns: boolean
          }
      check_user_current_org: {
        Args: {
          user_jwt: Json
          org_id: number
        }
        Returns: boolean
      }
      get_org_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          email: string
          name: string
        }[]
      }
      get_user_info: {
        Args: {
          subject_user_id: string
        }
        Returns: {
          id: string
          email: string
          name: string
        }[]
      }
      is_valid_abn: {
        Args: {
          abn_input: string
        }
        Returns: boolean
      }
    }
    Enums: {
      continents:
        | "Africa"
        | "Antarctica"
        | "Asia"
        | "Europe"
        | "Oceania"
        | "North America"
        | "South America"
      severity: "information" | "warning" | "error"
      user_role: "owner" | "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

