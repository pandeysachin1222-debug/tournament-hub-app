import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Trophy, 
  History, 
  User, 
  Wallet, 
  LayoutDashboard,
  BarChart3,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const Navigation: React.FC = () => {
  const { isAdmin } = useAppContext();

  const navItems = [
    { to: '/', icon: Trophy, label: 'Tournaments' },
    { to: '/recharge', icon: ArrowUpCircle, label: 'Recharge' },
    { to: '/withdraw', icon: ArrowDownCircle, label: 'Withdraw' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/leaderboard', icon: BarChart3, label: 'Leaderboard' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin', icon: LayoutDashboard, label: 'Admin' });
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-xl border-t border-white/5 z-50 px-2 pb-safe">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center gap-1 transition-all
              ${isActive ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
