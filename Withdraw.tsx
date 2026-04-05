import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  ArrowDownCircle, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, doc, runTransaction } from 'firebase/firestore';
import { formatFirestoreShortDate } from '../utils';

const Withdraw: React.FC = () => {
  const { user, userData, withdrawRequests } = useAppContext();
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (userData?.upiId) {
      setUpiId(userData.upiId);
    }
  }, [userData?.upiId]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const handleWithdrawRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData || !amount || !upiId) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 50) {
      setError("Minimum withdrawal amount is ₹50");
      return;
    }

    if (withdrawAmount > 1000) {
      setError("Maximum withdrawal amount is ₹1,000");
      return;
    }

    if (withdrawAmount > userData.balance) {
      setError("Insufficient balance.");
      return;
    }

    if (!upiId.includes('@')) {
      setError("Please enter a valid UPI ID (e.g., name@upi)");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Check daily limit (max 3 requests)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailyQ = query(collection(db, 'withdrawRequests'), where('userId', '==', user.uid));
      const dailySnapshot = await getDocs(dailyQ);
      const todayRequests = dailySnapshot.docs.filter(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt >= today;
      });

      if (todayRequests.length >= 3) {
        setError("Daily limit reached (max 3 withdrawals per day).");
        setSubmitting(false);
        return;
      }

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw new Error("User not found");
        const currentBalance = userSnap.data().balance;
        
        if (currentBalance < withdrawAmount) throw new Error("Insufficient balance");
        
        // Deduct balance immediately
        transaction.update(userRef, {
          balance: currentBalance - withdrawAmount
        });
        
        // Create withdraw request
        const withdrawRef = doc(collection(db, 'withdrawRequests'));
        transaction.set(withdrawRef, {
          userId: user.uid,
          userEmail: user.email,
          amount: withdrawAmount,
          upiId: upiId,
          status: 'pending',
          createdAt: Timestamp.now()
        });
      });

      setSuccess(true);
      setAmount('');
      setUpiId('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("Withdrawal failed:", err);
      setError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">WITHDRAW FUNDS</h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Transfer winnings to your bank</p>
        </div>
        <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex items-center gap-3">
          <Wallet className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">Available Balance</p>
            <p className="text-xl font-black text-white leading-none">₹{formatNumber(userData?.balance)}</p>
          </div>
        </div>
      </div>

      {/* Important Instructions */}
      <div className="bg-amber-500/10 rounded-3xl border border-amber-500/20 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">IMPORTANT INSTRUCTIONS</h3>
        </div>
        <ul className="space-y-2">
          {[
            "Minimum withdrawal ₹50",
            "Maximum ₹1000 per request",
            "Daily max 3 withdrawal",
            "UPI ID sahi hona chahiye",
            "Processing time 24–48 hrs",
            "Wrong details → reject"
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-3 text-xs font-bold text-zinc-400">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Withdrawal Form */}
        <div className="space-y-6">
          <form onSubmit={handleWithdrawRequest} className="bg-zinc-900 rounded-3xl border border-white/5 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-black text-white">WITHDRAWAL DETAILS</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Withdraw Amount (₹)</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Min ₹50, Max ₹1000"
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50 transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">UPI ID (Google Pay, PhonePe, etc.)</label>
                <input 
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="example@upi"
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 flex gap-3">
              <Info className="w-5 h-5 text-zinc-500 shrink-0" />
              <p className="text-zinc-500 text-[10px] font-bold leading-relaxed uppercase tracking-wider">
                Withdrawals are processed within 24-48 hours. Please ensure your UPI ID is correct.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-500 text-xs font-bold">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <p className="text-emerald-500 text-xs font-bold">Withdrawal request submitted! Amount deducted from balance.</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
            >
              {submitting ? (
                <div className="w-6 h-6 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
              ) : (
                <>WITHDRAW NOW <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        </div>

        {/* Withdrawal History */}
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-3xl border border-white/5 p-6 h-full">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">WITHDRAWAL HISTORY</h3>
            <div className="space-y-3">
              {withdrawRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="w-12 h-12 text-zinc-800 mb-4" />
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">No withdrawal history</p>
                </div>
              ) : (
                withdrawRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        req.status === 'approved' ? 'bg-emerald-500/20' :
                        req.status === 'rejected' ? 'bg-red-500/20' :
                        'bg-amber-500/20'
                      }`}>
                        {req.status === 'approved' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
                         req.status === 'rejected' ? <XCircle className="w-5 h-5 text-red-500" /> :
                         <Clock className="w-5 h-5 text-amber-500" />}
                      </div>
                      <div>
                        <p className="text-white font-black">₹{formatNumber(req.amount)}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{formatFirestoreShortDate(req.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' :
                      req.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                      'bg-amber-500/20 text-amber-500'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
