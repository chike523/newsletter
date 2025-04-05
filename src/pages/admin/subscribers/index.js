// src/pages/admin/subscribers/index.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
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
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useToast,
  Spinner,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Select,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Tag,
  TagLabel,
  TagCloseButton,
  HStack,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { 
  FiMoreVertical, FiPlus, FiSearch, FiEdit, FiTrash2, 
  FiMail, FiTag, FiFilter, FiDownload, FiUpload, FiUsers
} from 'react-icons/fi';
import Layout from '../../../components/layout/Layout';
import { useRouter } from 'next/router';
import { getSubscribers, deleteSubscriber, updateSubscriber } from '../../../lib/firebase';

export default function SubscriberManagement() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedSubscribers, setSelectedSubscribers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [tags, setTags] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  
  const cancelRef = React.useRef();
  const router = useRouter();
  const toast = useToast();
  
  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch subscribers from Firebase
  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        setLoading(true);
        const data = await getSubscribers();
        setSubscribers(data);
        
        // Extract unique tags
        const allTags = data.reduce((acc, subscriber) => {
          if (subscriber.tags && Array.isArray(subscriber.tags)) {
            subscriber.tags.forEach(tag => {
              if (!acc.includes(tag)) {
                acc.push(tag);
              }
            });
          }
          return acc;
        }, []);
        
        setTags(allTags);
      } catch (error) {
        console.error("Error fetching subscribers:", error);
        toast({
          title: "Error loading subscribers",
          description: "There was a problem loading your subscribers.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isClient) {
      fetchSubscribers();
    }
  }, [isClient, toast]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSegmentChange = (e) => {
    setSelectedSegment(e.target.value);
  };
  
  const handleTagFilterToggle = (tag) => {
    setActiveFilters(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };
  
  const removeFilter = (filter) => {
    setActiveFilters(prev => prev.filter(f => f !== filter));
  };
  
  const clearFilters = () => {
    setActiveFilters([]);
    setSelectedSegment('all');
    setSearchTerm('');
  };

  // Apply all filters to get filtered subscribers
  const filteredSubscribers = subscribers.filter(subscriber => {
    // Apply search filter
    const matchesSearch = 
      !searchTerm || 
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subscriber.name && subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Apply segment filter
    const matchesSegment = 
      selectedSegment === 'all' || 
      subscriber.status === selectedSegment || 
      (selectedSegment === 'engaged' && subscriber.engagementScore && subscriber.engagementScore > 50) ||
      (selectedSegment === 'inactive' && (!subscriber.lastOpened || 
        new Date(subscriber.lastOpened) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)));
    
    // Apply tag filters
    const matchesTags = 
      activeFilters.length === 0 || 
      (subscriber.tags && activeFilters.every(tag => subscriber.tags.includes(tag)));
    
    return matchesSearch && matchesSegment && matchesTags;
  });

  const handleSelectSubscriber = (id) => {
    setSelectedSubscribers(prev => {
      if (prev.includes(id)) {
        return prev.filter(subId => subId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedSubscribers.length === filteredSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(filteredSubscribers.map(sub => sub.id));
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteSubscriber(deleteId);
      
      if (result.success) {
        setSubscribers(prev => prev.filter(subscriber => subscriber.id !== deleteId));
        setSelectedSubscribers(prev => prev.filter(id => id !== deleteId));
        
        toast({
          title: "Subscriber deleted",
          description: "The subscriber has been deleted successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error("Failed to delete subscriber");
      }
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      
      toast({
        title: "Delete failed",
        description: "There was a problem deleting the subscriber.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSubscribers.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedSubscribers.length} subscribers?`)) {
      setLoading(true);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const id of selectedSubscribers) {
        try {
          const result = await deleteSubscriber(id);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error deleting subscriber ${id}:`, error);
          errorCount++;
        }
      }
      
      setSubscribers(prev => prev.filter(sub => !selectedSubscribers.includes(sub.id)));
      setSelectedSubscribers([]);
      
      toast({
        title: "Bulk delete completed",
        description: `Successfully deleted ${successCount} subscribers. ${errorCount > 0 ? `Failed to delete ${errorCount} subscribers.` : ''}`,
        status: errorCount > 0 ? "warning" : "success",
        duration: 5000,
        isClosable: true,
      });
      
      setLoading(false);
    }
  };

  const onDeleteClick = (id) => {
    setDeleteId(id);
  };

  const closeDeleteDialog = () => {
    setDeleteId(null);
  };

  const editSubscriber = (id) => {
    router.push(`/admin/subscribers/edit/${id}`);
  };
  
  const handleAddTag = async (subscriberId, tag) => {
    const subscriber = subscribers.find(sub => sub.id === subscriberId);
    if (!subscriber) return;
    
    const currentTags = subscriber.tags || [];
    if (currentTags.includes(tag)) return;
    
    try {
      const result = await updateSubscriber(subscriberId, {
        tags: [...currentTags, tag]
      });
      
      if (result.success) {
        // Update local state
        setSubscribers(prev => prev.map(sub => {
          if (sub.id === subscriberId) {
            return {
              ...sub,
              tags: [...(sub.tags || []), tag]
            };
          }
          return sub;
        }));
        
        // Add to global tags if it's a new tag
        if (!tags.includes(tag)) {
          setTags(prev => [...prev, tag]);
        }
        
        toast({
          title: "Tag added",
          description: `Tag "${tag}" added to subscriber.`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Error adding tag",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleRemoveTag = async (subscriberId, tagToRemove) => {
    const subscriber = subscribers.find(sub => sub.id === subscriberId);
    if (!subscriber || !subscriber.tags) return;
    
    try {
      const result = await updateSubscriber(subscriberId, {
        tags: subscriber.tags.filter(tag => tag !== tagToRemove)
      });
      
      if (result.success) {
        // Update local state
        setSubscribers(prev => prev.map(sub => {
          if (sub.id === subscriberId) {
            return {
              ...sub,
              tags: (sub.tags || []).filter(tag => tag !== tagToRemove)
            };
          }
          return sub;
        }));
        
        toast({
          title: "Tag removed",
          description: `Tag "${tagToRemove}" removed from subscriber.`,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error removing tag:", error);
      toast({
        title: "Error removing tag",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleBulkAddTag = async () => {
    if (selectedSubscribers.length === 0) return;
    
    const tag = prompt("Enter tag to add to selected subscribers:");
    if (!tag) return;
    
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    for (const id of selectedSubscribers) {
      const subscriber = subscribers.find(sub => sub.id === id);
      if (!subscriber) continue;
      
      try {
        const currentTags = subscriber.tags || [];
        if (currentTags.includes(tag)) {
          successCount++; // Count as success if tag already exists
          continue;
        }
        
        const result = await updateSubscriber(id, {
          tags: [...currentTags, tag]
        });
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error adding tag to subscriber ${id}:`, error);
        errorCount++;
      }
    }
    
    // Update local state
    setSubscribers(prev => prev.map(sub => {
      if (selectedSubscribers.includes(sub.id)) {
        return {
          ...sub,
          tags: [...new Set([...(sub.tags || []), tag])]
        };
      }
      return sub;
    }));
    
    // Add to global tags if it's a new tag
    if (!tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
    
    toast({
      title: "Bulk tag addition completed",
      description: `Added tag "${tag}" to ${successCount} subscribers. ${errorCount > 0 ? `Failed for ${errorCount} subscribers.` : ''}`,
      status: errorCount > 0 ? "warning" : "success",
      duration: 5000,
      isClosable: true,
    });
    
    setLoading(false);
  };
  
  const exportSubscribers = () => {
    const dataToExport = filteredSubscribers.map(sub => {
      const { id, ...rest } = sub;
      return {
        email: rest.email,
        name: rest.name || '',
        status: rest.status || 'active',
        created: rest.createdAt || '',
        tags: (rest.tags || []).join(','),
        ...rest
      };
    });
    
    const headers = Object.keys(dataToExport[0]).join(',');
    const csvRows = dataToExport.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    );
    
    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `subscribers_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Don't render anything until client-side
  if (!isClient) {
    return null;
  }

  const totalActiveSubscribers = subscribers.filter(sub => sub.status === 'active').length;
  const growthRate = totalActiveSubscribers > 0 ? 
    Math.round((subscribers.filter(sub => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return new Date(sub.createdAt) > oneMonthAgo;
    }).length / totalActiveSubscribers) * 100) : 0;

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Tabs variant="enclosed" colorScheme="blue" index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Subscribers</Tab>
            <Tab>Analytics</Tab>
            <Tab>Segments</Tab>
          </TabList>
          
          <TabPanels>
            {/* Subscribers Tab */}
            <TabPanel px={0}>
              <Box mb={8}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading as="h1" size="xl">Subscribers</Heading>
                  <Button 
                    colorScheme="blue" 
                    leftIcon={<FiPlus />}
                    onClick={() => router.push('/admin/subscribers/add')}
                  >
                    Add Subscriber
                  </Button>
                </Flex>
                <Text color="gray.600">
                  Manage your newsletter subscribers and segment your audience.
                </Text>
              </Box>
              
              {/* Filters and search */}
              <Flex 
                mb={6}
                direction={{ base: "column", md: "row" }} 
                align={{ base: "stretch", md: "center" }}
                gap={4}
                wrap="wrap"
              >
                <InputGroup maxW={{ base: "100%", md: "250px" }}>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search subscribers..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </InputGroup>
                
                <Select 
                  maxW={{ base: "100%", md: "200px" }}
                  value={selectedSegment}
                  onChange={handleSegmentChange}
                >
                  <option value="all">All Subscribers</option>
                  <option value="active">Active Only</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="engaged">Highly Engaged</option>
                  <option value="inactive">Inactive (90+ days)</option>
                </Select>
                
                <Popover placement="bottom-start">
                  <PopoverTrigger>
                    <Button 
                      leftIcon={<FiTag />} 
                      variant="outline"
                    >
                      Filter by Tags
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent p={2} w="250px">
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader fontWeight="medium">Select Tags</PopoverHeader>
                    <PopoverBody maxH="200px" overflowY="auto">
                      {tags.length > 0 ? (
                        <VStack align="stretch" spacing={1}>
                          {tags.map(tag => (
                            <Box 
                              key={tag} 
                              py={1} 
                              px={2} 
                              cursor="pointer"
                              borderRadius="md"
                              bg={activeFilters.includes(tag) ? "blue.100" : "transparent"}
                              _hover={{ bg: activeFilters.includes(tag) ? "blue.100" : "gray.100" }}
                              onClick={() => handleTagFilterToggle(tag)}
                            >
                              <Flex align="center" justify="space-between">
                                <Text fontSize="sm">{tag}</Text>
                                {activeFilters.includes(tag) && (
                                  <Badge colorScheme="blue" size="sm">Selected</Badge>
                                )}
                              </Flex>
                            </Box>
                          ))}
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color="gray.500">No tags available</Text>
                      )}
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                
                <Button
                  leftIcon={<FiDownload />}
                  variant="outline"
                  onClick={exportSubscribers}
                >
                  Export
                </Button>
                
                {selectedSubscribers.length > 0 && (
                  <HStack spacing={2} ml={{ base: 0, md: "auto" }}>
                    <Text fontSize="sm" color="gray.600">
                      {selectedSubscribers.length} selected
                    </Text>
                    <Button 
                      size="sm" 
                      leftIcon={<FiTag />}
                      onClick={handleBulkAddTag}
                    >
                      Add Tag
                    </Button>
                    <Button 
                      size="sm" 
                      colorScheme="red" 
                      leftIcon={<FiTrash2 />}
                      onClick={handleBulkDelete}
                    >
                      Delete
                    </Button>
                  </HStack>
                )}
              </Flex>
              
              {/* Active filters */}
              {(activeFilters.length > 0 || selectedSegment !== 'all' || searchTerm) && (
                <Flex wrap="wrap" gap={2} mb={4}>
                  <Text fontSize="sm" fontWeight="medium" my={1}>Active filters:</Text>
                  
                  {selectedSegment !== 'all' && (
                    <Tag size="md" borderRadius="full" variant="subtle" colorScheme="blue">
                      <TagLabel>Segment: {selectedSegment}</TagLabel>
                      <TagCloseButton onClick={() => setSelectedSegment('all')} />
                    </Tag>
                  )}
                  
                  {searchTerm && (
                    <Tag size="md" borderRadius="full" variant="subtle" colorScheme="blue">
                      <TagLabel>Search: {searchTerm}</TagLabel>
                      <TagCloseButton onClick={() => setSearchTerm('')} />
                    </Tag>
                  )}
                  
                  {activeFilters.map(filter => (
                    <Tag 
                      key={filter}
                      size="md"
                      borderRadius="full"
                      variant="subtle"
                      colorScheme="blue"
                    >
                      <TagLabel>Tag: {filter}</TagLabel>
                      <TagCloseButton onClick={() => removeFilter(filter)} />
                    </Tag>
                  ))}
                  
                  <Button 
                    size="xs" 
                    variant="link" 
                    colorScheme="blue" 
                    onClick={clearFilters}
                    my={1}
                  >
                    Clear all filters
                  </Button>
                </Flex>
              )}
              
              {/* Subscribers table */}
              <Box 
                bg="white" 
                rounded="lg" 
                boxShadow="md" 
                overflow="hidden"
              >
                {loading ? (
                  <Flex justify="center" align="center" p={10}>
                    <Spinner size="xl" />
                  </Flex>
                ) : filteredSubscribers.length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th width="40px">
                            <input
                              type="checkbox"
                              checked={selectedSubscribers.length === filteredSubscribers.length && filteredSubscribers.length > 0}
                              onChange={handleSelectAll}
                            />
                          </Th>
                          <Th>Email</Th>
                          <Th>Name</Th>
                          <Th>Status</Th>
                          <Th>Subscribed Date</Th>
                          <Th>Tags</Th>
                          <Th>Engagement</Th>
                          <Th width="80px"></Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {filteredSubscribers.map((subscriber) => (
                          <Tr key={subscriber.id}>
                            <Td>
                              <input
                                type="checkbox"
                                checked={selectedSubscribers.includes(subscriber.id)}
                                onChange={() => handleSelectSubscriber(subscriber.id)}
                              />
                            </Td>
                            <Td fontWeight="medium">{subscriber.email}</Td>
                            <Td>{subscriber.name || '-'}</Td>
                            <Td>
                              <Badge colorScheme={subscriber.status === 'active' ? 'green' : 'red'}>
                                {subscriber.status || 'active'}
                              </Badge>
                            </Td>
                            <Td>
                              {subscriber.createdAt ? new Date(subscriber.createdAt).toLocaleDateString() : '-'}
                            </Td>
                            <Td>
                              <Flex wrap="wrap" gap={1}>
                                {subscriber.tags && subscriber.tags.length > 0 ? (
                                  subscriber.tags.map(tag => (
                                    <Tag size="sm" key={tag} colorScheme="blue" variant="subtle">
                                      <TagLabel>{tag}</TagLabel>
                                      <TagCloseButton onClick={() => handleRemoveTag(subscriber.id, tag)} />
                                    </Tag>
                                  ))
                                ) : (
                                  <Text fontSize="sm" color="gray.500">No tags</Text>
                                )}
                                <IconButton
                                  icon={<FiPlus />}
                                  size="xs"
                                  variant="ghost"
                                  aria-label="Add tag"
                                  onClick={() => {
                                    const tag = prompt('Enter new tag:');
                                    if (tag) {
                                      handleAddTag(subscriber.id, tag);
                                    }
                                  }}
                                />
                              </Flex>
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={
                                  subscriber.engagementScore > 70 ? 'green' : 
                                  subscriber.engagementScore > 30 ? 'yellow' : 
                                  'red'
                                }
                              >
                                {subscriber.engagementScore || 0}%
                              </Badge>
                            </Td>
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
                                  <MenuItem 
                                    icon={<FiEdit />}
                                    onClick={() => editSubscriber(subscriber.id)}
                                  >
                                    Edit
                                  </MenuItem>
                                  <MenuItem
                                    icon={<FiMail />}
                                    onClick={() => {
                                      // Send test email functionality would go here
                                      toast({
                                        title: "Test email sent",
                                        description: `A test email has been sent to ${subscriber.email}`,
                                        status: "success",
                                        duration: 3000,
                                      });
                                    }}
                                  >
                                    Send Test Email
                                  </MenuItem>
                                  <MenuItem 
                                    icon={<FiTrash2 />}
                                    color="red.500"
                                    onClick={() => onDeleteClick(subscriber.id)}
                                  >
                                    Delete
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Box p={10} textAlign="center">
                    <Text color="gray.500">
                      {searchTerm || activeFilters.length > 0 || selectedSegment !== 'all' ? 
                        'No subscribers match your filters.' : 
                        'No subscribers have been added yet.'}
                    </Text>
                    {searchTerm || activeFilters.length > 0 || selectedSegment !== 'all' ? (
                      <Button 
                        mt={4} 
                        onClick={clearFilters}
                        size="sm"
                      >
                        Clear filters
                      </Button>
                    ) : (
                      <Button 
                        mt={4} 
                        colorScheme="blue"
                        onClick={() => router.push('/admin/subscribers/add')}
                        leftIcon={<FiPlus />}
                      >
                        Add Your First Subscriber
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </TabPanel>
            
            {/* Analytics Tab */}
            <TabPanel px={0}>
              <Box mb={8}>
                <Heading as="h1" size="xl" mb={4}>Subscriber Analytics</Heading>
                <Text color="gray.600">
                  Insights and statistics about your subscriber base.
                </Text>
              </Box>
              
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
                <Stat bg="white" p={4} borderRadius="md" boxShadow="sm">
                  <StatLabel>Total Subscribers</StatLabel>
                  <StatNumber>{subscribers.length}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {growthRate}% growth
                  </StatHelpText>
                </Stat>
                
                <Stat bg="white" p={4} borderRadius="md" boxShadow="sm">
                  <StatLabel>Active Subscribers</StatLabel>
                  <StatNumber>
                    {subscribers.filter(sub => sub.status === 'active').length}
                  </StatNumber>
                  <StatHelpText>
                    {Math.round((subscribers.filter(sub => sub.status === 'active').length / subscribers.length) * 100)}% of total
                  </StatHelpText>
                </Stat>
                
                <Stat bg="white" p={4} borderRadius="md" boxShadow="sm">
                  <StatLabel>Avg. Open Rate</StatLabel>
                  <StatNumber>38.2%</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    4.3% from last month
                  </StatHelpText>
                </Stat>
                
                <Stat bg="white" p={4} borderRadius="md" boxShadow="sm">
                  <StatLabel>Avg. Click Rate</StatLabel>
                  <StatNumber>12.7%</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    2.1% from last month
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
              
              {/* Additional analytics content would go here */}
              <Box bg="white" p={6} borderRadius="lg" boxShadow="md" mb={6}>
                <Heading size="md" mb={4}>Subscriber Growth</Heading>
                {/* Chart component would go here */}
                <Box height="300px" bg="gray.100" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                  <Text color="gray.500">Subscriber growth chart would display here</Text>
                </Box>
              </Box>
              
              <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
                <Heading size="md" mb={4}>Engagement Metrics</Heading>
                {/* Chart component would go here */}
                <Box height="300px" bg="gray.100" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
                  <Text color="gray.500">Engagement metrics chart would display here</Text>
                </Box>
              </Box>
            </TabPanel>
            
            {/* Segments Tab */}
            <TabPanel px={0}>
              <Box mb={8}>
                <Heading as="h1" size="xl" mb={4}>Subscriber Segments</Heading>
                <Text color="gray.600">
                  Create and manage segments to target specific groups of subscribers.
                </Text>
              </Box>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {/* Predefined segments */}
                <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Highly Engaged</Heading>
                    <Badge colorScheme="green">
                      {subscribers.filter(sub => sub.engagementScore && sub.engagementScore > 70).length}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Subscribers with high open and click rates.
                  </Text>
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline"
                    leftIcon={<FiMail />}
                    onClick={() => {
                      // Route to newsletter creation with this segment pre-selected
                      router.push('/admin/newsletters/create?segment=engaged');
                    }}
                  >
                    Create Campaign
                  </Button>
                </Box>
                
                <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Recent Subscribers</Heading>
                    <Badge colorScheme="blue">
                      {subscribers.filter(sub => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return new Date(sub.createdAt) >= thirtyDaysAgo;
                      }).length}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Subscribers who joined in the last 30 days.
                  </Text>
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline"
                    leftIcon={<FiMail />}
                    onClick={() => {
                      router.push('/admin/newsletters/create?segment=recent');
                    }}
                  >
                    Create Campaign
                  </Button>
                </Box>
                
                <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Inactive</Heading>
                    <Badge colorScheme="red">
                      {subscribers.filter(sub => {
                        const ninetyDaysAgo = new Date();
                        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
                        return !sub.lastOpened || new Date(sub.lastOpened) < ninetyDaysAgo;
                      }).length}
                    </Badge>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Subscribers who haven't opened emails in 90+ days.
                  </Text>
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline"
                    leftIcon={<FiMail />}
                    onClick={() => {
                      router.push('/admin/newsletters/create?segment=inactive');
                    }}
                  >
                    Create Re-engagement Campaign
                  </Button>
                </Box>
                
                {/* Custom segments would be listed here */}
                {/* Add new segment card */}
                <Box 
                  bg="gray.50" 
                  p={6} 
                  borderRadius="lg" 
                  borderStyle="dashed" 
                  borderWidth="2px" 
                  borderColor="gray.200"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  _hover={{ bg: "gray.100" }}
                  onClick={() => {
                    // Open modal or navigate to segment creation
                    router.push('/admin/segments/create');
                  }}
                >
                  <Box 
                    bg="blue.50" 
                    color="blue.500" 
                    borderRadius="full" 
                    p={3}
                    mb={4}
                  >
                    <FiUsers size={24} />
                  </Box>
                  <Text fontWeight="medium">Create Custom Segment</Text>
                  <Text fontSize="sm" color="gray.600" mt={2} textAlign="center">
                    Define a segment with custom rules and conditions
                  </Text>
                </Box>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={!!deleteId}
        leastDestructiveRef={cancelRef}
        onClose={closeDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Subscriber
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this subscriber? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDelete} 
                ml={3}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Layout>
  );
}