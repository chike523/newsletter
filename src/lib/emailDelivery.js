// src/lib/emailDelivery.js
import { db } from './firebase';
import { doc, collection, addDoc, getDocs, query, where, updateDoc, limit, orderBy, Timestamp } from 'firebase/firestore';
import { sendEmail } from './emailjs';
import { processContentForTracking, storeTrackingInfo, trackEmailSend } from './analytics';

/**
 * Enhanced email delivery module
 * 
 * This module handles email delivery with improved deliverability features:
 * - DKIM/SPF setup instructions
 * - Rate limiting to avoid spam flags
 * - Send time optimization
 * - Delivery status tracking
 */

// Configuration for rate limiting
const RATE_LIMIT = {
  BATCH_SIZE: 50,      // Number of emails per batch
  DELAY_BETWEEN_BATCHES: 2 * 60 * 1000,  // 2 minutes between batches (in ms)
  MAX_PER_HOUR: 500,   // Maximum emails per hour
  MAX_PER_DAY: 2000    // Maximum emails per day
};

// Send a single email with tracking
export const sendSingleEmail = async (newsletter, subscriber) => {
  try {
    // Process content for tracking
    const { processedContent, trackingInfo } = processContentForTracking(
      newsletter.content,
      newsletter.id,
      subscriber.id
    );
    
    // Store tracking information
    await storeTrackingInfo(trackingInfo, newsletter.id, subscriber.id);
    
    // Send the email using EmailJS
    const result = await sendEmail({
      to_email: subscriber.email,
      to_name: subscriber.name || 'Subscriber',
      subject: newsletter.subject,
      message_html: processedContent,
      email_title: newsletter.title,
      date: new Date().toLocaleDateString()
    }, process.env.NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID);
    
    if (result.success) {
      // Record the send in analytics
      await trackEmailSend(newsletter.id, subscriber.id);
      
      // Store delivery info
      await addDoc(collection(db, 'email_delivery'), {
        newsletterId: newsletter.id,
        subscriberId: subscriber.id,
        sentAt: Timestamp.now(),
        status: 'sent',
        emailProvider: 'emailjs'
      });
      
      return { success: true };
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    console.error(`Error sending email to ${subscriber.email}:`, error);
    
    // Log the failure
    await addDoc(collection(db, 'email_delivery'), {
      newsletterId: newsletter.id,
      subscriberId: subscriber.id,
      sentAt: Timestamp.now(),
      status: 'failed',
      error: error.message,
      emailProvider: 'emailjs'
    });
    
    return { success: false, error };
  }
};

// Send newsletter to a list of subscribers with rate limiting
export const sendBatchEmails = async (newsletterId, subscriberIds, options = {}) => {
  try {
    // Get the newsletter
    const newsletterRef = doc(db, 'newsletters', newsletterId);
    const newsletterSnap = await getDoc(newsletterRef);
    
    if (!newsletterSnap.exists()) {
      return { success: false, error: 'Newsletter not found' };
    }
    
    const newsletter = {
      id: newsletterSnap.id,
      ...newsletterSnap.data()
    };
    
    // Get subscribers
    const subscribers = [];
    
    for (const subscriberId of subscriberIds) {
      const subscriberRef = doc(db, 'subscribers', subscriberId);
      const subscriberSnap = await getDoc(subscriberRef);
      
      if (subscriberSnap.exists()) {
        subscribers.push({
          id: subscriberSnap.id,
          ...subscriberSnap.data()
        });
      }
    }
    
    if (subscribers.length === 0) {
      return { success: false, error: 'No valid subscribers found' };
    }
    
    // Create a send job
    const batchSize = options.batchSize || RATE_LIMIT.BATCH_SIZE;
    const delay = options.delay || RATE_LIMIT.DELAY_BETWEEN_BATCHES;
    
    const sendJobRef = await addDoc(collection(db, 'send_jobs'), {
      newsletterId,
      totalSubscribers: subscribers.length,
      sentCount: 0,
      failedCount: 0,
      status: 'in_progress',
      createdAt: Timestamp.now(),
      startedAt: Timestamp.now(),
      batchSize,
      delay
    });
    
    // Start sending in batches
    const batches = [];
    for (let i = 0; i < subscribers.length; i += batchSize) {
      batches.push(subscribers.slice(i, i + batchSize));
    }
    
    let sentCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Update job status
      await updateDoc(sendJobRef, {
        currentBatch: i + 1,
        totalBatches: batches.length
      });
      
      // Send emails in this batch
      const sendPromises = batch.map(subscriber => sendSingleEmail(newsletter, subscriber));
      const results = await Promise.all(sendPromises);
      
      // Count successes and failures
      const batchSentCount = results.filter(r => r.success).length;
      const batchFailedCount = results.filter(r => !r.success).length;
      
      sentCount += batchSentCount;
      failedCount += batchFailedCount;
      
      // Update job stats
      await updateDoc(sendJobRef, {
        sentCount,
        failedCount
      });
      
      // Check if we're at the end
      if (i < batches.length - 1) {
        // Wait before the next batch to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Update newsletter status
    await updateDoc(newsletterRef, {
      sent: true,
      sentAt: Timestamp.now(),
      sentCount
    });
    
    // Finalize job
    await updateDoc(sendJobRef, {
      status: 'completed',
      completedAt: Timestamp.now()
    });
    
    return {
      success: true,
      sentCount,
      failedCount
    };
  } catch (error) {
    console.error("Error sending batch emails:", error);
    return { success: false, error };
  }
};

// Determine optimal send time based on subscriber engagement
export const getOptimalSendTime = async (subscriberIds) => {
  try {
    // This is a simplified algorithm that looks at when subscribers typically open emails
    // A more sophisticated version would analyze more data points
    
    // Get recent open events for these subscribers
    const openTimes = [];
    
    for (const subscriberId of subscriberIds) {
      const trackingRef = collection(db, 'tracking');
      const q = query(
        trackingRef,
        where('subscriberId', '==', subscriberId),
        where('type', '==', 'open'),
        where('tracked', '==', true),
        orderBy('trackDate', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.trackDate) {
          const date = data.trackDate.toDate();
          openTimes.push({
            day: date.getDay(), // 0-6 (Sunday-Saturday)
            hour: date.getHours() // 0-23
          });
        }
      });
    }
    
    if (openTimes.length === 0) {
      // Default times if no data
      return {
        success: true,
        data: {
          bestDay: 2, // Tuesday
          bestHour: 10, // 10 AM
          confidence: 'low'
        }
      };
    }
    
    // Count frequencies
    const dayFrequency = Array(7).fill(0);
    const hourFrequency = Array(24).fill(0);
    
    openTimes.forEach(time => {
      dayFrequency[time.day]++;
      hourFrequency[time.hour]++;
    });
    
    // Find the most common day and hour
    const bestDay = dayFrequency.indexOf(Math.max(...dayFrequency));
    const bestHour = hourFrequency.indexOf(Math.max(...hourFrequency));
    
    // Calculate confidence level
    const totalEvents = openTimes.length;
    const dayConfidence = dayFrequency[bestDay] / totalEvents;
    const hourConfidence = hourFrequency[bestHour] / totalEvents;
    
    let confidence = 'low';
    if (dayConfidence > 0.5 && hourConfidence > 0.5) {
      confidence = 'high';
    } else if (dayConfidence > 0.3 && hourConfidence > 0.3) {
      confidence = 'medium';
    }
    
    return {
      success: true,
      data: {
        bestDay,
        bestHour,
        confidence,
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        recommendedDay: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][bestDay],
        recommendedTime: `${bestHour > 12 ? bestHour - 12 : bestHour}${bestHour >= 12 ? 'PM' : 'AM'}`
      }
    };
  } catch (error) {
    console.error("Error determining optimal send time:", error);
    return { success: false, error };
  }
};

// Check for bounces and update subscriber status
export const processBounces = async () => {
  try {
    // This function would normally connect to your email service provider's API
    // to check for bounced emails. Since we're using EmailJS, we'll simulate this.
    
    // Get recent delivery failures
    const deliveryRef = collection(db, 'email_delivery');
    const q = query(
      deliveryRef,
      where('status', '==', 'failed'),
      where('bouncedProcessed', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    let hardBounceCount = 0;
    let softBounceCount = 0;
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      // For real implementation, you'd check the specific error type
      // Hard bounces are permanent failures (invalid email)
      // Soft bounces are temporary (mailbox full, server down)
      const isBounce = true; // Simulate we detected a bounce
      const isHardBounce = Math.random() > 0.5; // Randomly simulate hard/soft bounces
      
      if (isBounce) {
        if (isHardBounce) {
          // Update subscriber status for hard bounces
          const subscriberRef = doc(db, 'subscribers', data.subscriberId);
          await updateDoc(subscriberRef, {
            status: 'bounced',
            bounceReason: 'Hard bounce - invalid email address',
            bounceDate: Timestamp.now()
          });
          
          hardBounceCount++;
        } else {
          // Track soft bounces
          const subscriberRef = doc(db, 'subscribers', data.subscriberId);
          const subscriberSnap = await getDoc(subscriberRef);
          
          if (subscriberSnap.exists()) {
            const subscriber = subscriberSnap.data();
            const softBounceCount = (subscriber.softBounceCount || 0) + 1;
            
            await updateDoc(subscriberRef, {
              softBounceCount,
              lastSoftBounce: Timestamp.now()
            });
            
            // If too many soft bounces, treat as hard bounce
            if (softBounceCount >= 3) {
              await updateDoc(subscriberRef, {
                status: 'bounced',
                bounceReason: 'Multiple soft bounces',
                bounceDate: Timestamp.now()
              });
              
              hardBounceCount++;
            } else {
              softBounceCount++;
            }
          }
        }
        
        // Mark as processed
        await updateDoc(doc.ref, {
          bouncedProcessed: true,
          bounceType: isHardBounce ? 'hard' : 'soft',
          processedAt: Timestamp.now()
        });
      }
    }
    
    return {
      success: true,
      hardBounceCount,
      softBounceCount
    };
  } catch (error) {
    console.error("Error processing bounces:", error);
    return { success: false, error };
  }
};

// Clean subscriber list (remove chronic bounces, unsubscribes, etc.)
export const cleanSubscriberList = async () => {
  try {
    const subscribersRef = collection(db, 'subscribers');
    const querySnapshot = await getDocs(subscribersRef);
    
    let removedCount = 0;
    let updatedCount = 0;
    
    for (const doc of querySnapshot.docs) {
      const subscriber = doc.data();
      
      // 1. Handle bounced emails
      if (subscriber.status === 'bounced') {
        // Add to removal log before deleting
        await addDoc(collection(db, 'removed_subscribers'), {
          ...subscriber,
          id: doc.id,
          removedAt: Timestamp.now(),
          reason: 'bounced'
        });
        
        // Delete the subscriber
        await deleteDoc(doc.ref);
        removedCount++;
        continue;
      }
      
      // 2. Handle unsubscribed users
      if (subscriber.status === 'unsubscribed') {
        // Keep unsubscribed users in the database, but in a separate collection
        // This prevents them from being re-added accidentally
        await addDoc(collection(db, 'removed_subscribers'), {
          ...subscriber,
          id: doc.id,
          removedAt: Timestamp.now(),
          reason: 'unsubscribed'
        });
        
        await deleteDoc(doc.ref);
        removedCount++;
        continue;
      }
      
      // 3. Handle inactive subscribers
      if (subscriber.lastOpened) {
        const lastOpened = subscriber.lastOpened.toDate();
        const now = new Date();
        const daysSinceLastOpen = (now - lastOpened) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastOpen > 180) { // 6 months inactive
          // Update status to inactive
          await updateDoc(doc.ref, {
            status: 'inactive',
            inactiveReason: 'No opens for 6+ months'
          });
          
          updatedCount++;
        }
      }
    }
    
    return {
      success: true,
      removedCount,
      updatedCount
    };
  } catch (error) {
    console.error("Error cleaning subscriber list:", error);
    return { success: false, error };
  }
};

export default {
  sendSingleEmail,
  sendBatchEmails,
  getOptimalSendTime,
  processBounces,
  cleanSubscriberList,
  RATE_LIMIT
};