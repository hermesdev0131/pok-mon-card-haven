export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          cpf_hash: string | null;
          address_line: string | null;
          address_city: string | null;
          address_state: string | null;
          address_zip: string | null;
          role: 'buyer' | 'seller' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          avatar_url?: string | null;
          phone?: string | null;
          cpf_hash?: string | null;
          address_line?: string | null;
          address_city?: string | null;
          address_state?: string | null;
          address_zip?: string | null;
          role?: 'buyer' | 'seller' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          phone?: string | null;
          cpf_hash?: string | null;
          address_line?: string | null;
          address_city?: string | null;
          address_state?: string | null;
          address_zip?: string | null;
          role?: 'buyer' | 'seller' | 'admin';
          updated_at?: string;
        };
      };
      seller_profiles: {
        Row: {
          id: string;
          store_name: string;
          description: string | null;
          verified: boolean;
          total_sales: number;
          rating: number;
          rating_count: number;
          commission_rate: number;
          mercadopago_seller_id: string | null;
          payout_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          store_name: string;
          description?: string | null;
          verified?: boolean;
          total_sales?: number;
          rating?: number;
          rating_count?: number;
          commission_rate?: number;
          mercadopago_seller_id?: string | null;
          payout_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          store_name?: string;
          description?: string | null;
          verified?: boolean;
          mercadopago_seller_id?: string | null;
          payout_email?: string | null;
          updated_at?: string;
        };
      };
      card_bases: {
        Row: {
          id: string;
          name: string;
          set_name: string;
          set_code: string;
          number: string;
          type: CardType;
          rarity: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          set_name: string;
          set_code: string;
          number: string;
          type?: CardType;
          rarity?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          set_name?: string;
          set_code?: string;
          number?: string;
          type?: CardType;
          rarity?: string | null;
          image_url?: string | null;
        };
      };
      listings: {
        Row: {
          id: string;
          seller_id: string;
          card_base_id: string;
          grade: number;
          grade_company: GradeCompany;
          cert_number: string | null;
          price: number;
          status: ListingStatus;
          free_shipping: boolean;
          condition_notes: string | null;
          tags: string[];
          images: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          card_base_id: string;
          grade: number;
          grade_company: GradeCompany;
          cert_number?: string | null;
          price: number;
          status?: ListingStatus;
          free_shipping?: boolean;
          condition_notes?: string | null;
          tags?: string[];
          images?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          grade?: number;
          grade_company?: GradeCompany;
          cert_number?: string | null;
          price?: number;
          status?: ListingStatus;
          free_shipping?: boolean;
          condition_notes?: string | null;
          tags?: string[];
          images?: string[];
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          status: OrderStatus;
          price: number;
          shipping_cost: number;
          platform_fee: number;
          seller_payout: number;
          mp_payment_id: string | null;
          mp_preference_id: string | null;
          tracking_code: string | null;
          tracking_url: string | null;
          paid_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          completed_at: string | null;
          cancelled_at: string | null;
          auto_complete_at: string | null;
          cancellation_reason: string | null;
          refunded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          seller_id: string;
          status?: OrderStatus;
          price: number;
          shipping_cost?: number;
          platform_fee?: number;
          seller_payout?: number;
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          tracking_code?: string | null;
          tracking_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: OrderStatus;
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          tracking_code?: string | null;
          tracking_url?: string | null;
          paid_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          completed_at?: string | null;
          cancelled_at?: string | null;
          auto_complete_at?: string | null;
          cancellation_reason?: string | null;
          refunded_at?: string | null;
          updated_at?: string;
        };
      };
      confirmed_sales: {
        Row: {
          id: string;
          card_base_id: string;
          order_id: string;
          buyer_id: string;
          seller_id: string;
          grade: number;
          grade_company: GradeCompany;
          sale_price: number;
          sold_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          card_base_id: string;
          order_id: string;
          buyer_id: string;
          seller_id: string;
          grade: number;
          grade_company: GradeCompany;
          sale_price: number;
          sold_at: string;
          created_at?: string;
        };
        Update: never; // Immutable — no updates allowed
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          seller_id: string;
          buyer_id: string;
          rating: number;
          comment: string | null;
          seller_reply: string | null;
          replied_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          seller_id: string;
          buyer_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          seller_reply?: string | null;
          replied_at?: string | null;
        };
      };
      questions: {
        Row: {
          id: string;
          listing_id: string;
          user_id: string;
          question: string;
          answer: string | null;
          answered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          user_id: string;
          question: string;
          created_at?: string;
        };
        Update: {
          answer?: string | null;
          answered_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          order_id: string;
          sender_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
      };
      disputes: {
        Row: {
          id: string;
          order_id: string;
          opened_by: string;
          reason: string;
          description: string | null;
          status: DisputeStatus;
          admin_notes: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          opened_by: string;
          reason: string;
          description?: string | null;
          status?: DisputeStatus;
          created_at?: string;
        };
        Update: {
          status?: DisputeStatus;
          admin_notes?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          updated_at?: string;
        };
      };
      admin_event_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          details?: Json;
          created_at?: string;
        };
        Update: never; // Append-only
      };
      platform_config: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          value?: Json;
          updated_at?: string;
        };
      };
    };
    Enums: {
      card_type: CardType;
      grade_company: GradeCompany;
      listing_status: ListingStatus;
      order_status: OrderStatus;
      dispute_status: DisputeStatus;
    };
  };
};

// Enum types matching the database
export type CardType =
  | 'fire' | 'electric' | 'psychic' | 'dark' | 'dragon'
  | 'ghost' | 'flying' | 'grass' | 'water' | 'normal'
  | 'fighting' | 'steel' | 'fairy' | 'colorless';

export type GradeCompany = 'PSA' | 'CGC' | 'Beckett' | 'TAG' | 'ARS' | 'Mana Fix' | 'BGA' | 'Capy' | 'Taverna';

export type ListingStatus = 'active' | 'sold' | 'reserved' | 'cancelled';

export type OrderStatus =
  | 'awaiting_payment'
  | 'payment_confirmed'
  | 'awaiting_shipment'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'disputed'
  | 'cancelled'
  | 'refunded';

export type DisputeStatus = 'open' | 'resolved_buyer' | 'resolved_seller' | 'escalated' | 'closed';

// Convenience aliases for row types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type SellerProfile = Database['public']['Tables']['seller_profiles']['Row'];
export type CardBase = Database['public']['Tables']['card_bases']['Row'];
export type Listing = Database['public']['Tables']['listings']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type ConfirmedSale = Database['public']['Tables']['confirmed_sales']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Dispute = Database['public']['Tables']['disputes']['Row'];
