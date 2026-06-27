export interface Order {
  ma_phieugui: string;
  ma_buucu: string;
  time_nhap_may: string; // ISO String (YYYY-MM-DDTHH:mm:ss)
  ma_khgui: string;
  ten_khgui: string;
  trong_luong: number; // in grams
  tong_cuoc: number; // in VND
  SAN: string; // e.g. Shopee, Lazada, TikTok, Sàn Khác
}

export type TabType = 'input' | 'dashboard';

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  buuCu: string; // "All" or specific
  san: string; // "All" or specific
  khachHang: string; // "All" or specific
  compareMode: 'yesterday' | 'last_month' | 'none';
}

export interface AnomalyThresholds {
  tong_cuoc_max_change_pct: number; // % increase/decrease to trigger alert
  trong_luong_max_change_pct: number;
  ma_phieugui_max_change_pct: number;
}

export interface AnomalyWarning {
  field: string; // e.g. "Tổng cước", "Trọng lượng", "Số lượng đơn"
  dimension: string; // e.g. "Bưu cục BC1001" or "Sàn Shopee"
  currentValue: number;
  compareValue: number;
  changePct: number;
  type: 'increase' | 'decrease';
  severity: 'warning' | 'critical';
  message: string;
}

export interface UserConfig {
  id: string;
  username: string;
  password?: string;
  name: string;
  roleName: string; // e.g. "Admin", "Manager", "Nhân viên"
  canViewDashboard: boolean;
  canInputData: boolean;
  isSystem?: boolean; // Cannot delete
}

export interface HistoryLog {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  userWhoChanged: string; // Name of modifier
  actionType: 'create' | 'update' | 'delete' | 'login' | 'logout';
  details: string; // Describe change details
}

