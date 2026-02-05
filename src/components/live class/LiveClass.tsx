'use client';
import React, { useState, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Monitor, MessageSquare, Users, PhoneOff, Hand, Settings } from 'lucide-react';

const LiveClassRoom = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'Teacher', message: 'Welcome to the class!', time: '10:00 AM', isTeacher: true },
    { id: 2, user: 'Student 1', message: 'Thank you!', time: '10:01 AM', isTeacher: false }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState([
    { id: 1, name: 'Teacher (You)', isTeacher: true, isMuted: false, isVideoOff: false },
    { id: 2, name: 'Student 1', isTeacher: false, isMuted: false, isVideoOff: false },
    { id: 3, name: 'Student 2', isTeacher: false, isMuted: true, isVideoOff: false },
    { id: 4, name: 'Student 3', isTeacher: false, isMuted: false, isVideoOff: true }
  ]);

  const [classInfo] = useState({
    title: 'React Hooks Deep Dive',
    batch: 'Batch A',
    startTime: '10:00 AM',
    duration: '90 min'
  });

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleVideo = () => setIsVideoOff(!isVideoOff);
  const toggleScreenShare = () => setIsScreenSharing(!isScreenSharing);
  const toggleHandRaise = () => setHandRaised(!handRaised);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: chatMessages.length + 1,
      user: 'You',
      message: newMessage,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isTeacher: false
    };
    
    setChatMessages([...chatMessages, message]);
    setNewMessage('');
  };

  const endClass = () => {
    if (confirm('Are you sure you want to end the class?')) {
      window.location.href = '/teacher';
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{classInfo.title}</h1>
            <p className="text-sm text-gray-400">{classInfo.batch} • Started at {classInfo.startTime}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500 rounded-lg">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <span className="text-red-400 text-sm font-semibold">LIVE</span>
            </div>
            <div className="text-white text-sm">
              {participants.length} participants
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <div className="h-full grid grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Main Screen/Teacher Video */}
            <div className="col-span-2 lg:col-span-2 bg-gray-800 rounded-xl overflow-hidden relative">
              {isScreenSharing ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <Monitor className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Screen sharing active</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
                  {isVideoOff ? (
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl font-bold text-white">T</span>
                      </div>
                      <p className="text-white">Teacher</p>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Video className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                </div>
              )}
              
              {/* Video Label */}
              <div className="absolute bottom-4 left-4 px-3 py-2 bg-black/60 backdrop-blur-sm rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium">Teacher (You)</span>
                  {isMuted && <MicOff size={14} className="text-red-500" />}
                </div>
              </div>
            </div>

            {/* Participant Thumbnails */}
            <div className="space-y-4 overflow-y-auto custom-scrollbar">
              {participants.slice(1).map((participant) => (
                <div key={participant.id} className="bg-gray-800 rounded-xl aspect-video relative overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                    {participant.isVideoOff ? (
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mx-auto">
                          <span className="text-lg font-bold text-white">
                            {participant.name.charAt(0)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Video className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white flex items-center gap-1">
                    {participant.name}
                    {participant.isMuted && <MicOff size={12} className="text-red-500" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Chat & Participants */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="flex border-b border-gray-700">
              <button className="flex-1 px-4 py-3 text-white border-b-2 border-blue-500 bg-gray-700/50">
                Chat
              </button>
              <button className="flex-1 px-4 py-3 text-gray-400 hover:text-white">
                Participants ({participants.length})
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`${msg.isTeacher ? 'bg-blue-500/20' : 'bg-gray-700'} rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-semibold ${msg.isTeacher ? 'text-blue-400' : 'text-gray-300'}`}>
                      {msg.user}
                    </span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <p className="text-white text-sm">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mute */}
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isMuted ? <MicOff className="text-white" size={20} /> : <Mic className="text-white" size={20} />}
            </button>

            {/* Video */}
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition ${
                isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isVideoOff ? <VideoOff className="text-white" size={20} /> : <Video className="text-white" size={20} />}
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition ${
                isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Monitor className="text-white" size={20} />
            </button>

            {/* Raise Hand */}
            <button
              onClick={toggleHandRaise}
              className={`p-4 rounded-full transition ${
                handRaised ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Hand className="text-white" size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Chat Toggle */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition"
            >
              <MessageSquare className="text-white" size={20} />
            </button>

            {/* Participants */}
            <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition">
              <Users className="text-white" size={20} />
            </button>

            {/* Settings */}
            <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition">
              <Settings className="text-white" size={20} />
            </button>

            {/* End Call */}
            <button
              onClick={endClass}
              className="px-6 py-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition font-semibold flex items-center gap-2"
            >
              <PhoneOff size={20} />
              End Class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveClassRoom;