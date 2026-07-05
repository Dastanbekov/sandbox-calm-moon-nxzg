'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { api } from '@/services/auth.service';
import {
  MessageSquare,
  Search,
  Send,
  Paperclip,
  CheckCheck,
  ArrowLeft,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ru } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: number;
  other_user_name: string;
  other_user_role: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  vacancy_title?: string;
}

interface Message {
  id: number;
  sender_id: number;
  text: string;
  is_read: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMessageTime(isoDate: string) {
  const date = new Date(isoDate);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Вчера';
  return format(date, 'dd MMM', { locale: ru });
}

function formatFullTime(isoDate: string) {
  return format(new Date(isoDate), 'HH:mm');
}

// ─── Empty State Component ─────────────────────────────────────────────────────

function EmptyConversationList() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
        <MessageSquare size={36} className="text-blue-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">Нет диалогов</h3>
      <p className="text-sm text-gray-500 max-w-[220px] leading-relaxed">
        Диалоги появятся, когда работодатель или соискатель начнёт переписку.
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load conversations ────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await api.get('/api/messages/');
      setConversations(res.data.results || res.data || []);
      setApiAvailable(true);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Messaging module not yet deployed
        setApiAvailable(false);
      }
      setConversations([]);
    } finally {
      setIsLoadingConvs(false);
    }
  }, []);

  // ─── Load messages for active conversation ────────────────────────────
  const loadMessages = useCallback(async (convId: number) => {
    setIsLoadingMessages(true);
    try {
      const res = await api.get(`/api/messages/${convId}/`);
      setMessages(res.data.results || res.data || []);
      // Mark as read
      await api.patch(`/api/messages/${convId}/read/`).catch(() => {});
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
      // Poll every 5 seconds for new messages (WebSocket-ready replacement)
      pollRef.current = setInterval(() => loadMessages(activeConversationId), 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeConversationId, loadMessages]);

  // ─── Send message ──────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!messageText.trim() || !activeConversationId || isSending) return;
    const text = messageText.trim();
    setMessageText('');
    setIsSending(true);
    try {
      const res = await api.post(`/api/messages/${activeConversationId}/send/`, { text });
      setMessages(prev => [...prev, res.data]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {
      setMessageText(text); // restore on error
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return null;

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const filtered = searchQuery
    ? conversations.filter(c =>
        c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.vacancy_title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // ─── Messaging not available yet ──────────────────────────────────────
  if (!apiAvailable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 m-6 bg-white rounded-3xl border border-gray-100 shadow-sm animate-fadeIn">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 border border-blue-100">
          <MessageSquare size={44} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">Переписка</h2>
        <p className="text-gray-500 font-medium text-center max-w-sm leading-relaxed mb-6">
          Модуль сообщений находится в разработке и появится очень скоро.
          Работодатели смогут писать кандидатам после их отклика.
        </p>
        <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold border border-blue-100">
          <Clock size={16} />
          Скоро будет доступно
        </div>
      </div>
    );
  }

  // ─── Main chat UI ──────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-100px)] flex bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn m-6">

      {/* Sidebar */}
      <div className="w-full md:w-[340px] border-r border-gray-100 flex flex-col bg-gray-50/50 shrink-0">
        <div className="p-4 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight mb-4">Сообщения</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск диалогов..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoadingConvs ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={28} className="animate-spin text-blue-400" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyConversationList />
          ) : (
            filtered.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors flex gap-3 relative ${
                  activeConversationId === conv.id ? 'bg-blue-50/60' : 'hover:bg-white'
                }`}
              >
                {activeConversationId === conv.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600 rounded-r" />
                )}
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0 border border-white shadow-sm">
                  {conv.other_user_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="font-bold text-gray-900 text-[15px] truncate pr-2">{conv.other_user_name}</h4>
                    <span className="text-xs text-gray-400 shrink-0">{formatMessageTime(conv.last_message_at)}</span>
                  </div>
                  {conv.vacancy_title && (
                    <p className="text-xs text-blue-600 font-medium mb-1 truncate">{conv.vacancy_title}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate pr-2 ${conv.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                      {conv.last_message}
                    </p>
                    {conv.unread_count > 0 && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {conv.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:flex flex-1 flex-col bg-white">
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="h-[72px] border-b border-gray-100 px-6 flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                {activeConv.other_user_name[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">{activeConv.other_user_name}</h3>
                {activeConv.vacancy_title && (
                  <p className="text-xs text-gray-500 truncate">{activeConv.vacancy_title}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40 flex flex-col gap-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 size={28} className="animate-spin text-blue-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare size={36} className="mb-3 opacity-40" />
                  <p className="text-sm">Нет сообщений. Начните переписку!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex gap-2 max-w-[75%] ${isMine ? 'self-end flex-row-reverse' : 'self-start'}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 mt-auto">
                          {activeConv.other_user_name[0]}
                        </div>
                      )}
                      <div>
                        <div className={`p-3.5 rounded-2xl text-[14.5px] leading-relaxed ${
                          isMine
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                        }`}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                          <span className="text-xs text-gray-400">{formatFullTime(msg.created_at)}</span>
                          {isMine && <CheckCheck size={13} className={msg.is_read ? 'text-blue-400' : 'text-gray-300'} />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <div className="flex items-end gap-2 bg-gray-50 rounded-2xl p-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <button className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0" title="Прикрепить файл">
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Напишите сообщение... (Enter для отправки)"
                  className="w-full bg-transparent border-none resize-none outline-none py-2 px-1 text-[14.5px] max-h-[120px] min-h-[40px]"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!messageText.trim() || isSending}
                  className={`p-2.5 rounded-xl transition-all shrink-0 ${
                    messageText.trim() && !isSending
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 text-center">
                Enter — отправить · Shift+Enter — новая строка
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
              <MessageSquare size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Выберите диалог</h3>
            <p className="text-sm text-gray-500">Выберите собеседника из списка слева</p>
          </div>
        )}
      </div>

    </div>
  );
}
