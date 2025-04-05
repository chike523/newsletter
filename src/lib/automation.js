// src/lib/automation.js
import { db } from './firebase';
import { doc, collection, addDoc, getDocs, getDoc, updateDoc, query, where, orderBy, limit, Timestamp, deleteDoc } from 'firebase/firestore';
import { sendSingleEmail } from './emailDelivery';
import { processContentForTracking } from './analytics';

/**
 * Email Automation System
 * 
 * This module handles automated email sequences including:
 * - Welcome sequences
 * - Drip campaigns
 * - Trigger-based emails
 * - Re-engagement campaigns
 */

// Automation types
export const AUTOMATION_TYPES = {
  WELCOME: 'welcome',
  DRIP: 'drip',
  TRIGGER: 'trigger',
  REENGAGEMENT: 'reengagement'
};

// Trigger types
export const TRIGGER_TYPES = {
  SUBSCRIPTION: 'subscription',
  TAG_ADDED: 'tag_added',
  LINK_CLICKED: 'link_clicked',
  EMAIL_OPENED: 'email_opened',
  CUSTOM_EVENT: 'custom_event',
  INACTIVITY: 'inactivity'
};

// Create a new automation sequence
export const createAutomation = async (automationData) => {
  try {
    // Validate automation data
    if (!automationData.type || !Object.values(AUTOMATION_TYPES).includes(automationData.type)) {
      return { success: false, error: 'Invalid automation type' };
    }
    
    if (!automationData.name) {
      return { success: false, error: 'Automation name is required' };
    }
    
    // Create automation document
    const docRef = await addDoc(collection(db, 'automations'), {
      ...automationData,
      createdAt: Timestamp.now(),
      active: automationData.active || false,
      emailsSent: 0
    });
    
    // If it has emails, add them as separate documents in a subcollection
    if (automationData.emails && Array.isArray(automationData.emails)) {
      for (let i = 0; i < automationData.emails.length; i++) {
        const email = automationData.emails[i];
        
        await addDoc(collection(db, 'automations', docRef.id, 'emails'), {
          ...email,
          order: i,
          createdAt: Timestamp.now()
        });
      }
    }
    
    return { 
      success: true, 
      id: docRef.id 
    };
  } catch (error) {
    console.error('Error creating automation:', error);
    return { success: false, error };
  }
};

// Get automation details
export const getAutomation = async (automationId) => {
  try {
    const automationRef = doc(db, 'automations', automationId);
    const automationSnap = await getDoc(automationRef);
    
    if (!automationSnap.exists()) {
      return { success: false, error: 'Automation not found' };
    }
    
    const automation = {
      id: automationSnap.id,
      ...automationSnap.data()
    };
    
    // Get automation emails
    const emailsRef = collection(db, 'automations', automationId, 'emails');
    const emailsQuery = query(emailsRef, orderBy('order', 'asc'));
    const emailsSnap = await getDocs(emailsQuery);
    
    const emails = [];
    emailsSnap.forEach(doc => {
      emails.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      automation: {
        ...automation,
        emails
      }
    };
  } catch (error) {
    console.error('Error getting automation:', error);
    return { success: false, error };
  }
};

// Update automation
export const updateAutomation = async (automationId, updateData) => {
  try {
    const automationRef = doc(db, 'automations', automationId);
    await updateDoc(automationRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating automation:', error);
    return { success: false, error };
  }
};

// Delete automation
export const deleteAutomation = async (automationId) => {
  try {
    // First, delete all emails in the subcollection
    const emailsRef = collection(db, 'automations', automationId, 'emails');
    const emailsSnap = await getDocs(emailsRef);
    
    const batch = writeBatch(db);
    emailsSnap.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    // Then delete the automation document
    const automationRef = doc(db, 'automations', automationId);
    await deleteDoc(automationRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting automation:', error);
    return { success: false, error };
  }
};

// Add a subscriber to an automation sequence
export const addSubscriberToAutomation = async (automationId, subscriberId, customData = {}) => {
  try {
    // Get the automation
    const automationRef = doc(db, 'automations', automationId);
    const automationSnap = await getDoc(automationRef);
    
    if (!automationSnap.exists()) {
      return { success: false, error: 'Automation not found' };
    }
    
    const automation = automationSnap.data();
    
    // Check if automation is active
    if (!automation.active) {
      return { success: false, error: 'Automation is not active' };
    }
    
    // Check if subscriber is already in this automation
    const subscriberAutomationRef = collection(db, 'subscriber_automations');
    const q = query(
      subscriberAutomationRef,
      where('automationId', '==', automationId),
      where('subscriberId', '==', subscriberId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      // Subscriber is already in this automation
      return { success: false, error: 'Subscriber is already in this automation' };
    }
    
    // Add subscriber to automation
    const startDate = new Date();
    
    // If there's a delay before the first email, add it
    if (automation.initialDelay) {
      startDate.setTime(startDate.getTime() + (automation.initialDelay * 1000));
    }
    
    const docRef = await addDoc(collection(db, 'subscriber_automations'), {
      automationId,
      subscriberId,
      currentEmailIndex: 0,
      status: 'active',
      startedAt: Timestamp.now(),
      nextEmailDate: Timestamp.fromDate(startDate),
      customData
    });
    
    return { 
      success: true, 
      id: docRef.id 
    };
  } catch (error) {
    console.error('Error adding subscriber to automation:', error);
    return { success: false, error };
  }
};

// Process automation emails that are due to be sent
export const processAutomationEmails = async () => {
  try {
    const now = Timestamp.now();
    
    // Get subscriber automations with emails due to be sent
    const subscriberAutomationRef = collection(db, 'subscriber_automations');
    const q = query(
      subscriberAutomationRef,
      where('status', '==', 'active'),
      where('nextEmailDate', '<=', now)
    );
    
    const querySnapshot = await getDocs(q);
    
    let sentCount = 0;
    let errorCount = 0;
    
    for (const doc of querySnapshot.docs) {
      const subscriberAutomation = doc.data();
      
      try {
        // Get the automation
        const automationRef = doc(db, 'automations', subscriberAutomation.automationId);
        const automationSnap = await getDoc(automationRef);
        
        if (!automationSnap.exists()) {
          // Automation no longer exists, mark as complete
          await updateDoc(doc.ref, {
            status: 'completed',
            endedAt: now,
            endReason: 'automation_deleted'
          });
          continue;
        }
        
        const automation = automationSnap.data();
        
        // Get the subscriber
        const subscriberRef = doc(db, 'subscribers', subscriberAutomation.subscriberId);
        const subscriberSnap = await getDoc(subscriberRef);
        
        if (!subscriberSnap.exists()) {
          // Subscriber no longer exists, mark as complete
          await updateDoc(doc.ref, {
            status: 'completed',
            endedAt: now,
            endReason: 'subscriber_deleted'
          });
          continue;
        }
        
        const subscriber = subscriberSnap.data();
        
        // Check if subscriber is still active
        if (subscriber.status !== 'active') {
          // Subscriber is unsubscribed or bounced, mark as complete
          await updateDoc(doc.ref, {
            status: 'completed',
            endedAt: now,
            endReason: `subscriber_${subscriber.status}`
          });
          continue;
        }
        
        // Get automation emails
        const emailsRef = collection(db, 'automations', subscriberAutomation.automationId, 'emails');
        const emailsQuery = query(emailsRef, orderBy('order', 'asc'));
        const emailsSnap = await getDocs(emailsQuery);
        
        const emails = [];
        emailsSnap.forEach(doc => {
          emails.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Check if we've sent all emails
        if (subscriberAutomation.currentEmailIndex >= emails.length) {
          // All emails sent, mark as complete
          await updateDoc(doc.ref, {
            status: 'completed',
            endedAt: now,
            endReason: 'sequence_completed'
          });
          continue;
        }
        
        // Get the current email to send
        const currentEmail = emails[subscriberAutomation.currentEmailIndex];
        
        // Send the email
        const emailResult = await sendSingleEmail({
          id: currentEmail.id,
          title: currentEmail.subject,
          subject: currentEmail.subject,
          content: currentEmail.content
        }, {
          id: subscriberAutomation.subscriberId,
          email: subscriber.email,
          name: subscriber.name
        });
        
        if (emailResult.success) {
          sentCount++;
          
          // Update automation stats
          await updateDoc(automationRef, {
            emailsSent: increment(1)
          });
          
          // Calculate next email date
          let nextEmailDate = null;
          
          if (subscriberAutomation.currentEmailIndex + 1 < emails.length) {
            const nextEmail = emails[subscriberAutomation.currentEmailIndex + 1];
            const delay = nextEmail.delay || 86400; // Default 1 day (in seconds)
            
            const nextDate = new Date();
            nextDate.setTime(nextDate.getTime() + (delay * 1000));
            nextEmailDate = Timestamp.fromDate(nextDate);
          }
          
          // Update subscriber automation
          await updateDoc(doc.ref, {
            currentEmailIndex: subscriberAutomation.currentEmailIndex + 1,
            lastEmailSent: now,
            lastEmailId: currentEmail.id,
            nextEmailDate
          });
          
          // If no more emails, mark as complete
          if (!nextEmailDate) {
            await updateDoc(doc.ref, {
              status: 'completed',
              endedAt: now,
              endReason: 'sequence_completed'
            });
          }
          
          // Log email send
          await addDoc(collection(db, 'automation_logs'), {
            automationId: subscriberAutomation.automationId,
            subscriberId: subscriberAutomation.subscriberId,
            emailId: currentEmail.id,
            sentAt: now,
            success: true
          });
        } else {
          errorCount++;
          
          // Log email failure
          await addDoc(collection(db, 'automation_logs'), {
            automationId: subscriberAutomation.automationId,
            subscriberId: subscriberAutomation.subscriberId,
            emailId: currentEmail.id,
            sentAt: now,
            success: false,
            error: emailResult.error
          });
        }
      } catch (error) {
        console.error('Error processing automation email:', error);
        errorCount++;
      }
    }
    
    return {
      success: true,
      sentCount,
      errorCount
    };
  } catch (error) {
    console.error('Error processing automation emails:', error);
    return { success: false, error };
  }
};

// Handle a trigger event that might start an automation
export const handleTriggerEvent = async (triggerType, data) => {
  try {
    // Find automations that match this trigger
    const automationsRef = collection(db, 'automations');
    const q = query(
      automationsRef,
      where('type', '==', AUTOMATION_TYPES.TRIGGER),
      where('triggerType', '==', triggerType),
      where('active', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    let activatedCount = 0;
    
    for (const doc of querySnapshot.docs) {
      const automation = doc.data();
      
      // Check if this trigger matches the automation conditions
      let matches = true;
      
      if (automation.conditions) {
        // Process conditions (this would be more sophisticated in a real implementation)
        for (const condition of automation.conditions) {
          if (condition.field && condition.value) {
            if (data[condition.field] !== condition.value) {
              matches = false;
              break;
            }
          }
        }
      }
      
      if (matches && data.subscriberId) {
        // Add the subscriber to this automation
        const result = await addSubscriberToAutomation(doc.id, data.subscriberId, data);
        
        if (result.success) {
          activatedCount++;
        }
      }
    }
    
    return {
      success: true,
      activatedCount
    };
  } catch (error) {
    console.error('Error handling trigger event:', error);
    return { success: false, error };
  }
};

// Create re-engagement campaign for inactive subscribers
export const createReengagementCampaign = async (name, content, options = {}) => {
  try {
    // Define inactive threshold (default 90 days)
    const inactiveDays = options.inactiveDays || 90;
    const now = new Date();
    const inactiveDate = new Date();
    inactiveDate.setDate(now.getDate() - inactiveDays);
    
    // Create the automation
    const automationData = {
      name,
      type: AUTOMATION_TYPES.REENGAGEMENT,
      active: options.active || false,
      createdAt: Timestamp.now(),
      inactiveDays,
      emails: [
        {
          subject: options.subject || `We miss you! ${name}`,
          content,
          order: 0
        }
      ]
    };
    
    const result = await createAutomation(automationData);
    
    if (!result.success) {
      return result;
    }
    
    // Find inactive subscribers
    const subscribersRef = collection(db, 'subscribers');
    const q = query(
      subscribersRef,
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    let addedCount = 0;
    const inactiveTimestamp = Timestamp.fromDate(inactiveDate);
    
    // Add inactive subscribers to the automation
    for (const doc of querySnapshot.docs) {
      const subscriber = doc.data();
      
      // Check if subscriber is inactive
      let isInactive = false;
      
      if (!subscriber.lastOpened) {
        // No open record at all
        isInactive = true;
      } else if (subscriber.lastOpened < inactiveTimestamp) {
        // Last open is before our inactive threshold
        isInactive = true;
      }
      
      if (isInactive) {
        const addResult = await addSubscriberToAutomation(result.id, doc.id);
        
        if (addResult.success) {
          addedCount++;
        }
      }
    }
    
    return {
      success: true,
      automationId: result.id,
      inactiveSubscribersCount: addedCount
    };
  } catch (error) {
    console.error('Error creating re-engagement campaign:', error);
    return { success: false, error };
  }
};

// Create a welcome sequence
export const createWelcomeSequence = async (name, emails, options = {}) => {
  try {
    // Create the automation
    const automationData = {
      name,
      type: AUTOMATION_TYPES.WELCOME,
      triggerType: TRIGGER_TYPES.SUBSCRIPTION,
      active: options.active || false,
      createdAt: Timestamp.now(),
      initialDelay: options.initialDelay || 0, // Delay in seconds before first email
      emails: emails.map((email, index) => ({
        ...email,
        order: index
      }))
    };
    
    const result = await createAutomation(automationData);
    
    return result;
  } catch (error) {
    console.error('Error creating welcome sequence:', error);
    return { success: false, error };
  }
};

export default {
  AUTOMATION_TYPES,
  TRIGGER_TYPES,
  createAutomation,
  getAutomation,
  updateAutomation,
  deleteAutomation,
  addSubscriberToAutomation,
  processAutomationEmails,
  handleTriggerEvent,
  createReengagementCampaign,
  createWelcomeSequence
};