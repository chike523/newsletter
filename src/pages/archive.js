// src/pages/archive.js
import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Tag,
  Button,
} from '@chakra-ui/react';
import Layout from '../components/layout/Layout';

// Sample newsletter data - in a real app, this would come from a database
const newsletters = [
  {
    id: 1,
    title: 'The Future of AI in Business',
    date: 'March 25, 2025',
    excerpt: 'Exploring how artificial intelligence is transforming business operations and strategies across industries.',
    tags: ['AI', 'Business', 'Technology'],
  },
  {
    id: 2,
    title: 'Sustainable Business Practices',
    date: 'March 18, 2025',
    excerpt: 'How companies are implementing eco-friendly initiatives while improving their bottom line and meeting consumer expectations.',
    tags: ['Sustainability', 'Business', 'Environment'],
  },
  {
    id: 3,
    title: 'Remote Work Revolution',
    date: 'March 11, 2025',
    excerpt: 'The lasting impact of remote work on productivity, culture, and the future workplace environment.',
    tags: ['Remote Work', 'Productivity', 'Culture'],
  },
  {
    id: 4,
    title: 'Cryptocurrency Market Trends',
    date: 'March 4, 2025',
    excerpt: 'Analyzing recent developments in cryptocurrency markets and what they mean for investors and businesses.',
    tags: ['Cryptocurrency', 'Finance', 'Technology'],
  },
  {
    id: 5,
    title: 'Social Media Marketing Strategies',
    date: 'February 25, 2025',
    excerpt: 'Effective techniques for enhancing your brand presence and engagement across social media platforms.',
    tags: ['Marketing', 'Social Media', 'Branding'],
  },
  {
    id: 6,
    title: 'Health and Wellness in the Workplace',
    date: 'February 18, 2025',
    excerpt: 'How companies are prioritizing employee well-being and the benefits for both workers and organizations.',
    tags: ['Health', 'Workplace', 'Wellness'],
  },
];

export default function Archive() {
  return (
    <Layout>
      <Container maxW="container.xl" py={10}>
        <Heading as="h1" size="2xl" mb={4} textAlign="center">
          Newsletter Archive
        </Heading>
        <Text fontSize="xl" color="gray.600" maxW="3xl" mx="auto" textAlign="center" mb={12}>
          Browse through our collection of past newsletters covering various topics in business, technology, and more.
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {newsletters.map((newsletter) => (
            <Box 
              key={newsletter.id} 
              borderWidth="1px" 
              borderRadius="lg" 
              overflow="hidden"
              boxShadow="md"
              bg="white"
              p={6}
              transition="transform 0.3s"
              _hover={{ transform: 'translateY(-5px)' }}
            >
              <Text fontSize="sm" color="gray.500" mb={2}>
                {newsletter.date}
              </Text>
              <Heading as="h3" size="md" mb={3}>
                {newsletter.title}
              </Heading>
              <Text color="gray.600" mb={4}>
                {newsletter.excerpt}
              </Text>
              
              <Flex mb={4} flexWrap="wrap" gap={2}>
                {newsletter.tags.map((tag) => (
                  <Tag key={tag} colorScheme="blue" size="sm">
                    {tag}
                  </Tag>
                ))}
              </Flex>
              
              <Button colorScheme="blue" variant="outline" size="sm">
                Read Full Newsletter
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Layout>
  );
}