export type Role = "Admin" | "Sales" | "Warehouse" | "Accounts";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface ApiList<T> {
  data: T[];
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  business_name?: string | null;
  gst_number?: string | null;
  customer_type: "Retail" | "Wholesale" | "Distributor";
  address?: string | null;
  status: "Lead" | "Active" | "Inactive";
  follow_up_date?: string | null;
  notes?: string | null;
  latest_note?: string | null;
  latest_note_at?: string | null;
  created_at: string;
  followUps?: FollowUp[];
}

export interface FollowUp {
  id: number;
  note: string;
  follow_up_date?: string | null;
  created_at: string;
  created_by_name?: string | null;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  sku: string;
  category?: string | null;
  price?: string | number;
  unitPrice?: string | number;
  unit_price?: string | number;
  quantity?: number;
  currentStock?: number;
  current_stock?: number;
  minimumStockAlertQuantity?: number;
  minimum_stock_alert_quantity?: number;
  location?: string | null;
  isLowStock?: boolean;
  created_at: string;
  movements?: StockMovement[];
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  quantity_changed: number;
  movement_type: "IN" | "OUT";
  reason: string;
  created_at: string;
  created_by_name?: string | null;
}

export type ChallanStatus = "Draft" | "Confirmed" | "Cancelled";

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name: string;
  business_name?: string | null;
  mobile?: string | null;
  phone?: string | null;
  email?: string | null;
  gst_number?: string | null;
  address?: string | null;
  total_quantity: number;
  total_amount: string | number;
  status: ChallanStatus;
  created_by_name?: string | null;
  created_at: string;
  items?: ChallanItem[];
}

export interface ChallanItem {
  id: number;
  product_id: number;
  product_name_snapshot: string;
  product_sku_snapshot: string;
  unit_price_snapshot: string | number;
  quantity: number;
  line_total: string | number;
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  lowStockProducts: Product[];
  recentOrders: Challan[];
  salesTrend: Array<{ label: string; total: number }>;
  recentActivities: Array<{
    type: string;
    title: string;
    created_at: string;
  }>;
}
