import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormErrorMessage,
  Heading,
  Input,
  Text,
  Stack,
  useToast,
} from '@chakra-ui/react';
import Layout from '../components/layout/Layout';
import { addSubscriber } from '../lib/firebase';

export default function Home() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubscribe = async () => {
    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Add subscriber to Firebase
      const result = await addSubscriber({
        email,
        group: 'General',
        subscribedAt: new Date().toISOString()
      });
      
      setIsSubmitting(false);
      
      if (result.success) {
        setEmail('');
        toast({
          title: "Subscription successful!",
          description: "You're now subscribed to our newsletter.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else if (result.message === 'Email already subscribed') {
        toast({
          title: "Already subscribed",
          description: "This email is already subscribed to our newsletter.",
          status: "info",
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Error during subscription:', error);
      setIsSubmitting(false);
      
      toast({
        title: "Subscription failed",
        description: "There was an error processing your subscription. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={10}>
        <Stack spacing={12}>
          {/* Hero Section */}
          <Flex 
            direction="column" 
            align="center" 
            textAlign="center"
            py={10}
          >
            <Heading as="h1" size="3xl" mb={4}>
              Stay Informed with Our Newsletter
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl" mb={10}>
              Get the latest news, insights, and trends directly to your inbox. Our newsletter covers everything from technology to business strategies.
            </Text>
            
            <Flex 
              direction={{ base: "column", md: "row" }}
              w={{ base: "full", md: "container.md" }}
              gap={4}
            >
              <FormControl isInvalid={!!error} flex={1}>
                <Input
                  placeholder="Enter your email"
                  size="lg"
                  value={email}
                  onChange={handleEmailChange}
                />
                <FormErrorMessage>{error}</FormErrorMessage>
              </FormControl>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={handleSubscribe}
                isLoading={isSubmitting}
                loadingText="Subscribing"
                px={8}
              >
                Subscribe
              </Button>
            </Flex>
          </Flex>

          {/* Benefits Section */}
          <Box py={12}>
            <Heading as="h2" size="xl" mb={10} textAlign="center">
              Why Subscribe to Our Newsletter?
            </Heading>
            
            <Stack 
              direction={{ base: "column", md: "row" }}
              spacing={8}
            >
              {[
                {
                  title: "Exclusive Content",
                  description: "Get access to articles and insights not published anywhere else."
                },
                {
                  title: "Stay Updated",
                  description: "Never miss important news and updates in your industry."
                },
                {
                  title: "Expert Analysis",
                  description: "Benefit from in-depth analysis by industry experts."
                }
              ].map((item, index) => (
                <Box 
                  key={index} 
                  p={6} 
                  borderRadius="lg" 
                  boxShadow="md" 
                  bg="white"
                  flex={1}
                >
                  <Heading as="h3" size="md" mb={4}>
                    {item.title}
                  </Heading>
                  <Text color="gray.600">
                    {item.description}
                  </Text>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Recent Issues Preview Section */}
          <Box py={12} bg="gray.50" borderRadius="lg" p={8}>
            <Heading as="h2" size="xl" mb={10} textAlign="center">
              Recent Newsletter Issues
            </Heading>
            
            <Stack spacing={8}>
              {[
                {
                  title: "The Future of AI in Business",
                  date: "March 25, 2025",
                  excerpt: "Exploring how artificial intelligence is transforming business operations and strategies..."
                },
                {
                  title: "Sustainable Business Practices",
                  date: "March 18, 2025",
                  excerpt: "How companies are implementing eco-friendly initiatives while improving their bottom line..."
                },
                {
                  title: "Remote Work Revolution",
                  date: "March 11, 2025",
                  excerpt: "The lasting impact of remote work on productivity, culture, and the future workplace..."
                }
              ].map((issue, index) => (
                <Box 
                  key={index} 
                  p={6} 
                  borderRadius="md" 
                  boxShadow="sm" 
                  bg="white"
                >
                  <Text fontWeight="bold" color="gray.500" mb={1}>
                    {issue.date}
                  </Text>
                  <Heading as="h3" size="md" mb={2}>
                    {issue.title}
                  </Heading>
                  <Text color="gray.600">
                    {issue.excerpt}
                  </Text>
                  <Button mt={4} variant="ghost" colorScheme="blue">
                    Read Sample
                  </Button>
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Layout>
  );
}