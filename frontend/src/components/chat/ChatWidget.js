import React, { useEffect, useRef, useState } from 'react';
import { API_BASES } from '../../utils/constants';
import { useAuthStore } from '../../store/useAuthStore';

const CHAT_API_BASE_URL = API_BASES.chatHttp;
const CHAT_WS_BASE_URL = API_BASES.chatWs;
const USERS_API_BASE_URL = API_BASES.auth;

const ChatWidget = () => {
  const { user: currentUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [chattedUserIds, setChattedUserIds] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [loadError, setLoadError] = useState('');
  
  // 'list' for conversation list, 'chat' for active chat
  const [view, setView] = useState('list');

  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view, isOpen]);

  useEffect(() => {
    function handleOpenChat(event) {
      const { userId, fallbackName } = event.detail;
      setIsOpen(true);
      setView('chat');
      setSelectedUser(prev => {
        const real = users.find(u => String(u.id) === String(userId));
        return real || { id: userId, username: fallbackName || 'Người bán' };
      });
    }
    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, [users]);

  // Update selectedUser if we just loaded the real users list
  useEffect(() => {
    if (selectedUser && users.length > 0) {
      const realUser = users.find(u => String(u.id) === String(selectedUser.id));
      if (realUser && realUser.username !== selectedUser.username) {
        setSelectedUser(realUser);
      }
    }
  }, [users, selectedUser]);

  useEffect(() => {
    if (!isOpen || isLoadingUsers) return;
    
    // Fetch if we are in list view, or if we are in chat view but haven't loaded users yet
    if (view === 'list' || (view === 'chat' && users.length === 0)) {
      setIsLoadingUsers(true);
      setLoadError('');

      Promise.all([
        fetch(`${USERS_API_BASE_URL}/users`).then(res => {
          if (!res.ok) throw new Error('Chat users API unavailable');
          return res.json();
        }),
        fetch(`${CHAT_API_BASE_URL}/api/v1/chat/users/${currentUser.id}`).then(res => {
          if (!res.ok) throw new Error('History API unavailable');
          return res.json();
        })
      ])
      .then(([usersData, chattedIds]) => {
        const normalized = Array.isArray(usersData) ? usersData : (Array.isArray(usersData?.data) ? usersData.data : []);
        setUsers(normalized);
        setChattedUserIds(Array.isArray(chattedIds) ? chattedIds : []);
      })
      .catch((err) => {
        console.error('Lỗi tải dữ liệu chat:', err);
        setLoadError('Chat tạm thời không khả dụng.');
      })
      .finally(() => setIsLoadingUsers(false));
    }
  }, [isOpen, view, currentUser]);

  useEffect(() => {
    if (!currentUser || !selectedUser || view !== 'chat') return;

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
  }, [currentUser, selectedUser, view]);

  useEffect(() => {
    if (!currentUser) return undefined;

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
  }, [currentUser]);

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

  function openChat(user) {
    setSelectedUser(user);
    setView('chat');
  }

  function backToList() {
    setView('list');
    setSelectedUser(null);
  }

  const activeMessages = messages.filter((msg) => (
    (String(msg.sender_id) === String(currentUser?.id) && String(msg.receiver_id) === String(selectedUser?.id)) ||
    (String(msg.sender_id) === String(selectedUser?.id) && String(msg.receiver_id) === String(currentUser?.id))
  ));

  if (!currentUser) {
    return null;
  }

  // Derived lists for UI
  const otherUsers = users.filter(u => String(u.id) !== String(currentUser.id));
  const chattedUsers = otherUsers.filter(u => chattedUserIds.includes(String(u.id)));
  const unchattedUsers = otherUsers.filter(u => !chattedUserIds.includes(String(u.id)));

  return (
    <div className="fixed right-6 bottom-6 z-[60] sm:right-4 sm:bottom-4">
      <div 
        className={`absolute right-0 bottom-[76px] w-[min(384px,calc(100vw-32px))] h-[min(520px,calc(100vh-120px))] bg-white border border-slate-200 rounded-xl shadow-[0_24px_70px_rgba(15,23,42,0.24)] overflow-hidden flex flex-col origin-bottom-right transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95 pointer-events-none'}`}
      >
        <div className="min-h-[72px] px-4 py-3 text-white bg-brand-600 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            {view === 'chat' && (
              <button className="bg-white/20 hover:bg-white/30 border-none text-white w-8 h-8 rounded-md cursor-pointer flex items-center justify-center text-lg transition-colors" onClick={backToList} aria-label="Quay lại">
                &#8592;
              </button>
            )}
            {view === 'chat' ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-black text-white shrink-0">
                  {selectedUser ? selectedUser.username?.charAt(0)?.toUpperCase() : '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="m-0 text-sm font-semibold text-white truncate">{selectedUser ? selectedUser.username : 'Người dùng'}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-100">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {isConnected ? 'Trực tuyến' : 'Đang kết nối...'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="min-w-0">
                  <h3 className="m-0 text-sm font-semibold text-white">Tin nhắn</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-100">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {isConnected ? 'Đã kết nối' : 'Đang kết nối...'}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button className="w-8 h-8 rounded-md text-white bg-white/10 hover:bg-white/20 border-none flex items-center justify-center text-2xl leading-none cursor-pointer transition-colors" type="button" onClick={() => setIsOpen(false)} aria-label="Đóng chat">×</button>
        </div>

        {view === 'list' ? (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
            {isLoadingUsers ? (
              <div className="flex-1 grid place-items-center text-center text-slate-500 text-sm p-5">Đang tải dữ liệu...</div>
            ) : loadError ? (
              <div className="flex-1 grid place-items-center text-center text-slate-500 text-sm p-5">{loadError}</div>
            ) : (
              <>
                {chattedUsers.length > 0 && (
                  <>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-1 mb-2 ml-1 tracking-wide">Đoạn chat gần đây</div>
                    {chattedUsers.map(user => (
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl mb-2 cursor-pointer transition-all hover:border-slate-400 hover:shadow-sm hover:-translate-y-px" key={user.id} onClick={() => openChat(user)}>
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black shrink-0">{user.username?.charAt(0)?.toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="m-0 text-sm font-semibold text-slate-900 truncate">{user.username}</h4>
                          <p className="mt-1 mb-0 text-xs text-slate-500 truncate">Nhấn để xem tin nhắn</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {unchattedUsers.length > 0 && (
                  <>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2 ml-1 tracking-wide">Bắt đầu chat mới</div>
                    {unchattedUsers.map(user => (
                      <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl mb-2 cursor-pointer transition-all hover:border-slate-400 hover:shadow-sm hover:-translate-y-px" key={user.id} onClick={() => openChat(user)}>
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black shrink-0">{user.username?.charAt(0)?.toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="m-0 text-sm font-semibold text-slate-900 truncate">{user.username}</h4>
                          <p className="mt-1 mb-0 text-xs text-slate-500 truncate">Bắt đầu cuộc trò chuyện mới</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {otherUsers.length === 0 && (
                  <div className="flex-1 grid place-items-center text-center text-slate-500 text-sm p-5">Không có người dùng nào khác để chat.</div>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 bg-slate-50 flex flex-col gap-2.5">
              {activeMessages.length === 0 ? (
                <div className="flex-1 grid place-items-center text-center text-slate-500 text-sm p-5">Hãy gửi lời chào đến {selectedUser?.username}!</div>
              ) : activeMessages.map((msg, index) => {
                const isOwn = String(msg.sender_id) === String(currentUser?.id);
                return (
                  <div className={`flex w-full ${isOwn ? 'justify-end' : ''}`} key={`${msg.timestamp || 'msg'}-${index}`}>
                    <div className={`max-w-[78%] px-3 py-2.5 rounded-2xl text-sm leading-snug break-words border shadow-sm ${isOwn ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-slate-900 border-slate-200'}`}>
                      <span>{msg.content}</span>
                      <span className={`block mt-1 text-[10px] text-right opacity-70`}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Vừa xong'}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-200 shrink-0">
              <form className="flex items-end gap-2 p-1.5 border border-slate-200 rounded-xl bg-slate-50 focus-within:border-brand-300 focus-within:bg-white transition-colors" onSubmit={handleSendMessage}>
                <textarea
                  className="flex-1 min-w-0 max-h-[88px] resize-none border-none outline-none bg-transparent p-2 text-slate-900 text-sm font-inherit placeholder-slate-400"
                  placeholder="Nhập tin nhắn..."
                  rows="1"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!isConnected}
                />
                <button 
                  className="w-9 h-9 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex-shrink-0 flex items-center justify-center border-none cursor-pointer transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed" 
                  type="submit" 
                  disabled={!isConnected || !inputValue.trim()} 
                  aria-label="Gửi tin nhắn"
                >
                  <svg className="w-5 h-5 block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {!isOpen ? (
        <button 
          className="w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-[0_14px_30px_rgba(37,99,235,0.35)] hover:scale-105 border-none cursor-pointer flex items-center justify-center transition-all duration-300" 
          type="button" 
          onClick={() => setIsOpen(true)} 
          aria-label="Mở chat"
        >
          <svg className="w-[26px] h-[26px] block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
};

export default ChatWidget;
