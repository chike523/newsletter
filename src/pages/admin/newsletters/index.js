// src/pages/admin/newsletters/index.js
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
  HStack,
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
} from '@chakra-ui/react';
import { FiMoreVertical, FiPlus, FiSearch, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import Layout from '../../../components/layout/Layout';
import { useRouter } from 'next/router';
import { getNewsletters, deleteNewsletter, updateNewsletter } from '../../../lib/firebase';

export default function Newsletters() {
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newsletters, setNewsletters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = React.useRef();
  
  const router = useRouter();
  const toast = useToast();
  
  // Fix hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch newsletters from Firebase
  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        setLoading(true);
        const data = await getNewsletters();
        setNewsletters(data);
      } catch (error) {
        console.error("Error fetching newsletters:", error);
        toast({
          title: "Error loading newsletters",
          description: "There was a problem loading your newsletters.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isClient) {
      fetchNewsletters();
    }
  }, [isClient, toast]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredNewsletters = newsletters.filter(newsletter => 
    newsletter.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteNewsletter(deleteId);
      
      if (result.success) {
        setNewsletters(newsletters.filter(newsletter => newsletter.id !== deleteId));
        
        toast({
          title: "Newsletter deleted",
          description: "The newsletter has been deleted successfully.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error("Failed to delete newsletter");
      }
    } catch (error) {
      console.error("Error deleting newsletter:", error);
      
      toast({
        title: "Delete failed",
        description: "There was a problem deleting the newsletter.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const onDeleteClick = (id) => {
    setDeleteId(id);
  };

  const closeDeleteDialog = () => {
    setDeleteId(null);
  };

  const editNewsletter = (id) => {
    router.push(`/admin/newsletters/edit/${id}`);
  };

  const viewNewsletter = (id) => {
    router.push(`/admin/newsletters/view/${id}`);
  };

  // Don't render anything until client-side
  if (!isClient) {
    return null;
  }

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <Box mb={8}>
          <Flex justify="space-between" align="center">
            <Heading as="h1" size="xl">Newsletters</Heading>
            <Button 
              colorScheme="blue" 
              leftIcon={<FiPlus />}
              onClick={() => router.push('/admin/newsletters/create')}
            >
              Create Newsletter
            </Button>
          </Flex>
          <Text color="gray.600" mt={2}>
            Manage your newsletters
          </Text>
        </Box>
        
        {/* Search and filters */}
        <Flex 
          mb={6}
          direction={{ base: "column", md: "row" }} 
          align={{ base: "stretch", md: "center" }}
          gap={4}
        >
          <InputGroup maxW={{ base: "100%", md: "300px" }}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search newsletters..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </InputGroup>
        </Flex>
        
        {/* Newsletters table */}
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
          ) : filteredNewsletters.length > 0 ? (
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Title</Th>
                    <Th>Created Date</Th>
                    <Th>Status</Th>
                    <Th>Sent To</Th>
                    <Th width="80px"></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredNewsletters.map((newsletter) => (
                    <Tr key={newsletter.id}>
                      <Td fontWeight="medium">{newsletter.title}</Td>
                      <Td>{new Date(newsletter.createdAt).toLocaleDateString()}</Td>
                      <Td>
                        <Badge colorScheme={newsletter.sent ? 'green' : 
                                           newsletter.scheduledDate ? 'purple' : 'blue'}>
                          {newsletter.sent ? 'Sent' : 
                           newsletter.scheduledDate ? 'Scheduled' : 'Draft'}
                        </Badge>
                      </Td>
                      <Td>
                        {newsletter.sent ? 
                          (newsletter.sentCount || 'All subscribers') : 
                          (newsletter.targetAudience === 'all' ? 'All subscribers' : 
                           newsletter.targetAudience === 'test' ? 'Test group' : 
                           'Segmented audience')}
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
                              icon={<FiEye />}
                              onClick={() => viewNewsletter(newsletter.id)}
                            >
                              View
                            </MenuItem>
                            {!newsletter.sent && (
                              <MenuItem 
                                icon={<FiEdit />}
                                onClick={() => editNewsletter(newsletter.id)}
                              >
                                Edit
                              </MenuItem>
                            )}
                            <MenuItem 
                              icon={<FiTrash2 />}
                              color="red.500"
                              onClick={() => onDeleteClick(newsletter.id)}
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
                {searchTerm ? 
                  'No newsletters found matching your search.' : 
                  'No newsletters have been created yet.'}
              </Text>
              {searchTerm ? (
                <Button 
                  mt={4} 
                  onClick={() => setSearchTerm('')}
                  size="sm"
                >
                  Clear search
                </Button>
              ) : (
                <Button 
                  mt={4} 
                  colorScheme="blue"
                  onClick={() => router.push('/admin/newsletters/create')}
                  leftIcon={<FiPlus />}
                >
                  Create First Newsletter
                </Button>
              )}
            </Box>
          )}
        </Box>
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
              Delete Newsletter
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this newsletter? This action cannot be undone.
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