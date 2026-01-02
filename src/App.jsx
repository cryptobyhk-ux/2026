import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Download, 
  RefreshCw, 
  CreditCard,
  Trash2,
  ChevronDown,
  ExternalLink,
  Calendar,
  Hash,
  MinusCircle,
  PlusCircle,
  Gem,
  Image as ImageIcon,
  Clock
} from 'lucide-react';

// --- CONFIGURATION ---
// Isay TRUE karein jab Google Script URL daal dein
const USE_GOOGLE_SHEETS_API = true; 
const GOOGLE_API_URL = "https://script.google.com/macros/s/AKfycbyUqTpsKy61ePO91ucotXtcbGn91MaQaOZYhhb8QT_6-eMWAtknmkCsHAC2URLaVhckpQ/exec";

// --- HELPER FUNCTIONS ---

const formatDate = (dateString) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  // Agar YYYY-MM-DD hai to format karein, nahi to waise hi return karein
  if (parts.length === 3) {
     return new Date(dateString).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
     });
  }
  return dateString;
};

const calculateDaysRemaining = (endDateString) => {
  if (!endDateString) return 0;
  const end = new Date(endDateString);
  const now = new Date();
  end.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const getStatus = (endDateString) => {
  if (!endDateString) return { status: 'Active', days: 99, color: 'text-green-600 bg-green-50', icon: <CheckCircle2 size={14}/> };
  
  const days = calculateDaysRemaining(endDateString);
  if (days < 0) return { status: 'Expired', days, color: 'text-red-600 bg-red-50', icon: <XCircle size={14}/> };
  if (days <= 3) return { status: 'Expiring Soon', days, color: 'text-amber-600 bg-amber-50', icon: <AlertCircle size={14}/> };
  return { status: 'Active', days, color: 'text-green-600 bg-green-50', icon: <CheckCircle2 size={14}/> };
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount || 0);
};

// --- Mock Data Generators ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_SHEETS = [
  {
    id: 'sheet-1',
    name: 'Jan 2026', // Default current month
    customColumns: [],
    records: []
  }
];

const TIERS = {
  Diamond: 100,
  Platinum: 60,
  Premium: 20
};

// --- Components ---

const StatusBadge = ({ status }) => {
  const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : '';
  
  const styles = {
    active: 'bg-green-100 text-green-700 border-green-200',
    expiring: 'bg-amber-100 text-amber-700 border-amber-200',
    ended: 'bg-red-100 text-red-700 border-red-200',
  };

  const getStyleKey = () => {
    if (normalizedStatus.includes('active')) return 'active';
    if (normalizedStatus.includes('expiring')) return 'expiring';
    return 'ended';
  };

  const styleKey = getStyleKey();

  const icons = {
    active: <CheckCircle2 size={14} className="mr-1" />,
    expiring: <AlertCircle size={14} className="mr-1" />,
    ended: <XCircle size={14} className="mr-1" />,
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[styleKey]}`}>
      {icons[styleKey]}
      {status}
    </span>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b shrink-0">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- Invoice Modal ---
const InvoiceModal = ({ user, onClose }) => {
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => setIsLibraryLoaded(true);
      document.body.appendChild(script);
    } else {
      setIsLibraryLoaded(true);
    }
  }, []);

  const downloadPNG = async () => {
    if (!window.html2canvas || isGenerating) return;
    setIsGenerating(true);
    
    try {
      const element = document.getElementById('invoice-print-area');
      const canvas = await window.html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `Invoice_${user.discordUsername.replace(/[^a-z0-9]/gi, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Failed", err);
      alert("Error generating invoice.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center p-4 border-b bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">Invoice Preview</h3>
          <button onClick={onClose}><XCircle size={24} className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        
        <div className="bg-slate-100 p-6 overflow-y-auto max-h-[60vh] flex justify-center">
          <div id="invoice-print-area" className="bg-white p-8 shadow-lg max-w-lg w-full text-slate-800 border border-slate-200">
            <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-indigo-700">INVOICE</h1>
                <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">Receipt #{Math.floor(Math.random() * 10000)}</p>
              </div>
              <div className="text-right">
                <h2 className="font-bold text-xl text-slate-800">Inspired Analyst</h2>
                <p className="text-sm text-slate-500 font-medium">Subscription Services</p>
                <p className="text-xs text-slate-400 mt-1">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Billed To</h3>
              <p className="text-xl font-bold text-slate-800">{user.discordUsername}</p>
              <p className="text-sm text-slate-600 mt-1">TxID: <span className="font-mono bg-white px-1 border rounded">{user.txid}</span></p>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-slate-100 text-xs uppercase text-slate-500">
                  <th className="text-left py-3 font-bold">Description</th>
                  <th className="text-right py-3 font-bold">Period</th>
                  <th className="text-right py-3 font-bold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50 text-sm">
                  <td className="py-4 font-medium text-slate-700">{user.plan} Plan</td>
                  <td className="py-4 text-right text-slate-500">{user.startDate ? `${formatDate(user.startDate)} - ` : ''}{formatDate(user.endDate)}</td>
                  <td className="py-4 text-right font-bold text-slate-800">{formatCurrency(user.amount)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="2" className="pt-4 text-right font-bold text-slate-600">Total</td>
                  <td className="pt-4 text-right font-extrabold text-indigo-600 text-lg">{formatCurrency(user.amount)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-8 text-center pt-6 border-t border-slate-100">
              <p className="font-bold text-indigo-900 text-sm">Thanks for choosing Inspired Analyst!</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Close</button>
          <button onClick={downloadPNG} disabled={!isLibraryLoaded || isGenerating} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-70">
            {isGenerating ? <RefreshCw size={18} className="animate-spin"/> : <ImageIcon size={18}/>}
            {isGenerating ? 'Generating...' : 'Download PNG'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Details Modal ---
const DetailsModal = ({ user, onClose, onRenew, onDelete, onInvoice }) => {
  if (!user) return null;
  const statusMeta = user.statusData || getStatus(user.endDate);
  const { status, days, color, icon } = statusMeta;
  
  const calculateProgress = () => {
    if (!user.startDate || !user.endDate) return 0;
    const start = new Date(user.startDate).getTime();
    const end = new Date(user.endDate).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const progress = calculateProgress();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="relative h-24 bg-gradient-to-r from-violet-600 to-indigo-600 p-6 flex justify-end">
          <button onClick={onClose} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full backdrop-blur-md"><XCircle size={20} /></button>
        </div>
        <div className="px-6 pb-6 -mt-12">
          <div className="flex justify-between items-end">
            <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-lg rotate-3 hover:rotate-0 transition-transform">
              <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-3xl font-bold text-indigo-600 uppercase border border-slate-200">
                {user.discordUsername ? user.discordUsername.charAt(0) : 'U'}
              </div>
            </div>
            <div className={`mb-1 px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shadow-sm ${color.replace('bg-', 'bg-opacity-10 ')}`}>{icon} {status}</div>
          </div>
          
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">{user.discordUsername}</h2>
            <div className="mt-1"><span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded font-mono border border-slate-200">{user.txid || 'No TxID'}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Plan</p>
              <div className="flex items-center gap-1.5"><Gem size={16} className="text-indigo-500" /><span className="font-bold text-slate-700">{user.plan}</span></div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Amount</p>
              <span className="font-bold text-slate-700 text-lg">{formatCurrency(user.amount)}</span>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between items-end mb-2">
              <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subscription</p><p className="text-sm font-semibold text-slate-700 mt-0.5">{days} Days Remaining</p></div>
              <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{formatDate(user.endDate)}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ease-out ${days < 3 ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-400 to-indigo-600'}`} style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8">
            <button onClick={() => { onRenew(user.id); onClose(); }} className="group flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100">
              <RefreshCw size={20} className="group-hover:rotate-180 transition-transform" /><span className="text-[10px] font-bold uppercase">Renew</span>
            </button>
            <button onClick={() => { onInvoice(user); }} className="group flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100">
              <Download size={20} className="group-hover:-translate-y-0.5 transition-transform" /><span className="text-[10px] font-bold uppercase">Invoice</span>
            </button>
            <button onClick={() => { onDelete(user.id); onClose(); }} className="group flex flex-col items-center justify-center gap-1 py-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100">
              <Trash2 size={20} className="group-hover:scale-110 transition-transform" /><span className="text-[10px] font-bold uppercase">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function SubscriptionDashboard() {
  const [sheets, setSheets] = useState(INITIAL_SHEETS);
  const [activeSheetId, setActiveSheetId] = useState(INITIAL_SHEETS[0].id);
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSheetModal, setShowSheetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserForInvoice, setSelectedUserForInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newSheetName, setNewSheetName] = useState('');
  const [sheetType, setSheetType] = useState('default');
  const [customColumnsList, setCustomColumnsList] = useState(['']); 

  const [newUser, setNewUser] = useState({
    discordUsername: '',
    txid: '',
    customValues: {},
    plan: 'Premium',
    amount: 20,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];
  const isCustomSheet = activeSheet.customColumns && activeSheet.customColumns.length > 0;
  
  const processedRecords = useMemo(() => {
    return activeSheet.records.map(record => {
      const statusData = getStatus(record.endDate);
      return { ...record, status: statusData.status, statusData };
    }).sort((a, b) => {
      const getScore = (s) => s.includes('Expiring') ? 0 : s === 'Active' ? 1 : 2;
      return getScore(a.status) - getScore(b.status);
    });
  }, [activeSheet]);

  const filteredRecords = processedRecords.filter(r => 
    r.discordUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.txid.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => {
    return {
      totalRevenue: processedRecords.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
      activeCount: processedRecords.filter(r => r.status.toLowerCase().includes('active')).length,
      expiringCount: processedRecords.filter(r => r.status.toLowerCase().includes('expiring')).length,
      endedCount: processedRecords.filter(r => r.status.toLowerCase().includes('ended')).length,
    };
  }, [processedRecords]);

  // Effects
  useEffect(() => {
    if (TIERS[newUser.plan]) setNewUser(prev => ({ ...prev, amount: TIERS[prev.plan] }));
  }, [newUser.plan]);

  useEffect(() => {
    if (USE_GOOGLE_SHEETS_API && GOOGLE_API_URL.includes("http")) {
      setGoogleConnected(true);
      handleSync(); // Initial fetch
    }
  }, []);

  // --- ACTIONS ---

  const handleSync = async () => {
    setIsSyncing(true);
    
    if (USE_GOOGLE_SHEETS_API && googleConnected) {
      try {
        // Fetch sheets list first
        const sheetListRes = await fetch(`${GOOGLE_API_URL}?action=getSheets`);
        const sheetListData = await sheetListRes.json();
        
        // Fetch users for active sheet
        const res = await fetch(`${GOOGLE_API_URL}?action=getUsers&sheet=${activeSheet.name}`);
        const data = await res.json();
        
        if (data && data.users) {
          setSheets(prev => prev.map(s => {
            if (s.id === activeSheetId) return { ...s, records: data.users };
            return s;
          }));
        }
      } catch (error) {
        console.error("Sync Error:", error);
      }
    } else {
      // Mock sync delay
      setTimeout(() => {}, 1000);
    }
    
    setIsSyncing(false);
  };

  const saveData = async (newRecords) => {
    // 1. Update React State Immediately (Optimistic UI)
    const updatedSheets = sheets.map(sheet => {
      if (sheet.id === activeSheetId) return { ...sheet, records: newRecords };
      return sheet;
    });
    setSheets(updatedSheets);

    // 2. Send to Backend if Connected
    if (USE_GOOGLE_SHEETS_API && googleConnected) {
      setIsSyncing(true);
      
      // Flatten data for custom sheets before sending if needed
      let payloadUsers = newRecords;
      if (isCustomSheet) {
        payloadUsers = newRecords.map(u => ({
          ...u.customValues, // Spread custom values to top level for backend
          id: u.id
        }));
      }

      const payload = {
        action: 'saveData',
        sheetName: activeSheet.name,
        users: payloadUsers,
        // Backend detects 'Tier' in headers for default template
        headers: isCustomSheet ? activeSheet.customColumns : ['Tier', 'Username', 'Discord ID', 'TxID', 'Amount', 'Start Date', 'End Date'],
        keys: isCustomSheet ? activeSheet.customColumns : ['plan', 'username', 'discordId', 'txid', 'amount', 'startDate', 'endDate']
      };

      try {
        await fetch(GOOGLE_API_URL, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.error("Save failed", e);
        alert("Failed to save to Google Sheets.");
      }
      setIsSyncing(false);
    } else {
      // Local Storage Fallback
      localStorage.setItem('sub_dashboard_data', JSON.stringify(updatedSheets));
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    let record = {
      id: generateId(),
      discordUsername: isCustomSheet ? (newUser.customValues[activeSheet.customColumns[0]] || 'Record') : newUser.discordUsername,
      txid: isCustomSheet ? '-' : newUser.txid,
      customValues: newUser.customValues,
      plan: isCustomSheet ? 'Custom' : newUser.plan,
      amount: isCustomSheet ? 0 : newUser.amount,
      startDate: isCustomSheet ? null : newUser.startDate,
      endDate: isCustomSheet ? null : newUser.endDate,
    };

    saveData([...activeSheet.records, record]);
    setShowAddModal(false);
    setNewUser({ discordUsername: '', txid: '', customValues: {}, plan: 'Premium', amount: 20, startDate: new Date().toISOString().split('T')[0], endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] });
  };

  const handleCreateSheet = (e) => {
    e.preventDefault();
    if (!newSheetName) return;
    const finalCustomColumns = sheetType === 'custom' ? customColumnsList.filter(c => c.trim() !== '') : [];
    const newSheet = {
      id: generateId(),
      name: newSheetName,
      customColumns: finalCustomColumns,
      records: []
    };
    setSheets(prev => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
    setShowSheetModal(false);
    setNewSheetName('');
    
    // Save empty sheet to trigger creation in backend
    if(USE_GOOGLE_SHEETS_API && googleConnected) {
       saveData([]); // Send empty array to create sheet structure
    }
  };

  const handleDeleteUser = (userId) => {
    if(confirm('Delete this record?')) {
       const newRecords = activeSheet.records.filter(r => r.id !== userId);
       saveData(newRecords);
       setSelectedUser(null);
    }
  };

  const handleRenewUser = (userId) => {
    const newRecords = activeSheet.records.map(r => {
        if (r.id === userId && r.endDate) {
            const currentEnd = new Date(r.endDate);
            currentEnd.setMonth(currentEnd.getMonth() + 1);
            return { ...r, endDate: currentEnd.toISOString().split('T')[0] };
        }
        return r;
    });
    saveData(newRecords);
  };

  const handleCustomValueChange = (colName, value) => {
    setNewUser(prev => ({ ...prev, customValues: { ...prev.customValues, [colName]: value } }));
  };

  // ... (Rest of JSX Render remains same as before) ...
  // Returning main layout to keep file size managed, the render part logic is identical to previous working version.
  
  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20 hidden md:flex">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-500 rounded-lg"><LayoutDashboard size={20} className="text-white" /></div>
          <span className="font-bold text-lg tracking-tight">SubManager</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button className="flex items-center w-full gap-3 px-4 py-3 bg-indigo-600/20 text-indigo-300 rounded-lg border-l-4 border-indigo-500"><LayoutDashboard size={18} /><span>Dashboard</span></button>
          <div className="px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 mt-8">
            <div className="flex items-center gap-2 mb-2"><FileSpreadsheet size={16} className="text-green-400" /><span className="text-sm font-medium">Google Sheets</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-slate-400">{googleConnected ? 'Connected' : 'Mock Mode'}</span><div className={`w-2 h-2 rounded-full ${googleConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div></div>
            {googleConnected && (<div className="mt-2 text-xs text-slate-500 flex items-center gap-1"><RefreshCw size={10} className={isSyncing ? 'animate-spin' : ''} />{isSyncing ? 'Syncing...' : 'Idle'}</div>)}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Dashboard</h1>
            <div className="relative group">
              <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg cursor-pointer border border-transparent hover:border-slate-300">
                <FileSpreadsheet size={16} className="text-green-600" />
                <select className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 cursor-pointer appearance-none pr-6" value={activeSheetId} onChange={(e) => setActiveSheetId(e.target.value)} style={{ backgroundImage: 'none' }}>
                  {sheets.map(sheet => (<option key={sheet.id} value={sheet.id}>{sheet.name}</option>))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
            <button onClick={() => setShowSheetModal(true)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="New Sheet"><Plus size={18} /></button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." className="pl-9 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-indigo-500 w-64" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full"><Bell size={20} />{stats.expiringCount > 0 && (<span className="absolute top-1.5 right-2 w-2 h-2 bg-amber-500 rounded-full border border-white"></span>)}</button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex justify-between"><div><p className="text-sm font-medium text-slate-500">Total Revenue</p><p className="text-2xl font-bold text-slate-800">{formatCurrency(stats.totalRevenue)}</p></div><div className="p-3 bg-green-50 rounded-lg text-green-600"><CreditCard size={24} /></div></div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex justify-between"><div><p className="text-sm font-medium text-slate-500">Active Users</p><p className="text-2xl font-bold text-slate-800">{stats.activeCount}</p></div><div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Users size={24} /></div></div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex justify-between"><div><p className="text-sm font-medium text-slate-500">Expiring Soon</p><p className="text-2xl font-bold text-amber-600">{stats.expiringCount}</p></div><div className="p-3 bg-amber-50 rounded-lg text-amber-600"><AlertCircle size={24} /></div></div>
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex justify-between"><div><p className="text-sm font-medium text-slate-500">Ended</p><p className="text-2xl font-bold text-slate-400">{stats.endedCount}</p></div><div className="p-3 bg-slate-50 rounded-lg text-slate-400"><XCircle size={24} /></div></div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">Current Subscribers <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{activeSheet.name}</span></h2>
            <div className="flex gap-2">
              <button onClick={handleSync} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"><RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> Sync</button>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-md"><Plus size={16} /> Add Record</button>
            </div>
          </div>

          {/* List View */}
          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
              <div className="p-4 bg-slate-50 rounded-full mb-4"><Users size={32} className="text-slate-300" /></div>
              <h3 className="text-lg font-medium text-slate-600">No records found</h3>
              <button onClick={() => setShowAddModal(true)} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm mt-2">Add Record Now</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <div className="col-span-5">{isCustomSheet ? activeSheet.customColumns[0] || 'Name' : 'User'}</div>
                <div className="col-span-4 text-right sm:text-left">{isCustomSheet ? '' : 'End Date'}</div>
                <div className="col-span-3 text-right">{isCustomSheet ? '' : 'Status'}</div>
              </div>
              <div className="divide-y divide-slate-100">
                {filteredRecords.map((user) => (
                  <div key={user.id} onClick={() => setSelectedUser(user)} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">{user.discordUsername.charAt(0).toUpperCase()}</div>
                      <span className="font-medium text-slate-700 truncate">{user.discordUsername}</span>
                    </div>
                    <div className="col-span-4 text-sm text-slate-600 text-right sm:text-left">{!isCustomSheet && formatDate(user.endDate)}</div>
                    <div className="col-span-3 flex justify-end sm:justify-start">{!isCustomSheet && <StatusBadge status={user.status} />}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {selectedUser && <DetailsModal user={selectedUser} onClose={() => setSelectedUser(null)} onRenew={handleRenewUser} onDelete={handleDeleteUser} onInvoice={setSelectedUserForInvoice} />}
      {selectedUserForInvoice && <InvoiceModal user={selectedUserForInvoice} onClose={() => setSelectedUserForInvoice(null)} />}
      
      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={isCustomSheet ? "Add New Record" : "Add New Subscription"}>
        <form onSubmit={handleAddUser} className="space-y-4">
          {!isCustomSheet && (
            <>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Discord Username</label><input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" value={newUser.discordUsername} onChange={e => setNewUser({...newUser, discordUsername: e.target.value})}/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">TxID</label><input required type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" value={newUser.txid} onChange={e => setNewUser({...newUser, txid: e.target.value})}/></div>
            </>
          )}
          {activeSheet.customColumns?.map(col => (
             <div key={col}><label className="block text-sm font-medium text-slate-700 mb-1">{col}</label><input type="text" className="w-full px-3 py-2 border rounded-lg outline-none focus:border-indigo-500" value={newUser.customValues?.[col] || ''} onChange={e => handleCustomValueChange(col, e.target.value)}/></div>
          ))}
          {!isCustomSheet && (
            <>
              <div><label className="block text-sm font-medium text-slate-700 mb-2">Select Plan</label>
                <div className="grid grid-cols-3 gap-3">{Object.keys(TIERS).map(tier => (<button key={tier} type="button" onClick={() => setNewUser({ ...newUser, plan: tier })} className={`py-3 px-4 rounded-xl text-sm font-bold border-2 flex items-center justify-center gap-2 ${newUser.plan === tier ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}><Gem size={16} />{tier}</button>))}</div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Amount ($)</label><input type="number" className="w-full px-3 py-2 border rounded-lg outline-none focus:border-indigo-500" value={newUser.amount} onChange={e => setNewUser({...newUser, amount: e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label><input type="date" className="w-full px-3 py-2 border rounded-lg" value={newUser.startDate} onChange={e => setNewUser({...newUser, startDate: e.target.value})}/></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">End Date</label><input type="date" className="w-full px-3 py-2 border rounded-lg" value={newUser.endDate} onChange={e => setNewUser({...newUser, endDate: e.target.value})}/></div>
              </div>
            </>
          )}
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">Save Record</button>
        </form>
      </Modal>

      {/* Add Sheet Modal */}
      <Modal isOpen={showSheetModal} onClose={() => setShowSheetModal(false)} title="Create New Sheet">
         <form onSubmit={handleCreateSheet} className="space-y-4">
           <div><label className="block text-sm font-medium text-slate-700 mb-1">Sheet Name</label><input autoFocus type="text" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Jan 2026" value={newSheetName} onChange={e => setNewSheetName(e.target.value)}/></div>
           <div className="space-y-2 pt-2 border-t border-slate-100"><label className="block text-sm font-medium text-slate-700">Type</label>
             <div className="grid grid-cols-2 gap-3">
               <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${sheetType === 'default' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}><input type="radio" name="st" checked={sheetType === 'default'} onChange={() => setSheetType('default')} className="text-indigo-600"/><span className="text-sm font-medium">Default</span></label>
               <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${sheetType === 'custom' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}><input type="radio" name="st" checked={sheetType === 'custom'} onChange={() => setSheetType('custom')} className="text-indigo-600"/><span className="text-sm font-medium">Custom</span></label>
             </div>
           </div>
           {sheetType === 'custom' && (
             <div className="space-y-3"><label className="block text-sm font-medium text-slate-700">Columns</label>
               {customColumnsList.map((col, i) => (<div key={i} className="flex gap-2"><input type="text" className="flex-1 px-3 py-2 border rounded-lg" placeholder={`Column ${i+1}`} value={col} onChange={e => {const l=[...customColumnsList]; l[i]=e.target.value; setCustomColumnsList(l)}}/>{customColumnsList.length > 1 && <button type="button" onClick={() => {const l=[...customColumnsList]; l.splice(i,1); setCustomColumnsList(l)}} className="p-2 text-slate-400 hover:text-red-500"><MinusCircle/></button>}</div>))}
               <button type="button" onClick={() => setCustomColumnsList([...customColumnsList, ''])} className="text-indigo-600 text-sm font-medium flex items-center gap-2"><PlusCircle size={16}/> Add Column</button>
             </div>
           )}
           <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold">Create Sheet</button>
         </form>
      </Modal>
    </div>
  );
}
