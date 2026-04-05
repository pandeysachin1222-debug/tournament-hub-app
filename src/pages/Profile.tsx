import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  User, 
  Wallet, 
  Trophy, 
  ShieldCheck, 
  LogOut, 
  ChevronRight,
  Mail,
  Gamepad2,
  Medal,
  CreditCard,
  Check,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

const Profile: React.FC = () => {
  const { user, userData } = useAppContext();
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [newUpiId, setNewUpiId] = useState(userData?.upiId || '');
  const [updating, setUpdating] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpdateUpi = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        upiId: newUpiId
      });
      setIsEditingUpi(false);
    } catch (error) {
      console.error("Failed to update UPI ID:", error);
    } finally {
      setUpdating(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="relative bg-zinc-900 rounded-[3rem] border border-white/5 p-10 text-center space-y-6 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 blur-3xl -translate-y-1/2" />
        
        <div className="relative">
          <div className="w-32 h-32 bg-zinc-950 rounded-[2.5rem] flex items-center justify-center mx-auto border-4 border-zinc-900 shadow-2xl">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-[2.5rem] object-cover" />
            ) : (
              <User className="w-16 h-16 text-zinc-800" />
            )}
          </div>
          <div className="absolute bottom-0 right-1/2 translate-x-16 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-zinc-900 flex items-center justify-center shadow-lg">
            <ShieldCheck className="w-5 h-5 text-zinc-950" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">{user?.displayName || 'Elite Player'}</h2>
          <div className="flex items-center justify-center gap-2 text-zinc-500">
            <Mail className="w-4 h-4" />
            <span className="text-sm font-bold">{user?.email}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-zinc-950 rounded-3xl border border-white/5">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Wallet Balance</p>
            <div className="flex items-center justify-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-black text-white">₹{formatNumber(userData?.balance)}</span>
            </div>
          </div>
          <div className="p-6 bg-zinc-950 rounded-3xl border border-white/5">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Total Earnings</p>
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-black text-white">₹{formatNumber(userData?.totalEarnings)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900 rounded-[2rem] border border-white/5 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-white/5">
            <Gamepad2 className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Matches</p>
            <p className="text-xl font-black text-white">{formatNumber(userData?.totalMatches)}</p>
          </div>
        </div>
        <div className="bg-zinc-900 rounded-[2rem] border border-white/5 p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-white/5">
            <Medal className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Total Wins</p>
            <p className="text-xl font-black text-white">{formatNumber(userData?.totalWins)}</p>
          </div>
        </div>
      </div>

      {/* UPI Settings */}
      <div className="bg-zinc-900 rounded-[2rem] border border-white/5 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-white/5">
              <CreditCard className="w-6 h-6 text-zinc-500" />
            </div>
            <div>
              <p className="text-lg font-black text-white">Withdrawal Method</p>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">UPI ID for payouts</p>
            </div>
          </div>
          {!isEditingUpi && (
            <button 
              onClick={() => {
                setNewUpiId(userData?.upiId || '');
                setIsEditingUpi(true);
              }}
              className="p-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-500 rounded-xl border border-white/5 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isEditingUpi ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-3"
            >
              <input 
                type="text"
                value={newUpiId}
                onChange={(e) => setNewUpiId(e.target.value)}
                placeholder="example@upi"
                className="flex-1 bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50"
              />
              <button 
                onClick={handleUpdateUpi}
                disabled={updating}
                className="px-6 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center"
              >
                {updating ? <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" /> : <Check className="w-6 h-6" />}
              </button>
              <button 
                onClick={() => setIsEditingUpi(false)}
                className="px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-black rounded-2xl transition-all"
              >
                CANCEL
              </button>
            </motion.div>
          ) : (
            <div className="p-6 bg-zinc-950 rounded-2xl border border-white/5">
              <p className="text-zinc-400 font-mono text-lg tracking-wider">{userData?.upiId || 'Not set'}</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full py-6 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black rounded-[2rem] border border-red-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
      >
        <LogOut className="w-6 h-6" />
        SIGN OUT FROM HUB
      </button>

      <div className="text-center space-y-2">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Tournament Hub v2.0.0</p>
        <p className="text-zinc-800 text-[10px] font-black uppercase tracking-widest">Built for the elite</p>
      </div>
    </div>
  );
};

export default Profile;
