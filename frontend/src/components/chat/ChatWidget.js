import React, { useState, useEffect, useRef } from 'react';

const CHAT_API_BASE_URL = process.env.REACT_APP_CHAT_API_URL || 'http://localhost:8000';
const CHAT_WS_BASE_URL = process.env.REACT_APP_CHAT_WS_URL || 'ws://localhost:8000';
const USERS_API_BASE_URL = process.env.REACT_APP_AUTH_URL || '/api/auth';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [loadError, setLoadError] = useState('');
  
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  // Cuộn xuống cuối
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Tải danh sách user
  useEffect(() => {
    if (isOpen && users.length === 0 && !isLoadingUsers) {
      setIsLoadingUsers(true);
      setLoadError('');
      fetch(`${USERS_API_BASE_URL}/users`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Chat users API unavailable');
          }
          return res.json();
        })
        .then(data => {
          const normalized = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          setUsers(normalized);
          if (normalized.length > 0) {
            setCurrentUser(normalized[0]);
            setSelectedUser(normalized.length > 1 ? normalized[1] : normalized[0]);
          } else {
            setCurrentUser(null);
            setSelectedUser(null);
            setLoadError('Chat tạm thời không khả dụng.');
          }
          setIsLoadingUsers(false);
        })
        .catch(err => {
          console.error("Lỗi tải users:", err);
          setUsers([]);
          setCurrentUser(null);
          setSelectedUser(null);
          setLoadError('Chat tạm thời không khả dụng.');
          setIsLoadingUsers(false);
        });
    }
  }, [isOpen, users.length, isLoadingUsers]);

  // Lấy lịch sử chat
  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    const fetchHistory = async () => {
      try {
        const response = await fetch(`${CHAT_API_BASE_URL}/api/v1/chat/history/${currentUser.id}/${selectedUser.id}`);
        if (response.ok) {
          const history = await response.json();
          setMessages(history);
        } else {
          console.error("Lỗi lấy lịch sử chat");
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử chat:", error);
      }
    };

    fetchHistory();
  }, [currentUser, selectedUser]);

  // Kết nối WebSocket với isMounted để tránh lỗi closure
  useEffect(() => {
    if (!currentUser) return;
    
    let isMounted = true;
    let reconnectTimeout;

    const connectWs = () => {
      if (!isMounted) return;
      const url = `${CHAT_WS_BASE_URL}/api/v1/chat/ws/${currentUser.id}`;
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        if (isMounted) setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev, { ...data, timestamp: new Date().toISOString() }]);
        } catch (e) {
          console.error("Lỗi phân tích tin nhắn", e);
        }
      };

      ws.current.onclose = () => {
        if (isMounted) {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        }
      };
    };

    connectWs();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [currentUser]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (ws.current && isConnected && selectedUser && inputValue.trim()) {
      const messagePayload = {
        receiver_id: String(selectedUser.id),
        content: inputValue.trim(),
      };
      ws.current.send(JSON.stringify(messagePayload));
      
      setMessages(prev => [
        ...prev,
        {
          sender_id: currentUser.id,
          receiver_id: selectedUser.id,
          content: inputValue.trim(),
          timestamp: new Date().toISOString()
        }
      ]);
      setInputValue('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const activeMessages = messages.filter(
    (msg) =>
      (String(msg.sender_id) === String(currentUser?.id) && String(msg.receiver_id) === String(selectedUser?.id)) ||
      (String(msg.sender_id) === String(selectedUser?.id) && String(msg.receiver_id) === String(currentUser?.id))
  );

  const canChat = Boolean(currentUser && selectedUser && !loadError);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Khung chat popup */}
      <div 
        className={`absolute bottom-20 right-0 w-80 md:w-96 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 transition-all duration-300 ease-in-out origin-bottom-right ${isOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'}`}
        style={{ height: '520px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg backdrop-blur-sm shadow-inner">
              {selectedUser ? selectedUser.username.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <h3 className="font-semibold m-0 leading-tight">
                {selectedUser ? selectedUser.username : 'Hỗ trợ'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-blue-100">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`}></span>
                {isConnected ? 'Trực tuyến' : 'Đang kết nối...'}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Demo Selectors */}
        <div className="bg-blue-50/50 p-3 border-b border-blue-100 flex flex-col gap-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-medium text-blue-800">Tôi là:</span>
            <select 
              className="bg-white border border-blue-200 rounded px-2 py-1 outline-none text-gray-700 w-32 shadow-sm focus:border-blue-400"
              value={currentUser?.id || ''}
              onChange={(e) => setCurrentUser(users.find(u => String(u.id) === e.target.value))}
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-600">Chat với:</span>
            <select 
              className="bg-white border border-gray-200 rounded px-2 py-1 outline-none text-gray-700 w-32 shadow-sm focus:border-blue-400"
              value={selectedUser?.id || ''}
              onChange={(e) => setSelectedUser(users.find(u => String(u.id) === e.target.value))}
            >
              {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
            </select>
          </div>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 flex flex-col gap-3">
          {loadError ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm">
              <span>{loadError}</span>
            </div>
          ) : activeMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm">
              <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span>Chưa có tin nhắn nào</span>
            </div>
          ) : (
            activeMessages.map((msg, idx) => {
              const isOwn = String(msg.sender_id) === String(currentUser?.id);
              return (
                <div key={idx} className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                  <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl shadow-sm text-[14px] leading-relaxed relative group ${isOwn ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                    <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                    <span className={`block text-[10px] mt-1 opacity-60 ${isOwn ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Vừa xong'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-3 bg-white border-t border-gray-100">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-gray-100/80 rounded-2xl p-1.5 border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-colors">
            <textarea 
              className="flex-1 bg-transparent border-none outline-none resize-none py-2 px-3 text-sm text-gray-700 max-h-20"
              placeholder="Nhập tin nhắn..."
              rows="1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!isConnected || !canChat}
            />
            <button 
              type="submit" 
              disabled={!isConnected || !inputValue.trim() || !canChat}
              className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all mb-0.5 mr-0.5 shadow-sm"
            >
              <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>

      {/* Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 hover:bg-blue-700 transition-all duration-300"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
