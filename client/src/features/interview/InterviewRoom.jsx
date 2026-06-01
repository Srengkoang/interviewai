import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../../services/api';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import {
  Send, Play, Loader2, CheckCircle2, XCircle,
  StopCircle, Sparkles, ChevronDown, Terminal
} from 'lucide-react';

const LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'typescript', 'go', 'rust'];

const ChatBubble = ({ msg }) => (
  <div className={`flex gap-3 animate-slide-up ${msg.role === 'USER' ? 'flex-row-reverse' : ''}`}>
    <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-display font-bold ${
      msg.role === 'USER' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    }`}>
      {msg.role === 'USER' ? 'You' : 'AI'}
    </div>
    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm font-body leading-relaxed whitespace-pre-wrap ${
      msg.role === 'USER'
        ? 'bg-brand-500/15 text-white border border-brand-500/20 rounded-tr-sm'
        : 'bg-surface-700 text-gray-200 border border-white/5 rounded-tl-sm'
    }`}>
      {msg.content}
    </div>
  </div>
);

export default function InterviewRoom() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [streamText, setStreamText] = useState('');

  const [code, setCode] = useState('// Start coding here\n');
  const [language, setLanguage] = useState('javascript');
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState(null);
  const [showOutput, setShowOutput] = useState(false);

  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get(`/sessions/${id}`).then((r) => {
      setSession(r.data.session);
      setMessages(r.data.session.messages || []);
      setLanguage(r.data.session.language || 'javascript');
      if (r.data.session.submissions?.length > 0) {
        setCode(r.data.session.submissions[0].code);
      }
    });

    // Setup socket
    const socket = connectSocket(token);
    socketRef.current = socket;
    socket.emit('session:join', { sessionId: id, userId: user.id });

    socket.on('code:updated', ({ code: newCode }) => setCode(newCode));

    // Start session if pending
    api.patch(`/sessions/${id}/start`).catch(() => {});

    return () => {
      socket.emit('session:leave', { sessionId: id, userId: user.id });
    };
  }, [id, token, user.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    setStreamText('');

    setMessages((prev) => [...prev, { role: 'USER', content, id: Date.now() }]);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: id, content }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) {
              setMessages((prev) => [...prev, { role: 'ASSISTANT', content: full, id: Date.now() }]);
              setStreamText('');
            } else if (data.text) {
              full += data.text;
              setStreamText(full);
            }
          } catch {}
        }
      }
    } finally {
      setSending(false);
    }
  };

  const runCode = async () => {
    setExecuting(true);
    setShowOutput(true);
    try {
      const r = await api.post('/code/execute', { code, language, sessionId: id });
      setOutput(r.data.result);
    } finally {
      setExecuting(false);
    }
  };

  const handleCodeChange = (val) => {
    setCode(val);
    socketRef.current?.emit('code:update', { sessionId: id, code: val, language });
  };

  const endInterview = async () => {
    await api.patch(`/sessions/${id}/end`);
    navigate('/sessions');
  };

  const getChallenge = async () => {
    const r = await api.get(`/chat/challenge?language=${language}`);
    if (r.data.challenge) {
      const c = r.data.challenge;
      setCode(c.starterCode || '');
      const msg = `**${c.title}**\n\n${c.description}\n\nExamples:\n${c.examples?.map((e) => `Input: ${e.input}\nOutput: ${e.output}`).join('\n')}\n\nConstraints:\n${c.constraints?.join('\n')}`;
      setMessages((prev) => [...prev, { role: 'ASSISTANT', content: msg, id: Date.now() }]);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-surface-900 overflow-hidden">
      {/* Top bar */}
      <header className="h-12 border-b border-white/5 bg-surface-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-body text-sm font-medium text-white">{session?.title || 'Interview'}</span>
          <span className="font-mono text-xs text-gray-500">{session?.id?.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={getChallenge} className="btn-ghost flex items-center gap-1.5 text-xs py-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Get Challenge
          </button>
          <button onClick={endInterview} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-body transition-all">
            <StopCircle className="w-3.5 h-3.5" /> End Interview
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className="w-80 flex flex-col border-r border-white/5 shrink-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => <ChatBubble key={m.id || i} msg={m} />)}
            {streamText && (
              <ChatBubble msg={{ role: 'ASSISTANT', content: streamText }} />
            )}
            {sending && !streamText && (
              <div className="flex gap-2 items-center text-gray-500 text-xs font-body animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> AI is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="border-t border-white/5 p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type your answer..."
                rows={2}
                className="input-field resize-none text-xs py-2 flex-1"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="btn-primary px-3 self-end"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="h-10 border-b border-white/5 bg-surface-800 flex items-center gap-2 px-3 shrink-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-surface-700 text-gray-300 text-xs font-mono border border-white/10 rounded-lg px-2 py-1 outline-none"
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className="flex-1" />
            <button
              onClick={runCode}
              disabled={executing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 text-xs font-body transition-all"
            >
              {executing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              Run
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language === 'cpp' ? 'cpp' : language}
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: '"JetBrains Mono", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                padding: { top: 12 },
                suggest: { enabled: true },
              }}
            />
          </div>

          {/* Output panel */}
          {showOutput && (
            <div className="h-40 border-t border-white/5 bg-surface-900 shrink-0">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-mono text-gray-400">Output</span>
                  {output?.status && (
                    <span className={`text-xs font-mono ${output.status === 'Accepted' ? 'text-emerald-400' : 'text-red-400'}`}>
                      · {output.status}
                    </span>
                  )}
                </div>
                <button onClick={() => setShowOutput(false)} className="text-gray-600 hover:text-gray-400 text-xs">✕</button>
              </div>
              <div className="p-3 font-mono text-xs text-gray-300 overflow-y-auto h-28 whitespace-pre-wrap">
                {executing ? (
                  <span className="text-gray-500 animate-pulse">Executing...</span>
                ) : (
                  output?.stdout || output?.stderr || output?.compile_output || 'No output'
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
