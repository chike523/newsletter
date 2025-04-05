import { db } from './firebase';
import { doc, collection, addDoc, updateDoc, increment, arrayUnion, Timestamp } from 'firebase/firestore';

/**
 * Newsletter tracking and analytics module
 * 
 * This module handles tracking email opens, clicks, and subscriber engagement
 * for analytics and reporting purposes.
 */

// Generate a unique tracking ID for emails
export const generateTrackingId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Create tracking pixels for email opens
export const createTrackingPixel = (newsletterId, subscriberId) => {
  const trackingId = generateTrackingId();
  
  // Store the tracking info
  const trackingData = {
    newsletterId,
    subscriberId,
    trackingId,
    type: 'open',
    created: Timestamp.now()
  };
  
  // We'll add this to the database when sending the email
  // This function returns the HTML for the tracking pixel
  return {
    trackingId,
    trackingPixel: `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/track/open/${trackingId}" width="1" height="1" alt="" style="display:none;" />`
  };
};

// Generate tracking links for click tracking
export const createTrackingLink = (originalUrl, newsletterId, subscriberId) => {
  const trackingId = generateTrackingId();
  
  // Store the tracking info
  const trackingData = {
    newsletterId,
    subscriberId,
    trackingId,
    originalUrl,
    type: 'click',
    created: Timestamp.now()
  };
  
  // We'll add this to the database when sending the email
  // This function returns the tracking URL
  return {
    trackingId,
    trackingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/track/click/${trackingId}?url=${encodeURIComponent(originalUrl)}`
  };
};

// Process all links in HTML content for tracking
export const processContentForTracking = (content, newsletterId, subscriberId) => {
  // Simple regex to find links - in production you'd want a more robust solution
  const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi;
  
  const trackingInfo = [];
  
  // Replace links with tracking links
  const processedContent = content.replace(linkRegex, (match, url, rest) => {
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) {
      // Don't track anchor links or email/phone links
      return match;
    }
    
    const { trackingId, trackingUrl } = createTrackingLink(url, newsletterId, subscriberId);
    trackingInfo.push({ trackingId, type: 'click', originalUrl: url });
    
    return `<a href="${trackingUrl}"${rest}>`;
  });
  
  // Add tracking pixel for opens
  const { trackingId, trackingPixel } = createTrackingPixel(newsletterId, subscriberId);
  trackingInfo.push({ trackingId, type: 'open' });
  
  return {
    processedContent: processedContent + trackingPixel,
    trackingInfo
  };
};

// Store tracking information in the database
export const storeTrackingInfo = async (trackingInfo, newsletterId, subscriberId) => {
  try {
    for (const info of trackingInfo) {
      await addDoc(collection(db, 'tracking'), {
        ...info,
        newsletterId,
        subscriberId,
        created: Timestamp.now(),
        tracked: false
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Error storing tracking info:', error);
    return { success: false, error };
  }
};

// Record an email open event
export const recordOpen = async (trackingId) => {
  try {
    // Get the tracking doc
    const trackingRef = collection(db, 'tracking');
    const q = query(trackingRef, where('trackingId', '==', trackingId), where('type', '==', 'open'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Tracking ID not found' };
    }
    
    const trackingDoc = querySnapshot.docs[0];
    const trackingData = trackingDoc.data();
    
    // Update tracking record
    await updateDoc(trackingDoc.ref, {
      tracked: true,
      trackDate: Timestamp.now()
    });
    
    // Update newsletter stats
    const newsletterRef = doc(db, 'newsletters', trackingData.newsletterId);
    await updateDoc(newsletterRef, {
      openCount: increment(1),
      uniqueOpens: arrayUnion(trackingData.subscriberId)
    });
    
    // Update subscriber engagement
    const subscriberRef = doc(db, 'subscribers', trackingData.subscriberId);
    await updateDoc(subscriberRef, {
      lastOpened: Timestamp.now(),
      openCount: increment(1),
      engagementScore: computeEngagementScore(trackingData.subscriberId)
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error recording open:', error);
    return { success: false, error };
  }
};

// Record a link click event
export const recordClick = async (trackingId) => {
  try {
    // Get the tracking doc
    const trackingRef = collection(db, 'tracking');
    const q = query(trackingRef, where('trackingId', '==', trackingId), where('type', '==', 'click'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Tracking ID not found' };
    }
    
    const trackingDoc = querySnapshot.docs[0];
    const trackingData = trackingDoc.data();
    
    // Update tracking record
    await updateDoc(trackingDoc.ref, {
      tracked: true,
      trackDate: Timestamp.now()
    });
    
    // Update newsletter stats
    const newsletterRef = doc(db, 'newsletters', trackingData.newsletterId);
    await updateDoc(newsletterRef, {
      clickCount: increment(1),
      uniqueClicks: arrayUnion(trackingData.subscriberId)
    });
    
    // Update subscriber engagement
    const subscriberRef = doc(db, 'subscribers', trackingData.subscriberId);
    await updateDoc(subscriberRef, {
      lastClicked: Timestamp.now(),
      clickCount: increment(1),
      engagementScore: computeEngagementScore(trackingData.subscriberId)
    });
    
    return { 
      success: true,
      originalUrl: trackingData.originalUrl 
    };
  } catch (error) {
    console.error('Error recording click:', error);
    return { success: false, error };
  }
};

// Compute engagement score for a subscriber
// This is a simple algorithm that can be refined based on business needs
export const computeEngagementScore = async (subscriberId) => {
  try {
    // Get subscriber data
    const subscriberRef = doc(db, 'subscribers', subscriberId);
    const subscriberSnap = await getDoc(subscriberRef);
    
    if (!subscriberSnap.exists()) {
      return 0;
    }
    
    const subscriber = subscriberSnap.data();
    
    // Get the last 10 newsletters sent to this subscriber
    const trackingRef = collection(db, 'tracking');
    const q = query(
      trackingRef, 
      where('subscriberId', '==', subscriberId),
      where('type', '==', 'open'),
      orderBy('created', 'desc'),
      limit(10)
    );
    
    const querySnapshot = await getDocs(q);
    const recentNewsletters = [];
    
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (!recentNewsletters.includes(data.newsletterId)) {
        recentNewsletters.push(data.newsletterId);
      }
    });
    
    // Count opens and clicks
    const openCount = subscriber.openCount || 0;
    const clickCount = subscriber.clickCount || 0;
    
    // Count recent activity (newsletters received)
    const recentEmails = recentNewsletters.length;
    
    if (recentEmails === 0) {
      return 50; // Default for new subscribers
    }
    
    // Calculate recency - when was the last open?
    let recencyScore = 0;
    if (subscriber.lastOpened) {
      const daysSinceLastOpen = (Date.now() - subscriber.lastOpened.toMillis()) / (1000 * 60 * 60 * 24);
      recencyScore = Math.max(0, 100 - (daysSinceLastOpen * 2)); // Decays by 2 points per day
    }
    
    // Calculate open rate
    const openRate = (openCount / recentEmails) * 100;
    
    // Calculate click-to-open rate
    const clickToOpenRate = openCount > 0 ? (clickCount / openCount) * 100 : 0;
    
    // Final engagement score - weighted average
    const engagementScore = Math.round(
      (openRate * 0.4) + 
      (clickToOpenRate * 0.4) + 
      (recencyScore * 0.2)
    );
    
    return Math.min(100, Math.max(0, engagementScore));
  } catch (error) {
    console.error('Error computing engagement score:', error);
    return 0;
  }
};

// Get newsletter analytics
export const getNewsletterAnalytics = async (newsletterId) => {
  try {
    // Get newsletter data
    const newsletterRef = doc(db, 'newsletters', newsletterId);
    const newsletterSnap = await getDoc(newsletterRef);
    
    if (!newsletterSnap.exists()) {
      return { success: false, error: 'Newsletter not found' };
    }
    
    const newsletter = newsletterSnap.data();
    
    // Get tracking data
    const trackingRef = collection(db, 'tracking');
    const opensQuery = query(
      trackingRef,
      where('newsletterId', '==', newsletterId),
      where('type', '==', 'open'),
      where('tracked', '==', true)
    );
    
    const clicksQuery = query(
      trackingRef,
      where('newsletterId', '==', newsletterId),
      where('type', '==', 'click'),
      where('tracked', '==', true)
    );
    
    const opensSnapshot = await getDocs(opensQuery);
    const clicksSnapshot = await getDocs(clicksQuery);
    
    // Count unique subscribers for opens and clicks
    const uniqueOpens = new Set();
    const uniqueClicks = new Set();
    const linkClicks = {};
    
    opensSnapshot.forEach(doc => {
      const data = doc.data();
      uniqueOpens.add(data.subscriberId);
    });
    
    clicksSnapshot.forEach(doc => {
      const data = doc.data();
      uniqueClicks.add(data.subscriberId);
      
      // Count clicks per link
      if (data.originalUrl) {
        if (!linkClicks[data.originalUrl]) {
            linkClicks[data.originalUrl] = 0;
          }
          linkClicks[data.originalUrl]++;
        }
      });
      
      // Calculate rates
      const totalSent = newsletter.sentCount || 0;
      const openCount = uniqueOpens.size;
      const clickCount = uniqueClicks.size;
      
      const openRate = totalSent > 0 ? (openCount / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (clickCount / totalSent) * 100 : 0;
      const clickToOpenRate = openCount > 0 ? (clickCount / openCount) * 100 : 0;
      
      // Get top links by clicks
      const topLinks = Object.entries(linkClicks)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([url, clicks]) => ({ url, clicks }));
      
      return {
        success: true,
        data: {
          newsletterId,
          title: newsletter.title,
          sentDate: newsletter.sentAt,
          totalSent,
          openCount,
          clickCount,
          openRate: openRate.toFixed(2),
          clickRate: clickRate.toFixed(2),
          clickToOpenRate: clickToOpenRate.toFixed(2),
          topLinks
        }
      };
    } catch (error) {
      console.error('Error getting newsletter analytics:', error);
      return { success: false, error };
    }
  };
  
  // Get subscriber analytics
  export const getSubscriberAnalytics = async () => {
    try {
      // Get subscriber data
      const subscribersRef = collection(db, 'subscribers');
      const subscribersSnap = await getDocs(subscribersRef);
      
      const subscribers = [];
      subscribersSnap.forEach(doc => {
        subscribers.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Calculate subscriber metrics
      const totalSubscribers = subscribers.length;
      const activeSubscribers = subscribers.filter(s => s.status === 'active').length;
      const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed').length;
      
      // Engagement distribution
      const engagementDistribution = {
        high: subscribers.filter(s => s.engagementScore >= 70).length,
        medium: subscribers.filter(s => s.engagementScore >= 40 && s.engagementScore < 70).length,
        low: subscribers.filter(s => s.engagementScore < 40 || !s.engagementScore).length
      };
      
      // Subscriber growth over time
      const today = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push(month.toISOString().slice(0, 7)); // Format as YYYY-MM
      }
      
      const growth = months.map(month => {
        const count = subscribers.filter(sub => {
          if (!sub.createdAt) return false;
          return sub.createdAt.startsWith(month);
        }).length;
        
        return {
          month,
          count
        };
      });
      
      // Calculate retention rate (approximate based on unsubscribes)
      const retentionRate = totalSubscribers > 0 ? 
        ((totalSubscribers - unsubscribed) / totalSubscribers) * 100 : 100;
      
      return {
        success: true,
        data: {
          totalSubscribers,
          activeSubscribers,
          unsubscribed,
          retentionRate: retentionRate.toFixed(2),
          engagementDistribution,
          growth
        }
      };
    } catch (error) {
      console.error('Error getting subscriber analytics:', error);
      return { success: false, error };
    }
  };
  
  // Get heat map data for a specific newsletter
  export const getNewsletterHeatMap = async (newsletterId) => {
    try {
      // Get all clicks for this newsletter
      const trackingRef = collection(db, 'tracking');
      const clicksQuery = query(
        trackingRef,
        where('newsletterId', '==', newsletterId),
        where('type', '==', 'click'),
        where('tracked', '==', true)
      );
      
      const clicksSnapshot = await getDocs(clicksQuery);
      
      // Count clicks per link
      const linkClicks = {};
      
      clicksSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.originalUrl) {
          if (!linkClicks[data.originalUrl]) {
            linkClicks[data.originalUrl] = 0;
          }
          linkClicks[data.originalUrl]++;
        }
      });
      
      return {
        success: true,
        data: {
          newsletterId,
          linkClicks
        }
      };
    } catch (error) {
      console.error('Error getting newsletter heat map:', error);
      return { success: false, error };
    }
  };
  
  // Track an email send event
  export const trackEmailSend = async (newsletterId, subscriberId) => {
    try {
      // Update newsletter sent count
      const newsletterRef = doc(db, 'newsletters', newsletterId);
      await updateDoc(newsletterRef, {
        sentCount: increment(1)
      });
      
      // Add to email history
      await addDoc(collection(db, 'email_history'), {
        newsletterId,
        subscriberId,
        sentAt: Timestamp.now(),
        status: 'sent'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error tracking email send:', error);
      return { success: false, error };
    }
  };
  
  // Export analytics data
  export const exportAnalyticsData = async (newsletterId) => {
    try {
      const analytics = await getNewsletterAnalytics(newsletterId);
      
      if (!analytics.success) {
        return { success: false, error: analytics.error };
      }
      
      // Format data for CSV
      const csvData = [
        ['Newsletter', analytics.data.title],
        ['Sent Date', analytics.data.sentDate],
        ['Total Sent', analytics.data.totalSent],
        ['Opens', analytics.data.openCount],
        ['Clicks', analytics.data.clickCount],
        ['Open Rate', `${analytics.data.openRate}%`],
        ['Click Rate', `${analytics.data.clickRate}%`],
        ['Click-to-Open Rate', `${analytics.data.clickToOpenRate}%`],
        [''],
        ['Top Links', 'Clicks'],
        ...analytics.data.topLinks.map(link => [link.url, link.clicks])
      ];
      
      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      return {
        success: true,
        data: csvContent
      };
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      return { success: false, error };
    }
  };
  
  export default {
    createTrackingPixel,
    createTrackingLink,
    processContentForTracking,
    storeTrackingInfo,
    recordOpen,
    recordClick,
    computeEngagementScore,
    getNewsletterAnalytics,
    getSubscriberAnalytics,
    getNewsletterHeatMap,
    trackEmailSend,
    exportAnalyticsData
  };