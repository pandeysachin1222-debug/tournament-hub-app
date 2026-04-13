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

// ✅ TOURNAMENT LIVE (ULTIMATE FIX)
useEffect(() => {
  const q = query(collection(db, 'tournaments'));

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const now = new Date();

    const updated = await Promise.all(list.map(async (t: any) => {
      
      // ✅ TIME FIX (Firestore Timestamp → Date)
      let start = t.matchTime?.toDate
        ? t.matchTime.toDate()
        : new Date(t.matchTime);

      // ✅ MATCH END TIME (30 min match)
      const end = new Date(start.getTime() + 30 * 60 * 1000);

      // 🔥 AUTO NEXT DAY (RECURRING)
      if (t.isRecurring) {
        while (start < now) {
          start.setDate(start.getDate() + 1);
        }
      }

      // ✅ STATUS FIX (IMPORTANT)
      let status = "upcoming";

      if (now >= start && now <= end) {
        status = "ongoing";
      } else if (now > end) {
        status = "completed";
      }

      // 🔥 JOIN SYSTEM (24 hrs open)
      let joinStatus = "open";
      const joinCloseTime = new Date(start.getTime() - 15 * 60 * 1000);

      if (now >= joinCloseTime) {
        joinStatus = "closed";
      }

      // 🔥 AUTO ROOM ID (15 min before)
      let roomId = t.roomId || "";
      let roomPass = t.roomPass || "";

      if (!roomId && now >= joinCloseTime) {
        roomId = "ROOM" + Math.floor(100000 + Math.random() * 900000);
      }

      // 🔥 AUTO PASSWORD (10 min before)
      const passTime = new Date(start.getTime() - 10 * 60 * 1000);

      if (!roomPass && now >= passTime) {
        roomPass = "PASS" + Math.floor(1000 + Math.random() * 9000);
      }

      // 🔥 SAVE ON FIREBASE (IMPORTANT)
      if (roomId !== t.roomId || roomPass !== t.roomPass) {
        await updateDoc(doc(db, "tournaments", t.id), {
          roomId,
          roomPass
        });
      }

      // 🔥 FAKE PLAYERS LOGIC
      let fakePlayers = 0;
      const diff = (start.getTime() - now.getTime()) / (1000 * 60);

      if (diff > 60) fakePlayers = Math.floor(Math.random() * 5);
      else if (diff > 30) fakePlayers = Math.floor(Math.random() * 15) + 5;
      else if (diff > 10) fakePlayers = Math.floor(Math.random() * 30) + 20;
      else fakePlayers = Math.floor(Math.random() * 50) + 40;

      const totalPlayers = (t.joinedPlayers || 0) + fakePlayers;

      return {
        ...t,
        matchTime: start,
        status,
        joinStatus,
        displayPlayers: totalPlayers,
        roomId,
        roomPass
      };
    }));

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
