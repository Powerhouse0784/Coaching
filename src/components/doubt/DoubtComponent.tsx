'use client';
import React, { useState, useCallback } from 'react';
import { MessageSquare, ThumbsUp, CheckCircle, Send, Sparkles, Clock, User, X } from 'lucide-react';

// Types
interface User {
  name: string;
  avatar: string | null;
  role?: 'STUDENT' | 'TEACHER' | 'AI';
}

interface Reply {
  id: number;
  content: string;
  user: User;
  isAccepted: boolean;
  createdAt: Date;
}

interface Doubt {
  id: number;
  title: string;
  description: string;
  student: User;
  upvotes: number;
  isSolved: boolean;
  createdAt: Date;
  replies: Reply[];
}

const DoubtsDiscussion: React.FC = () => {
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [showAskModal, setShowAskModal] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [aiSolving, setAiSolving] = useState<boolean>(false);
  const [doubts, setDoubts] = useState<Doubt[]>([
    {
      id: 1,
      title: "How does useState hook work internally?",
      description: "I'm confused about how React keeps track of state across re-renders. Can someone explain the internal mechanism?",
      student: { name: "John Doe", avatar: null },
      upvotes: 15,
      isSolved: false,
      createdAt: new Date('2024-01-15'),
      replies: [
        {
          id: 1,
          content: "React uses a queue system to manage state updates. When you call setState, it doesn't immediately update the state but schedules an update...",
          user: { name: "Teacher Sarah", avatar: null, role: "TEACHER" },
          isAccepted: false,
          createdAt: new Date('2024-01-15')
        },
        {
          id: 2,
          content: "Think of it like a closure. Each component instance has its own state that persists between renders through React's fiber architecture.",
          user: { name: "Alex Kumar", avatar: null, role: "STUDENT" },
          isAccepted: false,
          createdAt: new Date('2024-01-15')
        }
      ]
    },
    {
      id: 2,
      title: "Difference between useEffect and useLayoutEffect?",
      description: "When should I use useLayoutEffect instead of useEffect? Are there performance implications?",
      student: { name: "Jane Smith", avatar: null },
      upvotes: 8,
      isSolved: true,
      createdAt: new Date('2024-01-14'),
      replies: [
        {
          id: 3,
          content: "useEffect runs asynchronously after paint, while useLayoutEffect runs synchronously before paint. Use useLayoutEffect when you need to make DOM measurements or mutations that affect layout.",
          user: { name: "Teacher Mike", avatar: null, role: "TEACHER" },
          isAccepted: true,
          createdAt: new Date('2024-01-14')
        }
      ]
    },
    {
      id: 3,
      title: "Best practices for component composition?",
      description: "I'm building a complex form. Should I use one large component or split into smaller ones? What's the best approach?",
      student: { name: "Bob Wilson", avatar: null },
      upvotes: 12,
      isSolved: false,
      createdAt: new Date('2024-01-13'),
      replies: []
    }
  ]);

  const handleUpvote = useCallback((doubtId: number) => {
    setDoubts(prevDoubts => 
      prevDoubts.map(doubt => 
        doubt.id === doubtId ? { ...doubt, upvotes: doubt.upvotes + 1 } : doubt
      )
    );
  }, []);

  const handleReply = useCallback((doubtId: number) => {
    if (!replyText.trim()) return;
    
    const newReply: Reply = {
      id: Date.now(),
      content: replyText,
      user: { name: "You", avatar: null, role: "STUDENT" },
      isAccepted: false,
      createdAt: new Date()
    };

    setDoubts(prevDoubts => 
      prevDoubts.map(doubt => 
        doubt.id === doubtId 
          ? { ...doubt, replies: [...doubt.replies, newReply] }
          : doubt
      )
    );
    setReplyText('');
  }, [replyText]);

  const solveWithAI = useCallback(async (doubt: Doubt) => {
    setAiSolving(true);
    
    setTimeout(() => {
      const aiReply: Reply = {
        id: Date.now(),
        content: `Based on React documentation and best practices:\n\n${doubt.description}\n\nHere's a detailed explanation: React manages state through its reconciliation algorithm. When you update state, React creates a new virtual DOM tree and compares it with the previous one to determine what needs to be updated in the actual DOM. This process is called "diffing" and helps optimize performance.`,
        user: { name: "AI Assistant", avatar: null, role: "AI" },
        isAccepted: false,
        createdAt: new Date()
      };

      setDoubts(prevDoubts => 
        prevDoubts.map(d => 
          d.id === doubt.id 
            ? { ...d, replies: [...d.replies, aiReply] }
            : d
        )
      );
      setAiSolving(false);
    }, 2000);
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const seconds: number = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes: number = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours: number = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days: number = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Discussion Forum</h1>
              <p className="text-gray-600">Ask doubts and help others learn</p>
            </div>
            <button
              onClick={() => setShowAskModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
            >
              <MessageSquare size={20} />
              Ask a Doubt
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-4 mt-6 border-b">
            <button className="pb-3 px-1 border-b-2 border-blue-600 text-blue-600 font-medium">
              All Doubts
            </button>
            <button className="pb-3 px-1 text-gray-600 hover:text-gray-900">
              Unsolved
            </button>
            <button className="pb-3 px-1 text-gray-600 hover:text-gray-900">
              My Doubts
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doubts List */}
          <div className="lg:col-span-2 space-y-4">
            {doubts.map((doubt) => (
              <div
                key={doubt.id}
                onClick={() => setSelectedDoubt(doubt)}
                className={`bg-white rounded-xl shadow-sm p-6 cursor-pointer transition hover:shadow-md ${
                  selectedDoubt?.id === doubt.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {doubt.student.name.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{doubt.title}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span>{doubt.student.name}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {formatTimeAgo(doubt.createdAt)}
                          </span>
                        </div>
                      </div>
                      {doubt.isSolved && (
                        <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          <CheckCircle size={14} />
                          Solved
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                      {doubt.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpvote(doubt.id);
                        }}
                        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition"
                      >
                        <ThumbsUp size={16} />
                        <span>{doubt.upvotes}</span>
                      </button>
                      <span className="flex items-center gap-1 text-gray-600">
                        <MessageSquare size={16} />
                        {doubt.replies.length} replies
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Doubt Detail */}
          <div className="lg:col-span-1">
            {selectedDoubt ? (
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Replies</h3>
                  <button
                    onClick={() => solveWithAI(selectedDoubt)}
                    disabled={aiSolving}
                    className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm disabled:opacity-50"
                  >
                    <Sparkles size={14} />
                    {aiSolving ? 'Solving...' : 'Ask AI'}
                  </button>
                </div>

                {/* Replies */}
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {selectedDoubt.replies.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-8">
                      No replies yet. Be the first to help!
                    </p>
                  ) : (
                    selectedDoubt.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-4 rounded-lg ${
                          reply.isAccepted
                            ? 'bg-green-50 border-2 border-green-500'
                            : reply.user.role === 'AI'
                            ? 'bg-purple-50 border border-purple-200'
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                            reply.user.role === 'TEACHER' ? 'bg-blue-600' :
                            reply.user.role === 'AI' ? 'bg-purple-600' :
                            'bg-gray-600'
                          }`}>
                            {reply.user.role === 'AI' ? '🤖' : reply.user.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {reply.user.name}
                              </span>
                              {reply.user.role === 'TEACHER' && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                  Teacher
                                </span>
                              )}
                              {reply.isAccepted && (
                                <CheckCircle size={16} className="text-green-600" />
                              )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-line">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Input */}
                <div className="border-t pt-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your answer..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  />
                  <button
                    onClick={() => handleReply(selectedDoubt.id)}
                    disabled={!replyText.trim()}
                    className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                    Post Reply
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">
                  Select a doubt to view replies
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ask Doubt Modal */}
      {showAskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Ask a Doubt</h2>
              <button
                onClick={() => setShowAskModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Brief summary of your doubt..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Explain your doubt in detail..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAskModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowAskModal(false);
                    alert('Doubt posted successfully!');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Post Doubt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoubtsDiscussion;
