import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Tooltip,
  Divider,
  Select,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FiBold, FiItalic, FiLink, FiList, FiAlignLeft, FiAlignCenter, 
  FiAlignRight, FiImage, FiCode, FiType, FiUnderline
} from 'react-icons/fi';

// This is a simplified version of a rich text editor
// For a production app, consider using a library like Quill, TinyMCE, or Draft.js
const RichTextEditor = forwardRef(({ initialValue = '', onChange }, ref) => {
  const editorRef = useRef(null);
  const [html, setHtml] = useState(initialValue);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialValue;
    }
  }, [initialValue]);
  
  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    getContent: () => html,
    setContent: (content) => {
      setHtml(content);
      if (editorRef.current) {
        editorRef.current.innerHTML = content;
      }
    },
    insertHTML: (html) => {
      document.execCommand('insertHTML', false, html);
      handleChange();
    }
  }));
  
  const handleChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setHtml(content);
      onChange && onChange(content);
    }
  };
  
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleChange();
    editorRef.current.focus();
  };
  
  const handleLinkInsert = () => {
    const url = prompt('Enter URL:', 'https://');
    if (url) {
      execCommand('createLink', url);
    }
  };
  
  const handleImageInsert = () => {
    const url = prompt('Enter image URL:', 'https://');
    if (url) {
      execCommand('insertImage', url);
    }
  };
  
  const handleHeadingChange = (e) => {
    const value = e.target.value;
    if (value === 'p') {
      execCommand('formatBlock', 'p');
    } else {
      execCommand('formatBlock', value);
    }
  };
  
  const toggleHtmlView = () => {
    if (editorRef.current) {
      if (editorRef.current.getAttribute('contenteditable') === 'true') {
        // Switch to HTML view
        const content = editorRef.current.innerHTML;
        editorRef.current.textContent = content;
        editorRef.current.setAttribute('contenteditable', 'false');
        editorRef.current.style.fontFamily = 'monospace';
        editorRef.current.style.whiteSpace = 'pre-wrap';
      } else {
        // Switch back to WYSIWYG
        const content = editorRef.current.textContent;
        editorRef.current.innerHTML = content;
        editorRef.current.setAttribute('contenteditable', 'true');
        editorRef.current.style.fontFamily = 'inherit';
        editorRef.current.style.whiteSpace = 'normal';
        handleChange();
      }
    }
  };
  
  return (
    <Box 
      border="1px" 
      borderColor={borderColor} 
      borderRadius="md" 
      overflow="hidden"
    >
      {/* Toolbar */}
      <Flex 
        bg={bgColor} 
        p={2} 
        borderBottom="1px" 
        borderColor={borderColor}
        wrap="wrap"
        gap={2}
      >
        <Select 
          size="sm" 
          width="auto" 
          onChange={handleHeadingChange}
          mr={2}
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </Select>
        
        <Divider orientation="vertical" height="24px" />
        
        <HStack>
          <Tooltip label="Bold">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiBold />}
              onClick={() => execCommand('bold')}
              aria-label="Bold"
            />
          </Tooltip>
          
          <Tooltip label="Italic">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiItalic />}
              onClick={() => execCommand('italic')}
              aria-label="Italic"
            />
          </Tooltip>
          
          <Tooltip label="Underline">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiUnderline />}
              onClick={() => execCommand('underline')}
              aria-label="Underline"
            />
          </Tooltip>
        </HStack>
        
        <Divider orientation="vertical" height="24px" />
        
        <HStack>
          <Tooltip label="Align Left">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiAlignLeft />}
              onClick={() => execCommand('justifyLeft')}
              aria-label="Align Left"
            />
          </Tooltip>
          
          <Tooltip label="Align Center">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiAlignCenter />}
              onClick={() => execCommand('justifyCenter')}
              aria-label="Align Center"
            />
          </Tooltip>
          
          <Tooltip label="Align Right">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiAlignRight />}
              onClick={() => execCommand('justifyRight')}
              aria-label="Align Right"
            />
          </Tooltip>
        </HStack>
        
        <Divider orientation="vertical" height="24px" />
        
        <HStack>
          <Tooltip label="Bulleted List">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiList />}
              onClick={() => execCommand('insertUnorderedList')}
              aria-label="Bulleted List"
            />
          </Tooltip>
          
          <Tooltip label="Insert Link">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiLink />}
              onClick={handleLinkInsert}
              aria-label="Insert Link"
            />
          </Tooltip>
          
          <Tooltip label="Insert Image">
            <IconButton
              size="sm"
              variant="ghost"
              icon={<FiImage />}
              onClick={handleImageInsert}
              aria-label="Insert Image"
            />
          </Tooltip>
        </HStack>
        
        <Divider orientation="vertical" height="24px" />
        
        <Tooltip label="Toggle HTML View">
          <IconButton
            size="sm"
            variant="ghost"
            icon={<FiCode />}
            onClick={toggleHtmlView}
            aria-label="HTML View"
          />
        </Tooltip>
      </Flex>
      
      {/* Editor Content Area */}
      <Box
        ref={editorRef}
        contentEditable="true"
        height="400px"
        p={4}
        overflowY="auto"
        bg={bgColor}
        color="inherit"
        onInput={handleChange}
        onBlur={handleChange}
        dangerouslySetInnerHTML={{ __html: initialValue }}
        sx={{
          '&:focus': {
            outline: 'none',
          },
          '& img': {
            maxWidth: '100%',
          }
        }}
      />
    </Box>
  );
});

export default RichTextEditor;