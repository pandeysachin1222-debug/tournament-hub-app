import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Medal, 
  User, 
  ChevronRight,
  ShieldCheck,
  Clock,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Leaderboard: React.FC = () => {
  const { leaderboard, weeklyLeaderboard, monthlyLeaderboard, user, leaderboardLoading } = useAppContext();
  const [activeTab, setActiveTab] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const currentLeaderboard = activeTab === 'weekly' ? weeklyLeaderboard : 
                            activeTab === 'monthly' ? monthlyLeaderboard : 
                            leaderboard;

  const topTen = currentLeaderboard.slice(0, 10);
  const topThree = topTen.slice(0, 3);
  const rest = topTen.slice(3);

  const getEarnings = (player: any) => {
    if (activeTab === 'weekly') return player.weeklyEarnings || 0;
    if (activeTab === 'monthly') return player.monthlyEarnings || 0;
    return player.totalEarnings || 0;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto">
          <BarChart3 className="w-8 h-8 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">ELITE LEADERBOARD</h2>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-2">The top earners in the arena</p>
        </div>

        <div className="flex justify-center">
          <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('weekly')}
              className={`px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'weekly' ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Weekly
            </button>
            <button 
              onClick={() => setActiveTab('monthly')}
              className={`px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'monthly' ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setActiveTab('allTime')}
              className={`px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'allTime' ? 'bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {leaderboardLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : topTen.length === 0 ? (
        <div className="bg-zinc-900 rounded-[3rem] border border-white/5 p-20 text-center">
          <Trophy className="w-20 h-20 text-zinc-800 mx-auto mb-6" />
          <p className="text-zinc-500 font-black uppercase tracking-widest">No data available for this period</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-12"
          >
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
              {/* Rank 2 */}
              {topThree[1] && (
                <div className="relative order-2 sm:order-1">
                  <div className="bg-zinc-900 rounded-[2.5rem] border border-white/5 p-8 text-center space-y-4 pt-12">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-zinc-800 rounded-2xl border-4 border-zinc-950 flex items-center justify-center">
                      <Medal className="w-8 h-8 text-zinc-400" />
                    </div>
                    <div className="w-20 h-20 bg-zinc-950 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
                      <User className="w-10 h-10 text-zinc-700" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white truncate px-4">{topThree[1].displayName || 'Player'}</h4>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Rank #2</p>
                    </div>
                    <div className="px-6 py-3 bg-zinc-950 rounded-2xl border border-white/5">
                      <p className="text-2xl font-black text-white">₹{formatNumber(getEarnings(topThree[1]))}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rank 1 */}
              {topThree[0] && (
                <div className="relative order-1 sm:order-2 z-10">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-[3rem] p-10 text-center space-y-6 pt-16 shadow-2xl shadow-emerald-500/20">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-zinc-950 rounded-3xl border-4 border-emerald-500 flex items-center justify-center shadow-xl">
                      <Trophy className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div className="w-24 h-24 bg-zinc-950/20 rounded-[2rem] flex items-center justify-center mx-auto backdrop-blur-md border border-white/10">
                      <User className="w-12 h-12 text-zinc-950" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-zinc-950 truncate px-4">{topThree[0].displayName || 'Player'}</h4>
                      <p className="text-zinc-950/60 text-xs font-black uppercase tracking-widest mt-1">Grand Champion</p>
                    </div>
                    <div className="px-8 py-4 bg-zinc-950 rounded-3xl shadow-xl">
                      <p className="text-3xl font-black text-white">₹{formatNumber(getEarnings(topThree[0]))}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {topThree[2] && (
                <div className="relative order-3">
                  <div className="bg-zinc-900 rounded-[2.5rem] border border-white/5 p-8 text-center space-y-4 pt-12">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-zinc-800 rounded-2xl border-4 border-zinc-950 flex items-center justify-center">
                      <Medal className="w-8 h-8 text-amber-700" />
                    </div>
                    <div className="w-20 h-20 bg-zinc-950 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
                      <User className="w-10 h-10 text-zinc-700" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-white truncate px-4">{topThree[2].displayName || 'Player'}</h4>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Rank #3</p>
                    </div>
                    <div className="px-6 py-3 bg-zinc-950 rounded-2xl border border-white/5">
                      <p className="text-2xl font-black text-white">₹{formatNumber(getEarnings(topThree[2]))}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rest of the Leaderboard (Top 10 only) */}
            {rest.length > 0 && (
              <div className="bg-zinc-900 rounded-[3rem] border border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">TOP CONTENDERS</h3>
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Top 10 Players</span>
                </div>
                <div className="divide-y divide-white/5">
                  {rest.map((player, index) => (
                    <div 
                      key={player.id}
                      className={`flex items-center justify-between p-6 transition-colors hover:bg-white/5 ${
                        player.id === user?.uid ? 'bg-emerald-500/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-6">
                        <span className="w-8 text-lg font-black text-zinc-700">#{index + 4}</span>
                        <div className="w-12 h-12 bg-zinc-950 rounded-xl flex items-center justify-center border border-white/5">
                          <User className="w-6 h-6 text-zinc-700" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-white">{player.displayName || 'Anonymous Player'}</h4>
                          {player.id === user?.uid && (
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">You</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-white">₹{formatNumber(getEarnings(player))}</p>
                        <div className="flex items-center gap-1 justify-end mt-1">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default Leaderboard;
