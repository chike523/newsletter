// src/pages/privacy.js
import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  ListItem,
  OrderedList,
  UnorderedList,
  Link,
  Divider,
} from '@chakra-ui/react';
import Layout from '../components/layout/Layout';

export default function Privacy() {
  return (
    <Layout>
      <Container maxW="container.lg" py={10}>
        <Heading as="h1" size="2xl" mb={6}>
          Privacy Policy
        </Heading>
        <Text color="gray.600" mb={8}>
          Last updated: March 30, 2025
        </Text>
        
        <Box mb={8}>
          <Text mb={4}>
            Newsletter Hub ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Newsletter Hub.
          </Text>
          <Text mb={4}>
            This Privacy Policy applies to our website, and its associated subdomains (collectively, our "Service"). By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
          </Text>
        </Box>
        
        <Divider my={8} />
        
        <Box mb={8}>
          <Heading as="h2" size="lg" mb={4}>
            1. Information We Collect
          </Heading>
          <Text mb={4}>
            We collect information from you when you visit our website, register for our newsletter, respond to a survey or fill out a form:
          </Text>
          <UnorderedList mb={4} spacing={2} pl={6}>
            <ListItem>Email address</ListItem>
            <ListItem>First name and last name</ListItem>
            <ListItem>Usage data and preferences</ListItem>
          </UnorderedList>
          <Text>
            We collect this information to deliver the newsletter services you request, improve our website, and communicate with you.
          </Text>
        </Box>
        
        <Box mb={8}>
          <Heading as="h2" size="lg" mb={4}>
            2. How We Use Your Information
          </Heading>
          <Text mb={4}>
            We use the information we collect in various ways, including to:
          </Text>
          <UnorderedList mb={4} spacing={2} pl={6}>
            <ListItem>Provide, operate, and maintain our website</ListItem>
            <ListItem>Send you our newsletter and other communications</ListItem>
            <ListItem>Improve, personalize, and expand our website</ListItem>
            <ListItem>Understand and analyze how you use our website</ListItem>
            <ListItem>Develop new products, services, features, and functionality</ListItem>
          </UnorderedList>
        </Box>
        
        <Box mb={8}>
          <Heading as="h2" size="lg" mb={4}>
            3. Sharing Your Information
          </Heading>
          <Text mb={4}>
            We may share the information we collect in various ways, including:
          </Text>
          <UnorderedList spacing={2} pl={6}>
            <ListItem>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</ListItem>
            <ListItem>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law</ListItem>
            <ListItem>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of ourselves or others</ListItem>
          </UnorderedList>
        </Box>
        
        {/* More sections would follow... */}
        
        <Box mb={8}>
          <Heading as="h2" size="lg" mb={4}>
            7. Contact Us
          </Heading>
          <Text>
            If you have any questions about this Privacy Policy, please contact us at:
          </Text>
          <UnorderedList spacing={2} pl={6} mt={4}>
            <ListItem>Email: privacy@newsletterhub.com</ListItem>
            <ListItem>Address: 123 Newsletter St, San Francisco, CA 94103</ListItem>
          </UnorderedList>
        </Box>
      </Container>
    </Layout>
  );
}