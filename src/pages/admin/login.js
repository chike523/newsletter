import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Link,
  Alert,
  AlertIcon,
  FormErrorMessage,
} from '@chakra-ui/react';
import Layout from '../../components/layout/Layout';
import { useRouter } from 'next/router';
import { signInWithEmail } from '../../lib/firebase';

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear field error when typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
    
    // Clear general login error when typing
    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!credentials.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await signInWithEmail(credentials.email, credentials.password);
      
      if (result.success) {
        // Redirect to admin dashboard
        router.push('/admin/dashboard');
      } else {
        setLoginError('Invalid email or password');
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError('Error logging in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Container maxW="md" py={12}>
        <Box bg="white" p={8} rounded="lg" boxShadow="lg">
          <Stack spacing={4}>
            <Heading fontSize="2xl" textAlign="center">
              Admin Login
            </Heading>
            <Text fontSize="md" color="gray.600" textAlign="center">
              Sign in to access the newsletter administration
            </Text>
            
            {loginError && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {loginError}
              </Alert>
            )}
            
            <Box as="form" onSubmit={handleSubmit}>
              <Stack spacing={4}>
                <FormControl id="email" isRequired isInvalid={!!errors.email}>
                  <FormLabel>Email address</FormLabel>
                  <Input 
                    type="email" 
                    name="email"
                    value={credentials.email}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>
                
                <FormControl id="password" isRequired isInvalid={!!errors.password}>
                  <FormLabel>Password</FormLabel>
                  <Input 
                    type="password" 
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                  />
                  <FormErrorMessage>{errors.password}</FormErrorMessage>
                </FormControl>
                
                <Stack spacing={6}>
                  <Link color="blue.500" href="#" alignSelf="flex-end" fontSize="sm">
                    Forgot password?
                  </Link>
                  
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isSubmitting}
                    loadingText="Signing in"
                  >
                    Sign in
                  </Button>
                </Stack>
              </Stack>
            </Box>
            
            <Text mt={4} textAlign="center" fontSize="sm" color="gray.600">
              Demo credentials: admin@example.com / password
            </Text>
          </Stack>
        </Box>
      </Container>
    </Layout>
  );
}