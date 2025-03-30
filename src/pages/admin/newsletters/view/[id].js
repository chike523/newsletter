// src/pages/admin/newsletters/view/[id].js
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
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiArrowLeft, FiEdit, FiTrash2 } from 'react-icons/fi';
import Layout from '../../../../components/layout/Layout';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export default function ViewNewsletter() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newsletter, setNewsletter] = useState(null);
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
          setNewsletter({
            id: docSnap.id,
            ...docSnap.data()
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
          
          {newsletter && !newsletter.sent && (
            <HStack>
              <Button
                leftIcon={<FiEdit />}
                colorScheme="blue"
                variant="outline"
                onClick={() => router.push(`/admin/newsletters/edit/${id}`)}
              >
                Edit
              </Button>
              <IconButton
                icon={<FiTrash2 />}
                colorScheme="red"
                variant="outline"
                aria-label="Delete newsletter"
                onClick={() => {
                  // Add delete functionality
                  if (confirm("Are you sure you want to delete this newsletter?")) {
                    // Implement delete logic
                  }
                }}
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
                
                {newsletter.scheduledDate && (
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
                  
                  <Stat bg="white" p={4} borderRadius="md" boxShadow="sm">
                    <StatLabel>Open Rate</StatLabel>
                    <StatNumber>67.2%</StatNumber>
                    <StatHelpText>Unique opens</StatHelpText>
                  </Stat>
                  
                  <Stat bg="white" p={4} borderRadius="md" boxShadow="sm">
                    <StatLabel>Click Rate</StatLabel>
                    <StatNumber>23.5%</StatNumber>
                    <StatHelpText>Unique clicks</StatHelpText>
                  </Stat>
                </SimpleGrid>
                
                <Divider mb={8} />
              </>
            )}
            
            <Box bg="white" p={6} borderRadius="md" boxShadow="md">
              <Text fontWeight="bold" mb={4}>Subject: {newsletter.subject}</Text>
              <Divider mb={4} />
              <Box whiteSpace="pre-wrap">
                {newsletter.content}
              </Box>
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
    </Layout>
  );
}