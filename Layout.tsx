import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import { useAppContext } from '../context/AppContext';
import { Wallet, Bell, ShieldCheck, LogIn } from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

const Layout: React.FC = () => {
  const { user, userData, loading } = useAppContext();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-black text-white mb-4 tracking-tight">TOURNAMENT HUB</h1>
          <p className="text-zinc-500 mb-12 text-lg">Join the elite arena of mobile gaming. Compete, win, and earn real rewards.</p>
          
          <button 
            onClick={handleLogin}
            className="w-full py-5 bg-white hover:bg-zinc-200 text-zinc-950 font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-white/5 active:scale-95"
          >
            <LogIn className="w-6 h-6" />
            SIGN IN WITH GOOGLE
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6 text-zinc-950" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight leading-none">HUB</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Tournament Arena</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-zinc-900 rounded-2xl border border-white/5">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-black text-white">₹{formatNumber(userData?.balance)}</span>
            </div>
            <button className="relative w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/5 hover:bg-zinc-800 transition-colors">
              <Bell className="w-5 h-5 text-zinc-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-900" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <Navigation />
    </div>
  );
};

export default Layout;
