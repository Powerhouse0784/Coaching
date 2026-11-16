'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  Send, Loader, Trash2, Upload, X, FileText, Image as ImageIcon,
  Sparkles, MessageSquare, Brain, Zap, Download, Copy, Check,
  RotateCcw, AlertCircle, Info, Lightbulb, BookOpen, GraduationCap,
  RefreshCw, Paperclip, File, ChevronDown, Bot, User as UserIcon,
  Wand2, Code, ListChecks, PenTool, Calculator, Beaker, Globe,
  Languages, History, Music, Palette
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: string | null;
  createdAt: string;
  sender?: { name: string | null; avatar: string | null };
  isAI?: boolean;
}

// ── Dark mode hook ────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dm, setDm] = useState(false);
  useEffect(() => {
    const check = () => setDm(document.documentElement.classList.contains('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dm;
}

export default function AIAssistant() {
  const { data: session } = useSession();
  const dm = useDarkMode();

  const [messages,         setMessages]         = useState<Message[]>([]);
  const [inputMessage,     setInputMessage]     = useState('');
  const [loading,          setLoading]          = useState(false);
  const [uploading,        setUploading]        = useState(false);
  const [uploadedFile,     setUploadedFile]     = useState<{ url: string; name: string; type: string; size: string } | null>(null);
  const [copiedId,         setCopiedId]         = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  const { startUpload: uploadImage, isUploading: isUploadingImage } = useUploadThing('chatImage', {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setUploadedFile({ url: res[0].url, name: res[0].name, type: 'image', size: `${(res[0].size / 1024 / 1024).toFixed(2)} MB` });
        setUploading(false);
      }
    },
    onUploadError: (err: Error) => { alert(`Upload failed: ${err.message}`); setUploading(false); },
  });

  const { startUpload: uploadDocument, isUploading: isUploadingDocument } = useUploadThing('chatDocument', {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setUploadedFile({ url: res[0].url, name: res[0].name, type: 'pdf', size: `${(res[0].size / 1024 / 1024).toFixed(2)} MB` });
        setUploading(false);
      }
    },
    onUploadError: (err: Error) => { alert(`Upload failed: ${err.message}`); setUploading(false); },
  });

  const fetchMessages = async () => {
    try {
      const res  = await fetch('/api/teacher/ai-assistant');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages.map((msg: Message, i: number) => ({ ...msg, isAI: i % 2 === 1 })));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchMessages(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isPDF   = file.type === 'application/pdf';
    if (!isImage && !isPDF)              { alert('Please upload an image or PDF file'); return; }
    if (isImage && file.size > 8  * 1024 * 1024) { alert('Image size must be less than 8MB');  return; }
    if (isPDF   && file.size > 16 * 1024 * 1024) { alert('PDF size must be less than 16MB');   return; }
    setUploading(true);
    isImage ? await uploadImage([file]) : await uploadDocument([file]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !uploadedFile) return;
    setLoading(true);
    setShowQuickActions(false);
    try {
      const history = messages.map(m => ({ role: m.isAI ? 'assistant' : 'user', content: m.content }));
      const res  = await fetch('/api/teacher/ai-assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: inputMessage, fileUrl: uploadedFile?.url, fileName: uploadedFile?.name, fileType: uploadedFile?.type, fileSize: uploadedFile?.size, conversationHistory: history }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(p => [...p, { ...data.userMessage, isAI: false }, { ...data.aiMessage, isAI: true }]);
        setInputMessage('');
        setUploadedFile(null);
      } else alert('Failed to send message: ' + data.error);
    } catch { alert('An error occurred while sending the message'); }
    finally { setLoading(false); }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear all chat history?')) return;
    try {
      const data = await (await fetch('/api/teacher/ai-assistant', { method: 'DELETE' })).json();
      if (data.success) { setMessages([]); setShowQuickActions(true); }
    } catch { alert('Failed to clear chat history'); }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickActions = [
    { icon: PenTool,       label: 'Create Lesson Plan',  prompt: 'Create a detailed lesson plan for [subject] for [grade] students on the topic of [topic]',                   color: 'from-blue-500 to-cyan-500'    },
    { icon: ListChecks,    label: 'Generate Quiz',        prompt: 'Generate a 10-question multiple choice quiz on [topic] for [grade] level students',                           color: 'from-purple-500 to-pink-500'  },
    { icon: FileText,      label: 'Design Assignment',    prompt: 'Design a creative assignment on [topic] that encourages critical thinking for [grade] students',              color: 'from-green-500 to-emerald-500'},
    { icon: Lightbulb,     label: 'Teaching Strategy',   prompt: 'Suggest innovative teaching strategies to make [topic] more engaging for students',                            color: 'from-orange-500 to-red-500'   },
    { icon: Calculator,    label: 'Math Problem',         prompt: 'Create practice problems with solutions for [math topic] at [grade] level',                                   color: 'from-indigo-500 to-purple-500'},
    { icon: Beaker,        label: 'Science Experiment',  prompt: 'Suggest a safe, engaging science experiment to demonstrate [concept] for [grade] students',                   color: 'from-teal-500 to-cyan-500'    },
    { icon: Globe,         label: 'Explain Concept',     prompt: 'Explain [complex topic] in simple terms suitable for [grade] level students',                                 color: 'from-pink-500 to-rose-500'    },
    { icon: GraduationCap, label: 'Study Guide',          prompt: 'Create a comprehensive study guide for [topic] covering key concepts, definitions, and practice questions',   color: 'from-yellow-500 to-orange-500'},
  ];

  const isBusy = uploading || isUploadingImage || isUploadingDocument;

  return (
    <div className={`flex flex-col h-full rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transition-colors ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-blue-50'}`}>

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 sm:p-5 lg:p-6 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-13 sm:h-13 lg:w-14 lg:h-14 bg-white/20 backdrop-blur-lg rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Brain className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
                EduGenius AI
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 flex-shrink-0" />
              </h2>
              <p className="text-purple-100 text-xs sm:text-sm truncate">Your intelligent teaching assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button onClick={fetchMessages}
              className="p-2 sm:p-2.5 lg:p-3 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl transition-colors" title="Refresh">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
            <button onClick={handleClearChat}
              className="p-2 sm:p-2.5 lg:p-3 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl transition-colors" title="Clear Chat">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5 lg:space-y-6">
        {messages.length === 0 && showQuickActions ? (
          <div className="space-y-5 sm:space-y-6">
            {/* Welcome */}
            <div className="text-center py-5 sm:py-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl sm:rounded-3xl mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-lg">
                <Wand2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>
                Welcome to EduGenius AI! 👋
              </h3>
              <p className={`text-sm sm:text-base max-w-2xl mx-auto mb-6 sm:mb-8 px-4 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                I'm your intelligent teaching assistant, here to help you create amazing lessons, generate content, and enhance your teaching experience. Try one of these quick actions or ask me anything!
              </p>
            </div>

            {/* Quick action grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {quickActions.map((action, idx) => (
                <button key={idx} onClick={() => { setInputMessage(action.prompt); setShowQuickActions(false); }}
                  className={`group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-indigo-500 text-left overflow-hidden ${
                    dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
                  }`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${action.color} rounded-lg sm:rounded-xl mb-3 sm:mb-4 shadow-lg`}>
                    <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h4 className={`text-base sm:text-lg font-bold mb-1.5 sm:mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>{action.label}</h4>
                  <p className={`text-xs sm:text-sm line-clamp-2 ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{action.prompt}</p>
                </button>
              ))}
            </div>

            {/* Tips */}
            <div className={`border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 ${dm ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h4 className={`font-bold mb-1.5 sm:mb-2 text-sm sm:text-base ${dm ? 'text-white' : 'text-gray-900'}`}>Pro Tips:</h4>
                  <ul className="space-y-1.5 sm:space-y-2">
                    {[
                      'Upload images or PDFs for specific help with visual content',
                      'Be specific with grade level and subject for better results',
                      'Ask follow-up questions to refine content',
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className={`text-xs sm:text-sm ${dm ? 'text-blue-300' : 'text-gray-700'}`}>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex gap-2.5 sm:gap-3 lg:gap-4 ${message.isAI ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                message.isAI ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}>
                {message.isAI
                  ? <Bot className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                  : <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />}
              </div>

              {/* Bubble */}
              <div className={`flex-1 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-lg ${
                message.isAI
                  ? dm ? 'bg-gray-800' : 'bg-white'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-600'
              } max-w-[85%] sm:max-w-[80%] lg:max-w-3xl`}
                style={{ alignSelf: message.isAI ? 'flex-start' : 'flex-end' }}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                  <span className={`font-semibold text-xs sm:text-sm ${message.isAI ? (dm ? 'text-white' : 'text-gray-900') : 'text-white'}`}>
                    {message.isAI ? 'EduGenius AI' : 'You'}
                  </span>
                  <span className={`text-xs flex-shrink-0 ${message.isAI ? (dm ? 'text-gray-500' : 'text-gray-500') : 'text-blue-100'}`}>
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Attachment preview */}
                {message.fileUrl && (
                  <div className={`mb-3 p-3 rounded-xl flex items-center gap-2 sm:gap-3 ${
                    message.isAI ? (dm ? 'bg-gray-700' : 'bg-gray-50') : 'bg-blue-700'
                  }`}>
                    {message.fileType === 'image'
                      ? <ImageIcon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${message.isAI ? (dm ? 'text-gray-300' : 'text-gray-600') : 'text-blue-200'}`} />
                      : <FileText  className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${message.isAI ? (dm ? 'text-gray-300' : 'text-gray-600') : 'text-blue-200'}`} />}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm font-medium truncate ${message.isAI ? (dm ? 'text-white' : 'text-gray-900') : 'text-white'}`}>{message.fileName}</p>
                      <p className={`text-xs ${message.isAI ? (dm ? 'text-gray-400' : 'text-gray-500') : 'text-blue-200'}`}>{message.fileSize}</p>
                    </div>
                    <a href={message.fileUrl} target="_blank" rel="noopener noreferrer"
                      className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${
                        message.isAI ? (dm ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-100') : 'bg-blue-600 hover:bg-blue-500'
                      }`}>
                      <Download className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${message.isAI ? (dm ? 'text-gray-200' : 'text-gray-600') : 'text-white'}`} />
                    </a>
                  </div>
                )}

                <div className={`whitespace-pre-wrap text-xs sm:text-sm leading-relaxed ${
                  message.isAI ? (dm ? 'text-gray-300' : 'text-gray-700') : 'text-white'
                }`}>
                  {message.content}
                </div>

                {message.isAI && (
                  <div className={`flex items-center gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t ${dm ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button onClick={() => handleCopy(message.content, message.id)}
                      className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${
                        dm ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}>
                      {copiedId === message.id
                        ? <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />Copied!</>
                        : <><Copy  className="w-3.5 h-3.5 sm:w-4 sm:h-4" />Copy</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Thinking indicator */}
        {loading && (
          <div className="flex gap-2.5 sm:gap-3 lg:gap-4">
            <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className={`rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-lg ${dm ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center gap-2 sm:gap-3">
                <Loader className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 animate-spin" />
                <span className={`font-medium text-xs sm:text-sm ${dm ? 'text-gray-300' : 'text-gray-700'}`}>EduGenius is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div className={`border-t-2 p-3 sm:p-4 lg:p-6 flex-shrink-0 ${dm ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>

        {/* Uploaded file preview */}
        {uploadedFile && (
          <div className={`mb-3 p-3 sm:p-4 border-2 rounded-xl flex items-center gap-2 sm:gap-3 ${dm ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
            {uploadedFile.type === 'image'
              ? <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
              : <FileText  className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className={`text-xs sm:text-sm font-semibold truncate ${dm ? 'text-white' : 'text-gray-900'}`}>{uploadedFile.name}</p>
              <p className={`text-xs ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{uploadedFile.size}</p>
            </div>
            <button onClick={() => setUploadedFile(null)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0 ${dm ? 'hover:bg-blue-800/50 text-gray-400' : 'hover:bg-blue-100 text-gray-600'}`}>
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 sm:gap-3">
          {/* Attach */}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={isBusy || loading}
            className={`p-2.5 sm:p-3 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0 ${
              dm ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}>
            {isBusy
              ? <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              : <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Textarea */}
          <textarea
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder="Ask me anything about teaching, lesson planning, content creation..."
            rows={2}
            disabled={loading}
            className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-xs sm:text-sm disabled:opacity-50 ${
              dm ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'
            }`}
          />

          {/* Send */}
          <button onClick={handleSendMessage}
            disabled={loading || (!inputMessage.trim() && !uploadedFile)}
            className="p-2.5 sm:p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg hover:shadow-xl flex-shrink-0">
            {loading
              ? <Loader className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
              : <Send   className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
          </button>
        </div>

        <p className={`text-xs mt-2 sm:mt-3 text-center ${dm ? 'text-gray-500' : 'text-gray-500'}`}>
          Press Enter to send · Shift+Enter for new line · Supports images (8MB) &amp; PDFs (16MB)
        </p>
      </div>
    </div>
  );
}