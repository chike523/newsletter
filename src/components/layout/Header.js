// src/components/layout/Header.js
import React from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  HStack,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
} from '@chakra-ui/react';
import { FiMenu } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const router = useRouter();

  // This helper function determines if a nav link is active
  const isActive = (path) => router.pathname === path;

  // Navigation items
  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Archive', path: '/archive' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <Box bg="white" px={4} boxShadow="sm" position="sticky" top={0} zIndex={10}>
      <Flex h={16} alignItems="center" justifyContent="space-between" maxW="container.xl" mx="auto">
        <Link href="/" passHref legacyBehavior>
          <Text
            as="a"
            fontWeight="bold"
            fontSize="xl"
            color="gray.800"
            cursor="pointer"
          >
            Newsletter Hub
          </Text>
        </Link>
        
        {/* Desktop Navigation */}
        <HStack spacing={4} display={{ base: "none", md: "flex" }}>
          {navItems.map((item) => (
            <Link key={item.path} href={item.path} passHref legacyBehavior>
              <Button 
                as="a" 
                variant="ghost" 
                colorScheme={isActive(item.path) ? "blue" : "gray"}
              >
                {item.name}
              </Button>
            </Link>
          ))}
        </HStack>
        
        {/* Mobile Navigation Icon */}
        <IconButton
          aria-label="Open menu"
          fontSize="20px"
          icon={<FiMenu />}
          variant="ghost"
          display={{ base: "flex", md: "none" }}
          onClick={onOpen}
        />
      </Flex>
      
      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          
          <DrawerBody>
            <VStack spacing={4} align="stretch" mt={4}>
              {navItems.map((item) => (
                <Link key={item.path} href={item.path} passHref legacyBehavior>
                  <Button 
                    as="a" 
                    justifyContent="flex-start" 
                    variant="ghost" 
                    colorScheme={isActive(item.path) ? "blue" : "gray"}
                    w="full"
                    onClick={onClose}
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Header;