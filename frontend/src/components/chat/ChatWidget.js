import React, { useEffect, useRef, useState } from 'react';
import { API_BASES } from '../../utils/constants';
import { useAuth } from '../auth/AuthProvider';

const CHAT_API_BASE_URL = API_BASES.chatHttp;
const CHAT_WS_BASE_URL = API_BASES.chatWs;
const USERS_API_BASE_URL = API_BASES.auth;

const ChatWidget = () => {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [loadError, setLoadError] = useState('');

  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isAuthenticated && currentUser) return;

    setIsOpen(false);
    setUsers([]);
    setSelectedUser(null);
    setMessages([]);
    setIsConnected(false);
    setInputValue('');
    setIsLoadingUsers(false);
    setLoadError('');
    ws.current?.close();
    ws.current = null;
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    function handleOpenChat(e) {
      const { sellerId } = e.detail;
      setIsOpen(true);
      
      setUsers((prev) => {
        const exists = prev.find(u => String(u.id) === String(sellerId));
        if (exists) {
          setSelectedUser(exists);
          return prev;
        } else {
          // Add a temporary user entry for the seller if not in the list
          const newSeller = { id: sellerId, username: `Người bán (${String(sellerId).substring(0,6)})` };
          setSelectedUser(newSeller);
          return [newSeller, ...prev];
        }
      });
    }

    window.addEventListener('openChatWithSeller', handleOpenChat);
    return () => window.removeEventListener('openChatWithSeller', handleOpenChat);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !currentUser || !isOpen || users.length || isLoadingUsers) return;

    setIsLoadingUsers(true);
    setLoadError('');
    
    async function fetchUsers() {
      try {
        const res = await fetch(`${USERS_API_BASE_URL}/users`);
        if (!res.ok) throw new Error('Chat users API unavailable');
        const data = await res.json();
        const normalized = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        
        let chattedUserIds = [];
        try {
          const chatUsersRes = await fetch(`${CHAT_API_BASE_URL}/api/v1/chat/users/${currentUser.id}`);
          if (chatUsersRes.ok) {
            chattedUserIds = await chatUsersRes.json();
          }
        } catch (err) {
          console.error('Lỗi tải danh sách người đã chat:', err);
        }

        const chattedUsers = normalized.filter(u => chattedUserIds.includes(String(u.id)) && String(u.id) !== String(currentUser.id));
        setUsers(chattedUsers);
        
        if (chattedUsers.length > 0) {
          setSelectedUser(chattedUsers[0]);
        } else {
          setLoadError('Chưa có đoạn chat nào.');
        }
      } catch (err) {
        console.error('Lỗi tải users:', err);
        setUsers([]);
        setSelectedUser(null);
        setLoadError('Chat tạm thời không khả dụng.');
      } finally {
        setIsLoadingUsers(false);
      }
    }
    
    fetchUsers();
  }, [isAuthenticated, isOpen, users.length, isLoadingUsers, currentUser]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser || !selectedUser) return;

    async function fetchHistory() {
      try {
        const response = await fetch(`${CHAT_API_BASE_URL}/api/v1/chat/history/${currentUser.id}/${selectedUser.id}`);
        if (response.ok) {
          const history = await response.json();
          setMessages(Array.isArray(history) ? history : []);
        }
      } catch (error) {
        console.error('Lỗi tải lịch sử chat:', error);
      }
    }

    fetchHistory();
  }, [isAuthenticated, currentUser, selectedUser]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return undefined;

    let mounted = true;
    let reconnectTimeout;

    function connectWs() {
      if (!mounted) return;
      ws.current = new WebSocket(`${CHAT_WS_BASE_URL}/api/v1/chat/ws/${currentUser.id}`);

      ws.current.onopen = () => {
        if (mounted) setIsConnected(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => [...prev, { ...data, timestamp: new Date().toISOString() }]);
        } catch (error) {
          console.error('Lỗi phân tích tin nhắn:', error);
        }
      };

      ws.current.onclose = () => {
        if (mounted) {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        }
      };
    }

    connectWs();

    return () => {
      mounted = false;
      clearTimeout(reconnectTimeout);
      ws.current?.close();
    };
  }, [isAuthenticated, currentUser]);

  function handleSendMessage(event) {
    event.preventDefault();
    if (!ws.current || !isConnected || !selectedUser || !currentUser || !inputValue.trim()) return;

    const content = inputValue.trim();
    ws.current.send(JSON.stringify({
      receiver_id: String(selectedUser.id),
      content,
    }));

    setMessages((prev) => [
      ...prev,
      {
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content,
        timestamp: new Date().toISOString(),
      },
    ]);
    setInputValue('');
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(event);
    }
  }

  const activeMessages = messages.filter((msg) => (
    (String(msg.sender_id) === String(currentUser?.id) && String(msg.receiver_id) === String(selectedUser?.id)) ||
    (String(msg.sender_id) === String(selectedUser?.id) && String(msg.receiver_id) === String(currentUser?.id))
  ));
  const canChat = Boolean(currentUser && selectedUser && !loadError);

  if (!isAuthenticated || !currentUser) {
    return null;
  }

  return (
    <>
      <style>{`
        .chat-widget { position: fixed; right: 24px; bottom: 24px; z-index: 60; font-family: 'Segoe UI', Tahoma, sans-serif; }
        
        .chat-sidebar { position: absolute; right: calc(min(384px, 100vw - 32px) + 16px); bottom: 76px; width: 260px; height: min(520px, calc(100vh - 120px)); background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 12px 40px rgba(15, 23, 42, .15); overflow: hidden; display: flex; flex-direction: column; transform-origin: bottom right; transition: opacity 160ms ease, transform 160ms ease, visibility 160ms ease; }
        .chat-sidebar.closed { opacity: 0; visibility: hidden; transform: translateX(20px) scale(.97); pointer-events: none; }
        .chat-sidebar.open { opacity: 1; visibility: visible; transform: translateX(0) scale(1); }
        .chat-sidebar-header { padding: 14px 16px; background: #fff; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #0f172a; font-size: 15px; }
        .chat-sidebar-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
        .chat-contact-box { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 6px; cursor: pointer; transition: background 0.2s; border: 1px solid transparent; }
        .chat-contact-box:hover { background: #e2e8f0; }
        .chat-contact-box.active { background: #eff6ff; border-color: #bfdbfe; }
        .chat-contact-avatar { width: 36px; height: 36px; border-radius: 50%; background: #3b82f6; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; }
        .chat-contact-name { font-size: 14px; font-weight: 500; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        
        .chat-panel { position: absolute; right: 0; bottom: 76px; width: min(384px, calc(100vw - 32px)); height: min(520px, calc(100vh - 120px)); background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 24px 70px rgba(15, 23, 42, .24); overflow: hidden; display: flex; flex-direction: column; transform-origin: bottom right; transition: opacity 160ms ease, transform 160ms ease, visibility 160ms ease; }
        .chat-panel.closed { opacity: 0; visibility: hidden; transform: scale(.97); pointer-events: none; }
        .chat-panel.open { opacity: 1; visibility: visible; transform: scale(1); }
        .chat-head { min-height: 72px; padding: 14px 16px; color: #fff; background: #2563eb; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .chat-person { min-width: 0; display: flex; align-items: center; gap: 10px; }
        .chat-avatar { width: 40px; height: 40px; border-radius: 999px; background: rgba(255,255,255,.2); display: inline-flex; align-items: center; justify-content: center; font-weight: 900; flex: 0 0 auto; }
        .chat-title { margin: 0; font-size: 15px; line-height: 1.2; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chat-status { margin-top: 4px; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #dbeafe; }
        .chat-dot { width: 8px; height: 8px; border-radius: 999px; background: #ef4444; }
        .chat-dot.online { background: #22c55e; }
        .chat-close, .chat-toggle, .chat-send { border: 0; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
        .chat-close { width: 32px; height: 32px; border-radius: 6px; color: #fff; background: rgba(255,255,255,.12); font-size: 22px; line-height: 1; }
        .chat-messages { flex: 1; min-height: 0; overflow-y: auto; padding: 14px; background: #f8fafc; display: flex; flex-direction: column; gap: 10px; }
        .chat-empty { flex: 1; display: grid; place-items: center; text-align: center; color: #64748b; font-size: 13px; }
        .chat-message-row { display: flex; width: 100%; }
        .chat-message-row.own { justify-content: flex-end; }
        .chat-bubble { max-width: 78%; padding: 9px 12px; border-radius: 14px; background: #fff; color: #0f172a; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px rgba(15,23,42,.04); font-size: 14px; line-height: 1.4; overflow-wrap: anywhere; }
        .chat-message-row.own .chat-bubble { background: #2563eb; color: #fff; border-color: #2563eb; }
        .chat-time { display: block; margin-top: 4px; opacity: .7; font-size: 10px; text-align: right; }
        .chat-form-wrap { padding: 12px; background: #fff; border-top: 1px solid #e5e7eb; }
        .chat-form { display: flex; align-items: flex-end; gap: 8px; padding: 6px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f8fafc; }
        .chat-form:focus-within { border-color: #93c5fd; background: #fff; }
        .chat-input { flex: 1; min-width: 0; max-height: 88px; resize: none; border: 0; outline: 0; background: transparent; padding: 8px; color: #0f172a; font: inherit; font-size: 14px; }
        .chat-send { width: 36px; height: 36px; border-radius: 999px; background: #2563eb; color: #fff; flex: 0 0 auto; }
        .chat-send:disabled { background: #cbd5e1; cursor: not-allowed; }
        .chat-toggle { width: 56px; height: 56px; border-radius: 999px; background: #2563eb; color: #fff; box-shadow: 0 14px 30px rgba(37,99,235,.35); }
        .chat-toggle:hover { background: #1d4ed8; }
        .chat-icon { width: 22px; height: 22px; display: block; }
        @media (max-width: 680px) {
          .chat-sidebar { display: none; }
        }
      `}</style>
      <div className="chat-widget">
        
        {/* Sidebar */}
        <div className={`chat-sidebar ${isOpen ? 'open' : 'closed'}`}>
          <div className="chat-sidebar-header">
            Đoạn chat
          </div>
          <div className="chat-sidebar-list">
            {users.length === 0 && !isLoadingUsers && (
              <div className="chat-empty">Chưa có đoạn chat nào</div>
            )}
            {users.map((user) => (
              <div 
                key={user.id} 
                className={`chat-contact-box ${selectedUser?.id === user.id ? 'active' : ''}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="chat-contact-avatar">
                  {user.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="chat-contact-name">
                  {user.username}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Panel */}
        <div className={`chat-panel ${isOpen ? 'open' : 'closed'}`}>
          <div className="chat-head">
            <div className="chat-person">
              <div className="chat-avatar">{selectedUser ? selectedUser.username?.charAt(0)?.toUpperCase() : '?'}</div>
              <div>
                <h3 className="chat-title">{selectedUser ? selectedUser.username : 'Hỗ trợ'}</h3>
                <div className="chat-status">
                  <span className={`chat-dot ${isConnected ? 'online' : ''}`} />
                  {isConnected ? 'Trực tuyến' : 'Đang kết nối...'}
                </div>
              </div>
            </div>
            <button className="chat-close" type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chat">x</button>
          </div>

          <div className="chat-messages">
            {loadError ? (
              <div className="chat-empty">{loadError}</div>
            ) : !selectedUser ? (
              <div className="chat-empty">Vui lòng chọn một đoạn chat</div>
            ) : activeMessages.length === 0 ? (
              <div className="chat-empty">{isLoadingUsers ? 'Đang tải chat...' : 'Chưa có tin nhắn nào'}</div>
            ) : activeMessages.map((msg, index) => {
              const isOwn = String(msg.sender_id) === String(currentUser?.id);
              return (
                <div className={`chat-message-row ${isOwn ? 'own' : ''}`} key={`${msg.timestamp || 'msg'}-${index}`}>
                  <div className="chat-bubble">
                    <span>{msg.content}</span>
                    <span className="chat-time">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {selectedUser && (
            <div className="chat-form-wrap">
              <form className="chat-form" onSubmit={handleSendMessage}>
                <textarea
                  className="chat-input"
                  placeholder="Nhập tin nhắn..."
                  rows="1"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!isConnected || !canChat}
                />
                <button className="chat-send" type="submit" disabled={!isConnected || !inputValue.trim() || !canChat} aria-label="Gửi tin nhắn">
                  <svg className="chat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          )}
        </div>

        {!isOpen ? (
          <button className="chat-toggle" type="button" onClick={() => setIsOpen(true)} aria-label="Mở chat">
            <svg className="chat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        ) : null}
      </div>
    </>
  );
};

export default ChatWidget;

