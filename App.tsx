import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Recharge from './pages/Recharge';
import Withdraw from './pages/Withdraw';
import History from './pages/History';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("App Error:", error);
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-white mb-4">SOMETHING WENT WRONG</h2>
        <p className="text-zinc-500 mb-8">The arena encountered an unexpected error.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-emerald-500 text-zinc-950 font-black rounded-2xl"
        >
          RELOAD ARENA
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="recharge" element={<Recharge />} />
              <Route path="withdraw" element={<Withdraw />} />
              <Route path="history" element={<History />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<Admin />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
