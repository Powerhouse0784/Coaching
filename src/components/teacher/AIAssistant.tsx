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
  sender?: {
    name: string | null;
    avatar: string | null;
  };
  isAI?: boolean;
}

export default function AIAssistant() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    url: string;
    name: string;
    type: string;
    size: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload: uploadImage, isUploading: isUploadingImage } = useUploadThing('chatImage', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        setUploadedFile({
          url: res[0].url,
          name: res[0].name,
          type: 'image',
          size: `${(res[0].size / 1024 / 1024).toFixed(2)} MB`,
        });
        setUploading(false);
      }
    },
    onUploadError: (error: Error) => {
      alert(`Upload failed: ${error.message}`);
      setUploading(false);
    },
  });

  const { startUpload: uploadDocument, isUploading: isUploadingDocument } = useUploadThing(
    'chatDocument',
    {
      onClientUploadComplete: (res) => {
        if (res && res[0]) {
          setUploadedFile({
            url: res[0].url,
            name: res[0].name,
            type: 'pdf',
            size: `${(res[0].size / 1024 / 1024).toFixed(2)} MB`,
          });
          setUploading(false);
        }
      },
      onUploadError: (error: Error) => {
        alert(`Upload failed: ${error.message}`);
        setUploading(false);
      },
    }
  );

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/teacher/ai-assistant');
      const data = await response.json();

      if (data.success) {
        const transformedMessages = data.messages.map((msg: Message, index: number) => ({
          ...msg,
          isAI: index % 2 === 1,
        }));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';

    if (!isImage && !isPDF) {
      alert('Please upload an image or PDF file');
      return;
    }

    if (isImage && file.size > 8 * 1024 * 1024) {
      alert('Image size must be less than 8MB');
      return;
    }

    if (isPDF && file.size > 16 * 1024 * 1024) {
      alert('PDF size must be less than 16MB');
      return;
    }

    setUploading(true);

    if (isImage) {
      await uploadImage([file]);
    } else {
      await uploadDocument([file]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !uploadedFile) return;

    setLoading(true);
    setShowQuickActions(false);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.isAI ? 'assistant' : 'user',
        content: msg.content,
      }));

      const response = await fetch('/api/teacher/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputMessage,
          fileUrl: uploadedFile?.url,
          fileName: uploadedFile?.name,
          fileType: uploadedFile?.type,
          fileSize: uploadedFile?.size,
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          { ...data.userMessage, isAI: false },
          { ...data.aiMessage, isAI: true },
        ]);
        setInputMessage('');
        setUploadedFile(null);
      } else {
        alert('Failed to send message: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while sending the message');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear all chat history?')) return;

    try {
      const response = await fetch('/api/teacher/ai-assistant', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessages([]);
        setShowQuickActions(true);
        alert('Chat history cleared successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to clear chat history');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
    setShowQuickActions(false);
  };

  const quickActions = [
    {
      icon: PenTool,
      label: 'Create Lesson Plan',
      prompt: 'Create a detailed lesson plan for [subject] for [grade] students on the topic of [topic]',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: ListChecks,
      label: 'Generate Quiz',
      prompt: 'Generate a 10-question multiple choice quiz on [topic] for [grade] level students',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: FileText,
      label: 'Design Assignment',
      prompt: 'Design a creative assignment on [topic] that encourages critical thinking for [grade] students',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Lightbulb,
      label: 'Teaching Strategy',
      prompt: 'Suggest innovative teaching strategies to make [topic] more engaging for students',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: Calculator,
      label: 'Math Problem',
      prompt: 'Create practice problems with solutions for [math topic] at [grade] level',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Beaker,
      label: 'Science Experiment',
      prompt: 'Suggest a safe, engaging science experiment to demonstrate [concept] for [grade] students',
      color: 'from-teal-500 to-cyan-500',
    },
    {
      icon: Globe,
      label: 'Explain Concept',
      prompt: 'Explain [complex topic] in simple terms suitable for [grade] level students',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: GraduationCap,
      label: 'Study Guide',
      prompt: 'Create a comprehensive study guide for [topic] covering key concepts, definitions, and practice questions',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                EduGenius AI
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </h2>
              <p className="text-purple-100 text-sm">Your intelligent teaching assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchMessages}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleClearChat}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && showQuickActions ? (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Wand2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to EduGenius AI! 👋
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                I'm your intelligent teaching assistant, here to help you create amazing lessons, generate content, and enhance your teaching experience. Try one of these quick actions or ask me anything!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.prompt)}
                  className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-100 hover:border-indigo-500 text-left overflow-hidden"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                  />
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl mb-4 shadow-lg`}
                  >
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{action.label}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{action.prompt}</p>
                </button>
              ))}
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Info className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Pro Tips:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Upload images or PDFs for specific help with visual content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Be specific with grade level and subject for better results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Ask follow-up questions to refine content</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.isAI ? 'flex-row' : 'flex-row-reverse'}`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                  message.isAI
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }`}
              >
                {message.isAI ? (
                  <Bot className="w-6 h-6 text-white" />
                ) : (
                  <UserIcon className="w-6 h-6 text-white" />
                )}
              </div>

              <div
                className={`flex-1 ${
                  message.isAI ? 'bg-white' : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                } rounded-2xl p-5 shadow-lg max-w-3xl`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`font-semibold ${message.isAI ? 'text-gray-900' : 'text-white'}`}
                  >
                    {message.isAI ? 'EduGenius AI' : 'You'}
                  </span>
                  <span
                    className={`text-xs ${message.isAI ? 'text-gray-500' : 'text-blue-100'}`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {message.fileUrl && (
                  <div
                    className={`mb-4 p-4 ${
                      message.isAI ? 'bg-gray-50' : 'bg-blue-700'
                    } rounded-xl flex items-center gap-3`}
                  >
                    {message.fileType === 'image' ? (
                      <ImageIcon
                        className={`w-5 h-5 ${message.isAI ? 'text-gray-600' : 'text-blue-200'}`}
                      />
                    ) : (
                      <FileText
                        className={`w-5 h-5 ${message.isAI ? 'text-gray-600' : 'text-blue-200'}`}
                      />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          message.isAI ? 'text-gray-900' : 'text-white'
                        }`}
                      >
                        {message.fileName}
                      </p>
                      <p
                        className={`text-xs ${message.isAI ? 'text-gray-500' : 'text-blue-200'}`}
                      >
                        {message.fileSize}
                      </p>
                    </div>
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2 ${
                        message.isAI
                          ? 'bg-white hover:bg-gray-100'
                          : 'bg-blue-600 hover:bg-blue-500'
                      } rounded-lg transition-colors`}
                    >
                      <Download
                        className={`w-4 h-4 ${message.isAI ? 'text-gray-600' : 'text-white'}`}
                      />
                    </a>
                  </div>
                )}

                <div
                  className={`prose prose-sm max-w-none ${
                    message.isAI ? 'prose-gray' : 'prose-invert'
                  }`}
                >
                  <div
                    className={`whitespace-pre-wrap ${
                      message.isAI ? 'text-gray-700' : 'text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>

                {message.isAI && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleCopy(message.content, message.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 bg-white rounded-2xl p-5 shadow-lg max-w-3xl">
              <div className="flex items-center gap-3">
                <Loader className="w-5 h-5 text-indigo-600 animate-spin" />
                <span className="text-gray-700 font-medium">EduGenius is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t-2 border-gray-200 p-6">
        {uploadedFile && (
          <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl flex items-center gap-3">
            {uploadedFile.type === 'image' ? (
              <ImageIcon className="w-6 h-6 text-blue-600" />
            ) : (
              <FileText className="w-6 h-6 text-blue-600" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{uploadedFile.name}</p>
              <p className="text-xs text-gray-600">{uploadedFile.size}</p>
            </div>
            <button
              onClick={() => setUploadedFile(null)}
              className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {uploading || isUploadingImage || isUploadingDocument ? (
              <Loader className="w-6 h-6 text-gray-600 animate-spin" />
            ) : (
              <Paperclip className="w-6 h-6 text-gray-600" />
            )}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask me anything about teaching, lesson planning, content creation..."
              rows={3}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={loading || (!inputMessage.trim() && !uploadedFile)}
            className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <Loader className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Send className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Press Enter to send • Shift+Enter for new line • Supports images (8MB) & PDFs (16MB)
        </p>
      </div>
    </div>
  );
}
