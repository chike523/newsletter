import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Button,
  Flex,
  VStack,
  HStack,
  Text,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Divider,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { 
  FiLayout, FiType, FiImage, FiLink, 
  FiColumns, FiAlignLeft, FiBold, FiItalic,
  FiSave, FiEye, FiSettings, FiMoreVertical
} from 'react-icons/fi';

// Email editor elements
const textBlock = `<div class="text-block" style="padding: 10px; margin-bottom: 20px;">
  <p style="font-size: 16px; line-height: 1.5; color: #333;">Edit this text block to add your content.</p>
</div>`;

const imageBlock = `<div class="image-block" style="padding: 10px; margin-bottom: 20px; text-align: center;">
  <img src="https://via.placeholder.com/600x300" alt="Placeholder image" style="max-width: 100%; height: auto;">
</div>`;

const buttonBlock = `<div class="button-block" style="padding: 10px; margin-bottom: 20px; text-align: center;">
  <a href="#" style="background-color: #4A90E2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Click Me</a>
</div>`;

const dividerBlock = `<div class="divider-block" style="padding: 10px; margin-bottom: 20px;">
  <hr style="border: 0; border-top: 1px solid #eee;">
</div>`;

const twoColumnBlock = `<div class="two-column-block" style="padding: 10px; margin-bottom: 20px; display: table; width: 100%;">
  <div style="display: table-cell; width: 50%; padding-right: 10px;">
    <p style="font-size: 16px; line-height: 1.5; color: #333;">Left column content.</p>
  </div>
  <div style="display: table-cell; width: 50%; padding-left: 10px;">
    <p style="font-size: 16px; line-height: 1.5; color: #333;">Right column content.</p>
  </div>
</div>`;

const elements = [
  { name: 'Text', icon: <FiType />, content: textBlock },
  { name: 'Image', icon: <FiImage />, content: imageBlock },
  { name: 'Button', icon: <FiLink />, content: buttonBlock },
  { name: 'Divider', icon: <FiLayout />, content: dividerBlock },
  { name: 'Two Columns', icon: <FiColumns />, content: twoColumnBlock },
];

// Template options
const templates = [
  { id: 'modern', name: 'Modern', thumbnail: '🌟' },
  { id: 'minimal', name: 'Minimal', thumbnail: '⚪' },
  { id: 'corporate', name: 'Corporate', thumbnail: '🏢' },
  { id: 'promotional', name: 'Promotional', thumbnail: '🎁' },
  { id: 'newsletter', name: 'Newsletter', thumbnail: '📰' },
  { id: 'announcement', name: 'Announcement', thumbnail: '📢' },
];

const DragDropEditor = forwardRef(({ initialValue = '', onChange, onPreview }, ref) => {
  const [content, setContent] = useState(initialValue || '');
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editorMode, setEditorMode] = useState('design'); // design or html
  const toast = useToast();
  
  // Initialize container ref for the editor
  const containerRef = React.useRef(null);
  
  useEffect(() => {
    if (initialValue && !content) {
      setContent(initialValue);
    }
  }, [initialValue]);
  
  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    getContent: () => content,
    setContent: (newContent) => {
      setContent(newContent);
    },
  }));
  
  // Handle dropping elements
  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const element = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // This is simplified - in a real implementation, you'd:
      // 1. Calculate the drop position
      // 2. Insert the content at the right place
      // 3. Handle more complex interactions
      setContent(prev => prev + element.content);
      
      if (onChange) {
        onChange(content + element.content);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };
  
  // Handle dragging elements
  const handleDragStart = (e, element) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(element));
  };
  
  const handleContentChange = (newContent) => {
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };
  
  const handlePreview = () => {
    if (onPreview) {
      onPreview(content);
    }
  };
  
  const switchToHtmlMode = () => {
    setEditorMode('html');
  };
  
  const switchToDesignMode = () => {
    setEditorMode('design');
  };
  
  const applyTemplate = (templateId) => {
    // In a real implementation, you would load the template
    // and apply it to the current content
    toast({
      title: `Template "${templateId}" applied`,
      status: "success",
      duration: 2000,
    });
  };
  
  return (
    <Box border="1px" borderColor="gray.200" borderRadius="md" overflow="hidden">
      <Flex>
        {/* Left sidebar - Elements */}
        <Box 
          w="200px" 
          bg="gray.50" 
          p={4} 
          borderRight="1px" 
          borderColor="gray.200"
          display={{ base: activeTab === 0 ? 'block' : 'none', md: 'block' }}
        >
          <Tabs isFitted size="sm" variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Blocks</Tab>
              <Tab>Templates</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel px={2}>
                <Text mb={3} fontSize="sm" fontWeight="medium">Drag elements to editor</Text>
                <VStack spacing={2} align="stretch">
                  {elements.map((element, index) => (
                    <Button
                      key={index}
                      leftIcon={element.icon}
                      size="sm"
                      justifyContent="flex-start"
                      draggable
                      onDragStart={(e) => handleDragStart(e, element)}
                    >
                      {element.name}
                    </Button>
                  ))}
                </VStack>
              </TabPanel>
              <TabPanel px={2}>
                <Text mb={3} fontSize="sm" fontWeight="medium">Choose a template</Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                  {templates.map((template) => (
                    <GridItem 
                      key={template.id}
                      border="1px" 
                      borderColor="gray.200" 
                      borderRadius="md"
                      p={2}
                      textAlign="center"
                      cursor="pointer"
                      _hover={{ bg: 'gray.100' }}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <Text fontSize="2xl">{template.thumbnail}</Text>
                      <Text fontSize="xs" mt={1}>{template.name}</Text>
                    </GridItem>
                  ))}
                </Grid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
        
        {/* Main content area */}
        <Box flex="1">
          {/* Toolbar */}
          <Flex 
            bg="white" 
            p={2} 
            borderBottom="1px" 
            borderColor="gray.200"
            justify="space-between"
          >
            <HStack spacing={1}>
              <Tooltip label="Text style">
                <IconButton size="sm" icon={<FiBold />} aria-label="Bold" variant="ghost" />
              </Tooltip>
              <Tooltip label="Italic">
                <IconButton size="sm" icon={<FiItalic />} aria-label="Italic" variant="ghost" />
              </Tooltip>
              <Tooltip label="Align">
                <IconButton size="sm" icon={<FiAlignLeft />} aria-label="Align" variant="ghost" />
              </Tooltip>
              <Divider orientation="vertical" height="24px" mx={1} />
              <Tooltip label="Settings">
                <IconButton size="sm" icon={<FiSettings />} aria-label="Settings" variant="ghost" />
              </Tooltip>
            </HStack>
            
            <HStack>
              <Button 
                size="sm" 
                variant={editorMode === 'design' ? 'solid' : 'outline'} 
                onClick={switchToDesignMode}
                colorScheme="blue"
              >
                Design
              </Button>
              <Button 
                size="sm" 
                variant={editorMode === 'html' ? 'solid' : 'outline'} 
                onClick={switchToHtmlMode}
                colorScheme="blue"
              >
                HTML
              </Button>
              <Tooltip label="Preview">
                <IconButton 
                  size="sm" 
                  icon={<FiEye />} 
                  aria-label="Preview" 
                  onClick={handlePreview}
                />
              </Tooltip>
              <Menu>
                <MenuButton
                  as={IconButton}
                  size="sm"
                  icon={<FiMoreVertical />}
                  variant="ghost"
                />
                <MenuList>
                  <MenuItem icon={<FiSave />}>Save as template</MenuItem>
                  <MenuItem icon={<FiEye />}>Preview</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
          
          {/* Editor area */}
          {editorMode === 'design' ? (
            <Box
              ref={containerRef}
              height="500px"
              p={4}
              bg="white"
              overflowY="auto"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              dangerouslySetInnerHTML={{ __html: content }}
              sx={{
                '.text-block:hover, .image-block:hover, .button-block:hover, .divider-block:hover, .two-column-block:hover': {
                  outline: '2px dashed #4A90E2',
                  position: 'relative',
                },
              }}
            />
          ) : (
            <Box height="500px" p={4}>
              <textarea
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  padding: '10px',
                  fontFamily: 'monospace',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
              />
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
});

export default DragDropEditor;