'use client';

import React, { useState } from 'react';
import { MessageSquare, Search, Filter, Send, CheckCircle, Clock, AlertCircle, Flag, Star } from 'lucide-react';

export default function DoubtManager() {
  const [selectedDoubt, setSelectedDoubt] = useState<any>(null);
  const [reply, setReply] = useState('');

  const doubts = [
    { id: 1, student: 'Rahul Sharma', subject: 'Physics', question: 'Can you explain the concept of wave-particle duality?', time: '2 hours ago', status: 'pending', priority: 'high', avatar: 'RS' },
    { id: 2, student: 'Priya Patel', subject: 'Chemistry', question: 'What is the mechanism of SN2 reaction?', time: '5 hours ago', status: 'pending', priority: 'medium', avatar: 'PP' },
    { id: 3, student: 'Amit Kumar', subject: 'Mathematics', question: 'How to solve integration by parts?', time: '1 day ago', status: 'resolved', priority: 'low', avatar: 'AK' },
  ];

  const stats = [
    { label: 'Pending', value: '23', icon: Clock, color: 'orange' },
    { label: 'Resolved Today', value: '15', icon: CheckCircle, color: 'green' },
    { label: 'High Priority', value: '8', icon: AlertCircle, color: 'red' },
    { label: 'Avg Response', value: '2.5 hrs', icon: MessageSquare, color: 'blue' },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Doubts & Q&A</h2>
          <p className="text-gray-600">Answer student questions and provide guidance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className={`w-12 h-12 bg-${stat.color}-100 rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Doubts List */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search doubts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {doubts.map((doubt) => (
            <div
              key={doubt.id}
              onClick={() => setSelectedDoubt(doubt)}
              className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedDoubt?.id === doubt.id ? 'border-pink-500' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">{doubt.avatar}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{doubt.student}</h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{doubt.subject}</span>
                    {doubt.priority === 'high' && <Flag className="w-4 h-4 text-red-500" />}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{doubt.question}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{doubt.time}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold ${
                      doubt.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {doubt.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-4">
          {selectedDoubt ? (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{selectedDoubt.avatar}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedDoubt.student}</h3>
                    <p className="text-sm text-gray-600">{selectedDoubt.subject} • {selectedDoubt.time}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-900">{selectedDoubt.question}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={6}
                  placeholder="Type your answer here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2">
                  <Send className="w-5 h-5" />
                  Send Response
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">
                  Mark Resolved
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a doubt to respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}