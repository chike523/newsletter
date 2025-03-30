import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  Icon,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FiUsers, FiMail, FiActivity, FiPlusCircle } from 'react-icons/fi';
import Layout from '../../components/layout/Layout';
import { useRouter } from 'next/router';
import { getSubscribers, getNewsletters } from '../../lib/firebase';

export default function AdminDashboard() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [newsletters, setNewsletters] = useState([]);
  const router = useRouter();
  const toast = useToast();
  
  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch data from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get recent subscribers
        const subscribersData = await getSubscribers();
        setSubscribers(subscribersData.slice(0, 5)); // Get only the 5 most recent
        
        // Get newsletters
        const newslettersData = await getNewsletters();
        setNewsletters(newslettersData.slice(0, 3)); // Get only the 3 most recent
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error loading data",
          description: "There was a problem loading dashboard data.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isClient) {
      fetchData();
    }
  }, [isClient, toast]);

  const StatBox = ({ title, stat, icon, helpText, change, type }) => (
    <Box
      p={5}
      bg="white"
      rounded="lg"
      boxShadow="md"
      borderWidth="1px"
      borderColor="gray.200"
    >
      <Flex justify="space-between">
        <Stat>
          <StatLabel fontWeight="medium">{title}</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="medium">
            {stat}
          </StatNumber>
          {helpText && (
            <StatHelpText>
              {change && <StatArrow type={type || 'increase'} />}
              {helpText}
            </StatHelpText>
          )}
        </Stat>
        <Box my="auto" color="gray.600">
          <Icon as={icon} w={8} h={8} />
        </Box>
      </Flex>
    </Box>
  );

  // Don't render anything until client-side
  if (!isClient) {
    return null;
  }

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Flex justify="space-between" align="center">
            <Heading as="h1" size="xl">Admin Dashboard</Heading>
            <Button 
              colorScheme="blue" 
              leftIcon={<Icon as={FiPlusCircle} />}
              onClick={() => router.push('/admin/newsletters/create')}
            >
              Create Newsletter
            </Button>
          </Flex>
          <Text color="gray.600" mt={2}>
            Welcome to the Newsletter Administration Dashboard.
          </Text>
        </Box>

        {/* Stats Overview */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={8}>
          <StatBox
            title="Total Subscribers"
            stat={loading ? <Spinner size="sm" /> : subscribers.length}
            icon={FiUsers}
            helpText="Active subscribers"
          />
          <StatBox
            title="Newsletters Sent"
            stat={loading ? <Spinner size="sm" /> : newsletters.filter(n => n.sent).length}
            icon={FiMail}
            helpText="Total sent"
          />
          <StatBox
            title="Average Open Rate"
            stat="68.5%"
            icon={FiActivity}
            helpText="3.2% increase"
            change={true}
          />
          <StatBox
            title="Average Click Rate"
            stat="42.3%"
            icon={FiActivity}
            helpText="1.1% decrease"
            change={true}
            type="decrease"
          />
        </SimpleGrid>

        {/* Recent Data */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Recent Subscribers */}
          <Box bg="white" p={6} rounded="lg" boxShadow="md">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h2" size="md">Recent Subscribers</Heading>
              <Button 
                size="sm" 
                colorScheme="blue" 
                variant="outline"
                onClick={() => router.push('/admin/subscribers')}
              >
                View All
              </Button>
            </Flex>
            {loading ? (
              <Flex justify="center" align="center" py={8}>
                <Spinner />
              </Flex>
            ) : subscribers.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Email</Th>
                      <Th>Date</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {subscribers.map((subscriber) => (
                      <Tr key={subscriber.id}>
                        <Td>{subscriber.email}</Td>
                        <Td>{new Date(subscriber.createdAt).toLocaleDateString()}</Td>
                        <Td>
                          <Badge colorScheme={subscriber.status === 'active' ? 'green' : 'yellow'}>
                            {subscriber.status}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Text textAlign="center" py={4}>No subscribers yet.</Text>
            )}
          </Box>

          {/* Recent Newsletters */}
          <Box bg="white" p={6} rounded="lg" boxShadow="md">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading as="h2" size="md">Recent Newsletters</Heading>
              <Button 
                size="sm" 
                colorScheme="blue" 
                variant="outline"
                onClick={() => router.push('/admin/newsletters')}
              >
                View All
              </Button>
            </Flex>
            {loading ? (
              <Flex justify="center" align="center" py={8}>
                <Spinner />
              </Flex>
            ) : newsletters.length > 0 ? (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Title</Th>
                      <Th>Created Date</Th>
                      <Th>Status</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {newsletters.map((newsletter) => (
                      <Tr key={newsletter.id}>
                        <Td>{newsletter.title}</Td>
                        <Td>{new Date(newsletter.createdAt).toLocaleDateString()}</Td>
                        <Td>
                          <Badge colorScheme={newsletter.sent ? 'green' : 'blue'}>
                            {newsletter.sent ? 'Sent' : 'Draft'}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            ) : (
              <Text textAlign="center" py={4}>No newsletters yet.</Text>
            )}
          </Box>
        </SimpleGrid>
      </Container>
    </Layout>
  );
}