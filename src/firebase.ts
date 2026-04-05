import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 🔥 DIRECT FIREBASE CONFIG (NO JSON)
const firebaseConfig = {
  apiKey: "AIzaSyAdsMK_nkzrLhhSMXfrLl84PNh5cnV61Mg",
  authDomain: "tournamenthub-15f89.firebaseapp.com",
  projectId: "tournamenthub-15f89",
  storageBucket: "tournamenthub-15f89.firebasestorage.app",
  messagingSenderId: "407134461502",
  appId: "1:407134461502:web:4764d84445229c31bb3b6f",
  measurementId: "G-QJ96WZL87L"
};

// 🔥 INITIALIZE
const app = initializeApp(firebaseConfig);

// 🔐 AUTH
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 🗄 DATABASE
export const db = getFirestore(app);

// 🔥 OPTIONAL ERROR HANDLER (same rakha)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
