import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Textarea,
  Select,
  Stack,
  Text,
  Flex,
  useToast,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import Layout from '../../../components/layout/Layout';
import { useRouter } from 'next/router';
import { addNewsletter, getSubscribers, updateNewsletter } from '../../../lib/firebase';
import { sendEmail } from '../../../lib/emailjs';

export default function CreateNewsletter() {
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletter, setNewsletter] = useState({
    title: '',
    subject: '',
    content: '',
    targetAudience: 'all', // all, segment, test
    scheduledDate: '',
  });
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const toast = useToast();
  
  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewsletter((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };
  
  const validateForm = () => {
    if (!newsletter.title.trim()) {
      setError('Newsletter title is required');
      return false;
    }
    
    if (!newsletter.subject.trim()) {
      setError('Email subject is required');
      return false;
    }
    
    if (!newsletter.content.trim()) {
      setError('Newsletter content is required');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save newsletter to Firebase
      const result = await addNewsletter({
        title: newsletter.title,
        subject: newsletter.subject,
        content: newsletter.content,
        targetAudience: newsletter.targetAudience,
        scheduledDate: newsletter.scheduledDate || null,
      });
      
      if (!result.success) {
        throw new Error('Failed to save newsletter');
      }
      
      const newsletterId = result.id;
      
      // If no scheduled date, send it now
      if (!newsletter.scheduledDate) {
        // Get subscribers
        let subscribers;
        try {
          if (newsletter.targetAudience === 'all') {
            subscribers = await getSubscribers('active');
          } else if (newsletter.targetAudience === 'test') {
            // For test, just use the first subscriber
            const allSubscribers = await getSubscribers('active');
            subscribers = allSubscribers.slice(0, 1);
          } else {
            // This would need more complex logic based on your segmentation
            subscribers = await getSubscribers('active');
          }
        } catch (error) {
          console.error('Error fetching subscribers:', error);
          throw new Error('Failed to fetch subscribers');
        }
        
        if (subscribers.length === 0) {
          throw new Error('No subscribers found to send newsletter to');
        }
        
        // Send to each subscriber
        let sentCount = 0;
        for (const subscriber of subscribers) {
          try {
            const emailResult = await sendEmail({
              to_email: subscriber.email,
              subject: newsletter.subject,
              message_html: newsletter.content,
            }, process.env.NEXT_PUBLIC_EMAILJS_NEWSLETTER_TEMPLATE_ID);
            
            if (emailResult.success) {
              sentCount++;
            }
          } catch (error) {
            console.error(`Error sending to ${subscriber.email}:`, error);
          }
        }
        
        // Update the newsletter as sent
        await updateNewsletter(newsletterId, { 
          sent: true, 
          sentAt: new Date().toISOString(),
          sentCount
        });
        
        toast({
          title: "Newsletter sent!",
          description: `Your newsletter has been sent to ${sentCount} subscribers.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Newsletter scheduled!",
          description: "Your newsletter has been scheduled for delivery.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      }
      
      // Redirect to dashboard
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error handling newsletter:', error);
      setIsSubmitting(false);
      
      toast({
        title: "Failed to process newsletter",
        description: error.message || "There was an error. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render until client-side
  if (!isClient) {
    return null;
  }

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Heading as="h1" size="xl">Create Newsletter</Heading>
          <Text color="gray.600" mt={2}>
            Compose and send a new newsletter to your subscribers.
          </Text>
        </Box>
        
        {error && (
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
        
        <Box 
          as="form" 
          onSubmit={handleSubmit}
          bg="white"
          p={6}
          rounded="lg"
          boxShadow="md"
        >
          <Tabs variant="enclosed" index={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab>Content</Tab>
              <Tab>Settings</Tab>
              <Tab>Preview</Tab>
            </TabList>
            
            <TabPanels>
              {/* Content Tab */}
              <TabPanel>
                <Stack spacing={5}>
                  <FormControl isRequired>
                    <FormLabel>Newsletter Title</FormLabel>
                    <Input 
                      name="title"
                      value={newsletter.title}
                      onChange={handleChange}
                      placeholder="E.g., March 2025 Newsletter"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Email Subject Line</FormLabel>
                    <Input 
                      name="subject"
                      value={newsletter.subject}
                      onChange={handleChange}
                      placeholder="E.g., The Latest Industry Updates - March 2025"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Newsletter Content</FormLabel>
                    <Textarea 
                      name="content"
                      value={newsletter.content}
                      onChange={handleChange}
                      placeholder="Write your newsletter content here..."
                      minH="300px"
                    />
                  </FormControl>
                  
                  <Button mt={4} colorScheme="blue" onClick={() => setActiveTab(1)}>
                    Next: Settings
                  </Button>
                </Stack>
              </TabPanel>
              
              {/* Settings Tab */}
              <TabPanel>
                <Stack spacing={5}>
                  <FormControl>
                    <FormLabel>Target Audience</FormLabel>
                    <Select 
                      name="targetAudience"
                      value={newsletter.targetAudience}
                      onChange={handleChange}
                    >
                      <option value="all">All Subscribers</option>
                      <option value="segment">Segment: Active Readers</option>
                      <option value="test">Test Group Only</option>
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Schedule</FormLabel>
                    <Input 
                      type="datetime-local"
                      name="scheduledDate"
                      value={newsletter.scheduledDate}
                      onChange={handleChange}
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Leave blank to send immediately after reviewing
                    </Text>
                  </FormControl>
                  
                  <Flex justify="space-between" mt={4}>
                    <Button onClick={() => setActiveTab(0)}>
                      Back to Content
                    </Button>
                    <Button colorScheme="blue" onClick={() => setActiveTab(2)}>
                      Next: Preview
                    </Button>
                  </Flex>
                </Stack>
              </TabPanel>
              
              {/* Preview Tab */}
              <TabPanel>
                <Box mb={5}>
                  <Heading size="md" mb={2}>Preview</Heading>
                  <Text fontSize="sm" color="gray.500">
                    This is how your newsletter will appear to subscribers.
                  </Text>
                </Box>
                
                {newsletter.title || newsletter.content ? (
                  <Box borderWidth="1px" borderRadius="lg" p={6}>
                    <HStack mb={4}>
                      <Badge>Preview</Badge>
                      {newsletter.scheduledDate && (
                        <Badge colorScheme="blue">
                          Scheduled: {new Date(newsletter.scheduledDate).toLocaleString()}
                        </Badge>
                      )}
                      <Badge colorScheme={newsletter.targetAudience === 'test' ? 'yellow' : 'green'}>
                        {newsletter.targetAudience === 'all' ? 'All Subscribers' : 
                         newsletter.targetAudience === 'test' ? 'Test Group Only' : 
                         'Segment: Active Readers'}
                      </Badge>
                    </HStack>
                    
                    <Box borderBottom="1px" borderColor="gray.200" pb={4} mb={4}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.500" mb={1}>
                        Subject: {newsletter.subject || "Your Subject Line"}
                      </Text>
                    </Box>
                    
                    <Heading as="h2" size="lg" mb={4}>
                      {newsletter.title || "Newsletter Title"}
                    </Heading>
                    
                    <Box whiteSpace="pre-wrap">
                      {newsletter.content || "Your newsletter content will appear here."}
                    </Box>
                  </Box>
                ) : (
                  <Box p={10} textAlign="center" bg="gray.50" borderRadius="md">
                    <Text color="gray.500">
                      Add content in the first tab to see a preview here.
                    </Text>
                  </Box>
                )}
                
                <Flex justify="space-between" mt={8}>
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab(1)}
                  >
                    Back to Settings
                  </Button>
                  
                  <HStack>
                    <Button 
                      variant="outline" 
                      colorScheme="blue"
                    >
                      Save as Draft
                    </Button>
                    <Button 
                      type="submit"
                      colorScheme="blue"
                      isLoading={isSubmitting}
                      loadingText="Saving"
                      disabled={!newsletter.title || !newsletter.subject || !newsletter.content}
                    >
                      {newsletter.scheduledDate ? 'Schedule Newsletter' : 'Send Newsletter'}
                    </Button>
                  </HStack>
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>
    </Layout>
  );
}