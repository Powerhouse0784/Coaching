'use client';

import React, { useState } from 'react';
import {
  Video, Users, Mic, MicOff, VideoOff, MonitorUp, MessageSquare,
  Settings, PhoneOff, MoreVertical, Grid3x3, LayoutList, Hand,
  Share2, Download, Circle, Square, AlertCircle, CheckCircle,
  Clock, TrendingUp, Eye, Volume2, VolumeX
} from 'lucide-react';

export default function LiveClassManager() {
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'speaker'>('grid');
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [messages, setMessages] = useState([
    { id: 1, user: 'Rahul S.', message: 'Good morning sir!', time: '10:00 AM' },
    { id: 2, user: 'Priya P.', message: 'Can you please repeat that?', time: '10:05 AM' },
    { id: 3, user: 'Amit K.', message: 'Thank you for the explanation', time: '10:10 AM' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([
    { id: 1, name: 'Rahul Sharma', status: 'active', handRaised: false, audio: true, video: true },
    { id: 2, name: 'Priya Patel', status: 'active', handRaised: true, audio: true, video: false },
    { id: 3, name: 'Amit Kumar', status: 'active', handRaised: false, audio: false, video: true },
    { id: 4, name: 'Sneha Gupta', status: 'active', handRaised: false, audio: true, video: true },
    { id: 5, name: 'Rohan Singh', status: 'idle', handRaised: false, audio: true, video: true },
  ]);

  const liveStats = [
    { label: 'Viewers', value: '87', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Duration', value: '45:32', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Engagement', value: '92%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  ];

  const startLiveClass = () => {
    setIsLive(true);
  };

  const endLiveClass = () => {
    if (confirm('Are you sure you want to end this live class?')) {
      setIsLive(false);
      setIsScreenSharing(false);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        user: 'You (Teacher)',
        message: newMessage,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };

  if (!isLive) {
    return (
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Live Class Manager</h2>
          <p className="text-gray-600">Start and manage live video sessions with your students</p>
        </div>

        {/* Pre-Live Setup */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div>
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl aspect-video flex items-center justify-center relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20"></div>
              <div className="relative text-center">
                <Video className="w-16 h-16 text-white mx-auto mb-4" />
                <p className="text-white text-lg font-semibold">Camera Preview</p>
                <p className="text-gray-300 text-sm">Your video will appear here</p>
              </div>
              
              {/* Preview Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
                  } backdrop-blur-lg`}
                >
                  {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                </button>
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
                  } backdrop-blur-lg`}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>

            {/* Device Settings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                Device Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Camera</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Built-in Camera (Default)</option>
                    <option>External Webcam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Microphone</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Built-in Microphone (Default)</option>
                    <option>External Microphone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Speaker</label>
                  <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <option>Built-in Speakers (Default)</option>
                    <option>Headphones</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Class Info */}
          <div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-200">
              <h3 className="font-bold text-gray-900 text-xl mb-4">Ready to Go Live?</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>HD Video & Audio Ready</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Screen Sharing Available</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Interactive Whiteboard</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Live Chat & Q&A</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Recording Available</span>
                </div>
              </div>

              <button
                onClick={startLiveClass}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Circle className="w-5 h-5 fill-current" />
                Start Live Class
              </button>
            </div>

            {/* Quick Tips */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Quick Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Ensure good lighting and stable internet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Test audio and video before starting</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Keep chat open for student questions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Use screen share for presentations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="mt-8">
          <h3 className="font-bold text-gray-900 text-xl mb-4">Upcoming Classes</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { subject: 'Physics', topic: 'Wave Optics', time: 'Today, 10:00 AM', students: 95 },
              { subject: 'Chemistry', topic: 'Organic Reactions', time: 'Today, 2:00 PM', students: 87 },
              { subject: 'Mathematics', topic: 'Integration', time: 'Tomorrow, 10:00 AM', students: 103 },
            ].map((cls, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <h4 className="font-bold text-gray-900 mb-2">{cls.subject}</h4>
                <p className="text-gray-600 text-sm mb-3">{cls.topic}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{cls.time}</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {cls.students}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Live Class View
  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Top Bar */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-semibold">LIVE</span>
          </div>
          <div className="flex items-center gap-6">
            {liveStats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className="text-sm text-white font-semibold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setViewMode(viewMode === 'grid' ? 'speaker' : 'grid')}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
          >
            {viewMode === 'grid' ? <LayoutList className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
            <span className="text-sm">{viewMode === 'grid' ? 'Speaker' : 'Grid'} View</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl h-full flex items-center justify-center relative">
            <div className="text-center">
              <Video className="w-20 h-20 text-white mx-auto mb-4 opacity-50" />
              <p className="text-white text-xl font-semibold">Your Video Stream</p>
              <p className="text-gray-400">Students are watching...</p>
            </div>

            {/* Floating Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-800/90 backdrop-blur-lg px-6 py-4 rounded-full">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
              </button>
              
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
              </button>

              <button
                onClick={() => setIsScreenSharing(!isScreenSharing)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isScreenSharing ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <MonitorUp className="w-5 h-5 text-white" />
              </button>

              <button className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-all">
                <Share2 className="w-5 h-5 text-white" />
              </button>

              <button 
                onClick={endLiveClass}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all ml-2"
              >
                <PhoneOff className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setShowChat(true)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                showChat ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              Chat
            </button>
            <button
              onClick={() => setShowChat(false)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                !showChat ? 'text-white bg-gray-700' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Participants ({participants.length})
            </button>
          </div>

          {/* Content */}
          {showChat ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">{msg.user}</span>
                      <span className="text-xs text-gray-400">{msg.time}</span>
                    </div>
                    <p className="text-sm text-gray-300">{msg.message}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{participant.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{participant.name}</p>
                      <p className="text-xs text-gray-400">{participant.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {participant.handRaised && (
                      <Hand className="w-4 h-4 text-yellow-500" />
                    )}
                    {participant.audio ? (
                      <Volume2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-red-500" />
                    )}
                    {participant.video ? (
                      <Video className="w-4 h-4 text-green-500" />
                    ) : (
                      <VideoOff className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}