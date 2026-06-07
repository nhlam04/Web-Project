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
    if (!isAuthenticated || !currentUser || !isOpen || users.length || isLoadingUsers) return;

    setIsLoadingUsers(true);
    setLoadError('');
    fetch(`${USERS_API_BASE_URL}/users`)
      .then((res) => {
        if (!res.ok) throw new Error('Chat users API unavailable');
        return res.json();
      })
      .then((data) => {
        const normalized = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setUsers(normalized);
        const otherUsers = normalized.filter(u => String(u.id) !== String(currentUser?.id));
        setSelectedUser(otherUsers.length > 0 ? otherUsers[0] : normalized[0] || null);
        if (!normalized.length) setLoadError('Chat tạm thời không khả dụng.');
      })
      .catch((err) => {
        console.error('Lỗi tải users:', err);
        setUsers([]);
        setSelectedUser(null);
        setLoadError('Chat tạm thời không khả dụng.');
      })
      .finally(() => setIsLoadingUsers(false));
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
        .chat-selectors { padding: 12px; background: #eff6ff; border-bottom: 1px solid #bfdbfe; display: grid; gap: 8px; font-size: 12px; }
        .chat-select-row { display: flex; justify-content: space-between; align-items: center; gap: 10px; color: #334155; font-weight: 800; }
        .chat-select-row select { width: 150px; min-width: 0; border: 1px solid #bfdbfe; border-radius: 6px; padding: 6px 8px; background: #fff; color: #0f172a; }
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
        @media (max-width: 520px) {
          .chat-widget { right: 16px; bottom: 16px; }
          .chat-panel { bottom: 72px; }
        }
      `}</style>
      <div className="chat-widget">
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

          <div className="chat-selectors">
            <label className="chat-select-row">
              <span>Chat với:</span>
              <select value={selectedUser?.id || ''} onChange={(e) => setSelectedUser(users.find((u) => String(u.id) === e.target.value) || null)}>
                {users.filter(u => String(u.id) !== String(currentUser.id)).map((user) => <option key={user.id} value={user.id}>{user.username}</option>)}
              </select>
            </label>
          </div>

          <div className="chat-messages">
            {loadError ? (
              <div className="chat-empty">{loadError}</div>
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

