import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Users, FileSpreadsheet, Search, Bell, Plus, RefreshCw, Download, Copy, LogOut, CheckCircle, AlertTriangle, XCircle, ChevronDown, Menu, X, Minus } from 'lucide-react';

// --- CONFIGURATION ---
const USE_GOOGLE_SHEETS_API = true; // Yahan TRUE karein
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbzZYiCECf0p3h_cRTTqGVuRFJvFWWSAMyeLrJHPLnuzcTU76D209jBAjJnoW7wshF4ijg/exec"; // Yahan apna URL dalein

const PLAN_PRICES = { 'Premium': 20, 'Platinum': 60, 'Diamond': 100 };

const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
const formatDate = (dateStr) => { if (!dateStr) return '-'; const date = new Date(dateStr); return isNaN(date) ? dateStr : date.toLocaleDateString('en-GB'); };
const parseDate = (input) => { if (!input) return new Date(); const parts = input.split(/[-/]/); if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]); return new Date(parts[2], parts[1] - 1, parts[0]); };

const getStatus = (endDateStr) => {
  if (!endDateStr) return { status: 'Active', days: 99, color: 'text-green-600 bg-green-50', icon: <CheckCircle size={16}/> };
  const end = parseDate(endDateStr); const now = new Date(); now.setHours(0,0,0,0); end.setHours(0,0,0,0);
  const diffTime = end - now; const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (days < 0) return { status: 'Expired', days, color: 'text-red-600 bg-red-50', icon: <XCircle size={16}/> };
  if (days <= 3) return { status: 'Expiring Soon', days, color: 'text-amber-600 bg-amber-50', icon: <AlertTriangle size={16}/> };
  return { status: 'Active', days, color: 'text-green-600 bg-green-50', icon: <CheckCircle size={16}/> };
};

const LoginScreen = ({ onLogin }) => {
  const [pin, setPin] = useState('');
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>
        <input type="password" maxLength="4" className="w-full text-center text-3xl py-3 border rounded-xl mb-4" placeholder="••••" value={pin} onChange={(e) => setPin(e.target.value)} />
        <button onClick={() => pin === '1288' ? onLogin() : alert('Wrong PIN')} className="w-full bg-indigo-600 text-white py-3 rounded-xl">Login</button>
      </div>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSheet, setActiveSheet] = useState('Dec 2025');
  const [sheetsList, setSheetsList] = useState(['Dec 2025']);
  const [sheetMenuOpen, setSheetMenuOpen] = useState(false);
  const [sheetConfig, setSheetConfig] = useState({ type: 'default', columns: [] });
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewSheetModal, setShowNewSheetModal] = useState(false);
  const [newUser, setNewUser] = useState({});
  const [defaultUserForm, setDefaultUserForm] = useState({ username: '', discordId: '', txid: '', plan: 'Premium', amount: 20, startDate: '', months: 1 });
  const [newSheetName, setNewSheetName] = useState('');
  const [newSheetType, setNewSheetType] = useState('default');
  const [customColumns, setCustomColumns] = useState(['']);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { if (localStorage.getItem('isAuth') === 'true') { setIsAuthenticated(true); fetchData(); } }, []);
  useEffect(() => { if(isAuthenticated) fetchData(); }, [activeSheet]);

  const fetchData = async () => {
    setLoading(true);
    const configStr = localStorage.getItem(`sheet_config_${activeSheet}`);
    setSheetConfig(configStr ? JSON.parse(configStr) : { type: 'default', columns: [] });

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

  const handleAddUser = (e) => {
    e.preventDefault();
    const start = new Date(sheetConfig.type === 'default' ? defaultUserForm.startDate : newUser.startDate);
    const months = parseInt(sheetConfig.type === 'default' ? defaultUserForm.months : newUser.months || 1);
    const end = new Date(start); end.setMonth(end.getMonth() + months);
    
    const formData = sheetConfig.type === 'default' ? defaultUserForm : newUser;
    const userObj = { id: Math.random().toString(36).substr(2, 9), ...formData, endDate: end.toISOString().split('T')[0] };
    saveData([...users, userObj]);
    setShowAddModal(false);
    setDefaultUserForm({ username: '', discordId: '', txid: '', plan: 'Premium', amount: 20, startDate: '', months: 1 });
    setNewUser({});
  };

  const handleCreateSheet = (e) => {
    e.preventDefault();
    if(newSheetName) {
      setSheetsList([...sheetsList, newSheetName]);
      const config = { type: newSheetType, columns: newSheetType === 'custom' ? customColumns.filter(c => c.trim() !== '') : [] };
      localStorage.setItem(`sheet_config_${newSheetName}`, JSON.stringify(config));
      setActiveSheet(newSheetName); setShowNewSheetModal(false); setNewSheetName('');
    }
  };

  const processedUsers = useMemo(() => {
    let data = users;
    if (searchQuery) data = data.filter(u => Object.values(u).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase())));
    return data.sort((a, b) => getStatus(a.endDate).days - getStatus(b.endDate).days);
  }, [users, searchQuery]);

  if (!isAuthenticated) return <LoginScreen onLogin={() => { localStorage.setItem('isAuth', 'true'); setIsAuthenticated(true); fetchData(); }} />;

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20 md:pb-0">
      <header className="bg-white border-b px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <h1 className="font-bold text-xl text-slate-800">Inspired Analyst</h1>
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

      {mobileMenuOpen && (
        <div className="md:hidden bg-white p-4 border-b">
           <div className="flex gap-2 overflow-x-auto pb-2">
              {sheetsList.map(s => <button key={s} onClick={()=>{setActiveSheet(s); setMobileMenuOpen(false)}} className={`px-3 py-1 rounded-full text-sm border ${activeSheet===s?'bg-indigo-600 text-white':'bg-white'}`}>{s}</button>)}
              <button onClick={()=>setShowNewSheetModal(true)} className="px-3 py-1 rounded-full text-sm border text-indigo-600">+ New</button>
           </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Subscribers List</h2>
          <div className="flex gap-2">
             <button onClick={fetchData} className="p-2 bg-white border rounded hover:bg-slate-50"><RefreshCw size={20} className={loading?'animate-spin':''}/></button>
             <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded shadow"><Plus size={20}/> Add User</button>
          </div>
        </div>

        {loading ? <div className="text-center py-20 text-slate-400">Loading...</div> : processedUsers.length === 0 ? <div className="text-center py-20 text-slate-400">No data found.</div> : (
            <div className="hidden md:block bg-white rounded-xl shadow border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b font-semibold text-slate-600">
                    <tr>
                      {sheetConfig.type === 'default' ? <><th className="px-4 py-3">Tier</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">End</th><th className="px-4 py-3">TxID</th><th className="px-4 py-3">Amount</th></> : sheetConfig.columns.map((c,i)=><th key={i} className="px-4 py-3">{c}</th>)}
                      {sheetConfig.type === 'custom' && <th className="px-4 py-3">Dates</th>}
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedUsers.map(user => {
                      const { status, days, color } = getStatus(user.endDate);
                      return (
                        <tr key={user.id} className="border-b hover:bg-slate-50">
                          {sheetConfig.type === 'default' ? (
                            <>
                              <td className="px-4 py-3"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded font-bold">{user.plan}</span></td>
                              <td className="px-4 py-3 font-bold">{user.username}<div className="text-xs text-slate-400 font-normal">{user.discordId}</div></td>
                              <td className="px-4 py-3 text-slate-600">{formatDate(user.startDate)}</td>
                              <td className="px-4 py-3 text-slate-600">{formatDate(user.endDate)}</td>
                              <td className="px-4 py-3 font-mono text-xs">{user.txid}</td>
                              <td className="px-4 py-3 font-bold">{formatCurrency(user.amount)}</td>
                            </>
                          ) : (
                            <>{sheetConfig.columns.map((c,i)=><td key={i} className="px-4 py-3">{user[c]}</td>)}<td className="px-4 py-3 text-xs">{formatDate(user.startDate)} - {formatDate(user.endDate)}</td></>
                          )}
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold border ${color}`}>{status} ({days}d)</span></td>
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
             <div key={user.id} className="bg-white p-4 rounded shadow border">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold">{sheetConfig.type==='default'?user.username:user[sheetConfig.columns[0]]}</h3>
                 <span className={`text-xs px-2 py-1 rounded border ${getStatus(user.endDate).color}`}>{getStatus(user.endDate).days} Days Left</span>
               </div>
               <div className="text-sm text-slate-500 mb-2">Expires: {formatDate(user.endDate)}</div>
             </div>
           ))}
        </div>
      </div>

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

      {showNewSheetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
           <div className="bg-white p-6 rounded-lg w-full max-w-sm">
              <h2 className="text-lg font-bold mb-4">New Sheet</h2>
              <input autoFocus placeholder="Sheet Name" className="w-full p-2 border rounded mb-4" value={newSheetName} onChange={e=>setNewSheetName(e.target.value)}/>
              <div className="flex gap-2 mb-4"><button type="button" onClick={()=>setNewSheetType('default')} className={`flex-1 py-2 border rounded text-xs ${newSheetType==='default'?'bg-indigo-600 text-white':''}`}>Default</button><button type="button" onClick={()=>setNewSheetType('custom')} className={`flex-1 py-2 border rounded text-xs ${newSheetType==='custom'?'bg-indigo-600 text-white':''}`}>Custom</button></div>
              {newSheetType === 'custom' && (
                 <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                    {customColumns.map((c,i)=><div key={i} className="flex gap-2"><input placeholder={`Column ${i+1}`} className="flex-1 p-2 border rounded text-xs" value={c} onChange={e=>{const n=[...customColumns];n[i]=e.target.value;setCustomColumns(n)}}/>{customColumns.length>1&&<button onClick={()=>{const n=[...customColumns];n.splice(i,1);setCustomColumns(n)}} className="text-red-500"><Minus size={14}/></button>}</div>)}
                    {customColumns.length<5 && <button onClick={()=>setCustomColumns([...customColumns,''])} className="text-xs text-indigo-600 flex items-center gap-1"><Plus size={12}/> Add Column</button>}
                 </div>
              )}
              <div className="flex gap-2"><button type="button" onClick={()=>setShowNewSheetModal(false)} className="flex-1 py-2 bg-slate-100 rounded">Cancel</button><button onClick={handleCreateSheet} disabled={!newSheetName} className="flex-1 py-2 bg-indigo-600 text-white rounded">Create</button></div>
           </div>
        </div>
      )}
    </div>
  );
}
