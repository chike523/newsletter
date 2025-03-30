// In src/pages/_app.js
import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { initEmailJS } from '../lib/emailjs';
import '../styles/globals.css';

// Create a client
const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  // Initialize EmailJS
  useEffect(() => {
    initEmailJS();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider>
        <Component {...pageProps} />
      </ChakraProvider>
    </QueryClientProvider>
  );
}

export default MyApp;