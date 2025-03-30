// src/pages/admin/subscribers.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  HStack,
  Select,
  Text,
  Checkbox,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { FiMoreVertical, FiPlus, FiUpload, FiDownload, FiFilter } from 'react-icons/fi';
import Layout from '../../components/layout/Layout';

// Mock data for subscribers
const subscriberData = [
  { id: 1, email: 'john.doe@example.com', dateJoined: '2025-03-28', status: 'active', group: 'General' },
  { id: 2, email: 'jane.smith@example.com', dateJoined: '2025-03-28', status: 'active', group: 'General' },
  { id: 3, email: 'bob.johnson@example.com', dateJoined: '2025-03-27', status: 'active', group: 'Business' },
  { id: 4, email: 'alice.williams@example.com', dateJoined: '2025-03-27', status: 'pending', group: 'Tech' },
  { id: 5, email: 'charlie.brown@example.com', dateJoined: '2025-03-26', status: 'active', group: 'General' },
  { id: 6, email: 'david.miller@example.com', dateJoined: '2025-03-25', status: 'unsubscribed', group: 'Business' },
  { id: 7, email: 'emma.davis@example.com', dateJoined: '2025-03-24', status: 'active', group: 'Tech' },
  { id: 8, email: 'frank.thomas@example.com', dateJoined: '2025-03-23', status: 'active', group: 'General' },
  { id: 9, email: 'grace.wilson@example.com', dateJoined: '2025-03-22', status: 'active', group: 'Business' },
  { id: 10, email: 'henry.jackson@example.com', dateJoined: '2025-03-21', status: 'bounced', group: 'Tech' },
];

export default function Subscribers() {
  const [isClient, setIsClient] = useState(false);
  const [subscribers, setSubscribers] = useState([]);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGroup, setFilterGroup] = useState('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newSubscriber, setNewSubscriber] = useState({ email: '', group: 'General' });
  const toast = useToast();
  
  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
    setSubscribers(subscriberData);
  }, []);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleStatusFilter = (e) => {
    setFilterStatus(e.target.value);
  };
  
  const handleGroupFilter = (e) => {
    setFilterGroup(e.target.value);
  };
  
  const handleCheckbox = (id) => {
    if (selectedSubscribers.includes(id)) {
      setSelectedSubscribers(selectedSubscribers.filter(item => item !== id));
    } else {
      setSelectedSubscribers([...selectedSubscribers, id]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(filteredSubscribers.map(subscriber => subscriber.id));
    }
  };
  
  const handleNewSubscriberChange = (e) => {
    const { name, value } = e.target;
    setNewSubscriber({
      ...newSubscriber,
      [name]: value
    });
  };
  
  const handleAddSubscriber = () => {
    // In a real app, this would be an API call
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(newSubscriber.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const newId = Math.max(...subscribers.map(s => s.id)) + 1;
    const today = new Date().toISOString().split('T')[0];
    
    const subscriberToAdd = {
      id: newId,
      email: newSubscriber.email,
      dateJoined: today,
      status: 'active',
      group: newSubscriber.group,
    };
    
    setSubscribers([subscriberToAdd, ...subscribers]);
    setNewSubscriber({ email: '', group: 'General' });
    onClose();
    
    toast({
      title: "Subscriber added",
      description: `${newSubscriber.email} has been added to your subscriber list.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'yellow';
      case 'unsubscribed': return 'gray';
      case 'bounced': return 'red';
      default: return 'blue';
    }
  };
  
  // Apply filters and search
  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = subscriber.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || subscriber.status === filterStatus;
    const matchesGroup = filterGroup === 'all' || subscriber.group === filterGroup;
    
    return matchesSearch && matchesStatus && matchesGroup;
  });

  // Don't render anything until client-side
  if (!isClient) {
    return null;
  }

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Flex justify="space-between" align="center">
            <Heading as="h1" size="xl">Subscribers</Heading>
            <Button 
              colorScheme="blue" 
              leftIcon={<FiPlus />}
              onClick={onOpen}
            >
              Add Subscriber
            </Button>
          </Flex>
          <Text color="gray.600" mt={2}>
            Manage your newsletter subscribers
          </Text>
        </Box>
        
        {/* Filters and actions */}
        <Flex 
          direction={{ base: "column", md: "row" }} 
          justify="space-between" 
          align={{ base: "stretch", md: "center" }}
          gap={4}
          mb={6}
        >
          <HStack spacing={4} flex="1">
            <Input
              placeholder="Search by email"
              value={searchTerm}
              onChange={handleSearch}
              maxW={{ base: "full", md: "300px" }}
            />
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<FiFilter />}
                variant="outline"
              >
                Filter
              </MenuButton>
              <MenuList p={4} minW="240px">
                <FormControl mb={4}>
                  <FormLabel fontSize="sm">Status</FormLabel>
                  <Select 
                    size="sm" 
                    value={filterStatus} 
                    onChange={handleStatusFilter}
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="unsubscribed">Unsubscribed</option>
                    <option value="bounced">Bounced</option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Group</FormLabel>
                  <Select 
                    size="sm" 
                    value={filterGroup} 
                    onChange={handleGroupFilter}
                  >
                    <option value="all">All groups</option>
                    <option value="General">General</option>
                    <option value="Business">Business</option>
                    <option value="Tech">Tech</option>
                  </Select>
                </FormControl>
              </MenuList>
            </Menu>
          </HStack>
          
          <HStack spacing={2}>
            <Button 
              leftIcon={<FiUpload />} 
              variant="outline"
            >
              Import
            </Button>
            <Button 
              leftIcon={<FiDownload />} 
              variant="outline"
              isDisabled={selectedSubscribers.length === 0}
            >
              Export Selected
            </Button>
          </HStack>
        </Flex>
        
        {/* Subscribers table */}
        <Box 
          bg="white" 
          rounded="lg" 
          boxShadow="md" 
          overflow="hidden"
        >
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th px={4} py={3} width="50px">
                    <Checkbox 
                      isChecked={
                        filteredSubscribers.length > 0 && 
                        selectedSubscribers.length === filteredSubscribers.length
                      }
                      onChange={handleSelectAll}
                    />
                  </Th>
                  <Th>Email</Th>
                  <Th>Date Joined</Th>
                  <Th>Status</Th>
                  <Th>Group</Th>
                  <Th width="50px"></Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredSubscribers.map((subscriber) => (
                  <Tr key={subscriber.id}>
                    <Td px={4} py={3}>
                      <Checkbox 
                        isChecked={selectedSubscribers.includes(subscriber.id)}
                        onChange={() => handleCheckbox(subscriber.id)}
                      />
                    </Td>
                    <Td>{subscriber.email}</Td>
                    <Td>{subscriber.dateJoined}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(subscriber.status)}>
                        {subscriber.status}
                      </Badge>
                    </Td>
                    <Td>{subscriber.group}</Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          aria-label="Options"
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem>Edit</MenuItem>
                          <MenuItem>View Activity</MenuItem>
                          <MenuItem>Change Group</MenuItem>
                          <MenuItem color="red.500">Remove</MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            
            {filteredSubscribers.length === 0 && (
              <Box p={8} textAlign="center">
                <Text color="gray.500">No subscribers found matching your criteria.</Text>
              </Box>
            )}
          </Box>
          
          <Flex 
            justify="space-between" 
            align="center" 
            p={4} 
            borderTopWidth="1px"
          >
            <Text fontSize="sm" color="gray.500">
              {selectedSubscribers.length} of {subscribers.length} selected
            </Text>
            
            <HStack spacing={2}>
              <Button 
                size="sm" 
                variant="outline" 
                colorScheme="red"
                isDisabled={selectedSubscribers.length === 0}
              >
                Remove Selected
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                colorScheme="blue"
                isDisabled={selectedSubscribers.length === 0}
              >
                Change Group
              </Button>
            </HStack>
          </Flex>
        </Box>
        
        {/* Add Subscriber Modal */}
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Add New Subscriber</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input 
                  name="email"
                  value={newSubscriber.email}
                  onChange={handleNewSubscriberChange}
                  placeholder="subscriber@example.com"
                />
              </FormControl>

              <FormControl mt={4}>
                <FormLabel>Group</FormLabel>
                <Select
                  name="group"
                  value={newSubscriber.group}
                  onChange={handleNewSubscriberChange}
                >
                  <option value="General">General</option>
                  <option value="Business">Business</option>
                  <option value="Tech">Tech</option>
                </Select>
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleAddSubscriber}>
                Add
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Container>
    </Layout>
  );
}