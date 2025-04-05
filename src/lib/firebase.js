import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,  // Add this import
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

// Add this function to get a single newsletter by ID
export const getNewsletterById = async (id) => {
  try {
    if (!id || typeof id !== 'string') {
      console.error('Invalid newsletter ID provided:', id);
      return null;
    }
    
    const docRef = doc(db, 'newsletters', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      console.log('No newsletter found with ID:', id);
      return null;
    }
  } catch (error) {
    console.error('Error getting newsletter:', error);
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

// Add this function to send newsletters
export const sendNewsletter = async (id) => {
  try {
    if (!id || typeof id !== 'string') {
      console.error('Invalid newsletter ID provided:', id);
      return { success: false, error: 'Invalid newsletter ID' };
    }
    
    // Get the newsletter
    const newsletterRef = doc(db, 'newsletters', id);
    const newsletterSnap = await getDoc(newsletterRef);
    
    if (!newsletterSnap.exists()) {
      return { success: false, error: 'Newsletter not found' };
    }
    
    const newsletter = {
      id: newsletterSnap.id,
      ...newsletterSnap.data()
    };
    
    // Check if already sent
    if (newsletter.sent) {
      return { success: false, error: 'Newsletter already sent' };
    }
    
    // Get subscribers based on target audience
    let subscribers;
    try {
      if (newsletter.targetAudience === 'all') {
        subscribers = await getSubscribers('active');
      } else if (newsletter.targetAudience === 'test') {
        // For test, just use the first subscriber or a test email
        const allSubscribers = await getSubscribers('active');
        subscribers = allSubscribers.slice(0, 1);
      } else {
        // This would need more complex logic based on your segmentation
        subscribers = await getSubscribers('active');
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      return { success: false, error: 'Failed to fetch subscribers' };
    }
    
    if (subscribers.length === 0) {
      return { success: false, error: 'No subscribers found to send newsletter to' };
    }
    
    // Import the sendEmail function
    const { sendEmail } = await import('../lib/emailjs');
    
    // Send to each subscriber
    let sentCount = 0;
    for (const subscriber of subscribers) {
      try {
        // Properly format the parameters for EmailJS
        const emailResult = await sendEmail({
          to_email: subscriber.email,
          to_name: subscriber.name || 'Subscriber',
          subject: newsletter.subject,
          message_html: newsletter.content,
          email_title: newsletter.title,
          date: new Date().toLocaleDateString()
        }, process.env.NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID);
        
        if (emailResult.success) {
          sentCount++;
        }
      } catch (error) {
        console.error(`Error sending to ${subscriber.email}:`, error);
      }
    }
    
    // Update the newsletter as sent
    await updateDoc(newsletterRef, { 
      sent: true, 
      sentAt: new Date().toISOString(),
      sentCount
    });
    
    return { success: true, sentCount };
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return { success: false, error: error.message };
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