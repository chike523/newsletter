// src/components/layout/Layout.js
import { Box, Container } from '@chakra-ui/react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children }) => {
  return (
    <Box minH="100vh">
      <Header />
      <Container maxW="container.xl" py="8">
        <main>{children}</main>
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;