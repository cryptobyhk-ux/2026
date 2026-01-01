import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Search, 
  Bell, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Download, 
  Copy, 
  LogOut,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Menu,
  X,
  Gem, 
  Minus,
  Settings,
  CreditCard,
  Hash,
  Clock,
  Cloud,
  CloudOff
} from 'lucide-react';

// --- CONFIGURATION ---
// IMPORTANT: Yahan apna Google Web App URL paste karein
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbxsqRSq7ljH_B3B2_tSuyE0abLeMwXqs9hGqy1V00g93sRJfwAz7ST6nYuDEAqDqmSlDQ/exec"; 

// --- CONSTANTS ---
const PLAN_PRICES = {
  'Premium': 20,
  'Platinum': 60,
  'Diamond': 100
};

// --- HELPER FUNCTIONS ---

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return isNaN(date) ? dateStr : date.toLocaleDateString('en-GB'); 
};

const parseDate = (input) => {
  if (!input) return new Date();
  const parts = input.split(/[-/]/);
  if (parts[0].length === 4) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

const getStatus = (endDateStr) => {
  if (!endDateStr) return { status: 'N/A', days: 0, color: 'text-slate-400 bg-slate-100', icon: <Minus size={16}/> };
  
  const end = parseDate(endDateStr);
  const now = new Date();
  now.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  
  const diffTime = end - now;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) return { status: 'Expired', days, color: 'text-red-600 bg-red-50', icon: <XCircle size={16}/> };
  if (days <= 3) return { status: 'Expiring Soon', days, color: 'text-amber-600 bg-amber-50', icon: <AlertTriangle size={16}/> };
  return { status: 'Active', days, color: 'text-green-600 bg-green-50', icon: <CheckCircle size={16}/> };
};

// PNG Invoice Generator
const downloadInvoicePNG = (user) => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#4F46E5'; 
  ctx.fillRect(0, 0, canvas.width, 120);
  
  ctx.fillStyle = 'white';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('INVOICE', 50, 75);
  ctx.font = '18px sans-serif';
  ctx.fillText(`Receipt #${Math.floor(Math.random() * 10000)}`, 50, 100);
  
  ctx.textAlign = 'right';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('Inspired Analyst', 750, 70);
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#e0e7ff';
  ctx.fillText('Subscription Services', 750, 95);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b'; 
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('BILL TO', 50, 180);
  
  // Handle custom sheet user display
  const name = user.username || (Object.keys(user).find(k => k !== 'id') ? user[Object.keys(user).find(k => k !== 'id')] : 'Valued Customer');

  ctx.fillStyle = '#1e293b'; 
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(name, 50, 210);
  
  ctx.fillStyle = '#475569';
  ctx.font = '16px sans-serif';
  if(user.discordId) ctx.fillText(`Discord: ${user.discordId}`, 50, 235);
  if(user.txid) ctx.fillText(`TxID: ${user.txid}`, 50, 260);

  ctx.beginPath();
  ctx.moveTo(50, 300);
  ctx.lineTo(750, 300);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('DESCRIPTION', 50, 330);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', 750, 330);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`${user.plan || 'Custom'} Plan`, 50, 370);
  
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#64748b';
  if (user.startDate && user.endDate) {
      ctx.fillText(`Valid from ${formatDate(user.startDate)} to ${formatDate(user.endDate)}`, 50, 395);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(user.amount ? formatCurrency(user.amount) : '-', 750, 370);

  ctx.beginPath();
  ctx.moveTo(50, 440);
  ctx.lineTo(750, 440);
  ctx.stroke();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#4F46E5';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(user.amount ? formatCurrency(user.amount) : '-', 750, 490);
  ctx.fillStyle = '#64748b';
  ctx.font = '16px sans-serif';
  ctx.fillText('Total Paid', 750, 455);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.fillText('Thank you for choosing Inspired Analyst!', 400, 560);

  const link = document.createElement('a');
  link.download = `Invoice.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

// --- COMPONENTS ---

const LoginScreen = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-indigo-600 p-3 rounded-full text-white">
            <Users size={32} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
        <p className="text-slate-500 mb-6">Inspired Analyst Dashboard</p>
        <input
          type="password"
          maxLength="4"
          className="w-full text-center text-3xl tracking-widest py-3 border-2 border-slate-200 rounded-xl focus:border-indigo-600 focus:outline-none mb-4 transition-all"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <button 
          onClick={() => pin === '1288' ? onLogin() : alert('Incorrect PIN')}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Access Dashboard
        </button>
      </div>
    </div>
  );
};

const UserDetailsModal = ({ user, onClose, onRenew, onDelete, isDefault }) => {
  if (!user) return null;
  const { status, days, color, icon } = getStatus(user.endDate);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className={`p-6 pb-8 ${isDefault ? (status === 'Active' ? 'bg-green-50' : status === 'Expired' ? 'bg-red-50' : 'bg-amber-50') : 'bg-indigo-50'} relative`}>
           <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white/50 p-1 rounded-full"><X size={20}/></button>
           
           <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold shadow-sm mb-3 text-slate-700">
                {(user.username || Object.values(user)[1] || 'U').charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{user.username || Object.values(user)[1]}</h2>
              
              {isDefault && (
                <>
                  <p className="text-sm text-slate-500 mb-2">{user.discordId}</p>
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-white ${color}`}>
                      {icon} {status} ({days} days left)
                  </span>
                </>
              )}
           </div>
        </div>

        {/* Details Body */}
        <div className="p-6 space-y-4">
           {/* Only show strict details for Default sheets */}
           {isDefault ? (
             <>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-2 text-xs text-slate-400 uppercase font-bold mb-1"><Gem size={12}/> Plan</div>
                     <div className="font-semibold text-slate-800">{user.plan}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-2 text-xs text-slate-400 uppercase font-bold mb-1"><CreditCard size={12}/> Amount</div>
                     <div className="font-semibold text-slate-800">{formatCurrency(user.amount)}</div>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                     <span className="text-sm text-slate-500 flex items-center gap-2"><Calendar size={14}/> Start Date</span>
                     <span className="text-sm font-medium text-slate-800">{formatDate(user.startDate)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                     <span className="text-sm text-slate-500 flex items-center gap-2"><Clock size={14}/> End Date</span>
                     <span className={`text-sm font-bold ${status === 'Expired' ? 'text-red-600' : 'text-slate-800'}`}>{formatDate(user.endDate)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                     <span className="text-sm text-slate-500 flex items-center gap-2"><Hash size={14}/> TxID</span>
                     <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{user.txid || 'N/A'}</span>
                  </div>
               </div>
             </>
           ) : (
             // Custom Sheet Details
             <div className="space-y-3">
                {Object.entries(user).map(([key, val]) => {
                  if(key === 'id') return null;
                  return (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-slate-100">
                       <span className="text-sm text-slate-500 font-medium capitalize">{key}</span>
                       <span className="text-sm font-bold text-slate-800">{val}</span>
                    </div>
                  )
                })}
             </div>
           )}

           {/* Actions */}
           <div className="flex flex-col gap-2 pt-2">
              <button onClick={() => downloadInvoicePNG(user)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all">
                 <Download size={18}/> Download Invoice (PNG)
              </button>
              <div className="flex gap-2">
                 {isDefault && (
                   <button onClick={() => onRenew(user.id)} className="flex-1 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-semibold transition-colors">Renew (+1M)</button>
                 )}
                 <button onClick={() => onDelete(user.id)} className={`flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors ${!isDefault ? 'w-full' : ''}`}>Delete</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSheet, setActiveSheet] = useState('Dec 2025');
  const [sheetsList, setSheetsList] = useState(['Dec 2025']);
  const [sheetMenuOpen, setSheetMenuOpen] = useState(false);
  const [sheetConfig, setSheetConfig] = useState({ type: 'default', columns: [] });
  
  const [users, setUsers] = useState([]);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); 
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewSheetModal, setShowNewSheetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [newUser, setNewUser] = useState({});
  const [defaultUserForm, setDefaultUserForm] = useState({ 
    discordId: '', txid: '', plan: 'Premium', amount: 20, startDate: '', months: 1 
  });

  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetType, setNewSheetType] = useState('default'); 
  const [customColumns, setCustomColumns] = useState(['']); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('isAuth') === 'true') {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isAuthenticated) {
      fetchSheetsList(); 
      fetchData(); 
      interval = setInterval(() => { fetchData(true); }, 15000);
    }
    return () => clearInterval(interval);
  }, [isAuthenticated, activeSheet]);

  const fetchSheetsList = async () => {
    if (GOOGLE_API_URL && GOOGLE_API_URL !== "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        try {
            const response = await fetch(`${GOOGLE_API_URL}?action=getSheets&t=${Date.now()}`);
            const data = await response.json();
            if (data.sheets && Array.isArray(data.sheets)) {
                setSheetsList(data.sheets);
            }
        } catch (e) { console.error("Sheet List Fetch Failed", e); }
    }
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setIsSyncing(true);
    
    const configStr = localStorage.getItem(`sheet_config_${activeSheet}`);
    if (configStr) setSheetConfig(JSON.parse(configStr));
    else setSheetConfig({ type: 'default', columns: [] });

    if (GOOGLE_API_URL && GOOGLE_API_URL !== "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
      try {
        const response = await fetch(`${GOOGLE_API_URL}?action=getUsers&sheet=${activeSheet}&t=${Date.now()}`);
        const data = await response.json();
        setUsers(data.users);
        setIsCloudConnected(true);
        setLastUpdated(new Date());
      } catch (e) { 
        console.error("Cloud Fetch Failed", e); 
        setIsCloudConnected(false);
      }
    } else {
      setIsCloudConnected(true); 
      if(!silent) setUsers([]); 
    }
    if (!silent) setLoading(false);
    if (silent) setIsSyncing(false);
  };

  const saveData = async (newUsersList) => {
    setUsers(newUsersList);
    
    if (GOOGLE_API_URL && GOOGLE_API_URL !== "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        setIsSyncing(true);
        let headers = [];
        let keys = [];

        if (sheetConfig.type === 'default') {
            headers = ['ID', 'Tier', 'Username', 'Discord ID', 'Start Date', 'End Date', 'TxID', 'Amount'];
            keys = ['id', 'plan', 'username', 'discordId', 'startDate', 'endDate', 'txid', 'amount'];
        } else {
            // For Custom Sheet: ONLY send custom columns, NO DATES
            headers = ['ID', ...sheetConfig.columns];
            keys = ['id', ...sheetConfig.columns];
        }

        try {
            await fetch(GOOGLE_API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'saveData',
                    sheetName: activeSheet,
                    users: newUsersList,
                    headers: headers,
                    keys: keys
                })
            });
            setIsCloudConnected(true);
            setLastUpdated(new Date());
        } catch (e) { 
            console.error("Cloud Save failed", e); 
            setIsCloudConnected(false);
            alert("Failed to save to Google Sheets!");
        }
        setIsSyncing(false);
    }
  };

  const handleLogin = () => {
    localStorage.setItem('isAuth', 'true');
    setIsAuthenticated(true);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuth');
    setIsAuthenticated(false);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    let userObj = { id: Math.random().toString(36).substr(2, 9) };

    if (sheetConfig.type === 'default') {
        const start = new Date(defaultUserForm.startDate);
        const months = parseInt(defaultUserForm.months);
        const end = new Date(start);
        end.setMonth(end.getMonth() + months);
        
        const finalForm = { ...defaultUserForm, username: defaultUserForm.discordId };
        userObj = { ...userObj, ...finalForm, endDate: end.toISOString().split('T')[0] };
    } else {
        // Custom Sheet - Direct data mapping, no dates
        userObj = { ...userObj, ...newUser };
    }

    saveData([...users, userObj]);
    setShowAddModal(false);
    setDefaultUserForm({ username: '', discordId: '', txid: '', plan: 'Premium', amount: 20, startDate: '', months: 1 });
    setNewUser({});
  };

  const renewSubscription = (userId) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const currentEnd = new Date(u.endDate);
        currentEnd.setMonth(currentEnd.getMonth() + 1);
        return { ...u, endDate: currentEnd.toISOString().split('T')[0] };
      }
      return u;
    });
    saveData(updatedUsers);
    setSelectedUser(null); 
  };

  const deleteUser = (userId) => {
    if(confirm('Are you sure?')) {
      saveData(users.filter(u => u.id !== userId));
      setSelectedUser(null); 
    }
  };

  const handleCreateSheet = (e) => {
    e.preventDefault();
    if(newSheetName) {
      const newList = [...sheetsList, newSheetName];
      setSheetsList(newList);
      const config = {
        type: newSheetType,
        columns: newSheetType === 'custom' ? customColumns.filter(c => c.trim() !== '') : []
      };
      localStorage.setItem(`sheet_config_${newSheetName}`, JSON.stringify(config));
      // For backend awareness, we can just save an empty list to init the sheet
      setActiveSheet(newSheetName);
      setShowNewSheetModal(false);
      setNewSheetName('');
      setNewSheetType('default');
      setCustomColumns(['']);
    }
  };

  const updateCustomColumn = (index, value) => { const c = [...customColumns]; c[index] = value; setCustomColumns(c); };
  const addCustomColumnField = () => { if (customColumns.length < 5) setCustomColumns([...customColumns, '']); };
  const removeCustomColumnField = (index) => { const c = [...customColumns]; c.splice(index, 1); setCustomColumns(c); };

  const processedUsers = useMemo(() => {
    let data = users;
    if (searchQuery) data = data.filter(u => Object.values(u).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase())));
    if (filter !== 'All' && sheetConfig.type === 'default') {
      data = data.filter(u => {
        const status = getStatus(u.endDate).status;
        if (filter === 'Active') return status === 'Active';
        if (filter === 'Expiring') return status === 'Expiring Soon';
        if (filter === 'Expired') return status === 'Expired';
        return true;
      });
    }
    // Only sort by date if default sheet
    if (sheetConfig.type === 'default') {
        return data.sort((a, b) => getStatus(a.endDate).days - getStatus(b.endDate).days);
    }
    return data;
  }, [users, searchQuery, filter, sheetConfig.type]);

  const expiringCount = users.filter(u => getStatus(u.endDate).status === 'Expiring Soon').length;

  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans pb-20 md:pb-0">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg hidden md:block"><LayoutDashboard size={20} /></div>
            <div className="flex flex-col">
              <h1 className="font-bold text-xl text-slate-800 tracking-tight flex items-center gap-2">Inspired Analyst
                {isCloudConnected ? <span className="flex items-center gap-1 bg-green-50 text-green-600 text-[10px] px-2 py-0.5 rounded-full border border-green-200 uppercase tracking-wide"><Cloud size={10} /> {isSyncing ? 'Syncing...' : 'Online'}</span> : <span className="flex items-center gap-1 bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-full border border-red-200 uppercase tracking-wide"><CloudOff size={10} /> No Backend</span>}
              </h1>
              {lastUpdated && <span className="text-[10px] text-slate-400 font-medium">Updated: {lastUpdated.toLocaleTimeString()}</span>}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
               <button onClick={() => setSheetMenuOpen(!sheetMenuOpen)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"><FileSpreadsheet size={16} className="text-green-600"/>{activeSheet}<ChevronDown size={14} className={`transition-transform duration-200 ${sheetMenuOpen ? 'rotate-180' : ''}`}/></button>
               {sheetMenuOpen && (<><div className="fixed inset-0 z-40" onClick={() => setSheetMenuOpen(false)}></div><div className="absolute top-full mt-2 w-48 bg-white shadow-xl rounded-lg p-2 border z-50 animate-in fade-in zoom-in-95 duration-100">{sheetsList.map(s => (<button key={s} onClick={() => { setActiveSheet(s); setSheetMenuOpen(false); }} className={`w-full text-left p-2 hover:bg-slate-50 cursor-pointer rounded text-sm ${activeSheet === s ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-700'}`}>{s}</button>))}<div className="border-t my-1"></div><button onClick={() => { setShowNewSheetModal(true); setSheetMenuOpen(false); }} className="w-full text-left p-2 text-indigo-600 cursor-pointer font-bold text-sm flex items-center gap-2 hover:bg-slate-50 rounded"><Plus size={14}/> New Sheet</button></div></>)}
            </div>
            <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div>
            <button className="relative p-2 hover:bg-slate-100 rounded-full"><Bell size={20} className="text-slate-600"/>{expiringCount > 0 && <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}</button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
          </div>
          <div className="md:hidden flex items-center gap-3"><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">{mobileMenuOpen ? <X/> : <Menu/>}</button></div>
        </div>
      </header>

      <div className="md:hidden bg-white border-b p-4 space-y-4" style={{display: mobileMenuOpen ? 'block' : 'none'}}>
         <div className="flex gap-2 overflow-x-auto pb-2">{sheetsList.map(s => <button key={s} onClick={()=>{setActiveSheet(s); setMobileMenuOpen(false)}} className={`whitespace-nowrap px-3 py-1 rounded-full text-sm border ${activeSheet === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300'}`}>{s}</button>)}<button onClick={() => setShowNewSheetModal(true)} className="whitespace-nowrap px-3 py-1 rounded-full text-sm border border-dashed border-indigo-400 text-indigo-600">+ New</button></div>
         <input type="text" placeholder="Search..." className="w-full px-4 py-2 bg-slate-100 rounded-lg text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-700 hidden md:block">Subscribers List <span className="text-xs font-normal bg-slate-200 px-2 py-1 rounded ml-2">{sheetConfig.type === 'custom' ? 'Custom Database' : 'Default'}</span></h2>
          <div className="flex gap-2 w-full md:w-auto"><button onClick={() => fetchData()} className="p-2 bg-white border rounded-lg text-slate-600 hover:bg-slate-50"><RefreshCw size={20} className={loading || isSyncing ? 'animate-spin' : ''}/></button><button onClick={() => setShowAddModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"><Plus size={20}/> <span className="font-semibold">Add User</span></button></div>
        </div>

        {loading ? <div className="text-center py-20 text-slate-400">Loading data from Google Sheets...</div> : processedUsers.length === 0 ? <div className="text-center py-20 border-2 border-dashed rounded-xl"><Users size={40} className="mx-auto text-slate-300 mb-2"/><p className="text-slate-400">{isCloudConnected ? "No users found in Sheet." : "Connect Google Backend to see data."}</p></div> : (
            <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold">
                    <tr>
                      {sheetConfig.type === 'default' ? <><th className="px-6 py-4">Username</th><th className="px-6 py-4">End Date</th><th className="px-6 py-4">Status</th></> : <>{sheetConfig.columns.map((col, idx) => <th key={idx} className="px-6 py-4">{col}</th>)}</>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedUsers.map(user => {
                      const { status, days, color, icon } = getStatus(user.endDate);
                      return (
                        <tr key={user.id} onClick={() => setSelectedUser(user)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                          {sheetConfig.type === 'default' ? <><td className="px-6 py-4"><p className="font-bold text-slate-800">{user.username}</p><p className="text-xs text-slate-400">{user.discordId}</p></td><td className="px-6 py-4 text-sm font-medium text-slate-600">{formatDate(user.endDate)}</td><td className="px-6 py-4"><div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit text-xs font-bold border ${color}`}>{icon} {status} ({days}d)</div></td></> : <>{sheetConfig.columns.map((col, idx) => <td key={idx} className="px-6 py-4 text-sm font-medium text-slate-700">{user[col] || '-'}</td>)}</>}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
            </div>
        )}
        <div className="md:hidden space-y-4">{processedUsers.map(user => { const { status, days, color, icon } = getStatus(user.endDate); return (<div key={user.id} onClick={() => setSelectedUser(user)} className="bg-white p-4 rounded-xl shadow-sm border relative active:scale-95 transition-transform">{sheetConfig.type === 'default' && <div className={`absolute top-4 right-4 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${color}`}>{icon} {days} Days Left</div>}<div className="mb-3"><h3 className="font-bold text-lg text-slate-800">{sheetConfig.type === 'default' ? user.username : user[sheetConfig.columns[0]]}</h3><p className="text-sm text-slate-500">{sheetConfig.type === 'default' ? user.discordId : (sheetConfig.columns[1] ? user[sheetConfig.columns[1]] : '')}</p></div>{sheetConfig.type === 'default' && <div className="text-sm text-slate-500 font-medium">Expires: {formatDate(user.endDate)}</div>}</div>) })}</div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl p-6 w-full max-w-md animate-in zoom-in duration-200">
              <h2 className="text-xl font-bold mb-4">Add New Subscriber</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                 {sheetConfig.type === 'default' ? (
                   <>
                     <div><label className="block text-sm font-medium text-slate-700 mb-1">Discord ID (Username)</label><input required className="w-full p-2 border rounded" value={defaultUserForm.discordId} onChange={e=>setDefaultUserForm({...defaultUserForm, discordId: e.target.value})}/></div>
                     <div><label className="block text-sm font-medium text-slate-700 mb-1">TxID</label><input className="w-full p-2 border rounded" value={defaultUserForm.txid} onChange={e=>setDefaultUserForm({...defaultUserForm, txid: e.target.value})}/></div>
                     <div><label className="block text-sm font-medium text-slate-700 mb-2">Select Plan</label><div className="grid grid-cols-3 gap-2">{['Premium', 'Platinum', 'Diamond'].map((plan) => (<button key={plan} type="button" onClick={() => setDefaultUserForm({ ...defaultUserForm, plan, amount: PLAN_PRICES[plan] })} className={`py-2 px-1 rounded-lg text-sm font-semibold border ${defaultUserForm.plan === plan ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>{plan}</button>))}</div></div>
                     <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label><input type="number" className="w-full p-2 border rounded" value={defaultUserForm.amount} onChange={e=>setDefaultUserForm({...defaultUserForm, amount: e.target.value})}/></div><div><label className="block text-sm font-medium text-slate-700 mb-1">Months</label><input type="number" min="1" className="w-full p-2 border rounded" value={defaultUserForm.months} onChange={e=>setDefaultUserForm({...defaultUserForm, months: e.target.value})}/></div></div>
                     <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label><input required type="date" className="w-full p-2 border rounded" value={defaultUserForm.startDate} onChange={e=>setDefaultUserForm({...defaultUserForm, startDate: e.target.value})}/></div>
                   </>
                 ) : (
                   <>{sheetConfig.columns.map((c,i)=><div key={i}><label className="block text-sm font-medium text-slate-700 mb-1">{c}</label><input required className="w-full p-2 border rounded" value={newUser[c]||''} onChange={e=>setNewUser({...newUser, [c]: e.target.value})}/></div>)}</>
                 )}
                 <div className="flex gap-2 pt-4"><button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold">Add User</button></div>
              </form>
           </div>
        </div>
      )}

      {showNewSheetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl p-6 w-full max-w-sm animate-in zoom-in duration-200">
              <h2 className="text-lg font-bold mb-4">Create New Database</h2>
              <form onSubmit={handleCreateSheet}>
                 <div className="mb-4"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sheet Name</label><input autoFocus className="w-full p-2 border rounded" value={newSheetName} onChange={e=>setNewSheetName(e.target.value)}/></div>
                 <div className="grid grid-cols-2 gap-2 mb-4"><button type="button" onClick={()=>setNewSheetType('default')} className={`py-2 text-sm border rounded-lg ${newSheetType==='default'?'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold':'border-slate-200 text-slate-600'}`}>Default</button><button type="button" onClick={()=>setNewSheetType('custom')} className={`py-2 text-sm border rounded-lg ${newSheetType==='custom'?'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold':'border-slate-200 text-slate-600'}`}>Custom</button></div>
                 {newSheetType === 'custom' && (<div className="mb-4 space-y-2 max-h-40 overflow-y-auto"><label className="block text-xs font-bold text-slate-500 uppercase">Columns (Max 5)</label>{customColumns.map((c,i)=><div key={i} className="flex gap-2"><input placeholder={`Col ${i+1}`} className="flex-1 p-2 border rounded text-xs" value={c} onChange={e=>{const n=[...customColumns];n[i]=e.target.value;setCustomColumns(n)}}/>{customColumns.length>1&&<button onClick={()=>{const n=[...customColumns];n.splice(i,1);setCustomColumns(n)}} className="text-red-500"><Minus size={14}/></button>}</div>)}{customColumns.length<5 && <button onClick={()=>setCustomColumns([...customColumns,''])} className="text-xs text-indigo-600 flex items-center gap-1"><Plus size={12}/> Add</button>}</div>)}
                 <div className="flex gap-2 border-t pt-4"><button type="button" onClick={()=>setShowNewSheetModal(false)} className="flex-1 py-2 bg-slate-100 rounded">Cancel</button><button onClick={handleCreateSheet} disabled={!newSheetName} className="flex-1 py-2 bg-indigo-600 text-white rounded font-bold">Create</button></div>
              </form>
           </div>
        </div>
      )}

      <UserDetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} onRenew={renewSubscription} onDelete={deleteUser} isDefault={sheetConfig.type === 'default'}/>
    </div>
  );
}
