import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp
} from 'firebase/firestore';

interface AppContextType {
  user: User | null;
  userData: any;
  loading: boolean;
  tournaments: any[];
  myResults: any[];
  leaderboard: any[];
  weeklyLeaderboard: any[];
  monthlyLeaderboard: any[];
  leaderboardLoading: boolean;
  rechargeRequests: any[];
  adminRechargeRequests: any[];
  withdrawRequests: any[];
  adminWithdrawRequests: any[];
  isAdmin: boolean;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [myResults, setMyResults] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<any[]>([]);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [rechargeRequests, setRechargeRequests] = useState<any[]>([]);
  const [adminRechargeRequests, setAdminRechargeRequests] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [adminWithdrawRequests, setAdminWithdrawRequests] = useState<any[]>([]);

  const isAdmin = user?.email === 'ravanvillan7@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'tournaments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setTournaments(list);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'results'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMyResults(list);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const allTime = [...users].sort((a: any, b: any) => (b.totalEarnings || 0) - (a.totalEarnings || 0));
      const weekly = [...users].sort((a: any, b: any) => (b.weeklyEarnings || 0) - (a.weeklyEarnings || 0));
      const monthly = [...users].sort((a: any, b: any) => (b.monthlyEarnings || 0) - (a.monthlyEarnings || 0));
      
      setLeaderboard(allTime);
      setWeeklyLeaderboard(weekly);
      setMonthlyLeaderboard(monthly);
      setLeaderboardLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'rechargeRequests'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRechargeRequests(list);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'rechargeRequests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setAdminRechargeRequests(list);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'withdrawRequests'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setWithdrawRequests(list);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, 'withdrawRequests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setAdminWithdrawRequests(list);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const refreshData = () => {
    // Logic to manually refresh if needed
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      tournaments, 
      myResults, 
      leaderboard, 
      weeklyLeaderboard,
      monthlyLeaderboard,
      leaderboardLoading,
      rechargeRequests, 
      adminRechargeRequests,
      withdrawRequests,
      adminWithdrawRequests,
      isAdmin,
      refreshData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
