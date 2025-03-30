import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0inGa3wv03QqMNtzJfIyrTaXBUQbou3Q",
  authDomain: "newsletter-97c2d.firebaseapp.com",
  projectId: "newsletter-97c2d",
  storageBucket: "newsletter-97c2d.firebasestorage.app",
  messagingSenderId: "1017650597761",
  appId: "1:1017650597761:web:028aecb3a9d0b443d36280",
  measurementId: "G-W0MP9F48YG"
};

// Initialize Firebase - with error handling to prevent multiple initializations
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  // Check if it's already initialized
  if (!/already exists/.test(error.message)) {
    console.error("Firebase initialization error", error.stack);
  }
}

// Subscriber functions
export const addSubscriber = async (subscriberData) => {
  try {
    // Check if email already exists
    const emailCheck = query(
      collection(db, 'subscribers'),
      where('email', '==', subscriberData.email)
    );
    
    const querySnapshot = await getDocs(emailCheck);
    
    if (!querySnapshot.empty) {
      // Email already exists
      return { success: false, message: 'Email already subscribed' };
    }
    
    // Add new subscriber
    const docRef = await addDoc(collection(db, 'subscribers'), {
      ...subscriberData,
      createdAt: new Date().toISOString(),
      status: 'active'
    });
    
    console.log("Subscriber added with ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding subscriber:', error);
    return { success: false, error };
  }
};

export const getSubscribers = async (status = null) => {
  try {
    let subscribersQuery;
    
    if (status) {
      subscribersQuery = query(
        collection(db, 'subscribers'), 
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    } else {
      subscribersQuery = query(
        collection(db, 'subscribers'),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(subscribersQuery);
    const subscribers = [];
    
    querySnapshot.forEach((doc) => {
      subscribers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return subscribers;
  } catch (error) {
    console.error('Error getting subscribers:', error);
    throw error;
  }
};

export const updateSubscriber = async (id, data) => {
  try {
    if (!id || typeof id !== 'string') {
      console.error('Invalid document ID provided:', id);
      return { success: false, error: 'Invalid document ID' };
    }
    
    const subscriberRef = doc(db, 'subscribers', id);
    await updateDoc(subscriberRef, data);
    return { success: true };
  } catch (error) {
    console.error('Error updating subscriber:', error);
    return { success: false, error };
  }
};

export const deleteSubscriber = async (id) => {
  try {
    if (!id || typeof id !== 'string') {
      console.error('Invalid document ID provided:', id);
      return { success: false, error: 'Invalid document ID' };
    }
    
    const subscriberRef = doc(db, 'subscribers', id);
    await deleteDoc(subscriberRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting subscriber:', error);
    return { success: false, error };
  }
};

// Newsletter functions
export const addNewsletter = async (newsletterData) => {
  try {
    const docRef = await addDoc(collection(db, 'newsletters'), {
      ...newsletterData,
      createdAt: new Date().toISOString(),
      sent: false
    });
    
    console.log("Newsletter added with ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding newsletter:', error);
    return { success: false, error };
  }
};

export const getNewsletters = async (limit = null) => {
  try {
    let newslettersQuery;
    
    if (limit) {
      newslettersQuery = query(
        collection(db, 'newsletters'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
    } else {
      newslettersQuery = query(
        collection(db, 'newsletters'),
        orderBy('createdAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(newslettersQuery);
    const newsletters = [];
    
    querySnapshot.forEach((doc) => {
      newsletters.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return newsletters;
  } catch (error) {
    console.error('Error getting newsletters:', error);
    throw error;
  }
};

export const updateNewsletter = async (id, data) => {
  try {
    if (!id || typeof id !== 'string') {
      console.error('Invalid document ID provided:', id);
      return { success: false, error: 'Invalid document ID' };
    }
    
    const newsletterRef = doc(db, 'newsletters', id);
    await updateDoc(newsletterRef, data);
    return { success: true };
  } catch (error) {
    console.error('Error updating newsletter:', error);
    return { success: false, error };
  }
};

export const deleteNewsletter = async (id) => {
  try {
    if (!id || typeof id !== 'string') {
      console.error('Invalid document ID provided:', id);
      return { success: false, error: 'Invalid document ID' };
    }
    
    const newsletterRef = doc(db, 'newsletters', id);
    await deleteDoc(newsletterRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting newsletter:', error);
    return { success: false, error };
  }
};

// Auth functions
export const signInWithEmail = async (email, password) => {
  try {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, error };
  }
};

export const signOut = async () => {
  try {
    const { signOut: firebaseSignOut } = await import('firebase/auth');
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    return { success: false, error };
  }
};

export { app, db, auth };