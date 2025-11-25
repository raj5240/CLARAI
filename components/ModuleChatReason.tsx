import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Brain, Zap, Bot, User, PlusCircle } from 'lucide-react';
import { ChatMessage, ChatSession } from '../types';
import { generateThinkingResponse, generateQuickResponse } from '../services/gemini';
import ThinkingIndicator from './ThinkingIndicator';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const createDefaultSession = (index: number = 1): ChatSession => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: `Chat ${index}`,
    messages: [
      {
        role: 'model',
        text: "Hello! I'm your AI assistant. You can ask me anything. Toggle 'Deep Thinking' for complex problems that require reasoning."
      }
    ],
    createdAt: now,
    updatedAt: now
  };
};

const loadSessions = (storageKey: string): ChatSession[] => {
  if (typeof window === 'undefined') {
    return [createDefaultSession()];
  }
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [createDefaultSession()];
    }
    const parsed = JSON.parse(raw) as ChatSession[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((session, idx) => ({
        ...session,
        id: session.id ?? generateId(),
        title: session.title || `Chat ${idx + 1}`,
        createdAt: session.createdAt ?? new Date().toISOString(),
        updatedAt: session.updatedAt ?? session.createdAt ?? new Date().toISOString(),
        messages:
          Array.isArray(session.messages) && session.messages.length > 0
            ? session.messages
            : createDefaultSession(idx + 1).messages
      }));
    }
    return [createDefaultSession()];
  } catch (error) {
    console.warn('Failed to load chat sessions from storage, creating a new one.', error);
    return [createDefaultSession()];
  }
};

const ModuleChatReason: React.FC = () => {
  const { user } = useAuth();
  const storageKey = useMemo(
    () => (user ? `clarai.chatSessions.v1.${user.email}` : 'clarai.chatSessions.v1.guest'),
    [user?.email]
  );

  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions(storageKey));
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find(session => session.id === activeSessionId) ?? sessions[0];
  const messages: ChatMessage[] = activeSession?.messages ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSessionId, messages.length]);

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    } else if (activeSessionId && !sessions.some(session => session.id === activeSessionId) && sessions[0]) {
      setActiveSessionId(sessions[0].id);
    }
  }, [activeSessionId, sessions]);

  useEffect(() => {
    setSessions(loadSessions(storageKey));
    setActiveSessionId('');
    setIsThinkingMode(false);
    setInput('');
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(sessions));
  }, [sessions, storageKey]);

  const updateSession = (sessionId: string, updater: (session: ChatSession) => ChatSession) => {
    setSessions(prev =>
      prev.map(session => (session.id === sessionId ? updater(session) : session))
    );
  };

  const handleNewChat = () => {
    const nextIndex = sessions.length + 1;
    const newSession = createDefaultSession(nextIndex);
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    setIsThinkingMode(false);
    setInput('');
  };

  const updateSessionTitle = (session: ChatSession, latestUserMessage?: string): string => {
    if (session.title && !session.title.startsWith('Chat ')) {
      return session.title;
    }
    const derived = latestUserMessage?.trim();
    if (derived) {
      return derived.length > 40 ? `${derived.slice(0, 40)}…` : derived;
    }
    return session.title;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const session = activeSession ?? createDefaultSession(sessions.length + 1);
    if (!activeSession) {
      setSessions(prev => [...prev, session]);
      setActiveSessionId(session.id);
    }

    const userMsg: ChatMessage = { role: 'user', text: input };
    const priorMessages = session.messages ?? [];
    const historySlice = [...priorMessages.slice(-6), userMsg];
    const promptHistory = historySlice
      .map(m => `${m.role === 'user' ? 'User' : 'Model'}: ${m.text}`)
      .join('\n');
    const fullPrompt = `${promptHistory}\nModel:`;

    updateSession(session.id, current => ({
      ...current,
      messages: [...current.messages, userMsg],
      title: updateSessionTitle(current, input),
      updatedAt: new Date().toISOString()
    }));

    setInput('');
    setIsLoading(true);

    try {
      const responseText = isThinkingMode
        ? await generateThinkingResponse(fullPrompt)
        : await generateQuickResponse(fullPrompt);

      updateSession(session.id, current => ({
        ...current,
        messages: [
          ...current.messages,
          { role: 'model', text: responseText, isThinking: isThinkingMode }
        ],
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message || "Sorry, I encountered an error processing your request."
          : "Sorry, I encountered an error processing your request.";
      updateSession(session.id, current => ({
        ...current,
        messages: [...current.messages, { role: 'model', text: message }],
        updatedAt: new Date().toISOString()
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
      {/* Header */}
      <div className="bg-gray-950 p-4 border-b border-gray-800 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-indigo-400" />
            Chat & Reason
          </h2>
          <p className="text-gray-400 text-sm">Ask questions, solve problems, or just chat.</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex flex-wrap items-center gap-2">
            {sessions.map((session, index) => (
              <button
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setIsThinkingMode(false);
                  setInput('');
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${session.id === activeSession?.id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                title={session.title}
              >
                {session.title || `Chat ${index + 1}`}
              </button>
            ))}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-800 text-gray-200 hover:bg-gray-700 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              New Chat
            </button>
          </div>
          <button
            onClick={() => setIsThinkingMode(!isThinkingMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${isThinkingMode
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            {isThinkingMode ? <Brain className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            {isThinkingMode ? 'Deep Thinking ON' : 'Quick Mode'}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-indigo-600'
                  }`}
              >
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div
                className={`p-4 rounded-2xl ${msg.role === 'user'
                  ? 'bg-blue-600/20 text-blue-50 border border-blue-500/30'
                  : 'bg-gray-800/80 text-gray-100 border border-gray-700'
                  }`}
              >
                {msg.isThinking && (
                  <div className="flex items-center gap-1 text-xs text-indigo-300 mb-2 font-medium uppercase tracking-wider">
                    <Brain className="w-3 h-3" /> Thought Processed
                  </div>
                )}
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] ml-11">
              {isThinkingMode ? (
                <ThinkingIndicator />
              ) : (
                <div className="flex space-x-2 p-4 bg-gray-800/50 rounded-2xl w-24">
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-950 border-t border-gray-800">
        <div className="flex items-end gap-2 bg-gray-900 p-2 rounded-xl border border-gray-700 focus-within:border-indigo-500 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isThinkingMode ? "Ask a complex question..." : "Type a message..."}
            className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none outline-none max-h-32 min-h-[2.5rem] p-2"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleChatReason;