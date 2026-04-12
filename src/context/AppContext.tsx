import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where
} from 'firebase/firestore';

interface AppContextType {
  user: User | null;
  userData: any;
  loading: boolean;
  tournaments: any[];
  myResults: any[];
  rechargeRequests: any[];
  withdrawRequests: any[];
  isAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [myResults, setMyResults] = useState<any[]>([]);
  const [rechargeRequests, setRechargeRequests] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);

  // ✅ ADMIN EMAILS (IMPORTANT)
  const adminEmails = [
    'ravanvillan7@gmail.com',
    'pandey.sachin1222@gmail.com'
  ];

  const isAdmin = user?.email ? adminEmails.includes(user.email) : false;

  // ✅ AUTH LISTENER
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

  // ✅ USER DATA LIVE
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setUserData(snap.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ TOURNAMENT LIVE (IMPORTANT FIX)
  useEffect(() => {
    const q = query(collection(db, 'tournaments'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 🔥 SORT FIX (date string support)
      const sorted = list.sort((a: any, b: any) => {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });

      const now = new Date();

const updated = sorted.map((t: any) => {
  const start = new Date(t.startTime);

  // ⏱️ Duration (IMPORTANT)
  const durationHours = 2; // 👈 tu change kar sakta hai (2 hour match)
  const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

  let status = "upcoming";

  if (now >= start && now <= end) {
    status = "ongoing";
  } else if (now > end) {
    status = "completed";
  }

  return {
    ...t,
    status
  };
});

setTournaments(updated);

});

setTournaments(updated);
    });

    return () => unsubscribe();
  }, []);

  // ✅ USER RESULTS FIX (IMPORTANT)
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'results'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allResults = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 🔥 FILTER USER RESULTS FROM WINNERS ARRAY
      const my = allResults.filter((res: any) =>
        res.winners?.some((w: any) => w.userId === user.uid)
      );

      setMyResults(my);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ USER RECHARGE
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'rechargeRequests'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setRechargeRequests(list);
    });

    return () => unsubscribe();
  }, [user]);

  // ✅ USER WITHDRAW
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'withdrawRequests'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setWithdrawRequests(list);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <AppContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      tournaments, 
      myResults, 
      rechargeRequests, 
      withdrawRequests,
      isAdmin
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('Context error');
  return context;
};
