import React, { useState, useMemo } from 'react';
import { Order, DashboardFilters, AnomalyThresholds, AnomalyWarning } from '../types';
import { formatVND, formatWeight } from '../utils/helpers';
import { getBuuCucMapping } from '../utils/buucucMapping';
import { 
  Calendar, 
  Building2, 
  ShoppingBag, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sliders, 
  HelpCircle,
  Users,
  Layers,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  BarChart4,
  RefreshCw,
  Clock,
  CheckCircle
} from 'lucide-react';

interface DashboardTabProps {
  orders: Order[];
}

export default function DashboardTab({ orders }: DashboardTabProps) {
  // --- Filter State ---
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    const dates = orders
      .map(o => o.time_nhap_may.slice(0, 10))
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    return {
      startDate: dates[0] || '2026-06-21',
      endDate: dates[dates.length - 1] || '2026-06-27',
      buuCu: 'All',
      san: 'All',
      khachHang: 'All',
      compareMode: 'yesterday'
    };
  });

  // Automatically adjust filters to cover the new date bounds when orders are added or reset
  const [prevOrdersLength, setPrevOrdersLength] = useState(orders.length);

  React.useEffect(() => {
    if (orders.length !== prevOrdersLength) {
      setPrevOrdersLength(orders.length);
      const dates = orders
        .map(o => o.time_nhap_may.slice(0, 10))
        .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort();
      if (dates.length > 0) {
        setFilters(prev => ({
          ...prev,
          startDate: dates[0],
          endDate: dates[dates.length - 1]
        }));
      }
    }
  }, [orders, prevOrdersLength]);

  // --- Search Text for Customer Dropdown ---
  const [custSearchText, setCustSearchText] = useState('');

  // --- Sub tabs inside Dashboard ---
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'region' | 'cluster' | 'postoffice'>('overview');

  // --- Sorting state for regional, cluster, and post office reports ---
  const [regionSort, setRegionSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'totalCước', dir: 'desc' });
  const [clusterSort, setClusterSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'totalCước', dir: 'desc' });
  const [poSort, setPoSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'totalCước', dir: 'desc' });

  // --- Top List State ---
  const [topLimit, setTopLimit] = useState<number>(10);
  const [topMetric, setTopMetric] = useState<'tong_cuoc' | 'ma_phieugui'>('tong_cuoc');

  // --- Top Post Offices State ---
  const [topBuuCucLimit, setTopBuuCucLimit] = useState<number>(10);
  const [topBuuCucMetric, setTopBuuCucMetric] = useState<'tong_cuoc' | 'ma_phieugui'>('tong_cuoc');

  // --- Anomaly Sensitivity Thresholds ---
  const [thresholds, setThresholds] = useState<AnomalyThresholds>({
    tong_cuoc_max_change_pct: 30, // 30% change is anomalous
    trong_luong_max_change_pct: 40,
    ma_phieugui_max_change_pct: 25
  });

  const [activeMetricTab, setActiveMetricTab] = useState<'tong_cuoc' | 'ma_phieugui' | 'trong_luong'>('tong_cuoc');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ date: string; current: number; compare?: number } | null>(null);

  // --- Available filter values in the dataset ---
  const buuCuList = useMemo(() => {
    const list = new Set(orders.map(o => o.ma_buucu));
    return Array.from(list).sort();
  }, [orders]);

  const sanList = useMemo(() => {
    return ["Shopee", "TikTok"];
  }, []);

  const khachHangList = useMemo(() => {
    const list = new Set(orders.map(o => o.ten_khgui));
    return Array.from(list).sort();
  }, [orders]);

  // Quick Preset Handlers
  const applyPreset = (preset: 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'all') => {
    const todayStr = '2026-06-27';
    switch (preset) {
      case 'today':
        setFilters(prev => ({ ...prev, startDate: todayStr, endDate: todayStr }));
        break;
      case 'yesterday':
        setFilters(prev => ({ ...prev, startDate: '2026-06-26', endDate: '2026-06-26' }));
        break;
      case '7days':
        setFilters(prev => ({ ...prev, startDate: '2026-06-21', endDate: todayStr }));
        break;
      case '30days':
        setFilters(prev => ({ ...prev, startDate: '2026-05-28', endDate: todayStr }));
        break;
      case 'thisMonth':
        setFilters(prev => ({ ...prev, startDate: '2026-06-01', endDate: '2026-06-30' }));
        break;
      case 'all':
        // find min and max order times
        if (orders.length === 0) return;
        const sortedTimes = orders.map(o => o.time_nhap_may.slice(0, 10)).sort();
        setFilters(prev => ({
          ...prev,
          startDate: sortedTimes[0],
          endDate: sortedTimes[sortedTimes.length - 1]
        }));
        break;
    }
  };

  // Helper to parse dates without timezone shifts
  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(dateStr);
  };

  // Helper to subtract days or months
  const subtractDays = (date: Date, days: number): Date => {
    const res = new Date(date);
    res.setDate(res.getDate() - days);
    return res;
  };

  const subtractMonths = (date: Date, months: number): Date => {
    const res = new Date(date);
    res.setMonth(res.getMonth() - months);
    return res;
  };

  const formatISODateOnly = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // --- Calculate Comparison Date Ranges ---
  const compareRange = useMemo(() => {
    const start = parseLocalDate(filters.startDate);
    const end = parseLocalDate(filters.endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (filters.compareMode === 'yesterday') {
      // Shift backward by diffDays + 1 day
      const compStart = subtractDays(start, diffDays + 1);
      const compEnd = subtractDays(end, diffDays + 1);
      return {
        startDate: formatISODateOnly(compStart),
        endDate: formatISODateOnly(compEnd)
      };
    } else if (filters.compareMode === 'last_month') {
      // Shift backward by 1 month
      const compStart = subtractMonths(start, 1);
      const compEnd = subtractMonths(end, 1);
      return {
        startDate: formatISODateOnly(compStart),
        endDate: formatISODateOnly(compEnd)
      };
    }
    return null;
  }, [filters.startDate, filters.endDate, filters.compareMode]);

  // Dynamically calculate period word based on filter dates
  const periodLabel = useMemo(() => {
    try {
      const start = parseLocalDate(filters.startDate);
      const end = parseLocalDate(filters.endDate);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays <= 1) return 'Ngày';
      if (diffDays > 1 && diffDays <= 8) return 'Tuần';
      if (diffDays > 8 && diffDays <= 31) return 'Tháng';
      return 'Kỳ';
    } catch (e) {
      return 'Ngày';
    }
  }, [filters.startDate, filters.endDate]);

  // --- Filter Datasets ---
  const filterOrders = (ordersList: Order[], startStr: string, endStr: string) => {
    return ordersList.filter(o => {
      const orderDate = o.time_nhap_may.slice(0, 10);
      
      // Date bounds
      if (orderDate < startStr || orderDate > endStr) return false;

      // Dropdowns
      if (filters.buuCu !== 'All' && o.ma_buucu !== filters.buuCu) return false;
      if (filters.san !== 'All' && o.SAN !== filters.san) return false;
      if (filters.khachHang !== 'All' && o.ten_khgui !== filters.khachHang) return false;

      return true;
    });
  };

  const currentPeriodOrders = useMemo(() => {
    return filterOrders(orders, filters.startDate, filters.endDate);
  }, [orders, filters.startDate, filters.endDate, filters.buuCu, filters.san, filters.khachHang]);

  const comparePeriodOrders = useMemo(() => {
    if (!compareRange) return [];
    return filterOrders(orders, compareRange.startDate, compareRange.endDate);
  }, [orders, compareRange, filters.buuCu, filters.san, filters.khachHang]);

  // --- Calculate Metrics ---
  const currentMetrics = useMemo(() => {
    let tongCuoc = 0;
    let trongLuong = 0;
    const phieuGuis = currentPeriodOrders.length;

    currentPeriodOrders.forEach(o => {
      tongCuoc += o.tong_cuoc;
      trongLuong += o.trong_luong;
    });

    return { tongCuoc, trongLuong, phieuGuis };
  }, [currentPeriodOrders]);

  const compareMetrics = useMemo(() => {
    let tongCuoc = 0;
    let trongLuong = 0;
    const phieuGuis = comparePeriodOrders.length;

    comparePeriodOrders.forEach(o => {
      tongCuoc += o.tong_cuoc;
      trongLuong += o.trong_luong;
    });

    return { tongCuoc, trongLuong, phieuGuis };
  }, [comparePeriodOrders]);

  // Helper to get first day of month
  const getFirstDayOfMonthStr = (dateStr: string): string => {
    try {
      const parts = dateStr.slice(0, 10).split('-');
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1]}-01`;
      }
    } catch (e) {}
    return dateStr.slice(0, 8) + '01';
  };

  const currentCumulativeOrders = useMemo(() => {
    const startStr = getFirstDayOfMonthStr(filters.endDate);
    return filterOrders(orders, startStr, filters.endDate);
  }, [orders, filters.endDate, filters.buuCu, filters.san, filters.khachHang]);

  const compareCumulativeOrders = useMemo(() => {
    const compareEndDate = compareRange?.endDate || formatISODateOnly(subtractMonths(parseLocalDate(filters.endDate), 1));
    const startStr = getFirstDayOfMonthStr(compareEndDate);
    return filterOrders(orders, startStr, compareEndDate);
  }, [orders, filters.endDate, compareRange, filters.buuCu, filters.san, filters.khachHang]);

  const currentCumulativeMetrics = useMemo(() => {
    let tongCuoc = 0;
    let trongLuong = 0;
    const phieuGuis = currentCumulativeOrders.length;
    currentCumulativeOrders.forEach(o => {
      tongCuoc += o.tong_cuoc;
      trongLuong += o.trong_luong;
    });
    return { tongCuoc, trongLuong, phieuGuis };
  }, [currentCumulativeOrders]);

  const compareCumulativeMetrics = useMemo(() => {
    let tongCuoc = 0;
    let trongLuong = 0;
    const phieuGuis = compareCumulativeOrders.length;
    compareCumulativeOrders.forEach(o => {
      tongCuoc += o.tong_cuoc;
      trongLuong += o.trong_luong;
    });
    return { tongCuoc, trongLuong, phieuGuis };
  }, [compareCumulativeOrders]);

  const cumulativeChangePercentages = useMemo(() => {
    const calcPct = (curr: number, comp: number) => {
      if (comp === 0) return curr > 0 ? 100 : 0;
      return ((curr - comp) / comp) * 100;
    };
    return {
      tongCuoc: calcPct(currentCumulativeMetrics.tongCuoc, compareCumulativeMetrics.tongCuoc),
      trongLuong: calcPct(currentCumulativeMetrics.trongLuong, compareCumulativeMetrics.trongLuong),
      phieuGuis: calcPct(currentCumulativeMetrics.phieuGuis, compareCumulativeMetrics.phieuGuis)
    };
  }, [currentCumulativeMetrics, compareCumulativeMetrics]);

  // --- Change Percentages ---
  const changePercentages = useMemo(() => {
    const calcPct = (curr: number, comp: number) => {
      if (comp === 0) return curr > 0 ? 100 : 0;
      return ((curr - comp) / comp) * 100;
    };

    return {
      tongCuoc: calcPct(currentMetrics.tongCuoc, compareMetrics.tongCuoc),
      trongLuong: calcPct(currentMetrics.trongLuong, compareMetrics.trongLuong),
      phieuGuis: calcPct(currentMetrics.phieuGuis, compareMetrics.phieuGuis)
    };
  }, [currentMetrics, compareMetrics]);

  // --- Custom TOP Customers Analysis ---
  const topCustomersData = useMemo(() => {
    const currentMap: Record<string, { name: string; code: string; currentCuoc: number; currentCount: number; currentWeight: number }> = {};
    currentPeriodOrders.forEach(o => {
      if (!currentMap[o.ten_khgui]) {
        currentMap[o.ten_khgui] = {
          name: o.ten_khgui,
          code: o.ma_khgui,
          currentCuoc: 0,
          currentCount: 0,
          currentWeight: 0
        };
      }
      currentMap[o.ten_khgui].currentCuoc += o.tong_cuoc;
      currentMap[o.ten_khgui].currentCount += 1;
      currentMap[o.ten_khgui].currentWeight += o.trong_luong;
    });

    const compareMap: Record<string, { compareCuoc: number; compareCount: number }> = {};
    comparePeriodOrders.forEach(o => {
      if (!compareMap[o.ten_khgui]) {
        compareMap[o.ten_khgui] = { compareCuoc: 0, compareCount: 0 };
      }
      compareMap[o.ten_khgui].compareCuoc += o.tong_cuoc;
      compareMap[o.ten_khgui].compareCount += 1;
    });

    const arr = Object.values(currentMap).map(item => {
      const comp = compareMap[item.name] || { compareCuoc: 0, compareCount: 0 };
      return {
        ...item,
        compareCuoc: comp.compareCuoc,
        compareCount: comp.compareCount
      };
    });

    if (topMetric === 'tong_cuoc') {
      arr.sort((a, b) => b.currentCuoc - a.currentCuoc);
    } else {
      arr.sort((a, b) => b.currentCount - a.currentCount);
    }

    return arr.slice(0, topLimit);
  }, [currentPeriodOrders, comparePeriodOrders, topMetric, topLimit]);

  // Total for Top client percentages
  const topMetricTotal = useMemo(() => {
    if (topMetric === 'tong_cuoc') {
      return currentMetrics.tongCuoc;
    }
    return currentMetrics.phieuGuis;
  }, [topMetric, currentMetrics]);

  // --- Custom TOP Post Offices Analysis ---
  const topBuuCucData = useMemo(() => {
    const currentMap: Record<string, { code: string; name: string; currentCuoc: number; currentCount: number; currentWeight: number; region: string; cluster: string }> = {};
    currentPeriodOrders.forEach(o => {
      if (!currentMap[o.ma_buucu]) {
        const mapping = getBuuCucMapping(o.ma_buucu);
        currentMap[o.ma_buucu] = {
          code: o.ma_buucu,
          name: mapping.ten,
          region: mapping.kv,
          cluster: mapping.cum,
          currentCuoc: 0,
          currentCount: 0,
          currentWeight: 0
        };
      }
      currentMap[o.ma_buucu].currentCuoc += o.tong_cuoc;
      currentMap[o.ma_buucu].currentCount += 1;
      currentMap[o.ma_buucu].currentWeight += o.trong_luong;
    });

    const compareMap: Record<string, { compareCuoc: number; compareCount: number }> = {};
    comparePeriodOrders.forEach(o => {
      if (!compareMap[o.ma_buucu]) {
        compareMap[o.ma_buucu] = { compareCuoc: 0, compareCount: 0 };
      }
      compareMap[o.ma_buucu].compareCuoc += o.tong_cuoc;
      compareMap[o.ma_buucu].compareCount += 1;
    });

    const arr = Object.values(currentMap).map(item => {
      const comp = compareMap[item.code] || { compareCuoc: 0, compareCount: 0 };
      return {
        ...item,
        compareCuoc: comp.compareCuoc,
        compareCount: comp.compareCount
      };
    });

    if (topBuuCucMetric === 'tong_cuoc') {
      arr.sort((a, b) => b.currentCuoc - a.currentCuoc);
    } else {
      arr.sort((a, b) => b.currentCount - a.currentCount);
    }

    return arr.slice(0, topBuuCucLimit);
  }, [currentPeriodOrders, comparePeriodOrders, topBuuCucMetric, topBuuCucLimit]);

  const topBuuCucMetricTotal = useMemo(() => {
    if (topBuuCucMetric === 'tong_cuoc') {
      return currentMetrics.tongCuoc;
    }
    return currentMetrics.phieuGuis;
  }, [topBuuCucMetric, currentMetrics]);

  // --- Unified Detailed Report Aggregation ---
  interface DetailedStats {
    id: string; // Region name, Cluster name, or Post office code
    name: string; // Display name
    cluster?: string;
    region?: string;
    totalĐơn: number;
    totalCước: number;
    totalWeight: number;
    compareĐơn: number;
    compareCước: number;
    compareWeight: number;
    platforms: Record<string, {
      đơn: number;
      cước: number;
      weight: number;
    }>;
  }

  const aggregatedData = useMemo(() => {
    const PREDEFINED_REGIONS = ["HCM 01", "HCM 02", "HCM 03", "HCM 04", "HCM 05", "HCM 06", "HCM 07", "HCM 08", "Khác"];
    const regions: Record<string, DetailedStats> = {};
    const clusters: Record<string, DetailedStats> = {};
    const postOffices: Record<string, DetailedStats> = {};

    const initStats = (id: string, name: string, region?: string, cluster?: string): DetailedStats => ({
      id,
      name,
      region,
      cluster,
      totalĐơn: 0,
      totalCước: 0,
      totalWeight: 0,
      compareĐơn: 0,
      compareCước: 0,
      compareWeight: 0,
      platforms: {
        "Shopee": { đơn: 0, cước: 0, weight: 0 },
        "TikTok": { đơn: 0, cước: 0, weight: 0 },
        "Lazada": { đơn: 0, cước: 0, weight: 0 },
        "Tiki": { đơn: 0, cước: 0, weight: 0 },
        "Ngoài Sàn": { đơn: 0, cước: 0, weight: 0 },
      }
    });

    // Initialize all predefined regions to ensure they are listed even with 0 counts
    PREDEFINED_REGIONS.forEach(r => {
      regions[r] = initStats(r, r);
    });

    // 1. Process current period orders
    currentPeriodOrders.forEach(o => {
      const mapping = getBuuCucMapping(o.ma_buucu);
      let rName = mapping.kv || "Khác";
      if (!PREDEFINED_REGIONS.includes(rName)) {
        rName = "Khác";
      }
      const cName = mapping.cum || "Khác";
      const poCode = o.ma_buucu || "KHAC";
      const poName = mapping.ten || o.ma_buucu;

      // Regions
      const rStats = regions[rName];
      rStats.totalĐơn += 1;
      rStats.totalCước += o.tong_cuoc;
      rStats.totalWeight += o.trong_luong;

      // Clusters
      if (!clusters[cName]) clusters[cName] = initStats(cName, cName, rName);
      const cStats = clusters[cName];
      cStats.totalĐơn += 1;
      cStats.totalCước += o.tong_cuoc;
      cStats.totalWeight += o.trong_luong;

      // Post Offices
      if (!postOffices[poCode]) postOffices[poCode] = initStats(poCode, poName, rName, cName);
      const poStats = postOffices[poCode];
      poStats.totalĐơn += 1;
      poStats.totalCước += o.tong_cuoc;
      poStats.totalWeight += o.trong_luong;

      // Platforms
      const san = o.SAN?.trim();
      const sanKey = ["Shopee", "TikTok", "Lazada", "Tiki"].includes(san) ? san : "Ngoài Sàn";

      rStats.platforms[sanKey].đơn += 1;
      rStats.platforms[sanKey].cước += o.tong_cuoc;
      rStats.platforms[sanKey].weight += o.trong_luong;

      cStats.platforms[sanKey].đơn += 1;
      cStats.platforms[sanKey].cước += o.tong_cuoc;
      cStats.platforms[sanKey].weight += o.trong_luong;

      poStats.platforms[sanKey].đơn += 1;
      poStats.platforms[sanKey].cước += o.tong_cuoc;
      poStats.platforms[sanKey].weight += o.trong_luong;
    });

    // 2. Process comparison period orders
    comparePeriodOrders.forEach(o => {
      const mapping = getBuuCucMapping(o.ma_buucu);
      let rName = mapping.kv || "Khác";
      if (!PREDEFINED_REGIONS.includes(rName)) {
        rName = "Khác";
      }
      const cName = mapping.cum || "Khác";
      const poCode = o.ma_buucu || "KHAC";
      const poName = mapping.ten || o.ma_buucu;

      // Regions
      const rStats = regions[rName];
      rStats.compareĐơn += 1;
      rStats.compareCước += o.tong_cuoc;
      rStats.compareWeight += o.trong_luong;

      // Clusters
      if (!clusters[cName]) clusters[cName] = initStats(cName, cName, rName);
      const cStats = clusters[cName];
      cStats.compareĐơn += 1;
      cStats.compareCước += o.tong_cuoc;
      cStats.compareWeight += o.trong_luong;

      // Post Offices
      if (!postOffices[poCode]) postOffices[poCode] = initStats(poCode, poName, rName, cName);
      const poStats = postOffices[poCode];
      poStats.compareĐơn += 1;
      poStats.compareCước += o.tong_cuoc;
      poStats.compareWeight += o.trong_luong;
    });

    return {
      regions: Object.values(regions),
      clusters: Object.values(clusters),
      postOffices: Object.values(postOffices)
    };
  }, [currentPeriodOrders, comparePeriodOrders]);


  // --- Anomaly Warnings Generator ---
  const anomalyWarnings = useMemo(() => {
    const alerts: AnomalyWarning[] = [];
    if (!compareRange) return alerts;

    const limitPctCuoc = thresholds.tong_cuoc_max_change_pct;
    const limitPctLuong = thresholds.trong_luong_max_change_pct;
    const limitPctPhieu = thresholds.ma_phieugui_max_change_pct;

    const timeText = filters.compareMode === 'yesterday' ? 'ngày trước đó' : 'cùng kỳ tháng trước';

    // 1. Check overall metrics
    const checkMetric = (curr: number, comp: number, limit: number, field: string) => {
      if (comp > 0) {
        const pct = ((curr - comp) / comp) * 100;
        if (Math.abs(pct) >= limit) {
          const isUp = pct > 0;
          alerts.push({
            field,
            dimension: "Toàn hệ thống",
            currentValue: curr,
            compareValue: comp,
            changePct: pct,
            type: isUp ? 'increase' : 'decrease',
            severity: Math.abs(pct) > limit * 1.8 ? 'critical' : 'warning',
            message: `${field} toàn hệ thống ${isUp ? 'TĂNG ĐỘT BIẾN' : 'GIẢM MẠNH'} ${pct.toFixed(1)}% so với ${timeText}. (${isUp ? 'Tăng' : 'Giảm'} từ ${field === 'Tổng cước' ? formatVND(comp) : field === 'Trọng lượng' ? formatWeight(comp) : comp + ' đơn'} lên ${field === 'Tổng cước' ? formatVND(curr) : field === 'Trọng lượng' ? formatWeight(curr) : curr + ' đơn'})`
          });
        }
      }
    };

    checkMetric(currentMetrics.tongCuoc, compareMetrics.tongCuoc, limitPctCuoc, "Tổng cước");
    checkMetric(currentMetrics.trongLuong, compareMetrics.trongLuong, limitPctLuong, "Trọng lượng");
    checkMetric(currentMetrics.phieuGuis, compareMetrics.phieuGuis, limitPctPhieu, "Số lượng đơn");

    // 2. Check anomalies per Bưu Cục
    buuCuList.forEach(bc => {
      const currBc = currentPeriodOrders.filter(o => o.ma_buucu === bc);
      const compBc = comparePeriodOrders.filter(o => o.ma_buucu === bc);

      const currCuoc = currBc.reduce((acc, o) => acc + o.tong_cuoc, 0);
      const compCuoc = compBc.reduce((acc, o) => acc + o.tong_cuoc, 0);

      const currCount = currBc.length;
      const compCount = compBc.length;

      if (compCuoc > 20000 && currCuoc > 0) { // only alert if historical was significant
        const pct = ((currCuoc - compCuoc) / compCuoc) * 100;
        if (Math.abs(pct) >= limitPctCuoc) {
          const isUp = pct > 0;
          alerts.push({
            field: "Tổng cước",
            dimension: `Bưu cục ${bc.replace('BC_', '')}`,
            currentValue: currCuoc,
            compareValue: compCuoc,
            changePct: pct,
            type: isUp ? 'increase' : 'decrease',
            severity: Math.abs(pct) > limitPctCuoc * 1.8 ? 'critical' : 'warning',
            message: `Cước bưu cục ${bc.replace('BC_', '')} ${isUp ? 'vọt tăng' : 'sụt giảm mạnh'} ${pct.toFixed(1)}% so với ${timeText}. (${formatVND(compCuoc)} ➔ ${formatVND(currCuoc)})`
          });
        }
      }

      if (compCount >= 3 && currCount > 0) {
        const pct = ((currCount - compCount) / compCount) * 100;
        if (Math.abs(pct) >= limitPctPhieu) {
          const isUp = pct > 0;
          alerts.push({
            field: "Số lượng đơn",
            dimension: `Bưu cục ${bc.replace('BC_', '')}`,
            currentValue: currCount,
            compareValue: compCount,
            changePct: pct,
            type: isUp ? 'increase' : 'decrease',
            severity: Math.abs(pct) > limitPctPhieu * 1.8 ? 'critical' : 'warning',
            message: `Số đơn bưu cục ${bc.replace('BC_', '')} ${isUp ? 'tăng nhanh' : 'giảm nhanh'} ${pct.toFixed(1)}% so với ${timeText}. (${compCount} đơn ➔ ${currCount} đơn)`
          });
        }
      }
    });

    // 3. Check anomalies per Sàn / Kênh
    sanList.forEach(s => {
      const currSan = currentPeriodOrders.filter(o => o.SAN === s);
      const compSan = comparePeriodOrders.filter(o => o.SAN === s);

      const currCuoc = currSan.reduce((acc, o) => acc + o.tong_cuoc, 0);
      const compCuoc = compSan.reduce((acc, o) => acc + o.tong_cuoc, 0);

      const currCount = currSan.length;
      const compCount = compSan.length;

      if (compCuoc > 20000 && currCuoc > 0) {
        const pct = ((currCuoc - compCuoc) / compCuoc) * 100;
        if (Math.abs(pct) >= limitPctCuoc) {
          const isUp = pct > 0;
          alerts.push({
            field: "Tổng cước",
            dimension: `Sàn ${s}`,
            currentValue: currCuoc,
            compareValue: compCuoc,
            changePct: pct,
            type: isUp ? 'increase' : 'decrease',
            severity: Math.abs(pct) > limitPctCuoc * 1.8 ? 'critical' : 'warning',
            message: `Cước giao dịch qua kênh ${s} ${isUp ? 'tăng' : 'giảm'} bất thường ${pct.toFixed(1)}% so với ${timeText}. (${formatVND(compCuoc)} ➔ ${formatVND(currCuoc)})`
          });
        }
      }
    });

    // Sort alerts: critical first, then highest change absolute values
    return alerts.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (a.severity !== 'critical' && b.severity === 'critical') return 1;
      return Math.abs(b.changePct) - Math.abs(a.changePct);
    });
  }, [currentPeriodOrders, comparePeriodOrders, compareRange, thresholds, buuCuList, sanList, filters.compareMode]);

  // --- SVG Trend Charts Calculations ---
  // Create grouped series of values by date
  const trendData = useMemo(() => {
    // Collect all dates in range
    const dates: string[] = [];
    const start = parseLocalDate(filters.startDate);
    const end = parseLocalDate(filters.endDate);
    
    let temp = new Date(start);
    while (temp <= end) {
      dates.push(formatISODateOnly(temp));
      temp.setDate(temp.getDate() + 1);
    }

    // Limit to max 45 days for rendering safety
    const renderDates = dates.slice(0, 45);

    return renderDates.map(d => {
      const ordersOnDay = currentPeriodOrders.filter(o => o.time_nhap_may.slice(0, 10) === d);
      
      const cuocSum = ordersOnDay.reduce((acc, o) => acc + o.tong_cuoc, 0);
      const weightSum = ordersOnDay.reduce((acc, o) => acc + o.trong_luong, 0);
      const count = ordersOnDay.length;

      // Find comparison date
      let compDateStr = '';
      let compCuoc = 0;
      let compWeight = 0;
      let compCount = 0;

      if (compareRange) {
        const dObj = parseLocalDate(d);
        if (filters.compareMode === 'yesterday') {
          // If we compare single days, or multi days. The date shift is fixed.
          const currentDurationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const shiftD = subtractDays(dObj, currentDurationDays);
          compDateStr = formatISODateOnly(shiftD);
        } else { // last_month
          const shiftD = subtractMonths(dObj, 1);
          compDateStr = formatISODateOnly(shiftD);
        }

        const compOrders = comparePeriodOrders.filter(o => o.time_nhap_may.slice(0, 10) === compDateStr);
        compCuoc = compOrders.reduce((acc, o) => acc + o.tong_cuoc, 0);
        compWeight = compOrders.reduce((acc, o) => acc + o.trong_luong, 0);
        compCount = compOrders.length;
      }

      return {
        date: d,
        compDate: compDateStr,
        tong_cuoc: cuocSum,
        tong_cuoc_comp: compCuoc,
        ma_phieugui: count,
        ma_phieugui_comp: compCount,
        trong_luong: weightSum,
        trong_luong_comp: compWeight
      };
    });
  }, [currentPeriodOrders, comparePeriodOrders, filters.startDate, filters.endDate, compareRange, filters.compareMode]);

  // --- Render custom interactive SVG Chart ---
  const renderedChartSVG = useMemo(() => {
    if (trendData.length === 0) return null;

    const width = 600;
    const height = 240;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Get active metric values
    const currentValues = trendData.map(d => {
      if (activeMetricTab === 'tong_cuoc') return d.tong_cuoc;
      if (activeMetricTab === 'trong_luong') return d.trong_luong;
      return d.ma_phieugui;
    });

    const compareValues = compareRange ? trendData.map(d => {
      if (activeMetricTab === 'tong_cuoc') return d.tong_cuoc_comp;
      if (activeMetricTab === 'trong_luong') return d.trong_luong_comp;
      return d.ma_phieugui_comp;
    }) : [];

    const allValues = [...currentValues, ...compareValues];
    const maxVal = Math.max(...allValues, 1) * 1.15; // +15% padding
    const minVal = 0;

    const pointsCount = trendData.length;

    // Build SVG paths
    const getX = (index: number) => {
      if (pointsCount <= 1) return paddingLeft + plotWidth / 2;
      return paddingLeft + (index / (pointsCount - 1)) * plotWidth;
    };

    const getY = (val: number) => {
      return paddingTop + plotHeight - ((val - minVal) / (maxVal - minVal)) * plotHeight;
    };

    // Current period path (solid line)
    let currentPath = '';
    let currentAreaPath = '';
    
    trendData.forEach((d, i) => {
      const x = getX(i);
      const y = getY(currentValues[i]);
      if (i === 0) {
        currentPath = `M ${x} ${y}`;
        currentAreaPath = `M ${x} ${paddingTop + plotHeight} L ${x} ${y}`;
      } else {
        currentPath += ` L ${x} ${y}`;
        currentAreaPath += ` L ${x} ${y}`;
      }
      if (i === trendData.length - 1) {
        currentAreaPath += ` L ${x} ${paddingTop + plotHeight} Z`;
      }
    });

    // Compare period path (dashed line)
    let comparePath = '';
    if (compareRange) {
      trendData.forEach((d, i) => {
        const x = getX(i);
        const y = getY(compareValues[i]);
        if (i === 0) {
          comparePath = `M ${x} ${y}`;
        } else {
          comparePath += ` L ${x} ${y}`;
        }
      });
    }

    // Grid y-axis lines (4 lines)
    const yGridLines = [0, 0.33, 0.66, 1].map(r => {
      const val = minVal + r * (maxVal - minVal);
      return {
        y: getY(val),
        label: activeMetricTab === 'tong_cuoc' ? formatVND(val) : activeMetricTab === 'trong_luong' ? formatWeight(val) : `${Math.round(val)} đơn`
      };
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yGridLines.map((gl, idx) => (
          <g key={idx}>
            <line 
              x1={paddingLeft} 
              y1={gl.y} 
              x2={width - paddingRight} 
              y2={gl.y} 
              stroke="#f1f5f9" 
              strokeWidth="1"
            />
            <text 
              x={paddingLeft - 8} 
              y={gl.y + 3} 
              textAnchor="end" 
              className="text-[9px] font-mono fill-slate-400 font-medium"
            >
              {gl.label}
            </text>
          </g>
        ))}

        {/* X Axis ticks */}
        {trendData.map((d, i) => {
          // Only show some labels if there are many dates
          const showLabel = trendData.length <= 10 || (trendData.length <= 20 && i % 2 === 0) || (trendData.length > 20 && i % 4 === 0) || i === trendData.length - 1;
          const x = getX(i);
          const parts = d.date.split('-');
          const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.date;

          return (
            <g key={i}>
              {showLabel && (
                <>
                  <line 
                    x1={x} 
                    y1={paddingTop + plotHeight} 
                    x2={x} 
                    y2={paddingTop + plotHeight + 4} 
                    stroke="#cbd5e1" 
                    strokeWidth="1"
                  />
                  <text 
                    x={x} 
                    y={paddingTop + plotHeight + 14} 
                    textAnchor="middle" 
                    className="text-[9px] font-mono fill-slate-400 font-medium"
                  >
                    {displayDate}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Comparison Line (Dashed) */}
        {comparePath && (
          <path 
            d={comparePath} 
            fill="none" 
            stroke="#94a3b8" 
            strokeWidth="1.5" 
            strokeDasharray="4 4"
            className="opacity-85"
          />
        )}

        {/* Current Period Area & Line */}
        {currentAreaPath && (
          <path 
            d={currentAreaPath} 
            fill="url(#chartGradient)"
          />
        )}
        {currentPath && (
          <path 
            d={currentPath} 
            fill="none" 
            stroke="#4f46e5" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Dots & Hover trigger bars */}
        {trendData.map((d, i) => {
          const x = getX(i);
          const yCurr = getY(currentValues[i]);
          const yComp = compareRange ? getY(compareValues[i]) : 0;
          
          return (
            <g key={i} className="group/dot">
              {/* Invisible large hover area to capture touch/mouse easily */}
              <rect
                x={x - (plotWidth / pointsCount) / 2}
                y={paddingTop}
                width={plotWidth / pointsCount}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredDataPoint({
                  date: d.date,
                  current: currentValues[i],
                  compare: compareRange ? compareValues[i] : undefined
                })}
                onMouseLeave={() => setHoveredDataPoint(null)}
                className="cursor-pointer"
              />

              {/* Vertical Guide line on hover */}
              <line
                x1={x}
                y1={paddingTop}
                x2={x}
                y2={paddingTop + plotHeight}
                stroke="#6366f1"
                strokeWidth="1"
                strokeDasharray="2 2"
                className="opacity-0 group-hover/dot:opacity-100 pointer-events-none transition-opacity"
              />

              {/* Current value dot */}
              <circle
                cx={x}
                cy={yCurr}
                r="3.5"
                fill="#4f46e5"
                stroke="#ffffff"
                strokeWidth="1.5"
                className="shadow-sm opacity-60 group-hover/dot:opacity-100 group-hover/dot:r-[5px] pointer-events-none transition-all"
              />

              {/* Compare value dot */}
              {compareRange && (
                <circle
                  cx={x}
                  cy={yComp}
                  r="3"
                  fill="#94a3b8"
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="opacity-40 group-hover/dot:opacity-100 group-hover/dot:r-[4px] pointer-events-none transition-all"
                />
              )}
            </g>
          );
        })}
      </svg>
    );
  }, [trendData, activeMetricTab, compareRange, filters.compareMode]);

  // Handle customer search input filtering
  const filteredCustomerList = useMemo(() => {
    if (!custSearchText.trim()) return khachHangList;
    const query = custSearchText.toLowerCase();
    return khachHangList.filter(k => k.toLowerCase().includes(query));
  }, [khachHangList, custSearchText]);

  // Helper to sort detailed report lists
  const getSortedData = (data: DetailedStats[], sortState: { field: string; dir: 'asc' | 'desc' }) => {
    const { field, dir } = sortState;
    const sorted = [...data];
    
    sorted.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (field === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (field === 'totalĐơn') {
        valA = a.totalĐơn;
        valB = b.totalĐơn;
      } else if (field === 'totalCước') {
        valA = a.totalCước;
        valB = b.totalCước;
      } else if (field === 'totalWeight') {
        valA = a.totalWeight;
        valB = b.totalWeight;
      } else if (field === 'compareĐơn') {
        valA = a.compareĐơn;
        valB = b.compareĐơn;
      } else if (field === 'compareCước') {
        valA = a.compareCước;
        valB = b.compareCước;
      } else if (field === 'compareWeight') {
        valA = a.compareWeight;
        valB = b.compareWeight;
      } else if (field === 'compareChangePct') {
        const getPct = (item: DetailedStats) => {
          if (item.compareCước === 0) {
            return item.totalCước === 0 ? 0 : 100;
          }
          return ((item.totalCước - item.compareCước) / item.compareCước) * 100;
        };
        valA = getPct(a);
        valB = getPct(b);
      } else if (field.includes('-')) {
        const [platform, metric] = field.split('-');
        const pMetric = metric as 'đơn' | 'cước' | 'weight';
        valA = a.platforms[platform]?.[pMetric] || 0;
        valB = b.platforms[platform]?.[pMetric] || 0;
      }

      if (typeof valA === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return dir === 'asc' ? valA - valB : valB - valA;
      }
    });
    
    return sorted;
  };

  // Helper to render report table
  const renderDetailedReportTable = (
    title: string,
    description: string,
    data: DetailedStats[],
    sortState: { field: string; dir: 'asc' | 'desc' },
    setSortState: React.Dispatch<React.SetStateAction<{ field: string; dir: 'asc' | 'desc' }>>
  ) => {
    const sorted = getSortedData(data, sortState);
    
    const handleSort = (field: string) => {
      setSortState(prev => {
        if (prev.field === field) {
          return { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
        }
        return { field, dir: 'desc' };
      });
    };

    const renderSortIcon = (field: string) => {
      if (sortState.field !== field) return <span className="text-slate-300 ml-1 text-[10px]">↕</span>;
      return sortState.dir === 'asc' 
        ? <span className="text-indigo-600 ml-1 font-bold">▲</span> 
        : <span className="text-indigo-600 ml-1 font-bold">▼</span>;
    };

    const showCompare = filters.compareMode !== 'none';
    const showShopee = filters.san === 'All' || filters.san === 'Shopee';
    const showTikTok = filters.san === 'All' || filters.san === 'TikTok';
    const showLazada = false;
    const showTiki = false;
    const showKhac = false;

    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>{title}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          </div>
          <div className="text-xs bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-100 self-start md:self-auto font-medium">
            Tổng số nhóm: <span className="font-bold text-slate-800">{data.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Row 1: Header groups */}
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3 border-r border-slate-200/60 min-w-[150px]" rowSpan={2}>
                  Tên nhóm
                </th>
                <th className="px-4 py-1.5 border-r border-slate-200/60 text-center text-indigo-700 bg-indigo-50/30" colSpan={3}>
                  Toàn Bộ Kênh
                </th>
                {showCompare && (
                  <th className="px-4 py-1.5 border-r border-slate-200/60 text-center text-amber-700 bg-amber-50/20" colSpan={4}>
                    Kỳ So Sánh
                  </th>
                )}
                {showShopee && (
                  <th className="px-4 py-1.5 border-r border-slate-200/60 text-center text-orange-700 bg-orange-50/10" colSpan={3}>
                    Sàn Shopee
                  </th>
                )}
                {showTikTok && (
                  <th className="px-4 py-1.5 border-r border-slate-200/60 text-center text-slate-800 bg-slate-100/30" colSpan={3}>
                    Sàn TikTok
                  </th>
                )}
                {showLazada && (
                  <th className="px-4 py-1.5 border-r border-slate-200/60 text-center text-blue-700 bg-blue-50/10" colSpan={3}>
                    Sàn Lazada
                  </th>
                )}
                {showTiki && (
                  <th className="px-4 py-1.5 border-r border-slate-200/60 text-center text-sky-700 bg-sky-50/10" colSpan={3}>
                    Sàn Tiki
                  </th>
                )}
                {showKhac && (
                  <th className="px-4 py-1.5 text-center text-slate-600 bg-slate-100/50" colSpan={3}>
                    Ngoài Sàn / Khác
                  </th>
                )}
              </tr>
              
              {/* Row 2: Sortable metric sub-headers */}
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                {/* Toàn Bộ Kênh */}
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('totalĐơn')}>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Đơn</span>
                    {renderSortIcon('totalĐơn')}
                  </div>
                </th>
                <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('totalWeight')}>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Nặng</span>
                    {renderSortIcon('totalWeight')}
                  </div>
                </th>
                <th className="px-3 py-2 border-r border-slate-200/60 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('totalCước')}>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Cước</span>
                    {renderSortIcon('totalCước')}
                  </div>
                </th>

                {/* Kỳ So Sánh */}
                {showCompare && (
                  <>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('compareĐơn')}>
                      <div className="flex items-center justify-between text-amber-800">
                        <span>Đơn</span>
                        {renderSortIcon('compareĐơn')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('compareWeight')}>
                      <div className="flex items-center justify-between text-amber-800">
                        <span>Nặng</span>
                        {renderSortIcon('compareWeight')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('compareCước')}>
                      <div className="flex items-center justify-between text-amber-800">
                        <span>Cước</span>
                        {renderSortIcon('compareCước')}
                      </div>
                    </th>
                    <th className="px-3 py-2 border-r border-slate-200/60 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('compareChangePct')}>
                      <div className="flex items-center justify-between text-amber-800">
                        <span>% +/-</span>
                        {renderSortIcon('compareChangePct')}
                      </div>
                    </th>
                  </>
                )}

                {/* Sàn Shopee */}
                {showShopee && (
                  <>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Shopee-đơn')}>
                      <div className="flex items-center justify-between text-orange-800">
                        <span>Đơn</span>
                        {renderSortIcon('Shopee-đơn')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Shopee-weight')}>
                      <div className="flex items-center justify-between text-orange-800">
                        <span>Nặng</span>
                        {renderSortIcon('Shopee-weight')}
                      </div>
                    </th>
                    <th className="px-3 py-2 border-r border-slate-200/60 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Shopee-cước')}>
                      <div className="flex items-center justify-between text-orange-800">
                        <span>Cước</span>
                        {renderSortIcon('Shopee-cước')}
                      </div>
                    </th>
                  </>
                )}

                {/* Sàn TikTok */}
                {showTikTok && (
                  <>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('TikTok-đơn')}>
                      <div className="flex items-center justify-between text-slate-800">
                        <span>Đơn</span>
                        {renderSortIcon('TikTok-đơn')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('TikTok-weight')}>
                      <div className="flex items-center justify-between text-slate-800">
                        <span>Nặng</span>
                        {renderSortIcon('TikTok-weight')}
                      </div>
                    </th>
                    <th className="px-3 py-2 border-r border-slate-200/60 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('TikTok-cước')}>
                      <div className="flex items-center justify-between text-slate-800">
                        <span>Cước</span>
                        {renderSortIcon('TikTok-cước')}
                      </div>
                    </th>
                  </>
                )}

                {/* Sàn Lazada */}
                {showLazada && (
                  <>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Lazada-đơn')}>
                      <div className="flex items-center justify-between text-blue-800">
                        <span>Đơn</span>
                        {renderSortIcon('Lazada-đơn')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Lazada-weight')}>
                      <div className="flex items-center justify-between text-blue-800">
                        <span>Nặng</span>
                        {renderSortIcon('Lazada-weight')}
                      </div>
                    </th>
                    <th className="px-3 py-2 border-r border-slate-200/60 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Lazada-cước')}>
                      <div className="flex items-center justify-between text-blue-800">
                        <span>Cước</span>
                        {renderSortIcon('Lazada-cước')}
                      </div>
                    </th>
                  </>
                )}

                {/* Sàn Tiki */}
                {showTiki && (
                  <>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Tiki-đơn')}>
                      <div className="flex items-center justify-between text-sky-800">
                        <span>Đơn</span>
                        {renderSortIcon('Tiki-đơn')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Tiki-weight')}>
                      <div className="flex items-center justify-between text-sky-800">
                        <span>Nặng</span>
                        {renderSortIcon('Tiki-weight')}
                      </div>
                    </th>
                    <th className="px-3 py-2 border-r border-slate-200/60 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Tiki-cước')}>
                      <div className="flex items-center justify-between text-sky-800">
                        <span>Cước</span>
                        {renderSortIcon('Tiki-cước')}
                      </div>
                    </th>
                  </>
                )}

                {/* Sàn Khác */}
                {showKhac && (
                  <>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Ngoài Sàn-đơn')}>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Đơn</span>
                        {renderSortIcon('Ngoài Sàn-đơn')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Ngoài Sàn-weight')}>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Nặng</span>
                        {renderSortIcon('Ngoài Sàn-weight')}
                      </div>
                    </th>
                    <th className="px-3 py-2 cursor-pointer hover:bg-slate-100 hover:text-slate-800 transition-colors" onClick={() => handleSort('Ngoài Sàn-cước')}>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Cước</span>
                        {renderSortIcon('Ngoài Sàn-cước')}
                      </div>
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {sorted.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-400 font-normal" colSpan={30}>
                    Không có dữ liệu phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sorted.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5 border-r border-slate-200/60 font-semibold text-slate-800">
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                          {item.id !== item.name && (
                            <span className="text-[10px] text-slate-400 font-mono font-normal">Mã: {item.id}</span>
                          )}
                          {(item.region || item.cluster) && (
                            <span className="text-[9px] text-indigo-500 font-normal mt-0.5">
                              {[item.region, item.cluster].filter(Boolean).join(' • ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Toàn Bộ Kênh data */}
                      <td className="px-3 py-3.5 font-mono text-slate-600">{item.totalĐơn.toLocaleString('vi-VN')}</td>
                      <td className="px-3 py-3.5 font-mono text-slate-600">{formatWeight(item.totalWeight)}</td>
                      <td className="px-3 py-3.5 border-r border-slate-200/60 font-mono font-bold text-slate-900">{formatVND(item.totalCước)}</td>

                      {/* Kỳ So Sánh data */}
                      {showCompare && (
                        <>
                          <td className="px-3 py-3.5 font-mono text-amber-700 bg-amber-50/5">{item.compareĐơn.toLocaleString('vi-VN')}</td>
                          <td className="px-3 py-3.5 font-mono text-amber-700 bg-amber-50/5">{formatWeight(item.compareWeight)}</td>
                          <td className="px-3 py-3.5 font-mono font-bold text-amber-800 bg-amber-50/5">{formatVND(item.compareCước)}</td>
                          <td className="px-3 py-3.5 border-r border-slate-200/60 font-mono text-center bg-amber-50/5">
                            {(() => {
                              const pct = item.compareCước === 0 
                                ? (item.totalCước === 0 ? 0 : 100)
                                : ((item.totalCước - item.compareCước) / item.compareCước) * 100;
                              
                              if (pct === 0 && item.totalCước === 0 && item.compareCước === 0) {
                                return <span className="text-slate-400 font-normal">-</span>;
                              }
                              
                              return (
                                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  pct >= 0 
                                    ? 'bg-emerald-50 text-emerald-700' 
                                    : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                                </span>
                              );
                            })()}
                          </td>
                        </>
                      )}

                      {/* Sàn Shopee data */}
                      {showShopee && (
                        <>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{item.platforms["Shopee"].đơn.toLocaleString('vi-VN')}</td>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{formatWeight(item.platforms["Shopee"].weight)}</td>
                          <td className="px-3 py-3.5 border-r border-slate-200/60 font-mono font-semibold text-slate-800">{formatVND(item.platforms["Shopee"].cước)}</td>
                        </>
                      )}

                      {/* Sàn TikTok data */}
                      {showTikTok && (
                        <>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{item.platforms["TikTok"].đơn.toLocaleString('vi-VN')}</td>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{formatWeight(item.platforms["TikTok"].weight)}</td>
                          <td className="px-3 py-3.5 border-r border-slate-200/60 font-mono font-semibold text-slate-800">{formatVND(item.platforms["TikTok"].cước)}</td>
                        </>
                      )}

                      {/* Sàn Lazada data */}
                      {showLazada && (
                        <>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{item.platforms["Lazada"].đơn.toLocaleString('vi-VN')}</td>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{formatWeight(item.platforms["Lazada"].weight)}</td>
                          <td className="px-3 py-3.5 border-r border-slate-200/60 font-mono font-semibold text-slate-800">{formatVND(item.platforms["Lazada"].cước)}</td>
                        </>
                      )}

                      {/* Sàn Tiki data */}
                      {showTiki && (
                        <>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{item.platforms["Tiki"].đơn.toLocaleString('vi-VN')}</td>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{formatWeight(item.platforms["Tiki"].weight)}</td>
                          <td className="px-3 py-3.5 border-r border-slate-200/60 font-mono font-semibold text-slate-800">{formatVND(item.platforms["Tiki"].cước)}</td>
                        </>
                      )}

                      {/* Sàn Khác data */}
                      {showKhac && (
                        <>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{item.platforms["Ngoài Sàn"].đơn.toLocaleString('vi-VN')}</td>
                          <td className="px-3 py-3.5 font-mono text-slate-600">{formatWeight(item.platforms["Ngoài Sàn"].weight)}</td>
                          <td className="px-3 py-3.5 font-mono font-semibold text-slate-800">{formatVND(item.platforms["Ngoài Sàn"].cước)}</td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8" id="dashboard_tab_container">
      
      {/* FILTER CONTROL BOARD */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-xs space-y-5" id="dashboard_filter_board">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-slate-800">Bộ Lọc Tham Chiếu & Thời Gian</h3>
          </div>

          {/* Presets Row */}
          <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <button
              onClick={() => applyPreset('today')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              onClick={() => applyPreset('yesterday')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
            >
              Hôm qua
            </button>
            <button
              onClick={() => applyPreset('7days')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
            >
              7 ngày qua
            </button>
            <button
              onClick={() => applyPreset('30days')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
            >
              30 ngày qua
            </button>
            <button
              onClick={() => applyPreset('thisMonth')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
            >
              Tháng này
            </button>
            <button
              onClick={() => applyPreset('all')}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-white transition-all cursor-pointer"
            >
              Toàn bộ
            </button>
          </div>
        </div>

        {/* Grid Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          
          {/* Start Date */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Từ Ngày
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
              id="filter_start_date"
            />
          </div>

          {/* End Date */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Đến Ngày
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
              id="filter_end_date"
            />
          </div>

          {/* Compare Picker */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              So Sánh Với
            </label>
            <select
              value={filters.compareMode}
              onChange={e => setFilters(prev => ({ ...prev, compareMode: e.target.value as any }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              id="filter_compare_mode"
            >
              <option value="none">Không so sánh</option>
              <option value="yesterday">Khoảng ngày trước đó</option>
              <option value="last_month">Cùng kỳ tháng trước</option>
            </select>
          </div>

          {/* Bưu cục */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Bưu Cục
            </label>
            <select
              value={filters.buuCu}
              onChange={e => setFilters(prev => ({ ...prev, buuCu: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              id="filter_buucu"
            >
              <option value="All">Tất cả bưu cục ({buuCuList.length})</option>
              {buuCuList.map(bc => (
                <option key={bc} value={bc}>{bc.replace('BC_', 'BC ')}</option>
              ))}
            </select>
          </div>

          {/* Sàn */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
              Sàn / Kênh
            </label>
            <select
              value={filters.san}
              onChange={e => setFilters(prev => ({ ...prev, san: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              id="filter_san"
            >
              <option value="All">Tất cả Sàn ({sanList.length})</option>
              {sanList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Search & Select */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Khách hàng gửi:
          </div>
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhanh khách..."
                value={custSearchText}
                onChange={e => setCustSearchText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-1 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex flex-wrap gap-1 items-center max-h-[80px] overflow-y-auto">
              <button
                onClick={() => setFilters(prev => ({ ...prev, khachHang: 'All' }))}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                  filters.khachHang === 'All' 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Tất cả khách hàng
              </button>

              {filteredCustomerList.slice(0, 8).map(cust => (
                <button
                  key={cust}
                  onClick={() => setFilters(prev => ({ ...prev, khachHang: cust }))}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all truncate max-w-[150px] ${
                    filters.khachHang === cust 
                      ? 'bg-indigo-600 text-white border-indigo-600' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title={cust}
                >
                  {cust}
                </button>
              ))}

              {filteredCustomerList.length > 8 && (
                <span className="text-[10px] text-slate-400 font-semibold px-1">
                  +{filteredCustomerList.length - 8} khách khác
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW SUB-TABS SELECTOR */}
      <div className="flex flex-wrap bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200/50 gap-1" id="dashboard_view_selector">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/55'
          }`}
        >
          <BarChart4 className="w-4 h-4" />
          <span>Tổng quan</span>
        </button>
        <button
          onClick={() => setActiveSubTab('region')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'region'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/55'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Báo cáo khu vực</span>
        </button>
        <button
          onClick={() => setActiveSubTab('cluster')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'cluster'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/55'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Báo cáo cụm</span>
        </button>
        <button
          onClick={() => setActiveSubTab('postoffice')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'postoffice'
              ? 'bg-white text-indigo-600 shadow-xs border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/55'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Báo cáo bưu cục</span>
        </button>
      </div>

      {activeSubTab === 'overview' ? (
        <>
          {/* METRIC CARD GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard_metric_cards">
        
        {/* TOTAL REVENUE (tong_cuoc) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Tổng cước phí</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">tong_cuoc</span>
            </div>
            <h4 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {formatVND(currentMetrics.tongCuoc)}
            </h4>
          </div>

          {compareRange && filters.compareMode !== 'none' && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 truncate">
                So với {filters.compareMode === 'yesterday' ? 'kỳ trước' : 'cùng kỳ'} ({formatVND(compareMetrics.tongCuoc)})
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                changePercentages.tongCuoc >= 0 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {changePercentages.tongCuoc >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {changePercentages.tongCuoc >= 0 ? '+' : ''}{changePercentages.tongCuoc.toFixed(1)}%
              </span>
            </div>
          )}

          {/* Cumulative Section */}
          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 px-6 py-4">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Lũy kế tháng (đến {filters.endDate.slice(8, 10)}/{filters.endDate.slice(5, 7)})</span>
              <span className="font-mono text-slate-700">{formatVND(currentCumulativeMetrics.tongCuoc)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Cùng kỳ tháng trước</span>
              <span className="font-mono text-slate-500">
                {formatVND(compareCumulativeMetrics.tongCuoc)}
                <span className={`ml-1.5 font-bold ${cumulativeChangePercentages.tongCuoc >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ({cumulativeChangePercentages.tongCuoc >= 0 ? '+' : ''}{cumulativeChangePercentages.tongCuoc.toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* TOTAL QUANTITY (ma_phieugui counts) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Số lượng phiếu gửi</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">ma_phieugui</span>
            </div>
            <h4 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {currentMetrics.phieuGuis.toLocaleString('vi-VN')} <span className="text-base font-medium text-slate-400">đơn</span>
            </h4>
          </div>

          {compareRange && filters.compareMode !== 'none' && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 truncate">
                So với {filters.compareMode === 'yesterday' ? 'kỳ trước' : 'cùng kỳ'} ({compareMetrics.phieuGuis} đơn)
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                changePercentages.phieuGuis >= 0 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {changePercentages.phieuGuis >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {changePercentages.phieuGuis >= 0 ? '+' : ''}{changePercentages.phieuGuis.toFixed(1)}%
              </span>
            </div>
          )}

          {/* Cumulative Section */}
          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 px-6 py-4">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Lũy kế tháng (đến {filters.endDate.slice(8, 10)}/{filters.endDate.slice(5, 7)})</span>
              <span className="font-mono text-slate-700">{currentCumulativeMetrics.phieuGuis.toLocaleString('vi-VN')} đơn</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Cùng kỳ tháng trước</span>
              <span className="font-mono text-slate-500">
                {compareCumulativeMetrics.phieuGuis.toLocaleString('vi-VN')} đơn
                <span className={`ml-1.5 font-bold ${cumulativeChangePercentages.phieuGuis >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ({cumulativeChangePercentages.phieuGuis >= 0 ? '+' : ''}{cumulativeChangePercentages.phieuGuis.toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* TOTAL WEIGHT (trong_luong) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Tổng trọng lượng</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">trong_luong</span>
            </div>
            <h4 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
              {formatWeight(currentMetrics.trongLuong)}
            </h4>
          </div>

          {compareRange && filters.compareMode !== 'none' && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 truncate">
                So với {filters.compareMode === 'yesterday' ? 'kỳ trước' : 'cùng kỳ'} ({formatWeight(compareMetrics.trongLuong)})
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                changePercentages.trongLuong >= 0 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-rose-50 text-rose-700'
              }`}>
                {changePercentages.trongLuong >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {changePercentages.trongLuong >= 0 ? '+' : ''}{changePercentages.trongLuong.toFixed(1)}%
              </span>
            </div>
          )}

          {/* Cumulative Section */}
          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 px-6 py-4">
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              <span>Lũy kế tháng (đến {filters.endDate.slice(8, 10)}/{filters.endDate.slice(5, 7)})</span>
              <span className="font-mono text-slate-700">{formatWeight(currentCumulativeMetrics.trongLuong)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>Cùng kỳ tháng trước</span>
              <span className="font-mono text-slate-500">
                {formatWeight(compareCumulativeMetrics.trongLuong)}
                <span className={`ml-1.5 font-bold ${cumulativeChangePercentages.trongLuong >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  ({cumulativeChangePercentages.trongLuong >= 0 ? '+' : ''}{cumulativeChangePercentages.trongLuong.toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>
        </div>

      </div>

          {/* TREND CHART AND DETAIL ANALYSIS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT PANEL: Interactive Trend Line Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col" id="trend_chart_panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">
                <BarChart4 className="w-5 h-5 text-indigo-600" />
                <span>Biểu Đồ Xu Thế Vận Hành</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Nhấp hoặc di chuột để xem chi tiết từng thời điểm.
              </p>
            </div>

            {/* Metric Tab Controls inside chart */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => { setActiveMetricTab('tong_cuoc'); setHoveredDataPoint(null); }}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  activeMetricTab === 'tong_cuoc' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cước phí
              </button>
              <button
                onClick={() => { setActiveMetricTab('ma_phieugui'); setHoveredDataPoint(null); }}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  activeMetricTab === 'ma_phieugui' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Số đơn
              </button>
              <button
                onClick={() => { setActiveMetricTab('trong_luong'); setHoveredDataPoint(null); }}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                  activeMetricTab === 'trong_luong' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Khối lượng
              </button>
            </div>
          </div>

          {/* SVG Container */}
          <div className="flex-1 min-h-[220px] flex items-center justify-center relative">
            {currentPeriodOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm">Không có dữ liệu trong khoảng thời gian đã chọn.</p>
              </div>
            ) : (
              <div className="w-full">
                {renderedChartSVG}
                
                {/* SVG Legend */}
                <div className="flex justify-center gap-5 mt-3 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-indigo-600 inline-block rounded-xs"></span>
                    <span>Kỳ hiện tại ({filters.startDate} đến {filters.endDate})</span>
                  </div>
                  {compareRange && filters.compareMode !== 'none' && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 bg-slate-400 inline-block rounded-xs border-dashed border-t-2 border-slate-400"></span>
                      <span>Kỳ so sánh ({compareRange.startDate} đến {compareRange.endDate})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Float Tooltip Info */}
            {hoveredDataPoint && (
              <div className="absolute top-1 left-1 bg-slate-900/95 text-white text-xs p-3 rounded-xl shadow-lg border border-slate-700/50 backdrop-blur-xs space-y-1 z-30 pointer-events-none min-w-[150px]">
                <div className="font-bold border-b border-slate-700 pb-1 mb-1.5">
                  Ngày: {new Date(hoveredDataPoint.date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-300">Kỳ hiện tại:</span>
                  <span className="font-bold font-mono text-indigo-300">
                    {activeMetricTab === 'tong_cuoc' ? formatVND(hoveredDataPoint.current) : activeMetricTab === 'trong_luong' ? formatWeight(hoveredDataPoint.current) : `${hoveredDataPoint.current} đơn`}
                  </span>
                </div>
                {hoveredDataPoint.compare !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400">Kỳ trước:</span>
                    <span className="font-bold font-mono text-slate-400">
                      {activeMetricTab === 'tong_cuoc' ? formatVND(hoveredDataPoint.compare) : activeMetricTab === 'trong_luong' ? formatWeight(hoveredDataPoint.compare) : `${hoveredDataPoint.compare} đơn`}
                    </span>
                  </div>
                )}
                {hoveredDataPoint.compare !== undefined && hoveredDataPoint.compare > 0 && (
                  <div className="text-[10px] text-right font-bold font-mono border-t border-slate-800 pt-1 mt-1">
                    Biến động:{' '}
                    <span className={hoveredDataPoint.current >= hoveredDataPoint.compare ? 'text-emerald-400' : 'text-rose-400'}>
                      {hoveredDataPoint.current >= hoveredDataPoint.compare ? '+' : ''}
                      {(((hoveredDataPoint.current - hoveredDataPoint.compare) / hoveredDataPoint.compare) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Sàn / Kênh distribution comparison (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col" id="platform_distribution_panel">
          <div className="pb-4 mb-5 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-1.5">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Cơ Cấu Sàn Giao Dịch</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Phần trăm thị phần cước phí theo từng Sàn / Kênh thương mại điện tử.
            </p>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {currentPeriodOrders.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">Không có dữ liệu</p>
            ) : (
              (() => {
                // calculate stats per SAN
                const sanCuocs: { [san: string]: number } = {};
                const sanCounts: { [san: string]: number } = {};
                let totalC = 0;

                currentPeriodOrders.forEach(o => {
                  sanCuocs[o.SAN] = (sanCuocs[o.SAN] || 0) + o.tong_cuoc;
                  sanCounts[o.SAN] = (sanCounts[o.SAN] || 0) + 1;
                  totalC += o.tong_cuoc;
                });

                const sortedSan = Object.keys(sanCuocs).map(s => ({
                  name: s,
                  cuoc: sanCuocs[s],
                  count: sanCounts[s],
                  pct: totalC > 0 ? (sanCuocs[s] / totalC) * 100 : 0
                })).sort((a, b) => b.cuoc - a.cuoc);

                return (
                  <div className="space-y-4">
                    {/* Ring visual bars */}
                    {sortedSan.map(s => {
                      const colorClass = 
                        s.name === 'Shopee' ? 'bg-orange-500' :
                        s.name === 'Lazada' ? 'bg-blue-600' :
                        s.name === 'TikTok' ? 'bg-slate-900' :
                        s.name === 'Tiki' ? 'bg-sky-500' :
                        'bg-slate-400';

                      return (
                        <div key={s.name} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${colorClass}`}></span>
                              {s.name}
                            </span>
                            <span className="text-slate-400 font-medium">
                              <span className="font-bold text-slate-800 font-mono">{formatVND(s.cuoc)}</span> ({s.count} đơn)
                            </span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                              style={{ width: `${s.pct}%` }}
                            />
                          </div>

                          <div className="text-[10px] text-right font-bold text-indigo-600 font-mono">
                            Thị phần: {s.pct.toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </div>

      </div>

      {/* TOP CLIENTS ANALYSIS PANEL */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs" id="top_clients_analysis_panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Phân Tích TOP Khách Hàng Gửi Đơn</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bảng xếp hạng các đối tác, khách hàng gửi có tổng doanh thu hoặc số lượng phiếu gửi nhiều nhất.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center text-xs">
            {/* Limit Selector */}
            <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5">Chọn</span>
              {[10, 15, 20, 30].map(limit => (
                <button
                  key={limit}
                  onClick={() => setTopLimit(limit)}
                  className={`font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    topLimit === limit ? 'bg-white text-indigo-600 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  TOP {limit}
                </button>
              ))}
            </div>

            {/* Metric Selector */}
            <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5">Theo</span>
              <button
                onClick={() => setTopMetric('tong_cuoc')}
                className={`font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  topMetric === 'tong_cuoc' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tổng cước
              </button>
              <button
                onClick={() => setTopMetric('ma_phieugui')}
                className={`font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  topMetric === 'ma_phieugui' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Số lượng đơn
              </button>
            </div>
          </div>
        </div>

        {topCustomersData.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu xếp hạng khách hàng thỏa mãn bộ lọc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Top Bar chart visual listing */}
            <div className="space-y-4">
              {topCustomersData.map((cust, idx) => {
                const metricValue = topMetric === 'tong_cuoc' ? cust.currentCuoc : cust.currentCount;
                const percentage = topMetricTotal > 0 ? (metricValue / topMetricTotal) * 100 : 0;

                return (
                  <div key={cust.name} className="group flex items-center gap-3">
                    {/* Rank Number */}
                    <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                      idx === 0 ? 'bg-amber-100 text-amber-800' :
                      idx === 1 ? 'bg-slate-200 text-slate-800' :
                      idx === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Bar and details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 truncate" title={cust.name}>
                          {cust.name}
                        </span>
                        <span className="font-mono font-bold text-slate-600 shrink-0 ml-2">
                          {topMetric === 'tong_cuoc' ? formatVND(cust.currentCuoc) : `${cust.currentCount} đơn`}
                        </span>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500 group-hover:bg-indigo-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Share percent */}
                    <div className="w-12 text-right font-mono text-xs font-bold text-indigo-600 shrink-0">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table breakdowns with extra statistics and comparison */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-slate-50/50 p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider pb-2">
                    <th className="py-2 px-3">Xếp hạng / Tên</th>
                    <th className="py-2 px-3 text-right">Số lượng đơn</th>
                    <th className="py-2 px-3 text-right">Tổng cước</th>
                    <th className="py-2 px-3 text-right">Khối lượng</th>
                    <th className="py-2 px-3 text-right">Cước TB/Đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 font-mono">
                  {topCustomersData.map((cust, idx) => {
                    const diffCuocPct = cust.compareCuoc > 0 ? ((cust.currentCuoc - cust.compareCuoc) / cust.compareCuoc) * 100 : 0;
                    const diffCountPct = cust.compareCount > 0 ? ((cust.currentCount - cust.compareCount) / cust.compareCount) * 100 : 0;
                    
                    return (
                      <tr key={cust.name} className="hover:bg-white transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800 truncate max-w-[150px]">
                            <span className="text-slate-400 font-semibold font-mono mr-1.5">#{idx + 1}</span>
                            {cust.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{cust.code}</div>
                        </td>
                        
                        <td className="py-2.5 px-3 text-right">
                          <div className="font-mono font-bold">{cust.currentCount} đơn</div>
                          {compareRange && filters.compareMode !== 'none' && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Kỳ trước: {cust.compareCount}
                              {cust.compareCount > 0 && (
                                <span className={`ml-1 font-bold ${diffCountPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  ({diffCountPct >= 0 ? '+' : ''}{diffCountPct.toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="font-mono font-bold text-slate-800">{formatVND(cust.currentCuoc)}</div>
                          {compareRange && filters.compareMode !== 'none' && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Kỳ trước: {formatVND(cust.compareCuoc)}
                              {cust.compareCuoc > 0 && (
                                <span className={`ml-1 font-bold ${diffCuocPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  ({diffCuocPct >= 0 ? '+' : ''}{diffCuocPct.toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono">{formatWeight(cust.currentWeight)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-600 font-bold">
                          {formatVND(Math.round(cust.currentCuoc / cust.currentCount))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* TOP POST OFFICES ANALYSIS PANEL */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs animate-fade-in" id="top_post_offices_analysis_panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Phân Tích TOP Bưu Cục Nhận Đơn</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Bảng xếp hạng các bưu cục gốc có tổng doanh thu hoặc sản lượng đơn hàng lớn nhất mạng lưới.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center text-xs">
            {/* Limit Selector */}
            <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5">Chọn</span>
              {[10, 15, 20, 30].map(limit => (
                <button
                  key={limit}
                  onClick={() => setTopBuuCucLimit(limit)}
                  className={`font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    topBuuCucLimit === limit ? 'bg-white text-indigo-600 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  TOP {limit}
                </button>
              ))}
            </div>

            {/* Metric Selector */}
            <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5">Theo</span>
              <button
                onClick={() => setTopBuuCucMetric('tong_cuoc')}
                className={`font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  topBuuCucMetric === 'tong_cuoc' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tổng cước
              </button>
              <button
                onClick={() => setTopBuuCucMetric('ma_phieugui')}
                className={`font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  topBuuCucMetric === 'ma_phieugui' ? 'bg-white text-indigo-600 shadow-xs border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Số lượng đơn
              </button>
            </div>
          </div>
        </div>

        {topBuuCucData.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">Không tìm thấy dữ liệu xếp hạng bưu cục thỏa mãn bộ lọc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visual Bar listing */}
            <div className="space-y-4">
              {topBuuCucData.map((bc, idx) => {
                const metricValue = topBuuCucMetric === 'tong_cuoc' ? bc.currentCuoc : bc.currentCount;
                const percentage = topBuuCucMetricTotal > 0 ? (metricValue / topBuuCucMetricTotal) * 100 : 0;

                return (
                  <div key={bc.code} className="group flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                      idx === 0 ? 'bg-amber-100 text-amber-800' :
                      idx === 1 ? 'bg-slate-200 text-slate-800' :
                      idx === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 truncate" title={bc.name}>
                          {bc.code.replace('BC_', 'BC ')} - <span className="font-medium text-slate-400 text-[11px]">{bc.name}</span>
                        </span>
                        <span className="font-mono font-bold text-slate-600 shrink-0 ml-2">
                          {topBuuCucMetric === 'tong_cuoc' ? formatVND(bc.currentCuoc) : `${bc.currentCount} đơn`}
                        </span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-500 group-hover:bg-indigo-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-12 text-right font-mono text-xs font-bold text-indigo-600 shrink-0">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Table breakdowns with comparisons */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl bg-slate-50/50 p-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider pb-2">
                    <th className="py-2 px-3">Bưu cục</th>
                    <th className="py-2 px-3">Vùng / Cụm</th>
                    <th className="py-2 px-3 text-right">Số lượng đơn</th>
                    <th className="py-2 px-3 text-right">Tổng cước</th>
                    <th className="py-2 px-3 text-right">Trọng lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700 font-mono">
                  {topBuuCucData.map((bc, idx) => {
                    const diffCuocPct = bc.compareCuoc > 0 ? ((bc.currentCuoc - bc.compareCuoc) / bc.compareCuoc) * 100 : 0;
                    const diffCountPct = bc.compareCount > 0 ? ((bc.currentCount - bc.compareCount) / bc.compareCount) * 100 : 0;

                    return (
                      <tr key={bc.code} className="hover:bg-white transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800 truncate max-w-[130px]">
                            <span className="text-slate-400 font-semibold font-mono mr-1.5">#{idx + 1}</span>
                            {bc.code.replace('BC_', 'BC ')}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px]" title={bc.name}>{bc.name}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-indigo-600 text-[11px]">{bc.region}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{bc.cluster}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="font-mono font-bold">{bc.currentCount} đơn</div>
                          {compareRange && filters.compareMode !== 'none' && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Kỳ trước: {bc.compareCount}
                              {bc.compareCount > 0 && (
                                <span className={`ml-1 font-bold ${diffCountPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  ({diffCountPct >= 0 ? '+' : ''}{diffCountPct.toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="font-mono font-bold text-slate-800">{formatVND(bc.currentCuoc)}</div>
                          {compareRange && filters.compareMode !== 'none' && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Kỳ trước: {formatVND(bc.compareCuoc)}
                              {bc.compareCuoc > 0 && (
                                <span className={`ml-1 font-bold ${diffCuocPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  ({diffCuocPct >= 0 ? '+' : ''}{diffCuocPct.toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatWeight(bc.currentWeight)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ANOMALY WARNINGS PANEL */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-6 shadow-xs space-y-6" id="anomaly_detection_section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <div className="relative">
                <AlertTriangle className="w-5 h-5 text-amber-500 fill-amber-100 animate-pulse" />
              </div>
              <span>Trung Tâm Cảnh Báo Bất Thường</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống tự động phát hiện sai sót, đột biến tăng/giảm số liệu dựa trên từng cột thông tin và bưu cục tham chiếu.
            </p>
          </div>

          {/* SENSITIVITY CONTROLS */}
          <div className="flex flex-wrap gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Thiết lập độ nhạy cảnh báo:</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-[11px] font-semibold text-slate-500">
              <div className="flex flex-col">
                <span className="mb-1">Cước phí: &ge; {thresholds.tong_cuoc_max_change_pct}%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={thresholds.tong_cuoc_max_change_pct}
                  onChange={e => setThresholds(prev => ({ ...prev, tong_cuoc_max_change_pct: Number(e.target.value) }))}
                  className="w-24 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex flex-col">
                <span className="mb-1">Số lượng đơn: &ge; {thresholds.ma_phieugui_max_change_pct}%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={thresholds.ma_phieugui_max_change_pct}
                  onChange={e => setThresholds(prev => ({ ...prev, ma_phieugui_max_change_pct: Number(e.target.value) }))}
                  className="w-24 accent-indigo-600 cursor-pointer"
                />
              </div>

              <div className="flex flex-col">
                <span className="mb-1">Trọng lượng: &ge; {thresholds.trong_luong_max_change_pct}%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={thresholds.trong_luong_max_change_pct}
                  onChange={e => setThresholds(prev => ({ ...prev, trong_luong_max_change_pct: Number(e.target.value) }))}
                  className="w-24 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Display */}
        {filters.compareMode === 'none' ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Vui lòng kích hoạt chế độ "So Sánh Với" ngày trước đó hoặc cùng kỳ tháng trước ở bộ lọc để phân tích cảnh báo bất thường.
          </div>
        ) : anomalyWarnings.length === 0 ? (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5 text-center text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Chúc mừng! Không phát hiện bất kỳ biến động bất thường nào trong khoảng thời gian đã chọn với độ nhạy hiện tại.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalyWarnings.map((warning, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-xl border flex gap-3 shadow-2xs transition-all hover:shadow-xs ${
                  warning.severity === 'critical' 
                    ? 'bg-rose-50 border-rose-200 text-rose-900' 
                    : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}
              >
                <div className="shrink-0 pt-0.5">
                  <AlertTriangle className={`w-5 h-5 ${
                    warning.severity === 'critical' ? 'text-rose-600' : 'text-amber-600'
                  }`} />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs uppercase tracking-wider bg-white/85 px-2 py-0.5 rounded-md shadow-2xs border">
                      {warning.dimension}
                    </span>
                    <span className="font-bold text-[10px] uppercase font-mono tracking-wide px-1.5 py-0.5 rounded bg-black/5">
                      Cột: {warning.field}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed font-semibold">
                    {warning.message}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] font-mono font-bold text-slate-500 pt-1">
                    <span>Hiện tại: {warning.field === 'Tổng cước' ? formatVND(warning.currentValue) : warning.field === 'Trọng lượng' ? formatWeight(warning.currentValue) : warning.currentValue + ' đơn'}</span>
                    <span>Kỳ so sánh: {warning.field === 'Tổng cước' ? formatVND(warning.compareValue) : warning.field === 'Trọng lượng' ? formatWeight(warning.compareValue) : warning.compareValue + ' đơn'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      ) : activeSubTab === 'region' ? (
        renderDetailedReportTable(
          "Báo Cáo Theo Khu Vực", 
          "Báo cáo phân tích số lượng, trọng lượng, cước phí chi tiết từng sàn của từng Khu vực (Region) theo bộ lọc & đối sánh", 
          aggregatedData.regions, 
          regionSort, 
          setRegionSort
        )
      ) : activeSubTab === 'cluster' ? (
        renderDetailedReportTable(
          "Báo Cáo Theo Cụm", 
          "Báo cáo phân tích số lượng, trọng lượng, cước phí chi tiết từng sàn của từng Cụm (Cluster) theo bộ lọc & đối sánh", 
          aggregatedData.clusters, 
          clusterSort, 
          setClusterSort
        )
      ) : (
        renderDetailedReportTable(
          "Báo Cáo Chi Tiết Bưu Cục", 
          "Báo cáo phân tích số lượng, trọng lượng, cước phí chi tiết từng sàn của từng Bưu Cục (Post Office) gốc theo bộ lọc & đối sánh", 
          aggregatedData.postOffices, 
          poSort, 
          setPoSort
        )
      )}


</div>
);
}
