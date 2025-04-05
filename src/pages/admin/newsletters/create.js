// src/pages/admin/newsletters/create.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormHelperText,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  Flex,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Alert,
  AlertIcon,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Grid,
  GridItem,
  Divider,
  Textarea,
  Image,
  SimpleGrid,
  useDisclosure,
} from '@chakra-ui/react';
import { FiArrowLeft, FiEdit, FiSend, FiEye, FiSave, FiMonitor, FiTablet, FiSmartphone } from 'react-icons/fi';
import Layout from '../../../components/layout/Layout';
import { useRouter } from 'next/router';
import { addNewsletter, getSubscribers } from '../../../lib/firebase';
import dynamic from 'next/dynamic';

// Import the rich text editor with SSR disabled
const DragDropEditor = dynamic(
  () => import('../../../components/editors/DragDropEditor'),
  { ssr: false }
);

// Newsletter template options
const TEMPLATE_OPTIONS = [
  { id: 'modern', name: 'Modern', description: 'Clean and modern layout with blue accents' },
  { id: 'professional', name: 'Professional', description: 'Professional design with a structured layout' },
  { id: 'minimal', name: 'Minimal', description: 'Minimalist design focused on content' },
];

export default function CreateNewsletter() {
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [newsletter, setNewsletter] = useState({
    title: '',
    subject: '',
    content: '',
    targetAudience: 'all', // all, segment, test
    scheduledDate: '',
    template: 'modern', // default template
    useTemplate: true,
    templateData: {
      email_title: '',
      introduction_text: '',
      feature_1_title: '',
      feature_1_description: '',
      feature_1_image: '',
      feature_2_title: '',
      feature_2_description: '',
      feature_2_image: '',
      feature_3_title: '',
      feature_3_description: '',
      feature_4_title: '',
      feature_4_description: '',
      feature_5_title: '',
      feature_5_description: '',
      cta_url: '',
      cta_text: '',
      // Company info
      company_name: 'Your Company',
      company_address: '123 Business Street, City, Country',
      support_email: 'support@example.com',
      website_domain: 'example.com',
      website_url: 'https://example.com',
      // Social media placeholders
      facebook_url: 'https://facebook.com',
      youtube_url: 'https://youtube.com',
      instagram_url: 'https://instagram.com',
      // Placeholder images for social icons
      facebook_icon: '/images/social/facebook.png',
      youtube_icon: '/images/social/youtube.png',
      instagram_icon: '/images/social/instagram.png',
      // Other URLs
      help_center_url: 'https://example.com/help',
      updates_url: 'https://example.com/updates',
      blog_url: 'https://example.com/blog',
      unsubscribe_url: 'https://example.com/unsubscribe',
    }
  });
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(true);
  
  const editorRef = useRef(null);
  const router = useRouter();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Update email title when the main title changes
  useEffect(() => {
    if (newsletter.title) {
      setNewsletter(prev => ({
        ...prev,
        templateData: {
          ...prev.templateData,
          email_title: prev.title
        }
      }));
    }
  }, [newsletter.title]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewsletter((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };
  
  const handleTemplateDataChange = (e) => {
    const { name, value } = e.target;
    setNewsletter(prev => ({
      ...prev,
      templateData: {
        ...prev.templateData,
        [name]: value
      }
    }));
  };
  
  const handleEditorChange = (content) => {
    setNewsletter(prev => ({
      ...prev,
      content
    }));
  };
  
  const handleSwitchChange = (e) => {
    const { checked } = e.target;
    setNewsletter(prev => ({
      ...prev,
      useTemplate: checked
    }));
    setShowTemplateEditor(checked);
  };
  
  const handleTemplateSelect = (templateId) => {
    setNewsletter(prev => ({
      ...prev,
      template: templateId
    }));
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
    
    if (newsletter.useTemplate) {
      // Validate template data
      const requiredFields = ['email_title', 'introduction_text', 'feature_1_title', 'feature_1_description'];
      for (const field of requiredFields) {
        if (!newsletter.templateData[field]) {
          setError(`Template field "${field}" is required`);
          return false;
        }
      }
    } else {
      // Validate custom content
      if (!newsletter.content.trim()) {
        setError('Newsletter content is required');
        return false;
      }
    }
    
    return true;
  };
  
  const openPreview = async () => {
    try {
      // For a real implementation, you would call an API to generate the preview
      // This is a simplified version
      let preview = '';
      
      if (newsletter.useTemplate) {
        // In a real implementation, you would fetch the rendered template from the server
        // For now, we'll just show a placeholder message
        preview = `
          <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                <h1 style="color: #165bfb;">${newsletter.templateData.email_title || newsletter.title}</h1>
                <p>${newsletter.templateData.introduction_text || 'Introduction text will appear here.'}</p>
                <hr style="border: 1px solid #eee; margin: 20px 0;" />
                <h2 style="color: #165bfb;">${newsletter.templateData.feature_1_title || 'Feature 1 Title'}</h2>
                <p>${newsletter.templateData.feature_1_description || 'Feature 1 description will appear here.'}</p>
                <div style="text-align: center; margin: 20px 0;">
                  <img src="${newsletter.templateData.feature_1_image || 'https://via.placeholder.com/600x300'}" 
                      alt="Feature 1" style="max-width: 100%; height: auto;" />
                </div>
                
                <div style="background-color: #f0f5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #165bfb;">${newsletter.templateData.feature_2_title || 'Feature 2 Title'}</h2>
                  <p>${newsletter.templateData.feature_2_description || 'Feature 2 description will appear here.'}</p>
                </div>
                
                <a href="${newsletter.templateData.cta_url || '#'}" 
                  style="display: inline-block; background-color: #165bfb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                  ${newsletter.templateData.cta_text || 'Click Here'}
                </a>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                  <p>You're receiving this email because you subscribed to our newsletter.</p>
                  <p>© ${new Date().getFullYear()} ${newsletter.templateData.company_name}</p>
                </div>
              </div>
            </body>
          </html>
        `;
      } else {
        // Use custom content
        preview = `
          <html>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;">
                <h1 style="color: #165bfb;">${newsletter.title}</h1>
                ${newsletter.content}
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
                  <p>You're receiving this email because you subscribed to our newsletter.</p>
                  <p>© ${new Date().getFullYear()} ${newsletter.templateData.company_name}</p>
                </div>
              </div>
            </body>
          </html>
        `;
      }
      
      setPreviewHtml(preview);
      onOpen();
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: "Preview generation failed",
        description: error.message || "There was an error generating the preview.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare final newsletter data
      const newsletterData = {
        title: newsletter.title,
        subject: newsletter.subject,
        targetAudience: newsletter.targetAudience,
        scheduledDate: newsletter.scheduledDate || null,
        useTemplate: newsletter.useTemplate,
        template: newsletter.template,
        templateData: newsletter.templateData,
      };
      
      // If not using template, include the custom content
      if (!newsletter.useTemplate) {
        newsletterData.content = newsletter.content;
      }
      
      // Save newsletter to Firebase
      const result = await addNewsletter(newsletterData);
      
      if (!result.success) {
        throw new Error('Failed to save newsletter');
      }
      
      toast({
        title: newsletter.scheduledDate ? "Newsletter scheduled!" : "Newsletter created!",
        description: newsletter.scheduledDate ? 
          "Your newsletter has been scheduled for delivery." : 
          "Your newsletter has been created successfully.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect to newsletter list
      router.push('/admin/newsletters');
    } catch (error) {
      console.error('Error creating newsletter:', error);
      setIsSubmitting(false);
      
      toast({
        title: "Failed to create newsletter",
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
          <Flex align="center" mb={4}>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              mr={4}
              onClick={() => router.push('/admin/newsletters')}
            >
              Back
            </Button>
            <Heading as="h1" size="xl">Create Newsletter</Heading>
          </Flex>
          
          <Text color="gray.600">
            Create and send a new newsletter to your subscribers.
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
              <Tab>Details</Tab>
              <Tab>Content</Tab>
              <Tab>Template</Tab>
              <Tab>Preview & Send</Tab>
            </TabList>
            
            <TabPanels>
              {/* Details Tab */}
              <TabPanel>
                <Stack spacing={5}>
                  <FormControl isRequired>
                    <FormLabel>Newsletter Title</FormLabel>
                    <Input 
                      name="title"
                      value={newsletter.title}
                      onChange={handleChange}
                      placeholder="E.g., March 2025 Updates"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Email Subject Line</FormLabel>
                    <Input 
                      name="subject"
                      value={newsletter.subject}
                      onChange={handleChange}
                      placeholder="E.g., March Updates - New Features & Improvements"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Target Audience</FormLabel>
                    <Select 
                      name="targetAudience"
                      value={newsletter.targetAudience}
                      onChange={handleChange}
                    >
                      <option value="all">All Subscribers</option>
                      <option value="segment">Active Readers Only</option>
                      <option value="test">Test Group Only</option>
                    </Select>
                    <FormHelperText>
                      Select who should receive this newsletter.
                    </FormHelperText>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Schedule Send (Optional)</FormLabel>
                    <Input 
                      type="datetime-local"
                      name="scheduledDate"
                      value={newsletter.scheduledDate}
                      onChange={handleChange}
                    />
                    <FormHelperText>
                      Leave blank to send immediately after publishing.
                    </FormHelperText>
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <FormLabel mb="0">
                      Use email template
                    </FormLabel>
                    <Switch 
                      isChecked={newsletter.useTemplate}
                      onChange={handleSwitchChange}
                      colorScheme="blue"
                    />
                  </FormControl>
                  
                  <Button 
                    mt={4} 
                    colorScheme="blue" 
                    rightIcon={<FiEdit />} 
                    onClick={() => setActiveTab(1)}
                  >
                    Next: Content
                  </Button>
                </Stack>
              </TabPanel>
              
              {/* Content Tab */}
              <TabPanel>
                {showTemplateEditor ? (
                  <Stack spacing={5}>
                    <Heading size="md" mb={2}>Template Content</Heading>
                    <Text color="gray.600" mb={4}>
                      Fill in the content for your newsletter template.
                    </Text>
                    
                    <FormControl isRequired>
                      <FormLabel>Introduction Text</FormLabel>
                      <Textarea 
                        name="introduction_text"
                        value={newsletter.templateData.introduction_text}
                        onChange={handleTemplateDataChange}
                        placeholder="Write a short introduction for your newsletter..."
                        rows={4}
                      />
                    </FormControl>
                    
                    <Divider my={4} />
                    
                    <Heading size="sm" mb={2}>Main Feature</Heading>
                    
                    <FormControl isRequired>
                      <FormLabel>Feature 1 Title</FormLabel>
                      <Input 
                        name="feature_1_title"
                        value={newsletter.templateData.feature_1_title}
                        onChange={handleTemplateDataChange}
                        placeholder="E.g., New Dashboard Features"
                      />
                    </FormControl>
                    
                    <FormControl isRequired>
                      <FormLabel>Feature 1 Description</FormLabel>
                      <Textarea 
                        name="feature_1_description"
                        value={newsletter.templateData.feature_1_description}
                        onChange={handleTemplateDataChange}
                        placeholder="Describe the main feature..."
                        rows={3}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Feature 1 Image URL</FormLabel>
                      <Input 
                        name="feature_1_image"
                        value={newsletter.templateData.feature_1_image}
                        onChange={handleTemplateDataChange}
                        placeholder="https://example.com/images/feature1.jpg"
                      />
                    </FormControl>
                    
                    <Divider my={4} />
                    
                    <Heading size="sm" mb={2}>Secondary Feature</Heading>
                    
                    <FormControl>
                      <FormLabel>Feature 2 Title</FormLabel>
                      <Input 
                        name="feature_2_title"
                        value={newsletter.templateData.feature_2_title}
                        onChange={handleTemplateDataChange}
                        placeholder="E.g., Improved User Interface"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Feature 2 Description</FormLabel>
                      <Textarea 
                        name="feature_2_description"
                        value={newsletter.templateData.feature_2_description}
                        onChange={handleTemplateDataChange}
                        placeholder="Describe the secondary feature..."
                        rows={3}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Feature 2 Image URL</FormLabel>
                      <Input 
                        name="feature_2_image"
                        value={newsletter.templateData.feature_2_image}
                        onChange={handleTemplateDataChange}
                        placeholder="https://example.com/images/feature2.jpg"
                      />
                    </FormControl>
                    
                    <Divider my={4} />
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                      <Box>
                        <Heading size="sm" mb={2}>Feature 3</Heading>
                        
                        <FormControl>
                          <FormLabel>Title</FormLabel>
                          <Input 
                            name="feature_3_title"
                            value={newsletter.templateData.feature_3_title}
                            onChange={handleTemplateDataChange}
                            placeholder="Feature 3 Title"
                          />
                        </FormControl>
                        
                        <FormControl mt={2}>
                          <FormLabel>Description</FormLabel>
                          <Textarea 
                            name="feature_3_description"
                            value={newsletter.templateData.feature_3_description}
                            onChange={handleTemplateDataChange}
                            placeholder="Feature 3 description..."
                            rows={2}
                          />
                        </FormControl>
                      </Box>
                      
                      <Box>
                        <Heading size="sm" mb={2}>Feature 4</Heading>
                        
                        <FormControl>
                          <FormLabel>Title</FormLabel>
                          <Input 
                            name="feature_4_title"
                            value={newsletter.templateData.feature_4_title}
                            onChange={handleTemplateDataChange}
                            placeholder="Feature 4 Title"
                          />
                        </FormControl>
                        
                        <FormControl mt={2}>
                          <FormLabel>Description</FormLabel>
                          <Textarea 
                            name="feature_4_description"
                            value={newsletter.templateData.feature_4_description}
                            onChange={handleTemplateDataChange}
                            placeholder="Feature 4 description..."
                            rows={2}
                          />
                        </FormControl>
                      </Box>
                    </SimpleGrid>
                    
                    <Divider my={4} />
                    
                    <Heading size="sm" mb={2}>Call to Action</Heading>
                    
                    <FormControl>
                      <FormLabel>CTA Text</FormLabel>
                      <Input 
                        name="cta_text"
                        value={newsletter.templateData.cta_text}
                        onChange={handleTemplateDataChange}
                        placeholder="E.g., Try it now!"
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>CTA URL</FormLabel>
                      <Input 
                        name="cta_url"
                        value={newsletter.templateData.cta_url}
                        onChange={handleTemplateDataChange}
                        placeholder="https://example.com/action"
                      />
                    </FormControl>
                  </Stack>
                ) : (
                  <Stack spacing={5}>
                    <Heading size="md" mb={2}>Custom Content</Heading>
                    <Text color="gray.600" mb={4}>
                      Create your newsletter with the drag-and-drop editor.
                    </Text>
                    
                    <Box border="1px" borderColor="gray.200" borderRadius="md" overflow="hidden">
                      <DragDropEditor 
                        ref={editorRef}
                        initialValue={newsletter.content}
                        onChange={handleEditorChange}
                        onPreview={openPreview}
                      />
                    </Box>
                  </Stack>
                )}
                
                <Flex justify="space-between" mt={8}>
                  <Button onClick={() => setActiveTab(0)}>
                    Back to Details
                  </Button>
                  <Button colorScheme="blue" onClick={() => setActiveTab(2)}>
                    Next: Choose Template
                  </Button>
                </Flex>
              </TabPanel>
              
              {/* Template Tab */}
              <TabPanel>
                {newsletter.useTemplate ? (
                  <Stack spacing={5}>
                    <Heading size="md" mb={2}>Select Template</Heading>
                    <Text color="gray.600" mb={4}>
                      Choose a template design for your newsletter.
                    </Text>
                    
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                      {TEMPLATE_OPTIONS.map(template => (
                        <Box 
                          key={template.id}
                          borderWidth="1px"
                          borderRadius="lg"
                          overflow="hidden"
                          cursor="pointer"
                          onClick={() => handleTemplateSelect(template.id)}
                          boxShadow={newsletter.template === template.id ? "0 0 0 2px #3182CE" : "none"}
                          _hover={{ boxShadow: "sm" }}
                          transition="all 0.2s"
                        >
                          <Image 
                            src={`/images/templates/${template.id}-thumb.jpg`}
                            fallbackSrc="https://via.placeholder.com/300x200?text=Template+Preview"
                            alt={template.name}
                            height="200px"
                            width="100%"
                            objectFit="cover"
                          />
                          <Box p={4}>
                            <Heading size="md">{template.name}</Heading>
                            <Text mt={2} color="gray.600">
                              {template.description}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </Stack>
                ) : (
                  <Box textAlign="center" py={10}>
                    <Text fontSize="lg" mb={4}>
                      Custom content mode is selected. No template needed.
                    </Text>
                    <Text color="gray.600">
                      You can go back to the Details tab if you want to use a template instead.
                    </Text>
                  </Box>
                )}
                
                <Flex justify="space-between" mt={8}>
                  <Button onClick={() => setActiveTab(1)}>
                    Back to Content
                  </Button>
                  <Button colorScheme="blue" onClick={() => setActiveTab(3)}>
                    Next: Preview & Send
                  </Button>
                </Flex>
              </TabPanel>
              
              {/* Preview Tab */}
              <TabPanel>
                <Stack spacing={5}>
                  <Heading size="md" mb={2}>Preview & Send</Heading>
                  <Text color="gray.600" mb={4}>
                    Review your newsletter before sending.
                  </Text>
                  
                  <Box 
                    borderWidth="1px"
                    borderRadius="md"
                    p={6}
                  >
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="lg">{newsletter.title}</Heading>
                      
                      <HStack>
                        <Badge colorScheme="blue">
                          {newsletter.useTemplate ? `Template: ${newsletter.template}` : 'Custom Content'}
                        </Badge>
                        
                        <Badge colorScheme={newsletter.targetAudience === 'test' ? 'yellow' : 'green'}>
                          {newsletter.targetAudience === 'all' ? 'All Subscribers' : 
                           newsletter.targetAudience === 'test' ? 'Test Group' : 
                           'Active Readers'}
                        </Badge>
                        
                        {newsletter.scheduledDate && (
                          <Badge colorScheme="purple">
                            Scheduled: {new Date(newsletter.scheduledDate).toLocaleString()}
                          </Badge>
                        )}
                      </HStack>
                    </Flex>
                    
                    <Divider mb={4} />
                    
                    <Text fontWeight="bold" mb={2}>Subject: {newsletter.subject}</Text>
                    
                    <Box mt={6} textAlign="center">
                      <Button 
                        leftIcon={<FiEye />}
                        colorScheme="blue"
                        onClick={openPreview}
                      >
                        Preview Newsletter
                      </Button>
                      <Text fontSize="sm" color="gray.500" mt={2}>
                        Click to see how your newsletter will appear to subscribers
                      </Text>
                    </Box>
                  </Box>
                </Stack>
                
                <Flex justify="space-between" mt={8}>
                  <Button onClick={() => setActiveTab(2)}>
                    Back to Template
                  </Button>
                  <Button 
                    type="submit"
                    colorScheme="blue"
                    leftIcon={<FiSend />}
                    isLoading={isSubmitting}
                    loadingText="Creating..."
                  >
                    {newsletter.scheduledDate ? 'Schedule Newsletter' : 'Create Newsletter'}
                  </Button>
                </Flex>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>
      
      {/* Preview Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW={{ base: "95%", md: "800px" }}>
          <ModalHeader>
            Newsletter Preview
            <Flex mt={2} gap={2}>
              <Button
                size="sm"
                leftIcon={<FiSmartphone />}
                variant={previewMode === 'mobile' ? 'solid' : 'outline'}
                onClick={() => setPreviewMode('mobile')}
              >
                Mobile
              </Button>
              <Button
                size="sm"
                leftIcon={<FiTablet />}
                variant={previewMode === 'tablet' ? 'solid' : 'outline'}
                onClick={() => setPreviewMode('tablet')}
              >
                Tablet
              </Button>
              <Button
                size="sm"
                leftIcon={<FiMonitor />}
                variant={previewMode === 'desktop' ? 'solid' : 'outline'}
                onClick={() => setPreviewMode('desktop')}
              >
                Desktop
              </Button>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0}>
            <Box
              height="70vh"
              width="100%"
              overflow="hidden"
              borderTop="1px solid"
              borderColor="gray.200"
            >
              <iframe
                srcDoc={previewHtml}
                title="Newsletter Preview"
                width={previewMode === 'mobile' ? '375px' : previewMode === 'tablet' ? '768px' : '100%'}
                height="100%"
                style={{
                  border: 'none',
                  margin: '0 auto',
                  display: 'block',
                  maxWidth: '100%'
                }}
              />
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
}