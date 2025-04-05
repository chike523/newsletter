// src/pages/admin/newsletters/edit/[id].js
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
  Spinner,
} from '@chakra-ui/react';
import Layout from '@/components/layout/Layout';
import { useRouter } from 'next/router';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { doc, getDoc } from 'firebase/firestore';
import { db, updateNewsletter } from '@/lib/firebase';

export default function EditNewsletter() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletter, setNewsletter] = useState({
    title: '',
    subject: '',
    content: '',
    targetAudience: 'all',
    scheduledDate: '',
  });
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const toast = useToast();
  const { id } = router.query;
  
  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Fetch newsletter data
  useEffect(() => {
    const fetchNewsletter = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const docRef = doc(db, 'newsletters', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check if newsletter can be edited
          if (data.sent) {
            toast({
              title: "Cannot edit sent newsletter",
              description: "Newsletters that have already been sent cannot be edited.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
            router.push('/admin/newsletters');
            return;
          }
          
          setNewsletter({
            title: data.title || '',
            subject: data.subject || '',
            content: data.content || '',
            targetAudience: data.targetAudience || 'all',
            scheduledDate: data.scheduledDate || '',
          });
        } else {
          toast({
            title: "Newsletter not found",
            description: "The requested newsletter could not be found.",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          router.push('/admin/newsletters');
        }
      } catch (error) {
        console.error("Error fetching newsletter:", error);
        toast({
          title: "Error loading newsletter",
          description: "There was a problem loading the newsletter data.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isClient && id) {
      fetchNewsletter();
    }
  }, [isClient, id, router, toast]);
  
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
      if (!id) {
        throw new Error('Newsletter ID is missing');
      }
      
      const result = await updateNewsletter(id, {
        title: newsletter.title,
        subject: newsletter.subject,
        content: newsletter.content,
        targetAudience: newsletter.targetAudience,
        scheduledDate: newsletter.scheduledDate || null,
        updatedAt: new Date().toISOString(),
      });
      
      if (!result.success) {
        throw new Error('Failed to update newsletter');
      }
      
      toast({
        title: "Newsletter updated",
        description: "Your newsletter has been updated successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      router.push('/admin/newsletters');
    } catch (error) {
      console.error('Error updating newsletter:', error);
      setIsSubmitting(false);
      
      toast({
        title: "Update failed",
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
        <Flex mb={6} alignItems="center">
          <Button
            leftIcon={<FiArrowLeft />}
            variant="ghost"
            mr={4}
            onClick={() => router.push('/admin/newsletters')}
          >
            Back
          </Button>
          <Heading as="h1" size="xl">Edit Newsletter</Heading>
        </Flex>
        
        {loading ? (
          <Flex justify="center" align="center" height="300px">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <>
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
                      
                      <Button 
                        type="submit"
                        colorScheme="blue"
                        leftIcon={<FiSave />}
                        isLoading={isSubmitting}
                        loadingText="Saving"
                        disabled={!newsletter.title || !newsletter.subject || !newsletter.content}
                      >
                        Save Changes
                      </Button>
                    </Flex>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </>
        )}
      </Container>
    </Layout>
  );
}