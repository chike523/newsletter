// src/pages/about.js
import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Image,
  SimpleGrid,
  Divider,
  VStack,
} from '@chakra-ui/react';
import Layout from '../components/layout/Layout';

export default function About() {
  return (
    <Layout>
      <Container maxW="container.xl" py={10}>
        <VStack spacing={12} align="stretch">
          {/* Hero Section */}
          <Box textAlign="center">
            <Heading as="h1" size="2xl" mb={4}>
              About Newsletter Hub
            </Heading>
            <Text fontSize="xl" color="gray.600" maxW="3xl" mx="auto">
              We deliver insightful, timely, and valuable content directly to your inbox.
            </Text>
          </Box>

          {/* Our Story Section */}
          <Box>
            <Heading as="h2" size="xl" mb={6}>
              Our Story
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
              <Box>
                <Text fontSize="lg" mb={4}>
                  Newsletter Hub was founded in 2020 with a simple mission: to cut through the noise and deliver valuable insights to busy professionals.
                </Text>
                <Text fontSize="lg" mb={4}>
                  In a world overflowing with information, we recognized the need for carefully curated content that helps our readers stay informed without feeling overwhelmed.
                </Text>
                <Text fontSize="lg">
                  Our team of experienced writers and industry experts work together to research, analyze, and present the most relevant and impactful stories across business, technology, and culture.
                </Text>
              </Box>
              <Box>
                <Image 
                  src="/images/placeholder-image.jpg" 
                  alt="Team working together" 
                  borderRadius="md"
                  fallbackSrc="https://via.placeholder.com/600x400?text=Our+Team"
                />
              </Box>
            </SimpleGrid>
          </Box>

          <Divider />

          {/* Our Values Section */}
          <Box>
            <Heading as="h2" size="xl" mb={8}>
              Our Values
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
              {[
                {
                  title: "Quality Over Quantity",
                  description: "We believe in delivering fewer, more impactful pieces rather than overwhelming our readers with content."
                },
                {
                  title: "Insight-Driven",
                  description: "We go beyond the headlines to provide analysis and context that helps you understand what matters and why."
                },
                {
                  title: "Reader-Focused",
                  description: "Everything we do is designed with our readers in mind, ensuring our content is relevant, accessible, and valuable."
                }
              ].map((value, index) => (
                <Box key={index} textAlign="center" p={5}>
                  <Heading as="h3" size="md" mb={4}>
                    {value.title}
                  </Heading>
                  <Text color="gray.600">
                    {value.description}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          <Divider />

          {/* Team Section */}
          <Box>
            <Heading as="h2" size="xl" mb={8} textAlign="center">
              Meet Our Team
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={10}>
              {[
                { name: "Alex Johnson", role: "Founder & Editor-in-Chief" },
                { name: "Sarah Chen", role: "Technology Editor" },
                { name: "Michael Roberts", role: "Business Analyst" },
                { name: "Priya Sharma", role: "Culture & Trends Editor" }
              ].map((member, index) => (
                <Box key={index} textAlign="center">
                  <Box
                    borderRadius="full"
                    width="150px"
                    height="150px"
                    bg="gray.200"
                    mx="auto"
                    mb={4}
                    overflow="hidden"
                  >
                    <Image 
                      src={`https://via.placeholder.com/150?text=${member.name.charAt(0)}`}
                      alt={member.name}
                      width="100%"
                      height="100%"
                      objectFit="cover"
                    />
                  </Box>
                  <Heading as="h3" size="md" mb={1}>
                    {member.name}
                  </Heading>
                  <Text color="gray.600">
                    {member.role}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
}