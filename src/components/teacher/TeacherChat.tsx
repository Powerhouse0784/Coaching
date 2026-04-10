'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useUploadThing } from '@/lib/uploadthing';
import dynamic from 'next/dynamic';
import {
  Send, Paperclip, Smile, Image as ImageIcon, FileText,
  Download, Trash2, Check, CheckCheck, Loader, X,
  AlertCircle, Users, Search, MoreVertical,
  Copy, Edit2, Volume2, VolumeX, ChevronDown
} from 'lucide-react';

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
  updatedAt?: string;
  sender: { id: string; name: string | null; avatar: string | null };
  isSelf: boolean;
}

// ── Dark mode hook ────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dm;
}

export default function TeacherChat() {
  const { data: session }    = useSession();
  const dm                   = useDarkMode();
  const [messages, setMessages]         = useState<Message[]>([]);
  const [message, setMessage]           = useState('');
  const [loading, setLoading]           = useState(true);
  const [sending, setSending]           = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileModal, setShowFileModal]     = useState(false);
  const [uploadingFile, setUploadingFile]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [showSearch, setShowSearch]     = useState(false);
  const [isTyping, setIsTyping]         = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);

  // ── Edit state ──
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingEdit,     setSavingEdit]     = useState(false);

  const messagesEndRef       = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef             = useRef<HTMLInputElement>(null);
  const editInputRef         = useRef<HTMLInputElement>(null);
  const typingTimeoutRef     = useRef<NodeJS.Timeout | null>(null);

  // ── UploadThing ──
  const { startUpload: uploadImage } = useUploadThing('chatImage', {
    onClientUploadComplete: (res) => {
      if (res?.[0]) sendMessageWithFile(res[0].url, res[0].name, 'image', `${(res[0].size / 1024 / 1024).toFixed(2)} MB`);
      setUploadingFile(false); setShowFileModal(false);
    },
    onUploadError: (e: Error) => { alert(`Upload failed: ${e.message}`); setUploadingFile(false); },
  });

  const { startUpload: uploadDocument } = useUploadThing('chatDocument', {
    onClientUploadComplete: (res) => {
      if (res?.[0]) sendMessageWithFile(res[0].url, res[0].name, 'pdf', `${(res[0].size / 1024 / 1024).toFixed(2)} MB`);
      setUploadingFile(false); setShowFileModal(false);
    },
    onUploadError: (e: Error) => { alert(`Upload failed: ${e.message}`); setUploadingFile(false); },
  });

  // ── Fetch messages ──
  const fetchMessages = useCallback(async () => {
    try {
      const res  = await fetch('/api/teacher/chat?limit=100');
      const data = await res.json();
      if (!data.success) return;
      const next: Message[] = data.messages;
      setMessages(prev => {
        if (JSON.stringify(next) === JSON.stringify(prev)) return prev;
        if (next.length > prev.length && prev.length > 0) {
          const last = next[next.length - 1];
          if (!last.isSelf && soundEnabled) {
            const a = new Audio('/notification.mp3'); a.volume = 0.3; a.play().catch(() => {});
          }
        }
        const unread = next.filter((m) => !m.isSelf && !m.isRead).map((m) => m.id);
        if (unread.length) markAsRead(unread);
        return next;
      });
    } catch {}
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

  useEffect(() => {
    fetchMessages();
    const t = setInterval(fetchMessages, 3000);
    return () => clearInterval(t);
  }, [fetchMessages]);

  // Auto-scroll
  useEffect(() => { if (!userScrolled) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, userScrolled]);

  // Focus edit input when editing starts
  useEffect(() => { if (editingId) setTimeout(() => editInputRef.current?.focus(), 50); }, [editingId]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    setUserScrolled(scrollHeight - scrollTop - clientHeight > 100);
  };

  const markAsRead = async (ids: string[]) => {
    try {
      await fetch('/api/teacher/chat', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageIds: ids }),
      });
    } catch {}
  };

  // ── Send text ──
  const sendMessage = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const res  = await fetch('/api/teacher/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
      const data = await res.json();
      if (data.success) { setMessage(''); setMessages(p => [...p, data.message]); setUserScrolled(false); }
      else alert('Failed to send message');
    } catch { alert('An error occurred'); }
    finally { setSending(false); }
  };

  // ── Send with file ──
  const sendMessageWithFile = async (fileUrl: string, fileName: string, fileType: string, fileSize: string) => {
    try {
      const res  = await fetch('/api/teacher/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message || '', fileUrl, fileName, fileType, fileSize }),
      });
      const data = await res.json();
      if (data.success) { setMessage(''); setMessages(p => [...p, data.message]); setUserScrolled(false); }
    } catch { alert('Failed to send file'); }
  };

  // ── Delete ──
  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      const res  = await fetch(`/api/teacher/chat?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setMessages(p => p.filter(m => m.id !== id));
      else alert('Failed to delete message');
    } catch { alert('An error occurred'); }
  };

  // ── Edit ──
  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditingContent(msg.content);
  };

  const cancelEdit = () => { setEditingId(null); setEditingContent(''); };

  const saveEdit = async () => {
    if (!editingId || !editingContent.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const res  = await fetch('/api/teacher/chat', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: editingId, content: editingContent.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(p => p.map(m => m.id === editingId ? { ...m, content: editingContent.trim(), updatedAt: new Date().toISOString() } : m));
        cancelEdit();
      } else alert('Failed to update message');
    } catch { alert('An error occurred'); }
    finally { setSavingEdit(false); }
  };

  // ── Copy ──
  const copyMessage = (content: string) => { navigator.clipboard.writeText(content); };

  // ── File upload handlers ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert('Image must be less than 8MB'); return; }
    setUploadingFile(true); await uploadImage([file]);
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.type !== 'application/pdf') { alert('Only PDF files are allowed'); return; }
    if (file.size > 16 * 1024 * 1024)   { alert('PDF must be less than 16MB');  return; }
    setUploadingFile(true); await uploadDocument([file]);
  };

  const onEmojiClick = (emojiObject: any) => {
    setMessage(m => m + emojiObject.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const filteredMessages = searchQuery
    ? messages.filter(m =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // ── Loading ──
  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-[300px] sm:min-h-[400px] rounded-2xl ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className={`text-sm sm:text-base font-semibold ${dm ? 'text-gray-300' : 'text-gray-600'}`}>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col rounded-2xl overflow-hidden border-2 transition-colors ${
      dm ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
    }`} style={{ height: 'calc(100vh - 200px)', maxHeight: '800px', minHeight: '400px' }}>

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-3 sm:p-4 shadow-lg flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold truncate">Teacher Chat Room</h2>
              <p className="text-xs sm:text-sm text-purple-100 truncate">
                {filteredMessages.length} messages
                {isTyping && <span className="ml-1 sm:ml-2">• Typing...</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 sm:p-2 bg-white/20 rounded-lg hover:bg-white/30 transition" title="Search">
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 sm:p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
              title={soundEnabled ? 'Mute' : 'Unmute'}>
              {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="mt-2 sm:mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-9 sm:pl-10 pr-9 py-2 bg-white/20 text-white placeholder-purple-200 rounded-lg focus:ring-2 focus:ring-white/50 outline-none text-sm sm:text-base"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-200" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Messages container ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 relative"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Users className={`w-12 h-12 sm:w-16 sm:h-16 mb-4 ${dm ? 'text-gray-600' : 'text-gray-400'}`} />
            <h3 className={`text-base sm:text-lg font-semibold mb-2 ${dm ? 'text-gray-200' : 'text-gray-900'}`}>
              {searchQuery ? 'No messages found' : 'No messages yet'}
            </h3>
            <p className={`text-xs sm:text-sm ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              {searchQuery ? 'Try a different search term' : 'Be the first to start the conversation!'}
            </p>
          </div>
        ) : (
          filteredMessages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              darkMode={dm}
              editingId={editingId}
              editingContent={editingContent}
              editInputRef={editInputRef}
              savingEdit={savingEdit}
              onDelete={deleteMessage}
              onCopy={copyMessage}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
              onSaveEdit={saveEdit}
              onEditContentChange={setEditingContent}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Scroll to bottom ── */}
      {userScrolled && (
        <div className="absolute bottom-24 sm:bottom-28 right-4 sm:right-6 z-10">
          <button
            onClick={() => { setUserScrolled(false); messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
            className="relative p-3 sm:p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all"
            title="Jump to latest"
          >
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse border-2 border-white" />
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      )}

      {/* ── Input area ── */}
      <div className={`border-t-2 p-2.5 sm:p-4 flex-shrink-0 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* Attach */}
          <button onClick={() => setShowFileModal(true)}
            className={`p-2 sm:p-3 rounded-xl transition-colors flex-shrink-0 ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Attach file">
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Emoji */}
          <div className="relative flex-shrink-0">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2 sm:p-3 rounded-xl transition-colors ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title="Add emoji">
              <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-14 left-0 z-50">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  searchPlaceHolder="Search emoji..."
                  width={280}
                  height={350}
                />
              </div>
            )}
          </div>

          {/* Message input */}
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={e => { setMessage(e.target.value); handleTyping(); }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={sending}
            className={`flex-1 min-w-0 px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-sm sm:text-base ${
              dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'
            }`}
          />

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={!message.trim() || sending}
            className="p-2 sm:p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Send">
            {sending ? <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>

        {/* Hint */}
        <div className={`mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            <span>Enter to send</span>
          </div>
          {soundEnabled && (
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3" />Sound on
            </span>
          )}
        </div>
      </div>

      {/* File upload modal */}
      {showFileModal && (
        <FileUploadModal
          onClose={() => setShowFileModal(false)}
          onImageUpload={handleImageUpload}
          onDocumentUpload={handleDocumentUpload}
          uploading={uploadingFile}
          darkMode={dm}
        />
      )}
    </div>
  );
}

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({
  message, darkMode, editingId, editingContent, editInputRef, savingEdit,
  onDelete, onCopy, onStartEdit, onCancelEdit, onSaveEdit, onEditContentChange,
}: {
  message: Message;
  darkMode: boolean;
  editingId: string | null;
  editingContent: string;
  editInputRef: React.RefObject<HTMLInputElement>;
  savingEdit: boolean;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
  onStartEdit: (msg: Message) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditContentChange: (v: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const dm = darkMode;
  const isEditing = editingId === message.id;

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const wasEdited = message.updatedAt && message.updatedAt !== message.createdAt;

  // ── Edit input key handler ──
  const handleEditKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSaveEdit(); }
    if (e.key === 'Escape') onCancelEdit();
  };

  // ── File preview ──
  const FilePreview = ({ isSelf }: { isSelf: boolean }) => {
    if (!message.fileUrl) return null;
    if (message.fileType === 'image') {
      return (
        <div className="mb-2">
          <img
            src={message.fileUrl} alt={message.fileName || 'Image'}
            className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition shadow-md max-h-64 object-cover"
            onClick={() => window.open(message.fileUrl!, '_blank')}
          />
        </div>
      );
    }
    return (
      <div className={`mb-2 border-2 rounded-lg p-3 sm:p-4 flex items-center gap-2 sm:gap-3 ${isSelf ? 'bg-purple-50 border-purple-200' : dm ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
        <FileText className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 ${isSelf ? 'text-purple-600' : dm ? 'text-gray-300' : 'text-gray-600'}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-xs sm:text-sm truncate ${dm ? 'text-gray-100' : 'text-gray-900'}`}>{message.fileName}</p>
          <p className={`text-[10px] sm:text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{message.fileSize}</p>
        </div>
        <a href={message.fileUrl} download
          className={`p-1.5 sm:p-2 rounded-lg text-white transition flex-shrink-0 ${isSelf ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'}`}>
          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </a>
      </div>
    );
  };

  // ── Context menu ──
  const ContextMenu = ({ isSelf, alignRight }: { isSelf: boolean; alignRight: boolean }) => (
    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => setShowMenu(!showMenu)}
        className={`p-1 rounded transition ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
        <MoreVertical className={`w-3 h-3 ${dm ? 'text-gray-400' : 'text-gray-600'}`} />
      </button>
      {showMenu && (
        <div className={`absolute ${alignRight ? 'right-0' : 'left-0'} bottom-6 rounded-lg shadow-xl border py-1 z-20 min-w-[130px] sm:min-w-[140px] ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {message.content && (
            <button onClick={() => { onCopy(message.content); setShowMenu(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm transition ${dm ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
              <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Copy
            </button>
          )}
          {isSelf && message.content && (
            <button onClick={() => { onStartEdit(message); setShowMenu(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm transition ${dm ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'}`}>
              <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Edit
            </button>
          )}
          {isSelf && (
            <button onClick={() => { onDelete(message.id); setShowMenu(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-red-500 transition ${dm ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}>
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ── Self message ──
  if (message.isSelf) {
    return (
      <div className="flex items-end justify-end gap-1.5 sm:gap-2 group">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <FilePreview isSelf={true} />

          {/* Editing inline */}
          {isEditing ? (
            <div className={`rounded-2xl rounded-br-sm px-3 sm:px-4 py-2.5 sm:py-3 shadow-md border-2 ${dm ? 'bg-purple-900 border-purple-700' : 'bg-purple-50 border-purple-300'}`}>
              <input
                ref={editInputRef}
                type="text"
                value={editingContent}
                onChange={e => onEditContentChange(e.target.value)}
                onKeyDown={handleEditKey}
                disabled={savingEdit}
                className={`w-full bg-transparent outline-none text-sm sm:text-base ${dm ? 'text-white' : 'text-gray-900'}`}
                placeholder="Edit message..."
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button onClick={onCancelEdit} disabled={savingEdit}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition ${dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  Cancel
                </button>
                <button onClick={onSaveEdit} disabled={!editingContent.trim() || savingEdit}
                  className="px-2.5 sm:px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] sm:text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1">
                  {savingEdit ? <Loader className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" /> : <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                  Save
                </button>
              </div>
            </div>
          ) : message.content ? (
            <div className="bg-purple-600 text-white rounded-2xl rounded-br-sm px-3 sm:px-4 py-2.5 sm:py-3 shadow-md">
              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
              {wasEdited && <p className="text-[10px] sm:text-xs text-purple-200 mt-0.5 italic">edited</p>}
            </div>
          ) : null}

          {/* Timestamp row */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 mt-1 px-1">
            <span className={`text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{formatTime(message.createdAt)}</span>
            {message.isRead
              ? <CheckCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
              : <Check      className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />}
            {!isEditing && <ContextMenu isSelf={true} alignRight={true} />}
          </div>
        </div>
      </div>
    );
  }

  // ── Others' message ──
  return (
    <div className="flex items-start gap-2 sm:gap-3 group">
      {/* Avatar */}
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md overflow-hidden">
        {message.sender.avatar
          ? <img src={message.sender.avatar} alt="" className="w-full h-full object-cover" />
          : <span className="text-xs sm:text-sm">{message.sender.name?.charAt(0).toUpperCase()}</span>}
      </div>

      <div className="max-w-[80%] sm:max-w-[70%]">
        <p className={`text-[10px] sm:text-xs mb-1 font-medium ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{message.sender.name || 'Unknown'}</p>
        <FilePreview isSelf={false} />

        {message.content && (
          <div className={`rounded-2xl rounded-tl-sm px-3 sm:px-4 py-2.5 sm:py-3 shadow-md ${dm ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
            <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{message.content}</p>
            {wasEdited && <p className={`text-[10px] sm:text-xs mt-0.5 italic ${dm ? 'text-gray-400' : 'text-gray-500'}`}>edited</p>}
          </div>
        )}

        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 px-1">
          <span className={`text-[10px] sm:text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{formatTime(message.createdAt)}</span>
          <ContextMenu isSelf={false} alignRight={false} />
        </div>
      </div>
    </div>
  );
}

// ── File Upload Modal ──────────────────────────────────────────────────────────
function FileUploadModal({
  onClose, onImageUpload, onDocumentUpload, uploading, darkMode,
}: {
  onClose: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDocumentUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  darkMode: boolean;
}) {
  const dm = darkMode;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className={`rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-4 sm:p-6 shadow-2xl ${dm ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className={`text-lg sm:text-xl font-bold ${dm ? 'text-white' : 'text-gray-900'}`}>Upload File</h3>
          <button onClick={onClose} disabled={uploading}
            className={`p-2 rounded-lg transition ${dm ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" onChange={onImageUpload} disabled={uploading} className="hidden" />
            <div className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center hover:border-purple-500 transition ${dm ? 'border-gray-600 hover:bg-purple-900/20' : 'border-gray-300 hover:bg-purple-50'}`}>
              <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-purple-600 mx-auto mb-2 sm:mb-3" />
              <p className={`font-semibold text-sm sm:text-base mb-1 ${dm ? 'text-gray-200' : 'text-gray-900'}`}>Upload Image</p>
              <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>PNG, JPG up to 8MB</p>
            </div>
          </label>

          <label className="block cursor-pointer">
            <input type="file" accept="application/pdf" onChange={onDocumentUpload} disabled={uploading} className="hidden" />
            <div className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center hover:border-pink-500 transition ${dm ? 'border-gray-600 hover:bg-pink-900/20' : 'border-gray-300 hover:bg-pink-50'}`}>
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-pink-600 mx-auto mb-2 sm:mb-3" />
              <p className={`font-semibold text-sm sm:text-base mb-1 ${dm ? 'text-gray-200' : 'text-gray-900'}`}>Upload PDF</p>
              <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>PDF up to 16MB</p>
            </div>
          </label>
        </div>

        {uploading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-purple-500">
            <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            <span className={`font-medium text-sm sm:text-base ${dm ? 'text-purple-400' : 'text-purple-600'}`}>Uploading...</span>
          </div>
        )}
      </div>
    </div>
  );
}