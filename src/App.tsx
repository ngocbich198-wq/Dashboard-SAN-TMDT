import { useState, useEffect, FormEvent } from 'react';
import { Order, TabType, UserConfig } from './types';
import { getStoredOrders, saveOrders, SAMPLE_ORDERS } from './sampleData';
import InputTab from './components/InputTab';
import DashboardTab from './components/DashboardTab';
import { 
  BarChart4, 
  FolderPlus, 
  Database, 
  Settings2,
  GitCommit,
  UserCheck,
  Shield,
  User,
  Lock,
  Users,
  UserPlus,
  Trash2,
  Plus,
  Check,
  ChevronDown,
  X,
  ShieldAlert
} from 'lucide-react';

const DEFAULT_USERS: UserConfig[] = [
  {
    id: 'admin',
    name: 'Nguyễn Văn Admin',
    roleName: 'Quản trị viên',
    canViewDashboard: true,
    canInputData: true,
    isSystem: true
  },
  {
    id: 'manager',
    name: 'Trần Thị Manager',
    roleName: 'Quản lý',
    canViewDashboard: true,
    canInputData: false,
    isSystem: true
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard'); // Start on Dashboard
  const [orders, setOrders] = useState<Order[]>([]);
  
  // User Management State
  const [users, setUsersList] = useState<UserConfig[]>(() => {
    const saved = localStorage.getItem('buucuc_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_USERS;
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return localStorage.getItem('buucuc_active_user_id') || 'admin';
  });

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserRoleName, setNewUserRoleName] = useState('');
  const [newUserCanViewDashboard, setNewUserCanViewDashboard] = useState(true);
  const [newUserCanInputData, setNewUserCanInputData] = useState(false);
  const [formError, setFormError] = useState('');

  const activeUser = users.find(u => u.id === activeUserId) || users[0] || DEFAULT_USERS[0];

  // Load orders on mount
  useEffect(() => {
    const data = getStoredOrders();
    setOrders(data);
  }, []);

  // Save changes to users list
  useEffect(() => {
    localStorage.setItem('buucuc_users', JSON.stringify(users));
  }, [users]);

  // Save active user ID to localStorage
  useEffect(() => {
    localStorage.setItem('buucuc_active_user_id', activeUserId);
    
    // Automatically switch tabs if active tab is no longer permitted
    const currentActiveUser = users.find(u => u.id === activeUserId);
    if (currentActiveUser) {
      if (!currentActiveUser.canViewDashboard && activeTab === 'dashboard') {
        if (currentActiveUser.canInputData) {
          setActiveTab('input');
        }
      } else if (!currentActiveUser.canInputData && activeTab === 'input') {
        if (currentActiveUser.canViewDashboard) {
          setActiveTab('dashboard');
        }
      }
    }
  }, [activeUserId, users, activeTab]);

  // Handle switching active user
  const handleUserSelect = (userId: string) => {
    setActiveUserId(userId);
    setIsUserDropdownOpen(false);
  };

  // Add a new user
  const handleAddUser = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newUserName.trim()) {
      setFormError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!newUserRoleName.trim()) {
      setFormError('Vui lòng nhập chức vụ.');
      return;
    }

    const newUser: UserConfig = {
      id: 'user_' + Date.now(),
      name: newUserName.trim(),
      roleName: newUserRoleName.trim(),
      canViewDashboard: newUserCanViewDashboard,
      canInputData: newUserCanInputData
    };

    setUsersList(prev => [...prev, newUser]);
    
    // Reset form
    setNewUserName('');
    setNewUserRoleName('');
    setNewUserCanViewDashboard(true);
    setNewUserCanInputData(false);
  };

  // Delete a user
  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.isSystem) {
      alert('Không thể xóa tài khoản hệ thống mặc định!');
      return;
    }

    if (userId === activeUserId) {
      alert('Không thể xóa tài khoản hiện đang đăng nhập!');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userToDelete.name}" không?`)) {
      setUsersList(prev => prev.filter(u => u.id !== userId));
    }
  };

  // Sync to localStorage
  const handleAddOrders = (newOrders: Order[]) => {
    const updated = [...orders, ...newOrders];
    setOrders(updated);
    saveOrders(updated);
  };

  const handleDeleteOrder = (maPhieuGui: string) => {
    const updated = orders.filter(o => o.ma_phieugui.toLowerCase() !== maPhieuGui.toLowerCase());
    setOrders(updated);
    saveOrders(updated);
  };

  const handleUpdateOrder = (oldMaPhieuGui: string, updatedOrder: Order) => {
    const updated = orders.map(o => o.ma_phieugui.toLowerCase() === oldMaPhieuGui.toLowerCase() ? updatedOrder : o);
    setOrders(updated);
    saveOrders(updated);
  };

  const handleClearAll = () => {
    setOrders([]);
    saveOrders([]);
  };

  const handleLoadSample = () => {
    setOrders(SAMPLE_ORDERS);
    saveOrders(SAMPLE_ORDERS);
  };


  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900" id="app_root">
      
      {/* GLOBAL TOP NAVIGATION HEADER */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 z-50 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            
            {/* LOGO */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">
                  Bưu Cục Logistics
                </h1>
                <p className="text-[10px] text-indigo-600 font-mono font-bold tracking-widest">
                  PORTAL QUẢN TRỊ
                </p>
              </div>
            </div>

            {/* TAB SELECTORS */}
            <nav className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {activeUser.canViewDashboard ? (
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'dashboard' 
                      ? 'bg-white text-indigo-600 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  id="tab_trigger_dashboard"
                >
                  <BarChart4 className="w-4 h-4" />
                  <span>Trang Dashboard</span>
                </button>
              ) : (
                <button
                  disabled
                  title="Tài khoản không có quyền xem dashboard"
                  className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg text-slate-400 cursor-not-allowed opacity-50"
                  id="tab_trigger_dashboard_disabled"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>
              )}

              {activeUser.canInputData ? (
                <button
                  onClick={() => setActiveTab('input')}
                  className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'input' 
                      ? 'bg-white text-indigo-600 shadow-xs' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  id="tab_trigger_input"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>Nhập Dữ Liệu</span>
                </button>
              ) : (
                <button
                  disabled
                  title="Tài khoản không có quyền nhập dữ liệu"
                  className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg text-slate-400 cursor-not-allowed opacity-50"
                  id="tab_trigger_input_disabled"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Nhập Dữ Liệu</span>
                </button>
              )}
            </nav>

            {/* HEADER METRICS & DYNAMIC USER DROP-DOWN */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <div className="hidden lg:flex items-center gap-1.5 border-r border-slate-200 pr-4">
                <GitCommit className="w-4 h-4 text-emerald-500" />
                <span>Hệ thống: <strong className="text-slate-700 font-mono font-bold">LIVE</strong></span>
              </div>
              
              {/* DYNAMIC USER SELECTOR DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl border border-slate-200/60 transition-all cursor-pointer text-slate-700"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                    {activeUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-extrabold text-[11px] leading-tight text-slate-800">{activeUser.name}</div>
                    <div className="text-[9px] text-slate-400 font-semibold leading-none mt-0.5">{activeUser.roleName}</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isUserDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl py-2 z-20 animate-fade-in origin-top-right">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Người dùng hoạt động</p>
                      </div>
                      
                      <div className="max-h-60 overflow-y-auto">
                        {users.map(u => (
                          <button
                            key={u.id}
                            onClick={() => handleUserSelect(u.id)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-extrabold text-xs">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-700">{u.name}</p>
                                <p className="text-[10px] text-slate-400">{u.roleName}</p>
                              </div>
                            </div>
                            {u.id === activeUserId && (
                              <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 pt-1.5 mt-1 px-2">
                        <button
                          onClick={() => {
                            setIsUserModalOpen(true);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Users className="w-4 h-4" />
                          <span>Quản lý phân quyền</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* CORE VIEWPORT STAGE */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          activeUser.canViewDashboard ? (
            <DashboardTab orders={orders} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs flex flex-col items-center justify-center max-w-md mx-auto my-12 animate-fade-in">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-800">Truy cập bị từ chối</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Tài khoản **{activeUser.name}** không được cấp quyền xem dữ liệu báo cáo Dashboard.
              </p>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Cấp quyền / Đổi tài khoản
              </button>
            </div>
          )
        ) : activeUser.canInputData ? (
          <InputTab 
            orders={orders} 
            onAddOrders={handleAddOrders} 
            onClearAll={handleClearAll}
            onDeleteOrder={handleDeleteOrder}
            onUpdateOrder={handleUpdateOrder}
            onLoadSample={handleLoadSample}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs flex flex-col items-center justify-center max-w-md mx-auto my-12 animate-fade-in">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-4 border border-rose-100">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-800">Truy cập bị từ chối</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Tài khoản **{activeUser.name}** không được cấp quyền nhập liệu bưu cục.
            </p>
            <button
              onClick={() => {
                if (activeUser.canViewDashboard) {
                  setActiveTab('dashboard');
                } else {
                  setIsUserModalOpen(true);
                }
              }}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {activeUser.canViewDashboard ? 'Quay lại Dashboard' : 'Đổi tài khoản'}
            </button>
          </div>
        )}
      </main>

      {/* USER MANAGEMENT MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="user_modal">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-100 shadow-2xl flex flex-col scale-100 transition-transform">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Quản Lý Phân Quyền Thành Viên</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Tạo tài khoản và cấp quyền xem Dashboard hoặc Nhập dữ liệu bưu cục</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  setFormError('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Form - Left (md:col-span-5) */}
              <div className="md:col-span-5 space-y-6 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-8">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  <span>Thêm thành viên mới</span>
                </div>

                <form onSubmit={handleAddUser} className="space-y-4">
                  {formError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Họ và Tên</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600">Chức vụ / Phòng ban</label>
                    <input
                      type="text"
                      value={newUserRoleName}
                      onChange={(e) => setNewUserRoleName(e.target.value)}
                      placeholder="Ví dụ: Kế toán, Nhân viên bưu cục..."
                      className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-xs font-bold text-slate-600 block">Cấp quyền truy cập</label>
                    
                    {/* Checkbox Dashboard */}
                    <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      newUserCanViewDashboard 
                        ? 'bg-indigo-50/40 border-indigo-200' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={newUserCanViewDashboard}
                        onChange={(e) => setNewUserCanViewDashboard(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Quyền xem Dashboard</div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Cho phép xem phân tích báo cáo cước, biểu đồ, bưu cục.</p>
                      </div>
                    </label>

                    {/* Checkbox Input */}
                    <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      newUserCanInputData 
                        ? 'bg-indigo-50/40 border-indigo-200' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/50'
                    }`}>
                      <input
                        type="checkbox"
                        checked={newUserCanInputData}
                        onChange={(e) => setNewUserCanInputData(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer w-4 h-4"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Quyền nhập dữ liệu</div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Cho phép tải lên file excel, nhập phiếu, sửa xóa đơn hàng.</p>
                      </div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm thành viên</span>
                  </button>
                </form>
              </div>

              {/* User list - Right (md:col-span-7) */}
              <div className="md:col-span-7 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Danh sách thành viên ({users.length})</span>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">
                    Hoạt động
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-2 space-y-2">
                  {users.map((u) => {
                    const isSelf = u.id === activeUserId;
                    return (
                      <div 
                        key={u.id} 
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isSelf 
                            ? 'bg-indigo-50/20 border-indigo-100/80' 
                            : 'bg-white border-slate-100 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-800">{u.name}</span>
                              {isSelf && (
                                <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm">
                                  Bạn
                                </span>
                              )}
                              {u.isSystem && (
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm" title="Tài khoản mặc định">
                                  Hệ thống
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{u.roleName}</p>
                            
                            {/* Permissions Badges */}
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {u.canViewDashboard && (
                                <span className="text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">
                                  Xem Dashboard
                                </span>
                              )}
                              {u.canInputData && (
                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md">
                                  Nhập Dữ Liệu
                                </span>
                              )}
                              {!u.canViewDashboard && !u.canInputData && (
                                <span className="text-[9px] font-bold bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> Không có quyền
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {!u.isSystem && !isSelf && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa thành viên"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  setFormError('');
                }}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-5 rounded-xl transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FOOTER METADATA */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            &copy; 2026 Hệ Thống Báo Cáo Đơn Gửi Logistics. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Phiên bản: 1.2.0</span>
            <span>&bull;</span>
            <span>Trạng thái: Ổn định</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

