// src/pages/contact.js
import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  VStack,
  SimpleGrid,
  Icon,
  useToast,
} from '@chakra-ui/react';
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import Layout from '../components/layout/Layout';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }, 1500);
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={10}>
        <VStack spacing={12} align="stretch">
          {/* Hero Section */}
          <Box textAlign="center">
            <Heading as="h1" size="2xl" mb={4}>
              Contact Us
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="2xl" mx="auto">
              Have questions or feedback? We'd love to hear from you! Reach out using the form below or through our contact information.
            </Text>
          </Box>

          {/* Contact Information */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
            <Box p={5} borderRadius="lg" boxShadow="md" bg="white" textAlign="center">
              <Icon as={FiMail} w={10} h={10} color="blue.500" mb={4} />
              <Heading as="h3" size="md" mb={2}>
                Email
              </Heading>
              <Text color="gray.600">
                info@newsletterhub.com
              </Text>
            </Box>
            
            <Box p={5} borderRadius="lg" boxShadow="md" bg="white" textAlign="center">
              <Icon as={FiPhone} w={10} h={10} color="blue.500" mb={4} />
              <Heading as="h3" size="md" mb={2}>
                Phone
              </Heading>
              <Text color="gray.600">
                +1 (555) 123-4567
              </Text>
            </Box>
            
            <Box p={5} borderRadius="lg" boxShadow="md" bg="white" textAlign="center">
              <Icon as={FiMapPin} w={10} h={10} color="blue.500" mb={4} />
              <Heading as="h3" size="md" mb={2}>
                Address
              </Heading>
              <Text color="gray.600">
                123 Newsletter St, San Francisco, CA 94103
              </Text>
            </Box>
          </SimpleGrid>

          {/* Contact Form */}
          <Box 
            p={8} 
            borderRadius="lg" 
            boxShadow="md" 
            bg="white"
            as="form"
            onSubmit={handleSubmit}
          >
            <Heading as="h2" size="lg" mb={6}>
              Send us a message
            </Heading>
            
            <VStack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl id="name" isRequired>
                  <FormLabel>Your Name</FormLabel>
                  <Input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                  />
                </FormControl>
                
                <FormControl id="email" isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange}
                  />
                </FormControl>
              </SimpleGrid>
              
              <FormControl id="subject" isRequired>
                <FormLabel>Subject</FormLabel>
                <Input 
                  type="text" 
                  name="subject" 
                  value={formData.subject} 
                  onChange={handleChange}
                />
              </FormControl>
              
              <FormControl id="message" isRequired>
                <FormLabel>Message</FormLabel>
                <Textarea 
                  name="message" 
                  value={formData.message} 
                  onChange={handleChange}
                  rows={6}
                />
              </FormControl>
              
              <Button 
                type="submit"
                colorScheme="blue"
                size="lg"
                width={{ base: "full", md: "auto" }}
                isLoading={isSubmitting}
                loadingText="Sending"
              >
                Send Message
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
}