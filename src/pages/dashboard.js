import React from 'react';
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Heading,
  Text,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { FiUsers, FiMail, FiActivity, FiCheckCircle } from 'react-icons/fi';
import Layout from '../components/layout/Layout';

const StatsCard = ({ title, stat, icon, helpText, percentage, type }) => {
  return (
    <Stat
      px={{ base: 2, md: 4 }}
      py={'5'}
      shadow={'xl'}
      border={'1px'}
      borderColor={'gray.200'}
      rounded={'lg'}
      bg={'white'}
    >
      <Flex justifyContent={'space-between'}>
        <Box pl={{ base: 2, md: 4 }}>
          <StatLabel fontWeight={'medium'} isTruncated>
            {title}
          </StatLabel>
          <StatNumber fontSize={'2xl'} fontWeight={'medium'}>
            {stat}
          </StatNumber>
          {helpText && (
            <StatHelpText>
              {percentage && (
                <StatArrow type={type || 'increase'} />
              )}
              {helpText}
            </StatHelpText>
          )}
        </Box>
        <Box
          my={'auto'}
          color={'gray.800'}
          alignContent={'center'}
        >
          <Icon as={icon} w={10} h={10} />
        </Box>
      </Flex>
    </Stat>
  );
};

export default function Dashboard() {
  return (
    <Layout>
      <Box maxW="7xl" mx={'auto'} pt={5} px={{ base: 2, sm: 12, md: 17 }}>
        <Heading as="h1" size="xl" mb={6}>
          Dashboard
        </Heading>
        <Text mb={8} fontSize={'lg'} color={'gray.600'}>
          Welcome back! Here's an overview of your newsletter metrics.
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 5, lg: 8 }}>
          <StatsCard
            title={'Subscribers'}
            stat={'1,024'}
            icon={FiUsers}
            helpText={'7% increase'}
            percentage={true}
          />
          <StatsCard
            title={'Newsletters'}
            stat={'12'}
            icon={FiMail}
            helpText={'2 drafts'}
          />
          <StatsCard
            title={'Open Rate'}
            stat={'68.5%'}
            icon={FiActivity}
            helpText={'3.2% increase'}
            percentage={true}
          />
          <StatsCard
            title={'Click Rate'}
            stat={'42.3%'}
            icon={FiCheckCircle}
            helpText={'1.1% decrease'}
            percentage={true}
            type={'decrease'}
          />
        </SimpleGrid>
        
        {/* We'll add more dashboard components later */}
      </Box>
    </Layout>
  );
}