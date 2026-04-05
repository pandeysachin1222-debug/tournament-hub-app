import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Trophy, 
  Gamepad2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatFirestoreShortDate } from '../utils';

const History: React.FC = () => {
  const { myResults, rechargeRequests, withdrawRequests } = useAppContext();
  const [activeTab, setActiveTab] = useState<'matches' | 'recharge' | 'withdraw'>('matches');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const renderMatches = () => (
    <div className="grid grid-cols-1 gap-4">
      {myResults.length === 0 ? (
        <div className="bg-zinc-900 rounded-3xl border border-white/5 p-12 text-center">
          <Trophy className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest">No match results found</p>
          <p className="text-zinc-600 text-xs mt-2">Join tournaments to start earning!</p>
        </div>
      ) : (
        myResults.map((result) => (
          <motion.div 
            key={result.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-3xl border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-emerald-500/30 transition-all"
          >
            <div className="flex items-center gap-6 w-full sm:w-auto">
              <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5">
                <Gamepad2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white">{result.gameName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{formatFirestoreShortDate(result.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Rank</p>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-2xl font-black text-white">#{result.rank}</span>
                  {result.rank === 1 && <Trophy className="w-5 h-5 text-amber-500" />}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Earnings</p>
                <div className="flex items-center gap-2 justify-end">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-2xl font-black text-emerald-500">₹{formatNumber(result.earnings)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  const renderRecharge = () => (
    <div className="grid grid-cols-1 gap-4">
      {rechargeRequests.length === 0 ? (
        <div className="bg-zinc-900 rounded-3xl border border-white/5 p-12 text-center">
          <ArrowUpCircle className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest">No recharge history</p>
        </div>
      ) : (
        rechargeRequests.map((req) => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-3xl border border-white/5 p-6 flex items-center justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5">
                <ArrowUpCircle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white">₹{formatNumber(req.amount)}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{formatFirestoreShortDate(req.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2 justify-end">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' :
                  req.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                  'bg-amber-500/20 text-amber-500'
                }`}>
                  {req.status}
                </span>
                {req.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {req.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  const renderWithdraw = () => (
    <div className="grid grid-cols-1 gap-4">
      {withdrawRequests.length === 0 ? (
        <div className="bg-zinc-900 rounded-3xl border border-white/5 p-12 text-center">
          <ArrowDownCircle className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest">No withdrawal history</p>
        </div>
      ) : (
        withdrawRequests.map((req) => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 rounded-3xl border border-white/5 p-6 flex items-center justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-white/5">
                <ArrowDownCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white">₹{formatNumber(req.amount)}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{formatFirestoreShortDate(req.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Status</p>
              <div className="flex items-center gap-2 justify-end">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' :
                  req.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                  'bg-amber-500/20 text-amber-500'
                }`}>
                  {req.status}
                </span>
                {req.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {req.status === 'rejected' && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">MY HISTORY</h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Track your performance & transactions</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('matches')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'matches' ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Matches
          </button>
          <button 
            onClick={() => setActiveTab('recharge')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'recharge' ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Recharge
          </button>
          <button 
            onClick={() => setActiveTab('withdraw')}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === 'withdraw' ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Withdraw
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'matches' && renderMatches()}
          {activeTab === 'recharge' && renderRecharge()}
          {activeTab === 'withdraw' && renderWithdraw()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default History;
