export interface Tournament {
  id: string;
  gameName: string;
  imageURL: string;
  mode: string;
  entryFee: number;
  prizePool: number;
  perKill: number;
  totalPlayers: number;
  joinedPlayers: number;
  joinedUsers: string[];
  matchTime: any;
  slotTime: string;
  roomId?: string;
  roomPass?: string;
  status: 'open' | 'closed' | 'ongoing' | 'completed';
  matchStatus?: 'open' | 'ongoing' | 'completed';
  resultDeclared: boolean;
  lastResetDate?: string;
  createdAt?: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin';
}

export interface Wallet {
  balance: number;
}

export interface Result {
  id?: string;
  tournamentId: string;
  userId: string;
  position: number;
  kill: number;
  winningAmount: number;
  createdAt: any;
}

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  type: 'win' | 'deposit' | 'join';
  status: 'success' | 'pending' | 'failed';
  createdAt: any;
  tournamentId?: string;
}

export interface RechargeRequest {
  id?: string;
  userId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  upiId: string;
  createdAt: any;
}
