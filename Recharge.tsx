import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  QrCode,
  Copy,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { formatFirestoreShortDate } from '../utils';

const Recharge: React.FC = () => {
  const { user, userData, rechargeRequests } = useAppContext();
  const allowedAmounts = [50, 100, 200, 400, 800, 1000];
  const [currentIndex, setCurrentIndex] = useState(0);
  const amount = allowedAmounts[currentIndex];
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showUpiFallback, setShowUpiFallback] = useState(false);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const handleAmountChange = (newAmount: number) => {
    // Find nearest valid amount index
    let nearestIndex = 0;
    let minDiff = Math.abs(allowedAmounts[0] - newAmount);

    for (let i = 1; i < allowedAmounts.length; i++) {
      const diff = Math.abs(allowedAmounts[i] - newAmount);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIndex = i;
      }
    }
    setCurrentIndex(nearestIndex);
    setError(null);
  };

  const increaseAmount = () => {
    if (currentIndex < allowedAmounts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setError(null);
    }
  };

  const decreaseAmount = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setError(null);
    }
  };

  const handlePayNow = () => {
    if (amount < 50 || amount > 1000) {
      setError(`Amount must be between ₹50 and ₹1000`);
      return;
    }
    const upiLink = `upi://pay?pa=abhisek8543@ptyes&pn=TournamentHub&am=${amount}&cu=INR`;
    
    // Attempt to open UPI app
    window.location.href = upiLink;

    // Fallback logic: If the page is still focused after 2 seconds, show the fallback message
    const timeout = setTimeout(() => {
      setShowUpiFallback(true);
    }, 2000);

    // Clear timeout if user leaves the page (app opened)
    window.addEventListener('blur', () => clearTimeout(timeout), { once: true });
  };

  const handleRechargeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (amount < 50) {
      setError("Minimum recharge amount is ₹50");
      return;
    }
    if (amount > 1000) {
      setError("Maximum recharge amount is ₹1000");
      return;
    }

    if (!user || !transactionId.trim()) {
      setError("Transaction ID is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Check if this transactionId has already been used
      const tidQ = query(collection(db, 'rechargeRequests'), where('transactionId', '==', transactionId.trim()));
      const tidSnapshot = await getDocs(tidQ);
      if (!tidSnapshot.empty) {
        setError("This Transaction ID has already been submitted.");
        setSubmitting(false);
        return;
      }

      // Check daily limit (max 5 requests)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailyQ = query(collection(db, 'rechargeRequests'), where('userId', '==', user.uid));
      const dailySnapshot = await getDocs(dailyQ);
      const todayRequests = dailySnapshot.docs.filter(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt >= today;
      });

      if (todayRequests.length >= 5) {
        setError("Daily limit reached (max 5 requests per day).");
        setSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'rechargeRequests'), {
        userId: user.uid,
        userEmail: user.email,
        amount: amount,
        transactionId: transactionId.trim(),
        status: 'pending',
        createdAt: Timestamp.now()
      });

      setSuccess(true);
      setTransactionId('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error("Recharge failed:", err);
      setError("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">RECHARGE WALLET</h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Add funds to your account</p>
        </div>
        <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex items-center gap-3">
          <Wallet className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-none mb-1">Current Balance</p>
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
            "Payment karne ke baad hi request submit kare",
            "Fake Transaction ID par account suspend hoga",
            "Recharge will be approved within 24 hours after verification",
            "Daily limit: Max 5 requests"
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-3 text-xs font-bold text-zinc-400">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1 & 2: Amount & Payment */}
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-3xl border border-white/5 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">STEP 1: SELECT AMOUNT</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[50, 100, 500].map((amt) => {
                const isActive = (amt === 50 && currentIndex === 0) || 
                               (amt === 100 && currentIndex === 1) || 
                               (amt === 500 && currentIndex === 3);
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountChange(amt)}
                    className={`py-4 rounded-2xl font-black text-lg transition-all border ${
                      isActive 
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-500 shadow-lg shadow-emerald-500/20' 
                      : 'bg-zinc-950 text-white border-white/5 hover:border-emerald-500/50'
                    }`}
                  >
                    ₹{amt}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Select Amount (₹50 - ₹1000)</label>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={decreaseAmount}
                  disabled={currentIndex === 0}
                  className="w-12 h-12 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-center text-white hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <div className="flex-1 bg-zinc-950 border border-white/5 rounded-xl px-4 py-3 text-white font-black text-2xl text-center">
                  ₹{formatNumber(amount)}
                </div>
                <button 
                  type="button"
                  onClick={increaseAmount}
                  disabled={currentIndex === allowedAmounts.length - 1}
                  className="w-12 h-12 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-center text-white hover:border-emerald-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">STEP 2: PAYMENT</h3>
              </div>

              <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Pay via UPI ID</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">abhisek8543@ptyes</span>
                    <button onClick={() => copyToClipboard('abhisek8543@ptyes')} className="p-2 hover:bg-white/5 rounded-lg">
                      <Copy className="w-4 h-4 text-emerald-500" />
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={handlePayNow}
                  className="w-full py-4 bg-emerald-500 text-zinc-950 font-black rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  PAY NOW <ChevronRight className="w-5 h-5" />
                </button>

                {showUpiFallback && (
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">
                      No UPI app found? Try manually paying to the ID above.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Submit Details */}
        <div className="space-y-6">
          <div className="bg-zinc-900 rounded-3xl border border-white/5 p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">STEP 3: SUBMIT DETAILS</h3>
            </div>

            <form onSubmit={handleRechargeRequest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Transaction ID (UTR Number)</label>
                <input 
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter 12 digit Transaction ID"
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-emerald-500/50 transition-colors"
                  required
                />
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest ml-1">
                  Check your payment history for UTR/Transaction ID
                </p>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-500 text-xs font-bold">{error}</p>
                </div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <p className="text-emerald-500 text-xs font-bold">Request submitted! Recharge will be approved within 24 hours after verification.</p>
                </motion.div>
              )}

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                {submitting ? (
                  <div className="w-6 h-6 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                ) : (
                  <>SUBMIT REQUEST <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="bg-zinc-900 rounded-3xl border border-white/5 p-6">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">RECENT REQUESTS</h3>
        <div className="space-y-3">
          {rechargeRequests.length === 0 ? (
            <p className="text-zinc-500 text-xs font-bold text-center py-4">No recent requests</p>
          ) : (
            rechargeRequests.slice(0, 5).map((req) => (
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
                    <p className="text-[9px] text-zinc-600 font-mono tracking-tighter">ID: {req.transactionId}</p>
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
  );
};

export default Recharge;
