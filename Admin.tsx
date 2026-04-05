import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Trophy, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Plus, 
  Gamepad2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Users,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  Timestamp, 
  doc, 
  runTransaction, 
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { formatFirestoreDate } from '../utils';

const Admin: React.FC = () => {
  const { isAdmin, tournaments, adminRechargeRequests, adminWithdrawRequests } = useAppContext();
  const [activeTab, setActiveTab] = useState<'tournaments' | 'recharges' | 'withdrawals' | 'results'>('tournaments');
  const [showAddTournament, setShowAddTournament] = useState(false);
  const [showAddResult, setShowAddResult] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  // Form states
  const [newTournament, setNewTournament] = useState({
    gameName: '',
    prizePool: '',
    entryFee: '',
    perKill: '',
    totalPlayers: '',
    matchTime: '',
    imageURL: '',
    roomId: 'Locked',
    roomPass: 'Locked',
    status: 'upcoming' as 'upcoming' | 'live' | 'completed'
  });

  const [newResult, setNewResult] = useState({
    userEmail: '',
    gameName: '',
    rank: '',
    earnings: ''
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const handleAddTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'tournaments'), {
        ...newTournament,
        prizePool: parseFloat(newTournament.prizePool) || 0,
        entryFee: parseFloat(newTournament.entryFee) || 0,
        perKill: parseFloat(newTournament.perKill) || 0,
        totalPlayers: parseInt(newTournament.totalPlayers) || 0,
        joinedPlayers: 0,
        matchTime: newTournament.matchTime ? Timestamp.fromDate(new Date(newTournament.matchTime)) : Timestamp.now(),
        createdAt: Timestamp.now()
      });
      setShowAddTournament(false);
      setNewTournament({ 
        gameName: '', 
        prizePool: '', 
        entryFee: '', 
        perKill: '', 
        totalPlayers: '', 
        matchTime: '', 
        imageURL: '',
        roomId: 'Locked',
        roomPass: 'Locked',
        status: 'upcoming'
      });
    } catch (err) {
      console.error("Failed to add tournament:", err);
    }
  };

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const q = query(collection(db, 'users'), where('email', '==', newResult.userEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        alert("User not found");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      const earnings = parseFloat(newResult.earnings);

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw new Error("User not found");
        
        const currentData = userSnap.data();
        const isWin = parseInt(newResult.rank) === 1;
        transaction.update(userRef, {
          balance: (currentData.balance || 0) + earnings,
          totalEarnings: (currentData.totalEarnings || 0) + earnings,
          weeklyEarnings: (currentData.weeklyEarnings || 0) + earnings,
          monthlyEarnings: (currentData.monthlyEarnings || 0) + earnings,
          totalWins: isWin ? (currentData.totalWins || 0) + 1 : (currentData.totalWins || 0)
        });

        const resultRef = doc(collection(db, 'results'));
        transaction.set(resultRef, {
          userId,
          userEmail: newResult.userEmail,
          gameName: newResult.gameName,
          rank: parseInt(newResult.rank),
          earnings: earnings,
          createdAt: Timestamp.now()
        });
      });

      setShowAddResult(false);
      setNewResult({ userEmail: '', gameName: '', rank: '', earnings: '' });
    } catch (err) {
      console.error("Failed to add result:", err);
    }
  };

  const handleApproveRecharge = async (request: any) => {
    setProcessing(request.id);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', request.userId);
        const requestRef = doc(db, 'rechargeRequests', request.id);
        
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        
        const currentBalance = userSnap.data().balance || 0;
        transaction.update(userRef, {
          balance: currentBalance + request.amount
        });
        
        transaction.update(requestRef, {
          status: 'approved',
          processedAt: Timestamp.now()
        });
      });
    } catch (err) {
      console.error("Approval failed:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRecharge = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await updateDoc(doc(db, 'rechargeRequests', requestId), {
        status: 'rejected',
        processedAt: Timestamp.now()
      });
    } catch (err) {
      console.error("Rejection failed:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleApproveWithdraw = async (requestId: string) => {
    setProcessing(requestId);
    try {
      await updateDoc(doc(db, 'withdrawRequests', requestId), {
        status: 'approved',
        processedAt: Timestamp.now()
      });
    } catch (err) {
      console.error("Withdrawal approval failed:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectWithdraw = async (request: any) => {
    setProcessing(request.id);
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', request.userId);
        const requestRef = doc(db, 'withdrawRequests', request.id);
        
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        
        const currentBalance = userSnap.data().balance || 0;
        // Refund balance on rejection
        transaction.update(userRef, {
          balance: currentBalance + request.amount
        });
        
        transaction.update(requestRef, {
          status: 'rejected',
          processedAt: Timestamp.now()
        });
      });
    } catch (err) {
      console.error("Withdrawal rejection failed:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteTournament = async (id: string) => {
    if (window.confirm("Delete this tournament?")) {
      await deleteDoc(doc(db, 'tournaments', id));
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">ACCESS DENIED</h2>
        <p className="text-zinc-500 max-w-xs">You do not have administrative privileges to access this area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">ADMIN DASHBOARD</h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Manage the arena</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('tournaments')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'tournaments' ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Tournaments
          </button>
          <button 
            onClick={() => setActiveTab('recharges')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'recharges' ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Recharges
          </button>
          <button 
            onClick={() => setActiveTab('withdrawals')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'withdrawals' ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Withdrawals
          </button>
          <button 
            onClick={() => setActiveTab('results')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'results' ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Results
          </button>
        </div>
      </div>

      {/* Tournaments Tab */}
      {activeTab === 'tournaments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Active Tournaments</h3>
            <button 
              onClick={() => setShowAddTournament(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-5 h-5" /> ADD NEW
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((t) => {
              const title = t.gameName || "Game";
              const image = t.imageURL || "";
              const password = t.roomPass || "";
              const roomId = t.roomId || "";
              const prizePool = t.prizePool || 0;
              const entryFee = t.entryFee || 0;
              const perKill = t.perKill || 0;
              const totalPlayers = t.totalPlayers || 0;
              const joinedPlayers = t.joinedPlayers || 0;

              return (
                <div key={t.id} className="bg-zinc-900 rounded-3xl border border-white/5 p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden">
                        {image ? (
                          <img src={image} alt={title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Gamepad2 className="w-6 h-6 text-emerald-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-white">{title} ({t.mode})</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{formatFirestoreDate(t.matchTime)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteTournament(t.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-950 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Prize Pool</p>
                      <p className="text-sm font-black text-emerald-500">₹{formatNumber(prizePool)}</p>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Entry</p>
                      <p className="text-sm font-black text-white">₹{formatNumber(entryFee)}</p>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Per Kill</p>
                      <p className="text-sm font-black text-white">₹{formatNumber(perKill)}</p>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Players</p>
                      <p className="text-sm font-black text-white">{joinedPlayers}/{totalPlayers}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Room ID</p>
                      <p className="text-xs font-bold text-white">{roomId || 'Locked'}</p>
                    </div>
                    <div className="p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Password</p>
                      <p className="text-xs font-bold text-white">{password || 'Locked'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recharges Tab */}
      {activeTab === 'recharges' && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Pending Recharges</h3>
          <div className="grid grid-cols-1 gap-4">
            {adminRechargeRequests.length === 0 ? (
              <div className="bg-zinc-900 rounded-3xl border border-white/5 p-12 text-center">
                <ArrowUpCircle className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest">No pending requests</p>
              </div>
            ) : (
              adminRechargeRequests.map((req) => (
                <div key={req.id} className="bg-zinc-900 rounded-3xl border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5">
                      <ArrowUpCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white">₹{formatNumber(req.amount)}</h4>
                      <p className="text-xs text-zinc-500 font-bold">{req.userEmail}</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-1 uppercase tracking-widest">ID: {req.transactionId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button 
                      onClick={() => handleRejectRecharge(req.id)}
                      disabled={processing === req.id}
                      className="flex-1 sm:flex-none px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black rounded-2xl border border-red-500/20 transition-all"
                    >
                      REJECT
                    </button>
                    <button 
                      onClick={() => handleApproveRecharge(req)}
                      disabled={processing === req.id}
                      className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {processing === req.id ? '...' : 'APPROVE'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Pending Withdrawals</h3>
          <div className="grid grid-cols-1 gap-4">
            {adminWithdrawRequests.length === 0 ? (
              <div className="bg-zinc-900 rounded-3xl border border-white/5 p-12 text-center">
                <ArrowDownCircle className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest">No pending withdrawals</p>
              </div>
            ) : (
              adminWithdrawRequests.map((req) => (
                <div key={req.id} className="bg-zinc-900 rounded-3xl border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5">
                      <ArrowDownCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white">₹{formatNumber(req.amount)}</h4>
                      <p className="text-xs text-zinc-500 font-bold">{req.userEmail}</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-1 uppercase tracking-widest">UPI: {req.upiId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button 
                      onClick={() => handleRejectWithdraw(req)}
                      disabled={processing === req.id}
                      className="flex-1 sm:flex-none px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black rounded-2xl border border-red-500/20 transition-all"
                    >
                      REJECT & REFUND
                    </button>
                    <button 
                      onClick={() => handleApproveWithdraw(req.id)}
                      disabled={processing === req.id}
                      className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      {processing === req.id ? '...' : 'APPROVE'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Add Match Results</h3>
            <button 
              onClick={() => setShowAddResult(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <Plus className="w-5 h-5" /> ADD RESULT
            </button>
          </div>
          
          <div className="bg-zinc-900 rounded-3xl border border-white/5 p-12 text-center text-zinc-500">
            <p className="font-bold uppercase tracking-widest">Select "Add Result" to credit winnings to a player</p>
          </div>
        </div>
      )}

      {/* Add Tournament Modal */}
      <AnimatePresence>
        {showAddTournament && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-8 tracking-tight">NEW TOURNAMENT</h2>
              <form onSubmit={handleAddTournament} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Game Name (Title)</label>
                  <input 
                    type="text"
                    value={newTournament.gameName}
                    onChange={(e) => setNewTournament({...newTournament, gameName: e.target.value})}
                    placeholder="e.g. BGMI, Free Fire"
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Image URL</label>
                  <input 
                    type="text"
                    value={newTournament.imageURL}
                    onChange={(e) => setNewTournament({...newTournament, imageURL: e.target.value})}
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Prize Pool</label>
                    <input 
                      type="number"
                      value={newTournament.prizePool}
                      onChange={(e) => setNewTournament({...newTournament, prizePool: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Entry Fee</label>
                    <input 
                      type="number"
                      value={newTournament.entryFee}
                      onChange={(e) => setNewTournament({...newTournament, entryFee: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Per Kill</label>
                    <input 
                      type="number"
                      value={newTournament.perKill}
                      onChange={(e) => setNewTournament({...newTournament, perKill: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Total Players</label>
                    <input 
                      type="number"
                      value={newTournament.totalPlayers}
                      onChange={(e) => setNewTournament({...newTournament, totalPlayers: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Match Time</label>
                    <input 
                      type="datetime-local"
                      value={newTournament.matchTime}
                      onChange={(e) => setNewTournament({...newTournament, matchTime: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Room ID</label>
                    <input 
                      type="text"
                      value={newTournament.roomId}
                      onChange={(e) => setNewTournament({...newTournament, roomId: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Password</label>
                    <input 
                      type="text"
                      value={newTournament.roomPass}
                      onChange={(e) => setNewTournament({...newTournament, roomPass: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Status</label>
                  <select 
                    value={newTournament.status}
                    onChange={(e) => setNewTournament({...newTournament, status: e.target.value as any})}
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddTournament(false)}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    CREATE
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Result Modal */}
      <AnimatePresence>
        {showAddResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-8 tracking-tight">ADD MATCH RESULT</h2>
              <form onSubmit={handleAddResult} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">User Email</label>
                  <input 
                    type="email"
                    value={newResult.userEmail}
                    onChange={(e) => setNewResult({...newResult, userEmail: e.target.value})}
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Game Name</label>
                  <input 
                    type="text"
                    value={newResult.gameName}
                    onChange={(e) => setNewResult({...newResult, gameName: e.target.value})}
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Rank</label>
                    <input 
                      type="number"
                      value={newResult.rank}
                      onChange={(e) => setNewResult({...newResult, rank: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Earnings (₹)</label>
                    <input 
                      type="number"
                      value={newResult.earnings}
                      onChange={(e) => setNewResult({...newResult, earnings: e.target.value})}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddResult(false)}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                  >
                    CREDIT
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Admin;
