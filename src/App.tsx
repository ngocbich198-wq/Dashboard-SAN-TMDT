import { useState, useEffect, FormEvent } from 'react';
import { Order, TabType, UserConfig, HistoryLog } from './types';
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
  ShieldAlert,
  LogOut,
  Key,
  History,
  Edit2
} from 'lucide-react';

const DEFAULT_USERS: UserConfig[] = [
  {
    id: 'admin',
    username: 'admin',
    password: 'bichv260626',
    name: 'Nguyễn Văn Admin',
    roleName: 'Quản trị viên',
    canViewDashboard: true,
    canInputData: true,
    isSystem: true
  },
  {
    id: 'manager',
    username: 'manager',
    password: '123',
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
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((u: any) => {
            let pwd = u.password || '123';
            if (u.id === 'admin' && (pwd === '123' || !pwd)) {
              pwd = 'bichv260626';
            }
            return {
              ...u,
              username: u.username || u.id,
              password: pwd
            };
          });
        }
      } catch (e) {
        // Fallback
      }
    }
    return DEFAULT_USERS;
  });

  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(() => {
    return localStorage.getItem('buucuc_logged_in_user_id') || null;
  });

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'members' | 'history'>('members');

  // Change Password Form State (outside)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // New/Edit User Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRoleName, setNewUserRoleName] = useState('');
  const [newUserCanViewDashboard, setNewUserCanViewDashboard] = useState(true);
  const [newUserCanInputData, setNewUserCanInputData] = useState(false);
  const [formError, setFormError] = useState('');

  // History Log State
  const [logs, setLogs] = useState<HistoryLog[]>(() => {
    const saved = localStorage.getItem('buucuc_change_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: 'log_seed_1',
        timestamp: '2026-06-27 08:30:15',
        userWhoChanged: 'Hệ thống',
        actionType: 'create',
        details: 'Khởi tạo hệ thống quản trị bưu cục và cấu hình tài khoản Quản trị viên mặc định (admin).'
      },
      {
        id: 'log_seed_2',
        timestamp: '2026-06-27 08:35:40',
        userWhoChanged: 'Hệ thống',
        actionType: 'create',
        details: 'Khởi tạo tài khoản Quản lý mặc định (manager) với quyền truy cập xem Dashboard.'
      }
    ];
  });

  const activeUser = users.find(u => u.id === loggedInUserId) || DEFAULT_USERS[0];

  // Load orders on mount
  useEffect(() => {
    const data = getStoredOrders();
    setOrders(data);
  }, []);

  // Save changes to users list
  useEffect(() => {
    localStorage.setItem('buucuc_users', JSON.stringify(users));
  }, [users]);

  // Save changes to logs
  useEffect(() => {
    localStorage.setItem('buucuc_change_history', JSON.stringify(logs));
  }, [logs]);

  // Save loggedInUserId to localStorage and handle tab switching safety
  useEffect(() => {
    if (loggedInUserId) {
      localStorage.setItem('buucuc_logged_in_user_id', loggedInUserId);
    } else {
      localStorage.removeItem('buucuc_logged_in_user_id');
    }
    
    if (loggedInUserId) {
      const currentActiveUser = users.find(u => u.id === loggedInUserId);
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
    }
  }, [loggedInUserId, users, activeTab]);

  // Logger helper
  const addLog = (actionType: 'create' | 'update' | 'delete' | 'login' | 'logout', details: string, performerName?: string) => {
    const now = new Date();
    const formattedDate = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0') + ' ' + 
      String(now.getHours()).padStart(2, '0') + ':' + 
      String(now.getMinutes()).padStart(2, '0') + ':' + 
      String(now.getSeconds()).padStart(2, '0');
    
    const newLog: HistoryLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: formattedDate,
      userWhoChanged: performerName || activeUser.name,
      actionType,
      details
    };

    setLogs(prev => [newLog, ...prev]);
  };

  // Handle Login submission
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername.trim()) {
      setLoginError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Vui lòng nhập mật khẩu.');
      return;
    }

    const matchedUser = users.find(u => u.username.toLowerCase() === loginUsername.trim().toLowerCase());
    if (!matchedUser) {
      setLoginError('Tên đăng nhập không tồn tại.');
      return;
    }

    // Failsafe & Self-Healing for Admin account to ensure 'bichv260626' always works
    if (matchedUser.id === 'admin' && loginPassword === 'bichv260626') {
      if (matchedUser.password !== 'bichv260626') {
        setUsersList(prev => prev.map(u => u.id === 'admin' ? { ...u, password: 'bichv260626' } : u));
        matchedUser.password = 'bichv260626';
      }
    }

    if (matchedUser.password !== loginPassword) {
      setLoginError('Mật khẩu không chính xác.');
      return;
    }

    // Success login
    setLoggedInUserId(matchedUser.id);
    addLog('login', `Đăng nhập vào hệ thống thành công`, matchedUser.name);
    
    // Auto navigation depending on permission
    if (matchedUser.canViewDashboard) {
      setActiveTab('dashboard');
    } else if (matchedUser.canInputData) {
      setActiveTab('input');
    }

    setLoginUsername('');
    setLoginPassword('');
  };

  // Handle Logout
  const handleLogout = () => {
    if (loggedInUserId) {
      addLog('logout', `Đăng xuất khỏi hệ thống`, activeUser.name);
    }
    setLoggedInUserId(null);
    setIsUserDropdownOpen(false);
  };

  // Admin Resets a User's Password
  const handleResetPassword = (userId: string) => {
    const userToReset = users.find(u => u.id === userId);
    if (!userToReset) return;

    const newPass = prompt(`Nhập mật khẩu mới cho thành viên "${userToReset.name}" (Tên đăng nhập: ${userToReset.username}):`, "123456");
    if (newPass === null) return; // User clicked Cancel

    if (!newPass.trim()) {
      alert("Mật khẩu mới không được để trống!");
      return;
    }

    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          password: newPass.trim()
        };
      }
      return u;
    }));

    addLog('update', `Admin đặt lại mật khẩu cho thành viên [${userToReset.name}] (Tên đăng nhập: ${userToReset.username})`);
    alert(`Đã đặt lại mật khẩu cho "${userToReset.name}" thành công!`);
  };

  // Handle Change Password Form Submission
  const handleChangePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (!currentPasswordInput) {
      setChangePasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!newPasswordInput) {
      setChangePasswordError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      setChangePasswordError('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    // Verify current password
    if (activeUser.password !== currentPasswordInput) {
      setChangePasswordError('Mật khẩu hiện tại không chính xác.');
      return;
    }

    // Save updated password
    setUsersList(prev => prev.map(u => {
      if (u.id === activeUser.id) {
        return {
          ...u,
          password: newPasswordInput.trim()
        };
      }
      return u;
    }));

    addLog('update', `Đổi mật khẩu tài khoản cá nhân thành công`);
    setChangePasswordSuccess('Đổi mật khẩu thành công!');
    
    // Clear inputs
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmNewPasswordInput('');

    // Close modal after a delay
    setTimeout(() => {
      setIsChangePasswordOpen(false);
      setChangePasswordSuccess('');
    }, 1500);
  };

  // Prepare fields for user edit
  const handleEditClick = (u: UserConfig) => {
    setEditingUserId(u.id);
    setNewUserName(u.name);
    setNewUserUsername(u.username);
    setNewUserPassword(u.password || '');
    setNewUserRoleName(u.roleName);
    setNewUserCanViewDashboard(u.canViewDashboard);
    setNewUserCanInputData(u.canInputData);
    setFormError('');
  };

  // Reset form fields
  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserRoleName('');
    setNewUserCanViewDashboard(true);
    setNewUserCanInputData(false);
    setFormError('');
  };

  // Handle adding or updating user inside form
  const handleAddUser = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newUserName.trim()) {
      setFormError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!newUserUsername.trim()) {
      setFormError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!newUserPassword.trim()) {
      setFormError('Vui lòng nhập mật khẩu.');
      return;
    }
    if (!newUserRoleName.trim()) {
      setFormError('Vui lòng nhập chức vụ.');
      return;
    }

    if (editingUserId) {
      // Check duplicate usernames
      const duplicate = users.find(u => u.id !== editingUserId && u.username.toLowerCase() === newUserUsername.trim().toLowerCase());
      if (duplicate) {
        setFormError('Tên đăng nhập này đã tồn tại ở thành viên khác.');
        return;
      }

      const originalUser = users.find(u => u.id === editingUserId);
      if (!originalUser) return;

      const updated = users.map(u => {
        if (u.id === editingUserId) {
          return {
            ...u,
            name: newUserName.trim(),
            username: newUserUsername.trim(),
            password: newUserPassword.trim(),
            roleName: newUserRoleName.trim(),
            canViewDashboard: newUserCanViewDashboard,
            canInputData: newUserCanInputData
          };
        }
        return u;
      });

      setUsersList(updated);

      // Auditing details
      const changes: string[] = [];
      if (originalUser.name !== newUserName.trim()) changes.push(`Họ tên: '${originalUser.name}' ➔ '${newUserName.trim()}'`);
      if (originalUser.username !== newUserUsername.trim()) changes.push(`Tên đăng nhập: '${originalUser.username}' ➔ '${newUserUsername.trim()}'`);
      if (originalUser.password !== newUserPassword.trim()) changes.push(`Mật khẩu đã thay đổi`);
      if (originalUser.roleName !== newUserRoleName.trim()) changes.push(`Chức vụ: '${originalUser.roleName}' ➔ '${newUserRoleName.trim()}'`);
      if (originalUser.canViewDashboard !== newUserCanViewDashboard) changes.push(`Quyền xem báo cáo: ${newUserCanViewDashboard ? 'Cấp quyền' : 'Hủy quyền'}`);
      if (originalUser.canInputData !== newUserCanInputData) changes.push(`Quyền nhập liệu: ${newUserCanInputData ? 'Cấp quyền' : 'Hủy quyền'}`);

      const details = changes.length > 0 
        ? `Sửa tài khoản thành viên [${originalUser.name}]: ${changes.join(', ')}`
        : `Lưu thông tin thành viên [${originalUser.name}] không thay đổi trường nào`;

      addLog('update', details);
      handleCancelEdit();

    } else {
      // Check duplicate username
      const duplicate = users.find(u => u.username.toLowerCase() === newUserUsername.trim().toLowerCase());
      if (duplicate) {
        setFormError('Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác.');
        return;
      }

      const newUser: UserConfig = {
        id: 'user_' + Date.now(),
        name: newUserName.trim(),
        username: newUserUsername.trim(),
        password: newUserPassword.trim(),
        roleName: newUserRoleName.trim(),
        canViewDashboard: newUserCanViewDashboard,
        canInputData: newUserCanInputData
      };

      setUsersList(prev => [...prev, newUser]);
      addLog('create', `Thêm thành viên mới [${newUser.name}] (Tên đăng nhập: ${newUser.username}, Chức vụ: ${newUser.roleName}, Báo cáo: ${newUser.canViewDashboard ? 'Có' : 'Không'}, Nhập liệu: ${newUser.canInputData ? 'Có' : 'Không'})`);
      
      // Reset State
      setNewUserName('');
      setNewUserUsername('');
      setNewUserPassword('');
      setNewUserRoleName('');
      setNewUserCanViewDashboard(true);
      setNewUserCanInputData(false);
    }
  };

  // Delete a user and record details
  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.isSystem) {
      alert('Không thể xóa tài khoản hệ thống mặc định!');
      return;
    }

    if (userId === loggedInUserId) {
      alert('Không thể xóa tài khoản hiện đang đăng nhập!');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản "${userToDelete.name}" không?`)) {
      setUsersList(prev => prev.filter(u => u.id !== userId));
      addLog('delete', `Xóa tài khoản thành viên [${userToDelete.name}] (Tên đăng nhập: ${userToDelete.username}, Chức vụ: ${userToDelete.roleName})`);
      
      // If we are currently editing this user, cancel the editing state
      if (editingUserId === userId) {
        handleCancelEdit();
      }
    }
  };

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

  // If user is not logged in, render LoginPage overlay
  if (loggedInUserId === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none selection:bg-indigo-100 selection:text-indigo-900" id="login_page">
        {/* Ambient background blur circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-pulse duration-5000" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none animate-pulse duration-3000" />

        <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-xl p-8 relative z-10 animate-fade-in">
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 mb-4 ring-4 ring-indigo-50">
              <Database className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              DASHBOARD SÀN TMĐT
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập..."
                  className="w-full text-xs pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full text-xs pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs mt-6 duration-200"
            >
              <Lock className="w-4 h-4" />
              <span>Đăng nhập hệ thống</span>
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-400 font-medium">
          &copy; 2026 Hệ Thống Portal Sàn TMĐT &bull; Phiên bản bảo mật 1.3.0
        </div>
      </div>
    );
  }

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
                  DASHBOARD SÀN TMĐT
                </h1>
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
              
              {/* ACTIVE USER DROPDOWN */}
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
                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Đang đăng nhập</p>
                      </div>
                      
                      <div className="px-4 py-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-xs">
                            {activeUser.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-800">{activeUser.name}</p>
                            <p className="text-[10px] text-slate-400">{activeUser.roleName}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-1.5 mt-1 px-2 space-y-1">
                        {activeUser.id === 'admin' && (
                          <>
                            <button
                              onClick={() => {
                                setModalTab('members');
                                setIsUserModalOpen(true);
                                setIsUserDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                            >
                              <Users className="w-4 h-4 text-slate-500" />
                              <span>Quản lý phân quyền</span>
                            </button>

                            <button
                              onClick={() => {
                                setModalTab('history');
                                setIsUserModalOpen(true);
                                setIsUserDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                            >
                              <History className="w-4 h-4 text-slate-500" />
                              <span>Lịch sử thay đổi</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            setIsChangePasswordOpen(true);
                            setIsUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                        >
                          <Key className="w-4 h-4 text-slate-500" />
                          <span>Đổi mật khẩu</span>
                        </button>

                        <div className="border-t border-slate-100 my-1 pt-1.5">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Đăng xuất</span>
                          </button>
                        </div>
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
              {activeUser.id === 'admin' ? (
                <button
                  onClick={() => {
                    setModalTab('members');
                    setIsUserModalOpen(true);
                  }}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Cấp quyền / Quản lý tài khoản
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="mt-6 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất & Đổi tài khoản
                </button>
              )}
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
                } else if (activeUser.id === 'admin') {
                  setModalTab('members');
                  setIsUserModalOpen(true);
                } else {
                  handleLogout();
                }
              }}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {activeUser.canViewDashboard ? 'Quay lại Dashboard' : (activeUser.id === 'admin' ? 'Quản lý tài khoản' : 'Đăng xuất / Đổi tài khoản')}
            </button>
          </div>
        )}
      </main>

      {/* USER MANAGEMENT MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="user_modal">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-slate-100 shadow-2xl flex flex-col scale-100 transition-transform">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Quản Lý Phân Quyền & Hệ Thống</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Tạo tài khoản, phân quyền, quản trị và tra cứu lịch sử thay đổi</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  handleCancelEdit();
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 border-b border-slate-100 bg-slate-50/50 flex gap-4">
              <button
                onClick={() => setModalTab('members')}
                className={`py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  modalTab === 'members'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Thành viên & Phân quyền
              </button>
              <button
                onClick={() => setModalTab('history')}
                className={`py-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  modalTab === 'history'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Lịch sử thay đổi
              </button>
            </div>

            {/* Modal Body */}
            {modalTab === 'members' ? (
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Form - Left (md:col-span-5) */}
                <div className="md:col-span-5 space-y-6 border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-8">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    <span>{editingUserId ? 'Sửa thông tin thành viên' : 'Thêm thành viên mới'}</span>
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

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Tên đăng nhập</label>
                        <input
                          type="text"
                          value={newUserUsername}
                          onChange={(e) => setNewUserUsername(e.target.value)}
                          placeholder="Tên đăng nhập"
                          className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600">Mật khẩu</label>
                        <input
                          type="text"
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="Mật khẩu"
                          className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium font-mono"
                        />
                      </div>
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

                    <div className="flex gap-2">
                      {editingUserId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer"
                        >
                          Hủy sửa
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {editingUserId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{editingUserId ? 'Lưu thay đổi' : 'Thêm thành viên'}</span>
                      </button>
                    </div>
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

                  <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto pr-2 space-y-2">
                    {users.map((u) => {
                      const isSelf = u.id === loggedInUserId;
                      return (
                        <div 
                          key={u.id} 
                          className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                            isSelf 
                              ? 'bg-indigo-50/20 border-indigo-100/80 shadow-xs' 
                              : 'bg-white border-slate-100 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
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
                              <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                {u.roleName} &bull; <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600 text-[9px]">{u.username}</span> / <span className="font-mono text-slate-400">{u.password}</span>
                              </p>
                              
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

                          <div className="flex items-center gap-1.5 shrink-0 ml-4">
                            {!isSelf && (
                              <button
                                onClick={() => handleResetPassword(u.id)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Đặt lại mật khẩu"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(u)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Sửa quyền & thông tin"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!u.isSystem && !isSelf && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa thành viên"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <History className="w-4 h-4 text-indigo-600" />
                    <span>Nhật ký hoạt động & Thay đổi quyền ({logs.length})</span>
                  </div>
                  {logs.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa sạch toàn bộ lịch sử thay đổi không?')) {
                          setLogs([]);
                        }
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Xóa lịch sử
                    </button>
                  )}
                </div>

                {logs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    Chưa có lịch sử thay đổi nào được ghi lại.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto pr-2 space-y-2">
                    {logs.map((log) => {
                      let badgeBg = 'bg-slate-50 text-slate-600';
                      if (log.actionType === 'create') badgeBg = 'bg-indigo-50 text-indigo-700';
                      if (log.actionType === 'update') badgeBg = 'bg-amber-50 text-amber-700';
                      if (log.actionType === 'delete') badgeBg = 'bg-rose-50 text-rose-700';
                      if (log.actionType === 'login') badgeBg = 'bg-emerald-50 text-emerald-700';
                      if (log.actionType === 'logout') badgeBg = 'bg-slate-100 text-slate-700';

                      return (
                        <div key={log.id} className="p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                              {log.details}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span className="font-bold text-slate-500">{log.userWhoChanged}</span>
                              <span>&bull;</span>
                              <span className="font-mono font-semibold">{log.timestamp}</span>
                            </div>
                          </div>

                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shrink-0 text-center ${badgeBg}`}>
                            {log.actionType === 'create' && 'Tạo mới'}
                            {log.actionType === 'update' && 'Cập nhật'}
                            {log.actionType === 'delete' && 'Xóa bỏ'}
                            {log.actionType === 'login' && 'Đăng nhập'}
                            {log.actionType === 'logout' && 'Đăng xuất'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  handleCancelEdit();
                }}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" id="change_password_modal">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden border border-slate-100 shadow-2xl flex flex-col scale-100 transition-transform">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base">Đổi Mật Khẩu Cá Nhân</h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">Thay đổi mật khẩu đăng nhập tài khoản của bạn</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setChangePasswordError('');
                  setChangePasswordSuccess('');
                  setCurrentPasswordInput('');
                  setNewPasswordInput('');
                  setConfirmNewPasswordInput('');
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4">
              {changePasswordError && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{changePasswordError}</span>
                </div>
              )}

              {changePasswordSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{changePasswordSuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmNewPasswordInput}
                  onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới..."
                  className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setChangePasswordError('');
                    setChangePasswordSuccess('');
                    setCurrentPasswordInput('');
                    setNewPasswordInput('');
                    setConfirmNewPasswordInput('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer text-center"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác nhận đổi</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* FOOTER METADATA */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            &copy; 2026 Hệ Thống Portal Sàn TMĐT. All rights reserved.
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Phiên bản: 1.3.0</span>
            <span>&bull;</span>
            <span>Trạng thái: Bảo mật cao</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

