import { Timestamp } from 'firebase/firestore';

export const formatFirestoreDate = (date: any): string => {
  if (!date) return 'N/A';
  
  // If it's a Firestore Timestamp
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleString();
  }
  
  // If it's a plain object with seconds and nanoseconds (unhydrated Timestamp)
  if (typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000).toLocaleString();
  }
  
  // If it's already a string or Date
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toLocaleString();
  
  return 'Invalid Date';
};

export const formatFirestoreShortDate = (date: any): string => {
  if (!date) return 'N/A';
  
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  }
  
  if (typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000).toLocaleDateString();
  }
  
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toLocaleDateString();
  
  return 'Invalid Date';
};
