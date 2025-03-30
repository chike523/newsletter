import React from 'react';
import { Box, Container, Stack, Text } from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box bg="gray.50" color="gray.700" mt="auto">
      <Container as={Stack} maxW="container.xl" py={6} textAlign="center">
        <Text>© 2025 Newsletter Hub. All rights reserved</Text>
      </Container>
    </Box>
  );
};

export default Footer;