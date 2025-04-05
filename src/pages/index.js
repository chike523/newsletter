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
  Link,
} from '@chakra-ui/react';
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
    <Box bg="black" minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="container.md" py={10}>
        <Flex direction="column" align="center">
          {/* Logo/Avatar Circle */}
          <Box 
            width={{base: "120px", md: "180px"}} 
            height={{base: "120px", md: "180px"}} 
            borderRadius="full" 
            position="relative"
            mb={6}
            mx="auto"
            overflow="hidden"
            boxShadow="0 0 20px rgba(255, 0, 255, 0.5)"
          >
            <Box
              as="img"
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              objectFit="cover"
              src="/images/michael.png" 
              alt="Michael J. Saylor"
            />
          </Box>

          {/* Newsletter Title */}
          <Heading 
            as="h1" 
            fontSize={{base: "3xl", md: "5xl"}}
            fontWeight="900"
            letterSpacing="tight"
            mb={3}
            color="white"
            textAlign="center"
          >
            The Bitcoin Standard
          </Heading>
          
          {/* Newsletter Description */}
          <Text 
            fontSize={{base: "sm", md: "md"}} 
            color="gray.400"
            maxW="container.sm"
            textAlign="center"
            mx="auto"
            lineHeight="tall"
            px={4}
            mb={3}
          >
            Insights on Bitcoin as digital property, monetary inflation, macroeconomics, and the future of money from the Executive Chairman of MicroStrategy and advocate of the Bitcoin Standard.
          </Text>

          {/* Author Line */}
          <Text color="gray.500" fontSize="sm" mb={8}>
            By Michael J. Saylor · Over 250,000 subscribers
          </Text>
          
          {/* Subscription Form */}
          <Flex 
            direction={{ base: "column", sm: "row" }}
            w="100%"
            maxW="600px"
            mb={3}
          >
            <FormControl isInvalid={!!error} flex={1}>
              <Input
                placeholder="Type your email..."
                size="lg"
                value={email}
                onChange={handleEmailChange}
                bg="gray.900"
                color="white"
                border="1px solid"
                borderColor="gray.700"
                borderRadius="md"
                _placeholder={{ color: 'gray.500' }}
                _focus={{ borderColor: 'red.500' }}
              />
              <FormErrorMessage color="red.400">{error}</FormErrorMessage>
            </FormControl>
            <Button
              size="lg"
              onClick={handleSubscribe}
              isLoading={isSubmitting}
              loadingText="Subscribing"
              bg="red.600"
              _hover={{ bg: "red.700" }}
              color="white"
              borderRadius="md"
              px={8}
              ml={{ base: 0, sm: 2 }}
              mt={{ base: 2, sm: 0 }}
            >
              Subscribe
            </Button>
          </Flex>

          {/* Terms Text */}
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={2} maxW="600px">
            By subscribing, I agree to Terms of Use and acknowledge its Information Collection Notice and Privacy Policy
          </Text>
          
          {/* No Thanks Button */}
          <Box textAlign="center" mt={4}>
            <Button
              variant="link"
              color="gray.400"
              fontSize="sm"
              rightIcon={<Box as="span" ml={1}>›</Box>}
            >
              No thanks
            </Button>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}