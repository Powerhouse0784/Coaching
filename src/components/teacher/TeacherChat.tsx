'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useUploadThing } from '@/lib/uploadthing';
import dynamic from 'next/dynamic';
import {
  Send, Paperclip, Smile, Image as ImageIcon, FileText,
  Download, Trash2, Check, CheckCheck, Loader, X,
  Upload, AlertCircle, Users, Clock, Search, MoreVertical,
  Reply, Copy, Edit2, Pin, Archive, Volume2, VolumeX
} from 'lucide-react';

// Dynamic import emoji picker
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface Message {
  id: string;
  content: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: string | null;
  isRead: boolean;
  readBy: string[];
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  isSelf: boolean;
}

export default function TeacherChat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // UploadThing hooks
  const { startUpload: uploadImage } = useUploadThing('chatImage', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        sendMessageWithFile(res[0].url, res[0].name, 'image', `${(res[0].size / 1024 / 1024).toFixed(2)} MB`);
      }
      setUploadingFile(false);
      setShowFileModal(false);
    },
    onUploadError: (error: Error) => {
      alert(`Upload failed: ${error.message}`);
      setUploadingFile(false);
    },
  });

  const { startUpload: uploadDocument } = useUploadThing('chatDocument', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        sendMessageWithFile(res[0].url, res[0].name, 'pdf', `${(res[0].size / 1024 / 1024).toFixed(2)} MB`);
      }
      setUploadingFile(false);
      setShowFileModal(false);
    },
    onUploadError: (error: Error) => {
      alert(`Upload failed: ${error.message}`);
      setUploadingFile(false);
    },
  });

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/teacher/chat?limit=100');
      const data = await response.json();
      
      if (data.success) {
        const newMessages = data.messages;
        
        // Only update if messages actually changed
        if (JSON.stringify(newMessages) !== JSON.stringify(messages)) {
          // Check if there are NEW messages (length increased)
          if (newMessages.length > messages.length && messages.length > 0) {
            const latestMessage = newMessages[newMessages.length - 1];
            if (!latestMessage.isSelf && soundEnabled) {
              playNotificationSound();
            }
          }
          
          setMessages(newMessages);
          
          // Mark unread messages as read
          const unreadIds = newMessages
            .filter((msg: Message) => !msg.isSelf && !msg.isRead)
            .map((msg: Message) => msg.id);
          
          if (unreadIds.length > 0) {
            markAsRead(unreadIds);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Poll for new messages every 3 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []); // Remove messages.length dependency

  // Smart auto-scroll - only scroll to bottom in specific cases
  useEffect(() => {
    // Don't auto-scroll if user has scrolled up
    if (userScrolled) return;
    
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect user scroll
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setUserScrolled(!isAtBottom);
  };

  // Scroll to bottom button click
  const scrollToBottom = () => {
    setUserScrolled(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  // Mark messages as read
  const markAsRead = async (messageIds: string[]) => {
    try {
      await fetch('/api/teacher/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds }),
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Send text message
  const sendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    setIsTyping(false);
    
    try {
      const response = await fetch('/api/teacher/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('');
        setMessages((prev) => [...prev, data.message]);
        setUserScrolled(false); // Auto-scroll on send
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred');
    } finally {
      setSending(false);
    }
  };

  // Send message with file
  const sendMessageWithFile = async (fileUrl: string, fileName: string, fileType: string, fileSize: string) => {
    try {
      const response = await fetch('/api/teacher/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message || '',
          fileUrl,
          fileName,
          fileType,
          fileSize,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('');
        setMessages((prev) => [...prev, data.message]);
        setUserScrolled(false);
      }
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file');
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      const response = await fetch(`/api/teacher/chat?id=${messageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      } else {
        alert('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('An error occurred');
    }
  };

  // Copy message
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Message copied!');
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Image must be less than 8MB');
      return;
    }

    setUploadingFile(true);
    await uploadImage([file]);
  };

  // Handle document upload
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    if (file.size > 16 * 1024 * 1024) {
      alert('PDF must be less than 16MB');
      return;
    }

    setUploadingFile(true);
    await uploadDocument([file]);
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  // Handle emoji click
  const onEmojiClick = (emojiObject: any) => {
    setMessage(message + emojiObject.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Handle typing indicator
  const handleTyping = () => {
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filter messages by search
  const filteredMessages = searchQuery
    ? messages.filter((msg) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] bg-gray-50 rounded-2xl overflow-hidden border-2 border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Teacher Chat Room</h2>
              <p className="text-sm text-purple-100">
                {filteredMessages.length} messages
                {isTyping && <span className="ml-2">• Someone is typing...</span>}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 bg-white/20 backdrop-blur-lg rounded-lg hover:bg-white/30 transition"
              title="Search messages"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 bg-white/20 backdrop-blur-lg rounded-lg hover:bg-white/30 transition"
              title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-lg px-3 py-1 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-200" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-lg text-white placeholder-purple-200 rounded-lg focus:ring-2 focus:ring-white/50 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-purple-200" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Users className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No messages found' : 'No messages yet'}
            </h3>
            <p className="text-gray-600 text-sm">
              {searchQuery ? 'Try a different search term' : 'Be the first to start the conversation!'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onDelete={deleteMessage}
              onCopy={copyMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button - Beautiful Design */}
      {userScrolled && (
        <div className="absolute bottom-28 right-6 z-10">
          <button
            onClick={scrollToBottom}
            className="group relative p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
            title="Jump to latest messages"
          >
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white" />
            
            {/* Down arrow icon */}
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            
            {/* Tooltip */}
            <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
              New messages ↓
            </span>
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t-2 border-gray-200 p-4">
        <div className="flex items-end gap-2">
          {/* File Attach Button */}
          <button
            onClick={() => setShowFileModal(true)}
            className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Emoji Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-14 left-0 z-50">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  searchPlaceHolder="Search emoji..."
                  width={350}
                  height={400}
                />
              </div>
            )}
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={sending}
          />

          {/* Send Button */}
          <button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            {sending ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* File upload hint */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            <span>Press Enter to send • Shift + Enter for new line</span>
          </div>
          {soundEnabled && (
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              Sound on
            </span>
          )}
        </div>
      </div>

      {/* File Upload Modal */}
      {showFileModal && (
        <FileUploadModal
          onClose={() => setShowFileModal(false)}
          onImageUpload={handleImageUpload}
          onDocumentUpload={handleDocumentUpload}
          uploading={uploadingFile}
        />
      )}
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ 
  message, 
  onDelete, 
  onCopy 
}: { 
  message: Message; 
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (message.isSelf) {
    // Self message (right aligned)
    return (
      <div className="flex items-end justify-end gap-2 group">
        <div className="max-w-[70%]">
          {/* File preview */}
          {message.fileUrl && (
            <div className="mb-2">
              {message.fileType === 'image' ? (
                <img
                  src={message.fileUrl}
                  alt={message.fileName || 'Image'}
                  className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition shadow-md"
                  onClick={() => window.open(message.fileUrl!, '_blank')}
                />
              ) : (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 flex items-center gap-3">
                  <FileText className="w-10 h-10 text-purple-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{message.fileName}</p>
                    <p className="text-xs text-gray-600">{message.fileSize}</p>
                  </div>
                  <a
                    href={message.fileUrl}
                    download
                    className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <div className="bg-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-md">
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          )}

          {/* Timestamp and actions */}
          <div className="flex items-center justify-end gap-2 mt-1 px-1">
            <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
            <span title={message.isRead ? "Read" : "Sent"}>
              {message.isRead ? (
                <CheckCheck className="w-3 h-3 text-blue-500" />
              ) : (
                <Check className="w-3 h-3 text-gray-400" />
              )}
            </span>
            
            {/* Message menu */}
            <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <MoreVertical className="w-3 h-3 text-gray-600" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 bottom-6 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[120px]">
                  {message.content && (
                    <button
                      onClick={() => { onCopy(message.content); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                  )}
                  <button
                    onClick={() => { onDelete(message.id); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Others' message (left aligned)
  return (
    <div className="flex items-start gap-3 group">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
        {message.sender.avatar ? (
          <img
            src={message.sender.avatar}
            alt={message.sender.name || 'User'}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{message.sender.name?.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className="max-w-[70%]">
        {/* Sender name */}
        <p className="text-xs text-gray-600 mb-1 font-medium">{message.sender.name || 'Unknown'}</p>

        {/* File preview */}
        {message.fileUrl && (
          <div className="mb-2">
            {message.fileType === 'image' ? (
              <img
                src={message.fileUrl}
                alt={message.fileName || 'Image'}
                className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition shadow-md"
                onClick={() => window.open(message.fileUrl!, '_blank')}
              />
            ) : (
              <div className="bg-gray-100 border-2 border-gray-200 rounded-lg p-4 flex items-center gap-3">
                <FileText className="w-10 h-10 text-gray-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{message.fileName}</p>
                  <p className="text-xs text-gray-600">{message.fileSize}</p>
                </div>
                <a
                  href={message.fileUrl}
                  download
                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <div className="bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        )}

        {/* Timestamp and actions */}
        <div className="flex items-center gap-2 mt-1 px-1">
          <span className="text-xs text-gray-500">{formatTime(message.createdAt)}</span>
          
          {/* Message menu */}
          <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded transition"
            >
              <MoreVertical className="w-3 h-3 text-gray-600" />
            </button>
            
            {showMenu && (
              <div className="absolute left-0 bottom-6 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[120px]">
                {message.content && (
                  <button
                    onClick={() => { onCopy(message.content); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// File Upload Modal Component
function FileUploadModal({
  onClose,
  onImageUpload,
  onDocumentUpload,
  uploading,
}: {
  onClose: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Upload File</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={uploading}
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Image Upload */}
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition">
              <ImageIcon className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 mb-1">Upload Image</p>
              <p className="text-xs text-gray-600">PNG, JPG up to 8MB</p>
            </div>
          </label>

          {/* PDF Upload */}
          <label className="block">
            <input
              type="file"
              accept="application/pdf"
              onChange={onDocumentUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-pink-500 hover:bg-pink-50 transition">
              <FileText className="w-12 h-12 text-pink-600 mx-auto mb-3" />
              <p className="font-semibold text-gray-900 mb-1">Upload PDF</p>
              <p className="text-xs text-gray-600">PDF up to 16MB</p>
            </div>
          </label>
        </div>

        {uploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-purple-600">
            <Loader className="w-5 h-5 animate-spin" />
            <span className="font-medium">Uploading...</span>
          </div>
        )}
      </div>
    </div>
  );
}