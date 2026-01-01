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
  Clock
} from 'lucide-react';

// --- CONFIGURATION ---
// IMPORTANT: Yahan apna Google Web App URL paste karein
const USE_GOOGLE_SHEETS_API = true; // Set to true to enable Google Sheets
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzZYiCECf0p3h_cRTTqGVuRFJvFWWSAMyeLrJHPLnuzcTU76D209jBAjJnoW7wshF4ijg/exec";

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
  return isNaN(date) ? dateStr : date.toLocaleDateString('en-GB'); // DD/MM/YYYY
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
  if (!endDateStr) return { status: 'Active', days: 99, color: 'text-green-600 bg-green-50', icon: <CheckCircle size={16}/> };
  
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

// PNG Invoice Generator (Native Canvas)
const downloadInvoicePNG = (user) => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header Background
  ctx.fillStyle = '#4F46E5'; // Indigo-600
  ctx.fillRect(0, 0, canvas.width, 120);
  
  // Header Text
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

  // Reset Align
  ctx.textAlign = 'left';

  // Bill To Section
  ctx.fillStyle = '#64748b'; // Slate-500
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('BILL TO', 50, 180);
  
  ctx.fillStyle = '#1e293b'; // Slate-800
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(user.username || 'Valued Customer', 50, 210);
  
  ctx.fillStyle = '#475569';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Discord: ${user.discordId || '-'}`, 50, 235);
  ctx.fillText(`TxID: ${user.txid || '-'}`, 50, 260);

  // Divider
  ctx.beginPath();
  ctx.moveTo(50, 300);
  ctx.lineTo(750, 300);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Table Headers
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('DESCRIPTION', 50, 330);
  ctx.textAlign = 'right';
  ctx.fillText('AMOUNT', 750, 330);

  // Table Row
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`${user.plan || 'Custom'} Subscription`, 50, 370);
  
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`Valid from ${formatDate(user.startDate)} to ${formatDate(user.endDate)}`, 50, 395);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(formatCurrency(user.amount), 750, 370);

  // Total Line
  ctx.beginPath();
  ctx.moveTo(50, 440);
  ctx.lineTo(750, 440);
  ctx.stroke();

  // Total Amount
  ctx.textAlign = 'right';
  ctx.fillStyle = '#4F46E5';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(formatCurrency(user.amount), 750, 490);
  ctx.fillStyle = '#64748b';
  ctx.font = '16px sans-serif';
  ctx.fillText('Total Paid', 750, 455);

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.fillText('Thank you for choosing Inspired Analyst!', 400, 560);

  // Download
  const link = document.createElement('a');
  link.download = `Invoice-${user.username.replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

// --- COMPONENTS ---

// 1. Login Component
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

// 2. User Details Card (The new Modal)
const UserDetailsModal = ({ user, onClose, onRenew, onDelete }) => {
  if (!user) return null;
  const { status, days, color, icon } = getStatus(user.endDate);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header with Status Color */}
        <div className={`p-6 pb-8 ${status === 'Active' ? 'bg-green-50' : status === 'Expired' ? 'bg-red-50' : 'bg-amber-50'} relative`}>
           <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-white/50 p-1 rounded-full"><X size={20}/></button>
           
           <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl font-bold shadow-sm mb-3 text-slate-700">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <h2 className="text-xl font-bold text-slate-800">{user.username}</h2>
              <p className="text-sm text-slate-500 mb-2">{user.discordId}</p>
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-white ${color}`}>
                  {icon} {status} ({days} days left)
              </span>
           </div>
        </div>

        {/* Details Body */}
        <div className="p-6 space-y-4">
           <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                 <div className="flex items-center gap-2 text-xs text-slate-400 uppercase font-bold mb-1">
                    <Gem size={12}/> Plan
                 </div>
                 <div className="font-semibold text-slate-800">{user.plan || 'Custom'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                 <div className="flex items-center gap-2 text-xs text-slate-400 uppercase font-bold mb-1">
                    <CreditCard size={12}/> Amount
                 </div>
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

           {/* Actions */}
           <div className="flex flex-col gap-2 pt-2">
              <button onClick={() => downloadInvoicePNG(user)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all">
                 <Download size={18}/> Download Invoice (PNG)
              </button>
              <div className="flex gap-2">
                 <button onClick={() => onRenew(user.id)} className="flex-1 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl font-semibold transition-colors">
                    Renew (+1M)
                 </button>
                 <button onClick={() => onDelete(user.id)} className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-semibold transition-colors">
                    Delete
                 </button>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewSheetModal, setShowNewSheetModal] = useState(false);
  
  // State for the new User Details Modal
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [newUser, setNewUser] = useState({});
  const [defaultUserForm, setDefaultUserForm] = useState({ 
    username: '', discordId: '', txid: '', plan: 'Premium', amount: 20, startDate: '', months: 1 
  });

  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetType, setNewSheetType] = useState('default'); 
  const [customColumns, setCustomColumns] = useState(['']); 
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('isAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  useEffect(() => {
    if(isAuthenticated) fetchData();
  }, [activeSheet]);

  const fetchData = async () => {
    setLoading(true);
    const configStr = localStorage.getItem(`sheet_config_${activeSheet}`);
    if (configStr) {
      setSheetConfig(JSON.parse(configStr));
    } else {
      setSheetConfig({ type: 'default', columns: [] });
    }

    if (USE_GOOGLE_SHEETS_API) {
      try {
        const response = await fetch(`${GOOGLE_API_URL}?action=getUsers&sheet=${activeSheet}`);
        const data = await response.json();
        setUsers(data.users);
      } catch (e) { console.error(e); }
    } else {
      const stored = localStorage.getItem(`sheet_${activeSheet}`);
      setUsers(stored ? JSON.parse(stored) : []);
    }
    setLoading(false);
  };

  const saveData = async (newUsersList) => {
    setUsers(newUsersList);
    if (USE_GOOGLE_SHEETS_API) {
        let headers = [], keys = [];
        if (sheetConfig.type === 'default') {
            headers = ['ID', 'Tier', 'Username', 'Discord ID', 'Start Date', 'End Date', 'TxID', 'Amount'];
            keys = ['id', 'plan', 'username', 'discordId', 'startDate', 'endDate', 'txid', 'amount'];
        } else {
            headers = ['ID', ...sheetConfig.columns, 'Start Date', 'End Date'];
            keys = ['id', ...sheetConfig.columns, 'startDate', 'endDate'];
        }
        try {
            await fetch(GOOGLE_API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'saveData', sheetName: activeSheet, users: newUsersList, headers, keys })
            });
        } catch (e) { console.error(e); }
    } else {
        localStorage.setItem(`sheet_${activeSheet}`, JSON.stringify(newUsersList));
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
    const start = new Date(sheetConfig.type === 'default' ? defaultUserForm.startDate : newUser.startDate);
    const months = parseInt(sheetConfig.type === 'default' ? defaultUserForm.months : newUser.months || 1);
    const end = new Date(start); 
    end.setMonth(end.getMonth() + months);
    
    const formData = sheetConfig.type === 'default' ? defaultUserForm : newUser;
    const userObj = { id: Math.random().toString(36).substr(2, 9), ...formData, endDate: end.toISOString().split('T')[0] };
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
    setSelectedUser(null); // Close modal on renew
  };

  const deleteUser = (userId) => {
    if(confirm('Are you sure?')) {
      saveData(users.filter(u => u.id !== userId));
      setSelectedUser(null); // Close modal on delete
    }
  };

  const handleCreateSheet = (e) => {
    e.preventDefault();
    if(newSheetName) {
      setSheetsList([...sheetsList, newSheetName]);
      const config = { type: newSheetType, columns: newSheetType === 'custom' ? customColumns.filter(c => c.trim() !== '') : [] };
      localStorage.setItem(`sheet_config_${newSheetName}`, JSON.stringify(config));
      localStorage.setItem(`sheet_${newSheetName}`, JSON.stringify([]));
      setActiveSheet(newSheetName); setShowNewSheetModal(false); setNewSheetName('');
    }
  };

  const updateCustomColumn = (idx, val) => { const c = [...customColumns]; c[idx] = val; setCustomColumns(c); };
  const addCustomColumnField = () => { if (customColumns.length < 5) setCustomColumns([...customColumns, '']); };
  const removeCustomColumnField = (idx) => { const c = [...customColumns]; c.splice(idx, 1); setCustomColumns(c); };

  const processedUsers = useMemo(() => {
    let data = users;
    if (searchQuery) data = data.filter(u => Object.values(u).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase())));
    return data.sort((a, b) => getStatus(a.endDate).days - getStatus(b.endDate).days);
  }, [users, searchQuery]);

  const expiringCount = users.filter(u => getStatus(u.endDate).status === 'Expiring Soon').length;

  if (!isAuthenticated) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20 md:pb-0">
      <header className="bg-white border-b px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 text-white p-2 rounded-lg hidden md:block"><LayoutDashboard size={20} /></div>
          <h1 className="font-bold text-xl text-slate-800 tracking-tight">Inspired Analyst</h1>
        </div>
        <div className="hidden md:flex items-center gap-4">
            <div className="relative">
               <button onClick={() => setSheetMenuOpen(!sheetMenuOpen)} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium">
                 <FileSpreadsheet size={16}/>{activeSheet}<ChevronDown size={14}/>
               </button>
               {sheetMenuOpen && (
                 <div className="absolute top-full mt-2 w-48 bg-white shadow-xl rounded-lg p-2 border z-50">
                   {sheetsList.map(s => <button key={s} onClick={() => { setActiveSheet(s); setSheetMenuOpen(false); }} className="w-full text-left p-2 hover:bg-slate-50 text-sm">{s}</button>)}
                   <button onClick={() => { setShowNewSheetModal(true); setSheetMenuOpen(false); }} className="w-full text-left p-2 text-indigo-600 font-bold text-sm flex gap-2"><Plus size={14}/> New Sheet</button>
                 </div>
               )}
            </div>
            <input type="text" placeholder="Search..." className="pl-4 pr-4 py-2 bg-slate-100 rounded-full text-sm w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/>
            <button onClick={() => { localStorage.removeItem('isAuth'); setIsAuthenticated(false); }} className="text-red-500"><LogOut size={20}/></button>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden"><Menu/></button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Subscribers List</h2>
          <div className="flex gap-2">
             <button onClick={() => fetchData()} className="p-2 bg-white border rounded hover:bg-slate-50"><RefreshCw size={20} className={loading?'animate-spin':''}/></button>
             <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded shadow"><Plus size={20}/> Add User</button>
          </div>
        </div>

        {loading ? <div className="text-center py-20 text-slate-400">Loading...</div> : processedUsers.length === 0 ? <div className="text-center py-20 text-slate-400">No data found.</div> : (
            <div className="hidden md:block bg-white rounded-xl shadow border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b font-semibold text-slate-600">
                    <tr>
                      {/* SIMPLIFIED HEADERS */}
                      {sheetConfig.type === 'default' ? (
                        <>
                          <th className="px-6 py-4">Username</th>
                          <th className="px-6 py-4">End Date</th>
                          <th className="px-6 py-4">Status</th>
                        </>
                      ) : (
                        <>
                          {sheetConfig.columns.map((col, idx) => <th key={idx} className="px-6 py-4">{col}</th>)}
                          <th className="px-6 py-4">End Date</th>
                          <th className="px-6 py-4">Status</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {processedUsers.map(user => {
                      const { status, days, color, icon } = getStatus(user.endDate);
                      return (
                        // CLICKABLE ROW
                        <tr key={user.id} onClick={() => setSelectedUser(user)} className="border-b hover:bg-slate-50 cursor-pointer">
                          {sheetConfig.type === 'default' ? (
                            <>
                              <td className="px-6 py-4 font-bold">{user.username}</td>
                              <td className="px-6 py-4 text-slate-600">{formatDate(user.endDate)}</td>
                            </>
                          ) : (
                            <>
                              {sheetConfig.columns.map((c,i)=><td key={i} className="px-6 py-4">{user[c] || '-'}</td>)}
                              <td className="px-6 py-4 text-slate-600">{formatDate(user.endDate)}</td>
                            </>
                          )}
                          <td className="px-6 py-4"><span className={`flex items-center gap-1 w-fit px-2 py-1 rounded text-xs font-bold border ${color}`}>{icon} {status}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
            </div>
        )}
        
        {/* Mobile View */}
        <div className="md:hidden space-y-4">
           {processedUsers.map(user => (
             <div key={user.id} onClick={() => setSelectedUser(user)} className="bg-white p-4 rounded shadow border active:scale-95 transition-transform">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold">{sheetConfig.type==='default'?user.username:user[sheetConfig.columns[0]]}</h3>
                 <span className={`text-xs px-2 py-1 rounded border ${getStatus(user.endDate).color}`}>{getStatus(user.endDate).days} Days Left</span>
               </div>
               <div className="text-sm text-slate-500 mb-2">Expires: {formatDate(user.endDate)}</div>
             </div>
           ))}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
           <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Entry</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                 {sheetConfig.type === 'default' ? (
                   <>
                     <input required placeholder="Username" className="w-full p-2 border rounded" value={defaultUserForm.username} onChange={e=>setDefaultUserForm({...defaultUserForm, username: e.target.value})}/>
                     <input required placeholder="Discord ID" className="w-full p-2 border rounded" value={defaultUserForm.discordId} onChange={e=>setDefaultUserForm({...defaultUserForm, discordId: e.target.value})}/>
                     <input placeholder="TxID" className="w-full p-2 border rounded" value={defaultUserForm.txid} onChange={e=>setDefaultUserForm({...defaultUserForm, txid: e.target.value})}/>
                     <div className="flex gap-2">{['Premium','Platinum','Diamond'].map(p=><button key={p} type="button" onClick={()=>setDefaultUserForm({...defaultUserForm, plan: p, amount: PLAN_PRICES[p]})} className={`flex-1 py-2 border rounded text-xs ${defaultUserForm.plan===p?'bg-indigo-600 text-white':''}`}>{p}</button>)}</div>
                     <div className="flex gap-2"><input type="number" placeholder="Amount" className="w-1/2 p-2 border rounded" value={defaultUserForm.amount} onChange={e=>setDefaultUserForm({...defaultUserForm, amount: e.target.value})}/><input type="number" placeholder="Months" className="w-1/2 p-2 border rounded" value={defaultUserForm.months} onChange={e=>setDefaultUserForm({...defaultUserForm, months: e.target.value})}/></div>
                     <input required type="date" className="w-full p-2 border rounded" value={defaultUserForm.startDate} onChange={e=>setDefaultUserForm({...defaultUserForm, startDate: e.target.value})}/>
                   </>
                 ) : (
                   <>{sheetConfig.columns.map((c,i)=><input key={i} placeholder={c} className="w-full p-2 border rounded" value={newUser[c]||''} onChange={e=>setNewUser({...newUser, [c]: e.target.value})}/>)}<div className="flex gap-2"><input type="number" placeholder="Months" className="w-1/2 p-2 border rounded" value={newUser.months||1} onChange={e=>setNewUser({...newUser, months: e.target.value})}/><input required type="date" className="w-1/2 p-2 border rounded" value={newUser.startDate||''} onChange={e=>setNewUser({...newUser, startDate: e.target.value})}/></div></>
                 )}
                 <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 rounded">Cancel</button><button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded">Save</button></div>
              </form>
           </div>
        </div>
      )}

      {/* New Sheet Modal */}
      {showNewSheetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
           <div className="bg-white p-6 rounded-lg w-full max-w-sm">
              <h2 className="text-lg font-bold mb-4">New Sheet</h2>
              <input autoFocus placeholder="Sheet Name" className="w-full p-2 border rounded mb-4" value={newSheetName} onChange={e=>setNewSheetName(e.target.value)}/>
              <div className="flex gap-2 mb-4"><button type="button" onClick={()=>setNewSheetType('default')} className={`flex-1 py-2 border rounded text-xs ${newSheetType==='default'?'bg-indigo-600 text-white':''}`}>Default</button><button type="button" onClick={()=>setNewSheetType('custom')} className={`flex-1 py-2 border rounded text-xs ${newSheetType==='custom'?'bg-indigo-600 text-white':''}`}>Custom</button></div>
              {newSheetType === 'custom' && (
                 <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {customColumns.map((c,i)=><div key={i} className="flex gap-2"><input placeholder={`Column ${i+1}`} className="flex-1 p-2 border rounded text-xs" value={c} onChange={e=>{const n=[...customColumns];n[i]=e.target.value;setCustomColumns(n)}}/>{customColumns.length>1&&<button onClick={()=>{const n=[...customColumns];n.splice(i,1);setCustomColumns(n)}} className="text-red-500"><Minus size={14}/></button>}</div>)}
                    {customColumns.length<5 && <button onClick={()=>setCustomColumns([...customColumns,''])} className="text-xs text-indigo-600 flex items-center gap-1"><Plus size={12}/> Add</button>}
                 </div>
              )}
              <div className="flex gap-2"><button type="button" onClick={()=>setShowNewSheetModal(false)} className="flex-1 py-2 bg-slate-100 rounded">Cancel</button><button onClick={handleCreateSheet} disabled={!newSheetName} className="flex-1 py-2 bg-indigo-600 text-white rounded">Create</button></div>
           </div>
        </div>
      )}

      {/* USER DETAILS MODAL (CARD) */}
      <UserDetailsModal 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
        onRenew={renewSubscription} 
        onDelete={deleteUser} 
      />
    </div>
  );
}
