import emailjs from '@emailjs/browser';

// Initialize EmailJS
export const initEmailJS = () => {
  emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_USER_ID);
};

// Send a newsletter to a single subscriber
export const sendEmail = async (templateParams, templateId) => {
  try {
    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      templateId,
      templateParams
    );
    return { success: true, response };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

// Handle newsletter subscription confirmation
export const handleSubscription = async (email, name = '') => {
  try {
    const response = await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_SUBSCRIPTION_TEMPLATE_ID,
      {
        to_email: email,
        to_name: name,
        subscription_date: new Date().toLocaleDateString()
      }
    );
    return { success: true, response };
  } catch (error) {
    console.error('Error handling subscription:', error);
    return { success: false, error };
  }
};

export default { initEmailJS, sendEmail, handleSubscription };