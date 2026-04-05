import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  Trophy, 
  Users, 
  Gamepad2, 
  Calendar, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { 
  doc, 
  runTransaction, 
  Timestamp, 
  collection, 
  addDoc,
  arrayUnion
} from 'firebase/firestore';
import { formatFirestoreDate } from '../utils';

const Home: React.FC = () => {
  const { user, userData, tournaments } = useAppContext();
  const [joining, setJoining] = useState<string | null>(null);
  const [confirmJoin, setConfirmJoin] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const handleJoinTournament = async (tournament: any) => {
    if (!user || !userData) return;
    
    const walletBalance = userData.balance || 0;
    const entryFee = tournament.entryFee || 0;

    if (walletBalance < entryFee) {
      alert("Insufficient balance. Please recharge.");
      return;
    }

    if (tournament.joinedPlayers >= tournament.totalPlayers) {
      setError("Tournament is full.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setJoining(tournament.id);
    try {
      await runTransaction(db, async (transaction) => {
        const tDocRef = doc(db, 'tournaments', tournament.id);
        const uDocRef = doc(db, 'users', user.uid);
        
        const tSnap = await transaction.get(tDocRef);
        const uSnap = await transaction.get(uDocRef);
        
        if (!tSnap.exists() || !uSnap.exists()) throw new Error("Document not found");
        
        const tData = tSnap.data();
        const uData = uSnap.data();
        
        const currentBalance = uData.balance || 0;
        const currentEntryFee = tData.entryFee || 0;

        if (currentBalance < currentEntryFee) throw new Error("Insufficient balance");
        if (tData.joinedPlayers >= tData.totalPlayers) throw new Error("Tournament full");
        
        // Update tournament
        transaction.update(tDocRef, {
          joinedPlayers: (tData.joinedPlayers || 0) + 1,
          joinedUsers: arrayUnion(user.uid)
        });
        
        // Update user
        transaction.update(uDocRef, {
          balance: currentBalance - currentEntryFee,
          totalMatches: (uData.totalMatches || 0) + 1
        });
        
        // Add to registrations
        const regRef = doc(collection(db, 'registrations'));
        transaction.set(regRef, {
          userId: user.uid,
          tournamentId: tournament.id,
          gameName: tData.gameName,
          entryFee: tData.entryFee,
          matchTime: tData.matchTime,
          status: 'joined',
          createdAt: Timestamp.now()
        });
      });
      
      setShowConfirmation(tournament);
    } catch (err: any) {
      console.error("Join failed:", err);
      setError(err.message || "Failed to join tournament");
      setTimeout(() => setError(null), 3000);
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 sm:p-12">
        <div className="relative z-10 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-950/20 rounded-full backdrop-blur-sm mb-6"
          >
            <div className="w-2 h-2 bg-zinc-950 rounded-full animate-pulse" />
            <span className="text-xs font-black text-zinc-950 uppercase tracking-widest">Live Arena</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-black text-zinc-950 mb-6 tracking-tight leading-none"
          >
            DOMINATE THE <br />LEADERBOARD
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-950/70 text-lg font-medium mb-8 max-w-md"
          >
            Enter high-stakes tournaments and prove your skills against the best players.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-4"
          >
            <div className="px-6 py-3 bg-zinc-950 rounded-2xl text-white font-black text-sm shadow-xl shadow-zinc-950/20">
              ₹50,000+ DAILY PRIZES
            </div>
            <div className="px-6 py-3 bg-zinc-950/10 rounded-2xl text-zinc-950 font-black text-sm backdrop-blur-sm border border-zinc-950/10">
              1,200+ ACTIVE PLAYERS
            </div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <Gamepad2 className="w-full h-full rotate-12 translate-x-1/4 -translate-y-1/4" />
        </div>
      </section>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-red-500 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournament Grid */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">ACTIVE TOURNAMENTS</h3>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">Join the battle</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-zinc-900 rounded-xl text-xs font-black text-zinc-400 hover:text-white transition-colors border border-white/5">ALL GAMES</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => {
            const title = tournament.gameName || "Game";
            const image = tournament.imageURL || "";
            const password = tournament.roomPass || "";
            const roomId = tournament.roomId || "";
            const prizePool = tournament.prizePool || 0;
            const entryFee = tournament.entryFee || 0;
            const perKill = tournament.perKill || 0;
            const totalPlayers = tournament.totalPlayers || 0;
            const joinedPlayers = tournament.joinedPlayers || 0;
            const isJoined = tournament.joinedUsers?.includes(user?.uid);
            const isFull = joinedPlayers >= totalPlayers;
            const hasBalance = (userData?.balance || 0) >= entryFee;
            
            return (
              <motion.div 
                key={tournament.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative bg-zinc-900 rounded-[2rem] border border-white/5 overflow-hidden hover:border-emerald-500/30 transition-all shadow-xl hover:shadow-emerald-500/5"
              >
                <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-zinc-950/80 backdrop-blur-md rounded-full border border-white/10">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    tournament.status === 'live' ? 'text-red-500' : 
                    tournament.status === 'completed' ? 'text-zinc-500' : 
                    isJoined ? 'text-emerald-500' :
                    'text-amber-500'
                  }`}>
                    {tournament.status === 'completed' ? 'Completed' : 
                     tournament.status === 'live' ? 'Live' :
                     isJoined ? 'Joined' : 'Upcoming'}
                  </span>
                </div>
                
                {/* Tournament Image */}
                <div className="h-40 w-full overflow-hidden relative">
                  <img 
                    src={image} 
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                  <div className="absolute bottom-4 left-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500 rounded-full">
                      <Trophy className="w-3 h-3 text-zinc-950" />
                      <span className="text-[10px] font-black text-zinc-950 uppercase tracking-widest">₹{formatNumber(prizePool)} Pool</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-emerald-500/20 transition-colors shrink-0">
                      <Gamepad2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xl font-black text-white leading-tight truncate">{title} ({tournament.mode})</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{formatFirestoreDate(tournament.matchTime)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-zinc-950 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Entry Fee</p>
                      <p className="text-sm font-black text-emerald-500">₹{formatNumber(entryFee)}</p>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Per Kill</p>
                      <p className="text-sm font-black text-white">₹{formatNumber(perKill)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Room ID</p>
                      <p className="text-xs font-bold text-white">{roomId || 'Locked'}</p>
                    </div>
                    <div className="p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Password</p>
                      <p className="text-xs font-bold text-white">{password || 'Locked'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Users className="w-3 h-3" />
                        <span>{joinedPlayers}/{totalPlayers}</span>
                      </div>
                      <span className="text-emerald-500">{Math.round((joinedPlayers / (totalPlayers || 1)) * 100)}% Full</span>
                    </div>
                    <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(joinedPlayers / (totalPlayers || 1)) * 100}%` }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Join Button Visibility Logic */}
                  {!isJoined && !isFull && hasBalance && tournament.status !== 'completed' && (
                    <button 
                      onClick={() => setConfirmJoin(tournament)}
                      disabled={joining === tournament.id}
                      className="w-full mt-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                      {joining === tournament.id ? (
                        <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                      ) : (
                        <>JOIN NOW <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  )}

                  {/* Status Messages when button is hidden */}
                  {isJoined && (
                    <div className="w-full mt-8 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 font-black text-sm text-center uppercase tracking-widest">
                      Already Joined
                    </div>
                  )}
                  {!isJoined && isFull && (
                    <div className="w-full mt-8 py-4 bg-zinc-800 border border-white/5 rounded-2xl text-zinc-500 font-black text-sm text-center uppercase tracking-widest">
                      Tournament Full
                    </div>
                  )}
                  {!isJoined && !isFull && !hasBalance && (
                    <div className="w-full mt-8 py-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-500 font-black text-sm text-center uppercase tracking-widest">
                      Insufficient Balance
                    </div>
                  )}
                  {tournament.status === 'completed' && !isJoined && (
                    <div className="w-full mt-8 py-4 bg-zinc-800 border border-white/5 rounded-2xl text-zinc-500 font-black text-sm text-center uppercase tracking-widest">
                      Match Ended
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmJoin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-emerald-500/10"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gamepad2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Confirm Join</h2>
              <p className="text-zinc-400 text-center mb-8">Are you sure you want to join this tournament? ₹{formatNumber(confirmJoin.entryFee)} will be deducted from your balance.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmJoin(null)}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleJoinTournament(confirmJoin);
                    setConfirmJoin(null);
                  }}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full shadow-2xl shadow-emerald-500/10"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">Success!</h2>
              <p className="text-zinc-400 text-center mb-8">You have successfully joined the tournament.</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                  <span className="text-zinc-500 text-sm">Game</span>
                  <span className="font-bold text-white text-right ml-4">{showConfirmation.gameName}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                  <span className="text-zinc-500 text-sm">Match Time</span>
                  <span className="font-bold text-white text-right ml-4">{formatFirestoreDate(showConfirmation.matchTime)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-xl border border-white/5">
                  <span className="text-zinc-500 text-sm">Entry Fee</span>
                  <span className="font-bold text-emerald-400 text-right ml-4">₹{formatNumber(showConfirmation.entryFee)}</span>
                </div>
              </div>

              <button 
                onClick={() => setShowConfirmation(null)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
