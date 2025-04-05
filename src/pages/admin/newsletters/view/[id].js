// src/pages/admin/newsletters/view/[id].js
// Modified to use getNewsletterById and add send functionality

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Badge,
  Flex,
  HStack,
  VStack,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useToast,
  Spinner,
  IconButton,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiArrowLeft, FiEdit, FiTrash2, FiSend } from 'react-icons/fi';
import Layout from '../../../../components/layout/Layout';
import { getNewsletterById, deleteNewsletter, sendNewsletter } from '../../../../lib/firebase';

export default function ViewNewsletter() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newsletter, setNewsletter] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const router = useRouter();
  const toast = useToast();
  const { id } = router.query;
  const cancelRef = React.useRef();

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
        const data = await getNewsletterById(id);
        
        if (data) {
          setNewsletter(data);
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

  const handleSend = async () => {
    if (!newsletter || newsletter.sent) return;
    
    setSending(true);
    try {
      const result = await sendNewsletter(id);
      
      if (result.success) {
        // Update local state
        setNewsletter({
          ...newsletter,
          sent: true,
          sentAt: new Date().toISOString(),
          sentCount: result.sentCount
        });
        
        toast({
          title: "Newsletter sent!",
          description: `Successfully sent to ${result.sentCount} subscriber(s)`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error(result.error || "Failed to send newsletter");
      }
    } catch (error) {
      console.error("Error sending newsletter:", error);
      toast({
        title: "Send failed",
        description: error.message || "There was a problem sending the newsletter.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteNewsletter(id);
      
      if (result.success) {
        toast({
          title: "Newsletter deleted",
          description: "The newsletter has been deleted successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        router.push('/admin/newsletters');
      } else {
        throw new Error("Failed to delete newsletter");
      }
    } catch (error) {
      console.error("Error deleting newsletter:", error);
      toast({
        title: "Delete failed",
        description: "There was a problem deleting the newsletter.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  // Don't render anything until client-side
  if (!isClient) return null;

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Flex mb={8} justifyContent="space-between" alignItems="center">
          <Button
            leftIcon={<FiArrowLeft />}
            variant="ghost"
            onClick={() => router.push('/admin/newsletters')}
          >
            Back to newsletters
          </Button>
          
          {newsletter && (
            <HStack>
              {!newsletter.sent && (
                <>
                  <Button
                    leftIcon={<FiSend />}
                    colorScheme="green"
                    onClick={handleSend}
                    isLoading={sending}
                    loadingText="Sending..."
                  >
                    Send Now
                  </Button>
                  <Button
                    leftIcon={<FiEdit />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => router.push(`/admin/newsletters/edit/${id}`)}
                  >
                    Edit
                  </Button>
                </>
              )}
              <IconButton
                icon={<FiTrash2 />}
                colorScheme="red"
                variant="outline"
                aria-label="Delete newsletter"
                onClick={() => setIsDeleteOpen(true)}
              />
            </HStack>
          )}
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" height="300px">
            <Spinner size="xl" />
          </Flex>
        ) : newsletter ? (
          <Box>
            <VStack align="start" spacing={4} mb={8}>
              <Heading as="h1" size="xl">{newsletter.title}</Heading>
              
              <HStack>
                <Badge colorScheme={newsletter.sent ? 'green' : 
                                  newsletter.scheduledDate ? 'purple' : 'blue'}>
                  {newsletter.sent ? 'Sent' : 
                   newsletter.scheduledDate ? 'Scheduled' : 'Draft'}
                </Badge>
                
                <Badge colorScheme="gray">
                  Created: {new Date(newsletter.createdAt).toLocaleDateString()}
                </Badge>
                
                {newsletter.sent && newsletter.sentAt && (
                  <Badge colorScheme="green">
                    Sent: {new Date(newsletter.sentAt).toLocaleDateString()}
                  </Badge>
                )}
                
                {newsletter.scheduledDate && !newsletter.sent && (
                  <Badge colorScheme="purple">
                    Scheduled: {new Date(newsletter.scheduledDate).toLocaleDateString()}
                  </Badge>
                )}
                
                <Badge colorScheme="blue">
                  {newsletter.targetAudience === 'all' ? 'All subscribers' : 
                   newsletter.targetAudience === 'test' ? 'Test group' : 
                   'Segmented audience'}
                </Badge>
              </HStack>
            </VStack>
            
            {newsletter.sent && (
              <>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
                  <Stat bg="white" p={4} borderRadius="md" boxShadow="sm">
                    <StatLabel>Recipients</StatLabel>
                    <StatNumber>{newsletter.sentCount || 'N/A'}</StatNumber>
                    <StatHelpText>Total sent to</StatHelpText>
                  </Stat>
                </SimpleGrid>
                
                <Divider mb={8} />
              </>
            )}
            
            <Box bg="white" p={6} borderRadius="md" boxShadow="md">
              <Text fontWeight="bold" mb={4}>Subject: {newsletter.subject}</Text>
              <Divider mb={4} />
              <Box 
                dangerouslySetInnerHTML={{ __html: newsletter.content }} 
                className="newsletter-content"
                sx={{
                  '& img': {
                    maxWidth: '100%',
                    height: 'auto',
                    margin: '1rem 0',
                  },
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    margin: '1.5rem 0 1rem',
                    fontWeight: 'bold',
                  },
                  '& p': {
                    margin: '1rem 0',
                    lineHeight: '1.6',
                  },
                  '& ul, & ol': {
                    margin: '1rem 0',
                    paddingLeft: '2rem',
                  },
                  '& li': {
                    margin: '0.5rem 0',
                  },
                  '& a': {
                    color: 'blue.500',
                    textDecoration: 'underline',
                  },
                  '& blockquote': {
                    borderLeft: '4px solid #cbd5e0',
                    paddingLeft: '1rem',
                    fontStyle: 'italic',
                    margin: '1rem 0',
                  }
                }}
              />
            </Box>
          </Box>
        ) : (
          <Box textAlign="center" p={10}>
            <Heading size="md">Newsletter not found</Heading>
            <Text mt={4}>The newsletter you're looking for doesn't exist or has been removed.</Text>
            <Button 
              mt={6} 
              colorScheme="blue"
              onClick={() => router.push('/admin/newsletters')}
            >
              Back to Newsletters
            </Button>
          </Box>
        )}
      </Container>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Newsletter
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this newsletter? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDelete} 
                ml={3}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
}