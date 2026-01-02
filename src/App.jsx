import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Search, 
  Bell, 
  Plus, 
  RefreshCw, 
  Download, 
  Copy, 
  LogOut,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Menu,
  X,
  Trash2,
  CalendarDays
} from 'lucide-react';

// --- CONFIGURATION ---
const USE_GOOGLE_SHEETS_API = true; 
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbyUqTpsKy61ePO91ucotXtcbGn91MaQaOZYhhb8QT_6-eMWAtknmkCsHAC2URLaVhckpQ/exec";

// --- HELPER FUNCTIONS ---

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return isNaN(date) ? dateStr : date.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

// Robust Date Parsing and Calculation
const getStatus = (endDateStr) => {
  if (!endDateStr) return { status: 'Active', days: 99, color: 'text-green-600 bg-green-50' };
  
  const end = new Date(endDateStr);
  const now = new Date();
  
  // Set both to UTC midnight to avoid timezone issues
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = utcEnd - utcNow;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (days < 0) return { status: 'Expired', days, color: 'text-red-600 bg-red-50', icon: <XCircle size={16}/> };
  if (days <= 3) return { status: 'Expiring Soon', days, color: 'text-amber-600 bg-amber-50', icon: <AlertTriangle size={16}/> };
  return { status: 'Active', days, color: 'text-green-600 bg-green-50', icon: <CheckCircle size={16}/> };
};

// --- COMPONENTS ---

const LoginScreen = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const handleLogin = (e) => {
    e.preventDefault();
    if (pin === '1288') onLogin();
    else setError('Incorrect Passcode');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Subscription Dashboard</h2>
        <form onSubmit={handleLogin}>
          <input type="password" maxLength="4" className="w-full text-center text-3xl tracking-widest py-3 border-2 rounded-xl mb-4" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Access</button>
        </form>
      </div>
    </div>
  );
};

const InvoiceModal = ({ user, onClose }) => {
  const printInvoice = () => {
    const printContent = document.getElementById('invoice-print-area').innerHTML;
    const win = window.open('', '', 'height=700,width=800');
    win.document.write('<html><head><title>Invoice</title><script src="https://cdn.tailwindcss.com"></script></head><body>');
    win.document.write(printContent);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };
  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg">Invoice</h3>
          <button onClick={onClose}><X size={20}/></button>
        </div>
        <div id="invoice-print-area" className="p-8 bg-white text-slate-800">
          <div className="flex justify-between mb-8 border-b pb-6">
            <div><h1 className="text-3xl font-bold text-indigo-700">INVOICE</h1><p className="text-sm text-slate-500">Receipt #{Math.floor(Math.random() * 10000)}</p></div>
            <div className="text-right"><h2 className="font-bold text-xl">Inspired Analyst</h2><p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p></div>
          </div>
          <div className="mb-8"><h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</h3><p className="text-lg font-bold">{user.username}</p><p className="text-slate-600">Discord: {user.discordId}</p><p className="text-slate-600 text-sm">TXID: {user.txid}</p></div>
          <table className="w-full mb-8">
            <thead><tr className="border-b-2"><th className="text-left py-3">Description</th><th className="text-right py-3">Period</th><th className="text-right py-3">Amount</th></tr></thead>
            <tbody><tr className="border-b"><td className="py-4 font-medium">{user.plan} Plan</td><td className="py-4 text-right text-sm">{formatDate(user.startDate)} - {formatDate(user.endDate)}</td><td className="py-4 text-right font-bold">$ --</td></tr></tbody>
          </table>
          <div className="mt-12 text-center pt-6 border-t"><p className="font-bold text-indigo-900">Thanks for choosing Inspired Analyst!</p></div>
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Close</button>
          <button onClick={printInvoice} className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700"><Download size={16}/> PDF</button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSheet, setActiveSheet] = useState('Dec 2025');
  const [sheetsList, setSheetsList] = useState(['Dec 2025']);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewSheetModal, setShowNewSheetModal] = useState(false);
  const [selectedUserForInvoice, setSelectedUserForInvoice] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // New User State
  const [newUser, setNewUser] = useState({ 
    username: '', discordId: '', txid: '', plan: 'Premium', startDate: new Date().toISOString().split('T')[0], endDate: '', months: 1 
  });
  const [newSheetName, setNewSheetName] = useState('');

  useEffect(() => {
    const auth = localStorage.getItem('isAuth');
    if (auth === 'true') { setIsAuthenticated(true); fetchData(); }
  }, []);

  useEffect(() => { if(isAuthenticated) fetchData(); }, [activeSheet]);

  // Handle Start Date/Months Change -> Auto Calc End Date
  useEffect(() => {
    if (newUser.startDate && newUser.months) {
      const start = new Date(newUser.startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + parseInt(newUser.months));
      setNewUser(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
    }
  }, [newUser.startDate, newUser.months]);

  const fetchData = async () => {
    setLoading(true);
    if (USE_GOOGLE_SHEETS_API) {
      try {
        const response = await fetch(`${GOOGLE_API_URL}?action=getUsers&sheet=${activeSheet}`);
        const data = await response.json();
        setUsers(data.users);
      } catch (e) { console.error(e); }
    } else {
      const stored = localStorage.getItem(`sheet_${activeSheet}`);
      if (stored) setUsers(JSON.parse(stored));
      else { localStorage.setItem(`sheet_${activeSheet}`, JSON.stringify([])); setUsers([]); }
    }
    setLoading(false);
  };

  const saveData = (newUsersList) => {
    setUsers(newUsersList);
    if (!USE_GOOGLE_SHEETS_API) localStorage.setItem(`sheet_${activeSheet}`, JSON.stringify(newUsersList));
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    const userObj = { id: Math.random().toString(36).substr(2, 9), ...newUser };
    saveData([...users, userObj]);
    setShowAddModal(false);
    setNewUser({ username: '', discordId: '', txid: '', plan: 'Premium', startDate: new Date().toISOString().split('T')[0], endDate: '', months: 1 });
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
  };

  const deleteUser = (userId) => {
    if(confirm('Delete user?')) saveData(users.filter(u => u.id !== userId));
  };

  const copyDetails = (user) => {
    navigator.clipboard.writeText(`Name: ${user.username}\nPlan: ${user.plan}\nEnd: ${user.endDate}`);
    alert('Copied!');
  };

  const processedUsers = useMemo(() => {
    let data = users;
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      data = data.filter(u => u.username.toLowerCase().includes(lower) || u.discordId.toLowerCase().includes(lower) || u.txid.toLowerCase().includes(lower));
    }
    if (filter !== 'All') {
      data = data.filter(u => {
        const status = getStatus(u.endDate).status;
        return filter === 'Active' ? status === 'Active' : filter === 'Expiring' ? status === 'Expiring Soon' : status === 'Expired';
      });
    }
    return data.sort((a, b) => getStatus(a.endDate).days - getStatus(b.endDate).days);
  }, [users, searchQuery, filter]);

  if (!isAuthenticated) return <LoginScreen onLogin={() => { localStorage.setItem('isAuth', 'true'); setIsAuthenticated(true); fetchData(); }} />;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-20 md:pb-0">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg hidden md:block"><LayoutDashboard size={20}/></div>
            <h1 className="font-bold text-xl">Inspired Analyst</h1>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="relative group">
               <button className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-medium"><FileSpreadsheet size={16} className="text-green-600"/>{activeSheet}<ChevronDown size={14}/></button>
               <div className="absolute top-full mt-2 w-48 bg-white shadow-xl rounded-lg p-2 hidden group-hover:block border">
                 {sheetsList.map(s => <div key={s} onClick={() => setActiveSheet(s)} className="p-2 hover:bg-slate-50 cursor-pointer text-sm">{s}</div>)}
                 <div onClick={() => setShowNewSheetModal(true)} className="p-2 text-indigo-600 cursor-pointer border-t mt-1 text-sm flex gap-2"><Plus size={14}/> New Sheet</div>
               </div>
            </div>
            <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18}/><input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 bg-slate-100 rounded-full text-sm outline-none w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}/></div>
            <button onClick={() => { localStorage.removeItem('isAuth'); setIsAuthenticated(false); }} className="text-slate-400 hover:text-red-500"><LogOut size={20}/></button>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">{mobileMenuOpen ? <X/> : <Menu/>}</button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b p-4 space-y-4">
           <div className="flex gap-2 overflow-x-auto pb-2">{sheetsList.map(s => <button key={s} onClick={()=>{setActiveSheet(s); setMobileMenuOpen(false)}} className={`whitespace-nowrap px-3 py-1 rounded-full text-sm border ${activeSheet === s ? 'bg-indigo-600 text-white' : 'bg-white'}`}>{s}</button>)}</div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
           {['All', 'Active', 'Expiring', 'Expired'].map(f => (
             <div key={f} onClick={()=>setFilter(f)} className={`p-4 rounded-xl border cursor-pointer ${filter === f ? 'bg-indigo-50 border-indigo-200' : 'bg-white'}`}>
                <p className="text-xs text-slate-500 uppercase font-bold">{f}</p>
                <p className="text-2xl font-bold text-slate-800">{f === 'All' ? users.length : users.filter(u => {
                   const s = getStatus(u.endDate).status;
                   return f === 'Active' ? s === 'Active' : f === 'Expiring' ? s === 'Expiring Soon' : s === 'Expired';
                }).length}</p>
             </div>
           ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold hidden md:block">Subscribers</h2>
          <div className="flex gap-2 w-full md:w-auto">
             <button onClick={fetchData} className="p-2 bg-white border rounded-lg hover:bg-slate-50"><RefreshCw size={20} className={loading ? 'animate-spin' : ''}/></button>
             <button onClick={() => setShowAddModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-bold"><Plus size={20}/> Add User</button>
          </div>
        </div>

        {processedUsers.length === 0 ? <div className="text-center py-20 border-2 border-dashed rounded-xl"><Users size={40} className="mx-auto text-slate-300 mb-2"/><p>No users found.</p></div> : (
            <>
              <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 font-semibold"><tr><th className="px-6 py-4 text-left">User</th><th className="px-6 py-4 text-left">Plan</th><th className="px-6 py-4 text-left">Status</th><th className="px-6 py-4 text-left">End Date</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedUsers.map(user => {
                      const { status, days, color, icon } = getStatus(user.endDate);
                      return (
                        <tr key={user.id} className="hover:bg-slate-50 group">
                          <td className="px-6 py-4"><p className="font-bold">{user.username}</p><p className="text-xs text-slate-500 font-mono">{user.discordId}</p></td>
                          <td className="px-6 py-4"><span className="px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">{user.plan}</span></td>
                          <td className="px-6 py-4"><div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit text-xs font-bold border ${color}`}>{icon} {status}</div></td>
                          <td className="px-6 py-4 text-sm font-medium"><div className="flex items-center gap-2"><CalendarDays size={16} className="text-slate-400"/> {formatDate(user.endDate)} <span className="text-slate-400 text-xs">({days} days)</span></div></td>
                          <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => renewSubscription(user.id)} title="Renew +1 Month" className="p-1.5 hover:bg-green-100 text-green-600 rounded"><RefreshCw size={16}/></button><button onClick={() => setSelectedUserForInvoice(user)} title="Invoice" className="p-1.5 hover:bg-indigo-100 text-indigo-600 rounded"><Download size={16}/></button><button onClick={() => copyDetails(user)} className="p-1.5 hover:bg-slate-100 text-slate-600 rounded"><Copy size={16}/></button><button onClick={() => deleteUser(user.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded"><Trash2 size={16}/></button></div></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-4">
                 {processedUsers.map(user => {
                    const { status, days, color, icon } = getStatus(user.endDate);
                    return (
                      <div key={user.id} className="bg-white p-4 rounded-xl shadow-sm border relative">
                         <div className={`absolute top-4 right-4 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${color}`}>{icon} {days} Days</div>
                         <div className="mb-3"><h3 className="font-bold text-lg">{user.username}</h3><p className="text-sm text-slate-500">{user.discordId}</p></div>
                         <div className="grid grid-cols-2 gap-2 text-sm mb-4"><div className="bg-slate-50 p-2 rounded"><p className="text-xs text-slate-400 uppercase">Plan</p><p className="font-medium">{user.plan}</p></div><div className="bg-slate-50 p-2 rounded"><p className="text-xs text-slate-400 uppercase">Expires</p><p className="font-medium">{formatDate(user.endDate)}</p></div></div>
                         <div className="flex gap-2 pt-2 border-t"><button onClick={() => renewSubscription(user.id)} className="flex-1 py-2 bg-green-50 text-green-700 font-medium rounded-lg text-sm">Renew</button><button onClick={() => setSelectedUserForInvoice(user)} className="flex-1 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg text-sm">Invoice</button><button onClick={() => deleteUser(user.id)} className="p-2 text-red-500 bg-red-50 rounded-lg"><Trash2 size={18}/></button></div>
                      </div>
                    )
                 })}
              </div>
            </>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl p-6 w-full max-w-md animate-in zoom-in duration-200">
              <h2 className="text-xl font-bold mb-4">Add New Subscriber</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                 <input required type="text" placeholder="Username" className="w-full p-2 border rounded" value={newUser.username} onChange={e=>setNewUser({...newUser, username: e.target.value})}/>
                 <input required type="text" placeholder="Discord ID" className="w-full p-2 border rounded" value={newUser.discordId} onChange={e=>setNewUser({...newUser, discordId: e.target.value})}/>
                 <input type="text" placeholder="TXID (Optional)" className="w-full p-2 border rounded" value={newUser.txid} onChange={e=>setNewUser({...newUser, txid: e.target.value})}/>
                 <div className="grid grid-cols-2 gap-2">
                    <select className="p-2 border rounded" value={newUser.plan} onChange={e=>setNewUser({...newUser, plan: e.target.value})}><option>Premium</option><option>Platinum</option><option>Diamond</option></select>
                    <div className="relative"><input type="number" min="1" placeholder="Months" className="w-full p-2 border rounded" value={newUser.months} onChange={e=>setNewUser({...newUser, months: e.target.value})}/><span className="absolute right-2 top-2 text-xs text-slate-400">Mo</span></div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs text-slate-500 block mb-1">Start Date</label><input required type="date" className="w-full p-2 border rounded text-sm" value={newUser.startDate} onChange={e=>setNewUser({...newUser, startDate: e.target.value})}/></div>
                    <div><label className="text-xs text-slate-500 block mb-1">End Date (Editable)</label><input required type="date" className="w-full p-2 border rounded text-sm font-bold text-indigo-600 bg-indigo-50" value={newUser.endDate} onChange={e=>setNewUser({...newUser, endDate: e.target.value})}/></div>
                 </div>
                 <div className="flex gap-2 pt-2"><button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-2 bg-slate-100 rounded text-slate-600">Cancel</button><button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded font-bold">Add User</button></div>
              </form>
           </div>
        </div>
      )}

      {showNewSheetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-xl p-6 w-full max-w-sm">
              <h2 className="text-lg font-bold mb-4">New Database Sheet</h2>
              <form onSubmit={(e) => { e.preventDefault(); if(newSheetName){ setSheetsList([...sheetsList, newSheetName]); setActiveSheet(newSheetName); setShowNewSheetModal(false); setNewSheetName(''); }}}>
                 <input autoFocus type="text" placeholder="e.g. Jan 2026" className="w-full p-2 border rounded mb-4" value={newSheetName} onChange={e=>setNewSheetName(e.target.value)}/>
                 <div className="flex gap-2"><button type="button" onClick={()=>setShowNewSheetModal(false)} className="flex-1 py-2 bg-slate-100 rounded">Cancel</button><button type="submit" disabled={!newSheetName} className="flex-1 py-2 bg-indigo-600 text-white rounded">Create</button></div>
              </form>
           </div>
        </div>
      )}
      {selectedUserForInvoice && <InvoiceModal user={selectedUserForInvoice} onClose={() => setSelectedUserForInvoice(null)} />}
    </div>
  );
}
