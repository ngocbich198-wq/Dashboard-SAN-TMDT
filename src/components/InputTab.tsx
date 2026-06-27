import React, { useState, useRef } from 'react';
import { Order } from '../types';
import { parseImportText, formatVND, formatWeight } from '../utils/helpers';
import { 
  Plus, 
  Upload, 
  FileSpreadsheet, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  Clock,
  Sparkles,
  Pencil,
  X,
  Save,
  Search,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';

interface InputTabProps {
  orders: Order[];
  onAddOrders: (newOrders: Order[]) => void;
  onClearAll: () => void;
  onDeleteOrder: (maPhieuGui: string) => void;
  onUpdateOrder: (oldMaPhieuGui: string, updatedOrder: Order) => void;
  onLoadSample: () => void;
}

export default function InputTab({ 
  orders, 
  onAddOrders, 
  onClearAll, 
  onDeleteOrder,
  onUpdateOrder,
  onLoadSample
}: InputTabProps) {
  // --- Single Form State ---
  const [singleForm, setSingleForm] = useState<Partial<Order>>({
    ma_phieugui: '',
    ma_buucu: 'BC_CAUGIAY',
    time_nhap_may: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    ma_khgui: '',
    ten_khgui: '',
    trong_luong: 250,
    tong_cuoc: 30000,
    SAN: 'Shopee'
  });
  
  const [singleError, setSingleError] = useState('');
  const [singleSuccess, setSingleSuccess] = useState(false);

  // --- Batch Upload State ---
  const [pasteText, setPasteText] = useState('');
  const [fileError, setFileError] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Order[]>([]);
  const [parsingErrors, setParsingErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Data Management Filters State ---
  const [mgtFilterStart, setMgtFilterStart] = useState('');
  const [mgtFilterEnd, setMgtFilterEnd] = useState('');
  const [mgtSearchText, setMgtSearchText] = useState('');
  const [mgtBuuCu, setMgtBuuCu] = useState('All');
  const [mgtSan, setMgtSan] = useState('All');

  // Pagination State
  const [mgtPage, setMgtPage] = useState(1);
  const itemsPerPage = 10;

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Order | null>(null);
  const [editError, setEditError] = useState('');

  // Date Filter helper presets
  const setTodayFilter = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setMgtFilterStart(todayStr);
    setMgtFilterEnd(todayStr);
    setMgtPage(1);
  };

  const setLast7DaysFilter = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    setMgtFilterStart(start.toISOString().slice(0, 10));
    setMgtFilterEnd(end.toISOString().slice(0, 10));
    setMgtPage(1);
  };

  const setThisMonthFilter = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    setMgtFilterStart(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`);
    setMgtFilterEnd(`${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`);
    setMgtPage(1);
  };

  const setAllFilter = () => {
    setMgtFilterStart('');
    setMgtFilterEnd('');
    setMgtPage(1);
  };

  const handleStartEdit = (order: Order) => {
    setEditingId(order.ma_phieugui);
    setEditForm({ ...order });
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setEditError('');
  };

  const handleSaveEdit = () => {
    if (!editForm) return;
    
    if (!editForm.ma_phieugui.trim()) {
      setEditError('Mã phiếu gửi không được để trống.');
      return;
    }
    if (!editForm.ten_khgui.trim()) {
      setEditError('Tên khách gửi không được để trống.');
      return;
    }

    // Check duplicate if ID changed
    if (editForm.ma_phieugui.toLowerCase() !== editingId?.toLowerCase()) {
      const dup = orders.find(o => o.ma_phieugui.toLowerCase() === editForm.ma_phieugui.trim().toLowerCase());
      if (dup) {
        setEditError(`Mã phiếu gửi ${editForm.ma_phieugui} đã tồn tại.`);
        return;
      }
    }

    onUpdateOrder(editingId!, {
      ...editForm,
      ma_phieugui: editForm.ma_phieugui.trim().toUpperCase(),
      ma_buucu: editForm.ma_buucu.trim().toUpperCase(),
      ma_khgui: editForm.ma_khgui.trim().toUpperCase(),
      ten_khgui: editForm.ten_khgui.trim(),
      trong_luong: Number(editForm.trong_luong) || 0,
      tong_cuoc: Number(editForm.tong_cuoc) || 0,
    });

    setEditingId(null);
    setEditForm(null);
    setEditError('');
  };

  // Filter and sort orders
  const filteredOrders = [...orders]
    .filter(order => {
      // Date filter
      if (mgtFilterStart) {
        const oDate = order.time_nhap_may.slice(0, 10);
        if (oDate < mgtFilterStart) return false;
      }
      if (mgtFilterEnd) {
        const oDate = order.time_nhap_may.slice(0, 10);
        if (oDate > mgtFilterEnd) return false;
      }
      // Search text (ma_phieugui, ten_khgui, ma_khgui)
      if (mgtSearchText.trim()) {
        const query = mgtSearchText.toLowerCase();
        const matchCode = order.ma_phieugui.toLowerCase().includes(query);
        const matchName = order.ten_khgui.toLowerCase().includes(query);
        const matchCustCode = order.ma_khgui.toLowerCase().includes(query);
        if (!matchCode && !matchName && !matchCustCode) return false;
      }
      // Buu cu
      if (mgtBuuCu !== 'All' && order.ma_buucu !== mgtBuuCu) {
        return false;
      }
      // San
      if (mgtSan !== 'All' && order.SAN !== mgtSan) {
        return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.time_nhap_may).getTime() - new Date(a.time_nhap_may).getTime());

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const currentPage = Math.min(mgtPage, totalPages);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Auto-generate a dummy barcode
  const handleGenBarcode = () => {
    const rand = Math.floor(100000000 + Math.random() * 900000000);
    setSingleForm(prev => ({
      ...prev,
      ma_phieugui: `EH${rand}VN`
    }));
  };

  // Handle single form submit
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError('');
    setSingleSuccess(false);

    const { ma_phieugui, ma_buucu, time_nhap_may, ma_khgui, ten_khgui, trong_luong, tong_cuoc, SAN } = singleForm;

    if (!ma_phieugui || !ma_phieugui.trim()) {
      setSingleError('Vui lòng nhập Mã phiếu gửi.');
      return;
    }

    if (!ten_khgui || !ten_khgui.trim()) {
      setSingleError('Vui lòng nhập Tên khách gửi.');
      return;
    }

    const dup = orders.find(o => o.ma_phieugui.toLowerCase() === ma_phieugui.trim().toLowerCase());
    if (dup) {
      setSingleError(`Mã phiếu gửi ${ma_phieugui} đã tồn tại trong hệ thống.`);
      return;
    }

    // Format to local date-time string to avoid timezone shifting
    const getLocalTime = (val?: string) => {
      if (val) {
        return val.includes('T') && val.split('T')[1].split(':').length === 2 ? `${val}:00` : val;
      }
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    };

    const finalOrder: Order = {
      ma_phieugui: ma_phieugui.trim().toUpperCase(),
      ma_buucu: (ma_buucu || 'BC_KHAC').trim().toUpperCase(),
      time_nhap_may: getLocalTime(time_nhap_may),
      ma_khgui: (ma_khgui || 'KH_KHAC').trim().toUpperCase(),
      ten_khgui: ten_khgui.trim(),
      trong_luong: Number(trong_luong) || 0,
      tong_cuoc: Number(tong_cuoc) || 0,
      SAN: SAN || 'Ngoài Sàn'
    };

    onAddOrders([finalOrder]);
    setSingleSuccess(true);
    
    // Clear form except post office & platform for fast repetitive entries
    setSingleForm(prev => ({
      ...prev,
      ma_phieugui: '',
      ma_khgui: '',
      ten_khgui: '',
      trong_luong: 250,
      tong_cuoc: 30000
    }));

    setTimeout(() => setSingleSuccess(false), 3000);
  };

  // Handle paste text change / parse
  const handlePasteParse = (text: string) => {
    setPasteText(text);
    if (!text.trim()) {
      setParsedPreview([]);
      setParsingErrors([]);
      setFileError('');
      return;
    }

    const { orders: parsed, errors } = parseImportText(text);
    setParsedPreview(parsed);
    setParsingErrors(errors);
    if (parsed.length === 0 && errors.length > 0) {
      setFileError(errors[0]);
    } else {
      setFileError('');
    }
  };

  // Handle CSV/TSV File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handlePasteParse(text);
    };
    reader.onerror = () => {
      setFileError('Không thể đọc file. Vui lòng thử lại.');
    };
    reader.readAsText(file);
  };

  // Commit parsed batch to main state
  const handleCommitBatch = () => {
    if (parsedPreview.length === 0) return;

    // Filter duplicates against existing orders
    const existingIds = new Set(orders.map(o => o.ma_phieugui.toUpperCase()));
    const toAdd: Order[] = [];
    let dupsCount = 0;

    parsedPreview.forEach(o => {
      if (existingIds.has(o.ma_phieugui.toUpperCase())) {
        dupsCount++;
      } else {
        toAdd.push(o);
      }
    });

    onAddOrders(toAdd);
    
    // Reset preview
    setPasteText('');
    setParsedPreview([]);
    setParsingErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (dupsCount > 0) {
      alert(`Đã nhập thành công ${toAdd.length} đơn gửi mới. Bỏ qua ${dupsCount} đơn bị trùng mã.`);
    } else {
      alert(`Đã nhập thành công toàn bộ ${toAdd.length} đơn gửi mới!`);
    }
  };

  // Load spreadsheet paste template
  const loadTemplateText = () => {
    const template = `ma_phieugui\tma_buucu\ttime_nhap_may\tma_khgui\tten_khgui\ttrong_luong\ttong_cuoc\tSÀN
EH910488102VN\tBC_CAUGIAY\t2026-06-27 10:15:00\tKH_SHP_01\tShopee Mall Việt Nam\t350\t28000\tShopee
EH910488104VN\tBC_DONGDA\t2026-06-27 14:05:00\tKH_TIK_03\tTikTok Shop Fashion\t850\t38000\tTikTok`;
    handlePasteParse(template);
  };

  return (
    <div className="space-y-8" id="input_tab_container">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Hệ Thống Nhập Đơn Gửi</h2>
          <p className="text-slate-300 text-sm mt-2">
            Hỗ trợ nhập thủ công từng đơn lẻ hoặc nhập nhanh hàng loạt từ bảng tính Excel / CSV.
          </p>
        </div>
        <div className="flex gap-3 bg-slate-800 p-2 rounded-xl text-xs font-mono border border-slate-700">
          <div className="text-slate-400">Tổng cơ sở dữ liệu:</div>
          <div className="text-emerald-400 font-bold">{orders.length} Đơn gửi</div>
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Single Entry Form (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col" id="single_entry_card">
          <div className="flex items-center gap-2 pb-4 mb-6 border-b border-slate-100">
            <Plus className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-slate-800">Nhập Đơn Lẻ</h3>
          </div>

          <form onSubmit={handleSingleSubmit} className="space-y-4 flex-1 flex flex-col">
            {singleError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-100">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{singleError}</span>
              </div>
            )}

            {singleSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 border border-emerald-100">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Thêm đơn thành công! Dữ liệu đã lưu.</span>
              </div>
            )}

            {/* Mã phiếu gửi with Generator */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Mã Phiếu Gửi *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: EH829104821VN"
                  value={singleForm.ma_phieugui}
                  onChange={e => setSingleForm(prev => ({ ...prev, ma_phieugui: e.target.value.toUpperCase() }))}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                  id="input_ma_phieugui"
                />
                <button
                  type="button"
                  onClick={handleGenBarcode}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                  title="Tạo mã ngẫu nhiên"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Tự tạo</span>
                </button>
              </div>
            </div>

            {/* Bưu cục & Sàn */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Mã Bưu Cục
                </label>
                <select
                  value={singleForm.ma_buucu}
                  onChange={e => setSingleForm(prev => ({ ...prev, ma_buucu: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  id="select_ma_buucu"
                >
                  <option value="BC_CAUGIAY">BC Cầu Giấy</option>
                  <option value="BC_HOANKIEM">BC Hoàn Kiếm</option>
                  <option value="BC_DONGDA">BC Đống Đa</option>
                  <option value="BC_HAIBATRUNG">BC Hai Bà Trưng</option>
                  <option value="BC_KHAC">BC Khác / Vãng Lai</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Kênh / Sàn
                </label>
                <select
                  value={singleForm.SAN}
                  onChange={e => setSingleForm(prev => ({ ...prev, SAN: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  id="select_san"
                >
                  <option value="Shopee">Shopee</option>
                  <option value="TikTok">TikTok</option>
                </select>
              </div>
            </div>

            {/* Khách hàng details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Mã Khách Gửi
                </label>
                <input
                  type="text"
                  placeholder="KH_SHOPEEMALL"
                  value={singleForm.ma_khgui}
                  onChange={e => setSingleForm(prev => ({ ...prev, ma_khgui: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                  id="input_ma_khgui"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Tên Khách Gửi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tên Shop hoặc KH"
                  value={singleForm.ten_khgui}
                  onChange={e => setSingleForm(prev => ({ ...prev, ten_khgui: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  id="input_ten_khgui"
                />
              </div>
            </div>

            {/* Trọng lượng & Tổng cước */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Trọng lượng (gram)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="250"
                  value={singleForm.trong_luong || ''}
                  onChange={e => setSingleForm(prev => ({ ...prev, trong_luong: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                  id="input_trong_luong"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Tổng cước (VND)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="30000"
                  value={singleForm.tong_cuoc || ''}
                  onChange={e => setSingleForm(prev => ({ ...prev, tong_cuoc: Number(e.target.value) }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                  id="input_tong_cuoc"
                />
              </div>
            </div>

            {/* Thời gian nhập máy */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Thời Gian Nhập Máy
              </label>
              <input
                type="datetime-local"
                value={singleForm.time_nhap_may}
                onChange={e => setSingleForm(prev => ({ ...prev, time_nhap_may: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono"
                id="input_time_nhap_may"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 mt-auto">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-indigo-100"
                id="btn_submit_single"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Đơn Gửi</span>
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Batch Upload (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col" id="batch_import_card">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-lg text-slate-800">Tải File / Nhập Hàng Loạt</h3>
            </div>
            <button
              onClick={loadTemplateText}
              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Dùng mẫu Excel</span>
            </button>
          </div>

          <div className="space-y-4 flex-1 flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File input widget */}
              <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-medium text-slate-700 mb-1">Kéo thả CSV hoặc Txt vào đây</span>
                <span className="text-[10px] text-slate-400 mb-3">Hỗ trợ dấu phẩy, tab hoặc chấm phẩy</span>
                <input
                  type="file"
                  accept=".csv,.tsv,.txt"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv_file_input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border border-slate-200 hover:border-slate-300 shadow-xs text-xs font-bold text-slate-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Chọn file từ máy
                </button>
              </div>

              {/* Instructions list */}
              <div className="text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                <h4 className="font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  Hướng dẫn tiêu đề cột
                </h4>
                <p className="text-slate-500 leading-relaxed mb-2">
                  Hệ thống tự nhận diện các tiêu đề (không phân biệt hoa thường, có dấu hay không):
                </p>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-slate-600">
                  <div>• ma_phieugui (bắt buộc)</div>
                  <div>• tong_cuoc (bắt buộc)</div>
                  <div>• ma_buucu</div>
                  <div>• time_nhap_may</div>
                  <div>• ten_khgui</div>
                  <div>• trong_luong</div>
                </div>
              </div>
            </div>

            {/* Textarea paste area */}
            <div className="flex-1 flex flex-col min-h-[140px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Hoặc dán cột dữ liệu trực tiếp từ Excel
              </label>
              <textarea
                value={pasteText}
                onChange={e => handlePasteParse(e.target.value)}
                placeholder="Dán các cột dữ liệu có dòng tiêu đề ở đây..."
                className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono resize-none"
                id="textarea_batch_input"
              />
            </div>

            {fileError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-100">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Import Preview */}
            {parsedPreview.length > 0 && (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-xs font-bold text-slate-700">
                      Bản xem trước dữ liệu nhập ({parsedPreview.length} dòng hợp lệ)
                    </span>
                  </div>
                  {parsingErrors.length > 0 && (
                    <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium">
                      Bỏ qua {parsingErrors.length} lỗi
                    </span>
                  )}
                </div>

                <div className="max-h-[150px] overflow-y-auto border border-slate-150 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Mã Phiếu</th>
                        <th className="p-2">Tên Khách Gửi</th>
                        <th className="p-2">Cước phí</th>
                        <th className="p-2">Sàn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedPreview.slice(0, 20).map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono">{p.ma_phieugui}</td>
                          <td className="p-2 truncate max-w-[120px]">{p.ten_khgui}</td>
                          <td className="p-2 font-mono">{formatVND(p.tong_cuoc)}</td>
                          <td className="p-2">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm">{p.SAN}</span>
                          </td>
                        </tr>
                      ))}
                      {parsedPreview.length > 20 && (
                        <tr>
                          <td colSpan={4} className="p-2 text-center text-slate-400 italic">
                            ...và {parsedPreview.length - 20} dòng khác...
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={handleCommitBatch}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shadow-emerald-100"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Xác nhận nạp {parsedPreview.length} đơn vào Dashboard</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* QUẢN LÝ & CHỈNH SỬA DỮ LIỆU ĐƠN GỬI */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs" id="recent_entries_section">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>Quản Lý & Chỉnh Sửa Dữ Liệu Đơn Gửi</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tìm kiếm đơn, lọc theo thời gian nhập máy, chỉnh sửa thông tin trực tiếp hoặc xóa bản ghi nhập sai.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (window.confirm("Bạn có chắc muốn nạp dữ liệu mẫu để thử nghiệm không?")) {
                  onLoadSample();
                }
              }}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 border border-indigo-100"
              id="btn_load_sample"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Nạp Dữ Liệu Mẫu</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu đơn gửi không? Hệ thống sẽ trống hoàn toàn.")) {
                  onClearAll();
                }
              }}
              className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1 shrink-0 border border-rose-100 hover:border-rose-200"
              id="btn_clear_all_data"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa Sạch Dữ Liệu</span>
            </button>
          </div>
        </div>

        {/* CONTROLS & FILTERS BOX */}
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 space-y-4" id="mgt_filters_box">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            
            {/* SEARCH */}
            <div className="lg:col-span-4 space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Tìm kiếm thông tin
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Mã đơn, mã KH, tên khách..."
                  value={mgtSearchText}
                  onChange={e => { setMgtSearchText(e.target.value); setMgtPage(1); }}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* DATE RANGE FILTER */}
            <div className="lg:col-span-5 space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Thời gian nhập máy
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={mgtFilterStart}
                  onChange={e => { setMgtFilterStart(e.target.value); setMgtPage(1); }}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <span className="text-slate-400 text-xs">đến</span>
                <input
                  type="date"
                  value={mgtFilterEnd}
                  onChange={e => { setMgtFilterEnd(e.target.value); setMgtPage(1); }}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* FAST SELECT PERIODS */}
            <div className="lg:col-span-3 space-y-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Chọn khoảng nhanh
              </label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={setTodayFilter}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    mgtFilterStart === new Date().toISOString().slice(0, 10) && mgtFilterEnd === new Date().toISOString().slice(0, 10)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  H.Nay
                </button>
                <button
                  onClick={setLast7DaysFilter}
                  className="py-1.5 px-1 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  7 Ngày
                </button>
                <button
                  onClick={setThisMonthFilter}
                  className="py-1.5 px-1 rounded-lg text-[10px] font-bold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  T.Này
                </button>
                <button
                  onClick={setAllFilter}
                  className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    !mgtFilterStart && !mgtFilterEnd
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tất cả
                </button>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
            {/* bưu cục filter */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 w-16">
                Bưu cục:
              </span>
              <select
                value={mgtBuuCu}
                onChange={e => { setMgtBuuCu(e.target.value); setMgtPage(1); }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">Tất cả bưu cục</option>
                <option value="BC_CAUGIAY">BC Cầu Giấy</option>
                <option value="BC_HOANKIEM">BC Hoàn Kiếm</option>
                <option value="BC_DONGDA">BC Đống Đa</option>
                <option value="BC_HAIBATRUNG">BC Hai Bà Trưng</option>
                <option value="BC_KHAC">BC Khác / Vãng Lai</option>
              </select>
            </div>

            {/* Sàn filter */}
            <div className="flex items-center gap-3 md:justify-end">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                Sàn / Kênh:
              </span>
              <select
                value={mgtSan}
                onChange={e => { setMgtSan(e.target.value); setMgtPage(1); }}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">Tất cả sàn</option>
                <option value="Shopee">Shopee</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>
          </div>
        </div>

        {/* EDIT ERROR DISPLAY */}
        {editError && (
          <div className="p-3 mb-4 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2 border border-rose-150">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{editError}</span>
            <button onClick={() => setEditError('')} className="ml-auto font-bold text-slate-400 hover:text-slate-600">×</button>
          </div>
        )}

        {/* RESULTS TABLE */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-semibold text-sm">Không tìm thấy đơn gửi nào phù hợp với điều kiện lọc.</p>
            <p className="text-slate-400 text-xs mt-1">Vui lòng kiểm tra lại khoảng thời gian chọn hoặc nạp dữ liệu mẫu để thử nghiệm.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider bg-slate-50">
                    <th className="p-3">Thời gian nhập</th>
                    <th className="p-3">Mã phiếu gửi</th>
                    <th className="p-3">Bưu cục</th>
                    <th className="p-3">Khách gửi</th>
                    <th className="p-3 text-right">Trọng lượng (g)</th>
                    <th className="p-3 text-right">Cước phí (VND)</th>
                    <th className="p-3">Sàn / Kênh</th>
                    <th className="p-3 text-center w-[120px]">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {paginatedOrders.map((order) => {
                    const isEditing = editingId === order.ma_phieugui;

                    if (isEditing && editForm) {
                      return (
                        <tr key={order.ma_phieugui} className="bg-amber-50/40">
                          {/* Time Edit */}
                          <td className="p-2">
                            <input
                              type="datetime-local"
                              value={editForm.time_nhap_may.slice(0, 16)}
                              onChange={e => setEditForm({ ...editForm, time_nhap_may: e.target.value })}
                              className="bg-white border border-slate-300 rounded-lg p-1.5 text-[11px] font-mono text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full"
                            />
                          </td>
                          {/* Code Edit */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={editForm.ma_phieugui}
                              onChange={e => setEditForm({ ...editForm, ma_phieugui: e.target.value.toUpperCase() })}
                              className="bg-white border border-slate-300 rounded-lg p-1.5 text-[11px] font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full"
                            />
                          </td>
                          {/* Post Office Edit */}
                          <td className="p-2">
                            <select
                              value={editForm.ma_buucu}
                              onChange={e => setEditForm({ ...editForm, ma_buucu: e.target.value })}
                              className="bg-white border border-slate-300 rounded-lg p-1.5 text-[11px] text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full"
                            >
                              <option value="BC_CAUGIAY">BC Cầu Giấy</option>
                              <option value="BC_HOANKIEM">BC Hoàn Kiếm</option>
                              <option value="BC_DONGDA">BC Đống Đa</option>
                              <option value="BC_HAIBATRUNG">BC Hai Bà Trưng</option>
                              <option value="BC_KHAC">BC Khác</option>
                            </select>
                          </td>
                          {/* Customer Edit */}
                          <td className="p-2 space-y-1">
                            <input
                              type="text"
                              placeholder="Tên khách"
                              value={editForm.ten_khgui}
                              onChange={e => setEditForm({ ...editForm, ten_khgui: e.target.value })}
                              className="bg-white border border-slate-300 rounded-lg p-1.5 text-[11px] text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full"
                            />
                            <input
                              type="text"
                              placeholder="Mã khách"
                              value={editForm.ma_khgui}
                              onChange={e => setEditForm({ ...editForm, ma_khgui: e.target.value })}
                              className="bg-white border border-slate-300 rounded-lg p-1 text-[10px] font-mono text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full"
                            />
                          </td>
                          {/* Weight Edit */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={editForm.trong_luong}
                              onChange={e => setEditForm({ ...editForm, trong_luong: Number(e.target.value) })}
                              className="bg-white border border-slate-300 rounded-lg p-1.5 text-[11px] font-mono text-right text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full"
                            />
                          </td>
                          {/* Fee Edit */}
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={editForm.tong_cuoc}
                              onChange={e => setEditForm({ ...editForm, tong_cuoc: Number(e.target.value) })}
                              className="bg-white border border-slate-300 rounded-lg p-1.5 text-[11px] font-mono text-right text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full"
                            />
                          </td>
                          {/* Platform Edit */}
                          <td className="p-2">
                            <select
                              value={editForm.SAN}
                              onChange={e => setEditForm({ ...editForm, SAN: e.target.value })}
                              className="bg-white border border-slate-300 rounded-lg p-1.5 text-[11px] text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-full"
                            >
                              <option value="Shopee">Shopee</option>
                              <option value="TikTok">TikTok</option>
                            </select>
                          </td>
                          {/* Save / Cancel buttons */}
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={handleSaveEdit}
                                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                                title="Lưu thay đổi"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors cursor-pointer"
                                title="Hủy bỏ"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={order.ma_phieugui} className="hover:bg-slate-50/70 transition-colors">
                        {/* Time display */}
                        <td className="p-3 text-slate-500 text-xs font-mono">
                          {order.time_nhap_may.includes('T') 
                            ? `${order.time_nhap_may.split('T')[0]} ${order.time_nhap_may.split('T')[1].slice(0, 5)}`
                            : order.time_nhap_may.slice(0, 16)
                          }
                        </td>
                        {/* ID display */}
                        <td className="p-3 font-mono font-bold text-slate-800">
                          {order.ma_phieugui}
                        </td>
                        {/* Post Office */}
                        <td className="p-3 text-slate-700 font-semibold text-xs">
                          {order.ma_buucu.replace('BC_', '')}
                        </td>
                        {/* Customer */}
                        <td className="p-3 text-slate-700">
                          <div className="font-semibold text-slate-800 text-xs">{order.ten_khgui}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{order.ma_khgui}</div>
                        </td>
                        {/* Weight */}
                        <td className="p-3 text-right text-slate-600 font-mono font-medium">
                          {formatWeight(order.trong_luong)}
                        </td>
                        {/* Fee */}
                        <td className="p-3 text-right text-indigo-600 font-bold font-mono">
                          {formatVND(order.tong_cuoc)}
                        </td>
                        {/* Platform */}
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.SAN === 'Shopee' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                            order.SAN === 'Lazada' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            order.SAN === 'TikTok' ? 'bg-slate-950 text-white' :
                            order.SAN === 'Tiki' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {order.SAN}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleStartEdit(order)}
                              className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                              title="Sửa thông tin đơn"
                              disabled={editingId !== null}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn đơn ${order.ma_phieugui} không?`)) {
                                  onDeleteOrder(order.ma_phieugui);
                                }
                              }}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Xóa đơn"
                              disabled={editingId !== null}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs text-slate-500">
              <div>
                Hiển thị <span className="font-semibold text-slate-700">{Math.min(filteredOrders.length, (currentPage - 1) * itemsPerPage + 1)}</span> đến <span className="font-semibold text-slate-700">{Math.min(filteredOrders.length, currentPage * itemsPerPage)}</span> trong tổng số <span className="font-semibold text-slate-700">{filteredOrders.length}</span> đơn gửi (Đã lọc)
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMgtPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer font-bold text-xs"
                >
                  &lt; Trước
                </button>
                <div className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 font-bold">
                  Trang {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setMgtPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer font-bold text-xs"
                >
                  Sau &gt;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
