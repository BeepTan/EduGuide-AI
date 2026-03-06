import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  MessageCircle,
  Save,
  Settings,
  User,
  ChevronRight,
  Send,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  Download,
  Trash2,
  FileText,
  Plus,
  Copy,
  Mic,
  MicOff,
  Volume2,
  Square,
  Headphones
} from 'lucide-react';
import { Chat, GenerateContentResponse } from "@google/genai";

import { UserContext, UserRole, Message, SavedGuide } from './types';
import { createChatSession, generateRoadmap, refineToMarkdown } from './services/gemini';
import MarkdownRenderer from './components/MarkdownRenderer';
import Button from './components/Button';
import Toast, { ToastMessage, ToastType } from './components/Toast';
import AudioChat from './components/AudioChat';

// --- Context Setup ---
const DEFAULT_CONTEXT: UserContext = {
  role: UserRole.STUDENT,
  targetAge: 16,
  topic: 'Python Programming',
  currentLevel: 'Beginner',
  goal: 'Build a web scraper'
};

function App() {
  // Persist User Context
  const [userContext, setUserContext] = useState<UserContext>(() => {
    const saved = localStorage.getItem('edu_user_context');
    return saved ? JSON.parse(saved) : DEFAULT_CONTEXT;
  });

  const [savedGuides, setSavedGuides] = useState<SavedGuide[]>(() => {
    const saved = localStorage.getItem('edu_guides');
    return saved ? JSON.parse(saved) : [];
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    localStorage.setItem('edu_user_context', JSON.stringify(userContext));
  }, [userContext]);

  // Save to local storage whenever guides update
  useEffect(() => {
    localStorage.setItem('edu_guides', JSON.stringify(savedGuides));
  }, [savedGuides]);

  const addSavedGuide = (guide: SavedGuide) => {
    setSavedGuides(prev => [guide, ...prev]);
  };

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col h-full w-full relative">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 pb-24 md:pb-6 scroll-smooth relative">
            <Routes>
              <Route path="/" element={<Home userContext={userContext} setUserContext={setUserContext} showToast={showToast} />} />
              <Route path="/audio" element={<AudioChat userContext={userContext} />} />
              <Route
                path="/chat"
                element={
                  <ChatPage
                    userContext={userContext}
                    onSave={addSavedGuide}
                    savedGuides={savedGuides}
                    showToast={showToast}
                  />
                }
              />
              <Route path="/saved" element={<SavedPage guides={savedGuides} />} />
              <Route path="/saved/:id" element={<SavedDetailPage guides={savedGuides} showToast={showToast} />} />
            </Routes>

            {/* Toast Container */}
            <div className="fixed bottom-20 md:bottom-10 right-4 md:right-10 flex flex-col gap-2 z-50 pointer-events-none">
              {toasts.map(toast => (
                <div key={toast.id} className="pointer-events-auto">
                  <Toast toast={toast} onDismiss={dismissToast} />
                </div>
              ))}
            </div>
          </main>
          <MobileNav />
        </div>
      </div>
    </Router>
  );
}

// --- Layout Components ---

const Sidebar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "bg-indigo-100 text-indigo-700" : "text-gray-600 hover:bg-gray-100";

  return (
    <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full shadow-sm">
      <div className="p-6 flex items-center gap-2 border-b border-gray-100">
        <div className="bg-indigo-600 p-1.5 rounded-lg">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">EduGuide AI</h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/')}`}>
          <Settings size={20} />
          <span className="font-medium">Configuration</span>
        </Link>
        <Link to="/chat" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/chat')}`}>
          <MessageCircle size={20} />
          <span className="font-medium">Learning & Chat</span>
        </Link>
        <Link to="/audio" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/audio')}`}>
          <Headphones size={20} />
          <span className="font-medium">Voice Chat</span>
        </Link>
        <Link to="/saved" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/saved')}`}>
          <Save size={20} />
          <span className="font-medium">Saved Guides</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="bg-indigo-50 rounded-xl p-4">
          <p className="text-xs text-indigo-600 font-semibold uppercase mb-1">Pro Tip</p>
          <p className="text-sm text-gray-600">Switch to 'Parent' mode to get simple analogies for teaching!</p>
        </div>
      </div>
    </div>
  );
};

const MobileNav = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? "text-indigo-600" : "text-gray-400";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
          <Settings size={20} />
          <span className="text-[10px] font-medium">Config</span>
        </Link>
        <Link to="/chat" className={`flex flex-col items-center gap-1 ${isActive('/chat')}`}>
          <div className="bg-indigo-600 rounded-full p-3 -mt-6 shadow-lg border-4 border-gray-50">
            <MessageCircle size={24} className="text-white" />
          </div>
          <span className="text-[10px] font-medium text-indigo-600">Chat</span>
        </Link>
        <Link to="/audio" className={`flex flex-col items-center gap-1 ${isActive('/audio')}`}>
          <Headphones size={20} />
          <span className="text-[10px] font-medium">Voice</span>
        </Link>
        <Link to="/saved" className={`flex flex-col items-center gap-1 ${isActive('/saved')}`}>
          <Save size={20} />
          <span className="text-[10px] font-medium">Saved</span>
        </Link>
      </div>
    </div>
  );
};

const MobileHeader = () => {
  return (
    <div className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 p-1 rounded-md">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-gray-800 text-lg">EduGuide AI</span>
      </div>
      <div className="w-8"></div> {/* Spacer */}
    </div>
  );
};

// --- Pages ---

interface HomeProps {
  userContext: UserContext;
  setUserContext: (c: UserContext) => void;
  showToast: (msg: string) => void;
}

const Home: React.FC<HomeProps> = ({ userContext, setUserContext, showToast }) => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setUserContext({ ...userContext, role });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Learning preferences updated!");
    navigate('/chat');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-2 mt-4 md:mt-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Customize Your Learning</h2>
        <p className="text-gray-500">Tell us who you are and what you want to learn.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => handleRoleSelect(UserRole.STUDENT)}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${userContext.role === UserRole.STUDENT
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 hover:border-indigo-200 text-gray-600'
              }`}
          >
            <User size={24} />
            <span className="font-semibold">I'm a Student</span>
          </button>
          <button
            onClick={() => handleRoleSelect(UserRole.PARENT)}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${userContext.role === UserRole.PARENT
              ? 'border-teal-600 bg-teal-50 text-teal-700'
              : 'border-gray-200 hover:border-teal-200 text-gray-600'
              }`}
          >
            <div className="flex items-center gap-1">
              <User size={24} />
              <User size={16} />
            </div>
            <span className="font-semibold">I'm a Parent</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {userContext.role === UserRole.PARENT ? "Child's Age" : "Your Age / Grade"}
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              value={userContext.targetAge}
              onChange={(e) => setUserContext({ ...userContext, targetAge: e.target.value })}
              placeholder="e.g. 10, 10th Grade, College Sophomore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic to Learn</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              value={userContext.topic}
              onChange={(e) => setUserContext({ ...userContext, topic: e.target.value })}
              placeholder="e.g. Photosynthesis, Algebra, React Programming"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Understanding Level</label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white"
              value={userContext.currentLevel}
              onChange={(e) => setUserContext({ ...userContext, currentLevel: e.target.value })}
            >
              <option value="Novice">Total Novice (No prior knowledge)</option>
              <option value="Beginner">Beginner (Basic concepts known)</option>
              <option value="Intermediate">Intermediate (Can apply concepts)</option>
              <option value="Advanced">Advanced (Deep dive needed)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specific Goal</label>
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              rows={2}
              value={userContext.goal}
              onChange={(e) => setUserContext({ ...userContext, goal: e.target.value })}
              placeholder="e.g. Prepare for final exam, build a project, explain it to my 5yo"
            />
          </div>

          <Button type="submit" size="lg" className="w-full mt-4 shadow-lg shadow-indigo-200">
            Start Learning Journey <ChevronRight size={20} className="ml-2" />
          </Button>
        </form>
      </div>
    </div>
  );
};

interface ChatPageProps {
  userContext: UserContext;
  onSave: (guide: SavedGuide) => void;
  savedGuides: SavedGuide[];
  showToast: (msg: string, type?: ToastType) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({
  userContext,
  onSave,
  savedGuides,
  showToast
}) => {
  // Generate a function to create the initial message so we can reuse it
  const createInitialMessage = (): Message => ({
    id: `init-${Date.now()}`, // Dynamic ID to force re-render on clear
    role: 'model',
    text: `Hello! I'm ready to help you ${userContext.role === UserRole.PARENT ? 'teach your child' : 'learn'} about **${userContext.topic}**. What would you like to achieve today?`
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('edu_chat_messages');
    return saved ? JSON.parse(saved) : [createInitialMessage()];
  });

  const [input, setInput] = useState(() => {
    return localStorage.getItem('edu_chat_input') || '';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [savingMessageId, setSavingMessageId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [attachedGuide, setAttachedGuide] = useState<SavedGuide | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const recognitionRef = useRef<any>(null);

  // Persist State
  useEffect(() => {
    localStorage.setItem('edu_chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('edu_chat_input', input);
  }, [input]);

  // Initialize Chat Session with History
  useEffect(() => {
    try {
      // FIX: Strictly filter messages to prevent "ContentUnion is required" error
      // The API requires valid 'parts' with non-empty text.
      // We also exclude messages that are currently streaming or the initial greeting if it doesn't contain useful context.
      const history = messages
        .filter(m =>
          !m.id.startsWith('init') && // Don't send the "Hello" greeting as history, model knows who it is via System Instructions
          !m.isStreaming &&
          m.text &&
          m.text.trim().length > 0
        )
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      chatSessionRef.current = createChatSession(userContext, history);
    } catch (error) {
      console.error("Failed to init chat", error);
      showToast("Failed to restore chat session.", 'error');
    }
  }, [userContext]); // Re-init on context change. Note: we don't depend on 'messages' to avoid infinite loops, we just load initial history.

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachedGuide) || !chatSessionRef.current || isLoading) return;

    let displayInput = input;
    if (attachedGuide) {
      displayInput = `*(Attached Guide: ${attachedGuide.title})*\n\n${input}`;
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: displayInput || 'Discuss this guide' };
    setMessages(prev => [...prev, userMsg]);

    // Construct the payload for Gemini
    let aiPrompt = input;
    if (attachedGuide) {
      aiPrompt = `Context from attached guide titled '${attachedGuide.title}':\n${attachedGuide.content}\n\nMy prompt: ${input || "I want to discuss this guide. Please acknowledge."}`;
    }

    setInput('');
    setAttachedGuide(null); // Clear the attachment after sending
    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', isStreaming: true }]);

    try {
      const result = await chatSessionRef.current.sendMessageStream({ message: aiPrompt });

      let fullText = '';
      for await (const chunk of result) {
        const text = (chunk as GenerateContentResponse).text;
        if (text) {
          fullText += text;

          // Parse suggestions if we've received the complete block
          let displayPrefix = fullText;
          let newSuggestions: string[] | undefined = undefined;

          if (fullText.includes('---SUGGESTIONS---')) {
            const parts = fullText.split('---SUGGESTIONS---');
            displayPrefix = parts[0].trim();
            const suggestionsPart = parts[1];

            // Extract the lines as suggestions
            if (suggestionsPart) {
              newSuggestions = suggestionsPart
                .split('\n')
                .map(s => s.replace(/^[-*0-9.)]+/, '').trim())
                .filter(s => s.length > 5); // Basic check to ensure it's a substantive question
            }
          }

          setMessages(prev => prev.map(m =>
            m.id === modelMsgId ? { ...m, text: displayPrefix, suggestions: newSuggestions || m.suggestions } : m
          ));
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === modelMsgId ? { ...m, isStreaming: false } : m
      ));

    } catch (error: any) {
      console.error("Chat error", error);
      const errorMsg = error?.message || "I'm sorry, I encountered an error. Please try again.";
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: `Error: ${errorMsg}` }]);
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    const id = Date.now().toString();
    setMessages(prev => [...prev, { id, role: 'model', text: 'Generating your high-level personalized roadmap... This might take a few seconds.', isStreaming: true }]);

    try {
      const result = await generateRoadmap(userContext);

      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, text: result.text, suggestions: result.suggestions, isStreaming: false } : m
      ));
      showToast("Roadmap generated successfully!");

    } catch (e) {
      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, text: "Failed to generate roadmap. Please check your connection.", isStreaming: false } : m
      ));
      showToast("Failed to generate roadmap", 'error');
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleSaveToGuide = async (messageText: string, msgId: string) => {
    setSavingMessageId(msgId);
    try {
      const refined = await refineToMarkdown(messageText, userContext);

      // Better title extraction: Remove code blocks and empty lines, grab the first real text line
      const lines = refined.replace(/```[\s\S]*?```/g, '').split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const firstLine = lines.length > 0 ? lines[0] : "Saved Guide";
      const title = firstLine.replace(/[#*]/g, '').trim().substring(0, 50) || "Saved Guide";

      onSave({
        id: Date.now().toString(),
        title: title,
        content: refined,
        createdAt: new Date().toISOString(),
        tags: [userContext.topic, userContext.role]
      });

      showToast("Guide refined and saved!", 'success');
    } catch (e) {
      showToast("Failed to save guide.", 'error');
    } finally {
      setSavingMessageId(null);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the conversation?")) {
      const initMsg = createInitialMessage();
      setMessages([initMsg]);
      setInput('');
      localStorage.removeItem('edu_chat_messages');
      localStorage.removeItem('edu_chat_input');
      try {
        if (chatSessionRef.current) {
          chatSessionRef.current = createChatSession(userContext, []);
        }
      } catch (e) {
        console.error("Failed to reset session", e);
      }
      showToast("Conversation cleared.", 'info');
    }
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    showToast("Message deleted.", "info");
  };

  const cleanMarkdownForSpeech = (text: string) => {
    return text.replace(/[#_*\[\]`]/g, '').replace(/(\n\s*)+\-/g, '. ').trim();
  };

  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) {
      showToast("Text-to-speech is not supported in your browser.", "error");
      return;
    }

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanMarkdownForSpeech(text));
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
      setSpeakingMessageId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleImportGuide = (guide: SavedGuide) => {
    setAttachedGuide(guide);
    setShowImportModal(false);
    showToast(`Attached: ${guide.title}`, "info");
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      showToast("Speech recognition not supported in this browser.", 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        // Append to existing input
        setInput(prev => (prev ? prev + ' ' : '') + transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      // Ignore 'no-speech' error as it just happens if user is silent
      if (event.error !== 'no-speech') {
        showToast(`Voice input error: ${event.error}`, 'error');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-200 md:h-[calc(100vh-4rem)] md:mt-2 relative">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-2xl z-10">
        <div>
          <h2 className="font-bold text-gray-800">{userContext.topic}</h2>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            {userContext.role === UserRole.PARENT ? 'Parent Mode' : 'Student Mode'}
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            {userContext.currentLevel}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearChat}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-95"
            title="Clear Conversation"
          >
            <Trash2 size={18} />
          </button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateRoadmap}
            disabled={isGeneratingRoadmap || isLoading}
            className="shadow-sm"
          >
            {isGeneratingRoadmap ? 'Plan...' : 'Roadmap'}
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] relative group flex flex-col gap-2`}>
              <div className={`rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                }`}>
                {!msg.isStreaming && (
                  <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-gray-100">
                    {msg.role === 'model' && (
                      <>
                        <button
                          onClick={() => handleSpeak(msg.text, msg.id)}
                          className="p-1.5 bg-gray-100 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-lg active:scale-95 transition-transform"
                          title={speakingMessageId === msg.id ? "Stop Speaking" : "Listen to Response"}
                        >
                          {speakingMessageId === msg.id ? <Square size={16} /> : <Volume2 size={16} />}
                        </button>
                        <button
                          onClick={() => handleSaveToGuide(msg.text, msg.id)}
                          className="p-1.5 bg-gray-100 hover:bg-indigo-50 text-gray-500 hover:text-indigo-600 rounded-lg active:scale-95 transition-transform"
                          title="Refine & Save as Guide"
                          disabled={savingMessageId === msg.id}
                        >
                          {savingMessageId === msg.id ? (
                            <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                          ) : (
                            <Save size={16} />
                          )}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className={`p-1.5 rounded-lg active:scale-95 transition-transform ${msg.role === 'user' ? 'bg-indigo-700/50 hover:bg-indigo-700 text-indigo-100 hover:text-white' : 'bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500'}`}
                      title="Delete Message"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className="text-sm md:text-base leading-relaxed">
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <MarkdownRenderer content={msg.text} />
                  )}
                </div>
              </div>

              {/* Suggestions Rendering */}
              {msg.role === 'model' && !msg.isStreaming && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 animate-fade-in pl-2">
                  {msg.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(suggestion);
                        setTimeout(() => handleSendMessage(), 50); // Small timeout to allow input state to update
                      }}
                      className="text-xs md:text-sm bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 py-2 px-3 rounded-full transition-colors text-left active:scale-95 shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-2 md:p-4 bg-white border-t border-gray-100 rounded-b-2xl flex-shrink-0 flex flex-col gap-2">
        {attachedGuide && (
          <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-sm text-indigo-800 animate-fade-in mx-1 mt-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText size={16} className="text-indigo-500 shrink-0" />
              <span className="font-medium truncate">Attached: {attachedGuide.title}</span>
            </div>
            <button
              onClick={() => setAttachedGuide(null)}
              className="p-1 hover:bg-indigo-200 rounded-md text-indigo-600 transition-colors ml-2 shrink-0"
              title="Remove Attachment"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end w-full">
          <button
            onClick={() => setShowImportModal(true)}
            className="p-2 md:p-3 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors active:scale-95 shrink-0"
            title="Import Saved Guide"
          >
            <BookOpen size={20} />
          </button>
          <button
            onClick={toggleListening}
            className={`p-2 md:p-3 rounded-xl transition-all active:scale-95 shrink-0 ${isListening
              ? 'bg-red-50 text-red-500 border border-red-100 animate-pulse'
              : 'text-gray-500 hover:bg-gray-100'
              }`}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <textarea
            className="w-0 flex-1 px-3 py-2 md:px-4 md:py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm md:text-base min-w-[100px] resize-none overflow-y-auto"
            style={{ minHeight: '40px', maxHeight: '120px' }}
            rows={1}
            placeholder={isListening ? "Listening..." : "Ask a question..."}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // We use a timeout to let the state update if it was modified very recently (e.g., setInput from suggestion)
                setTimeout(() => handleSendMessage(), 0);
              }
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || (!input.trim() && !attachedGuide)}
            className="p-2 md:p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-100 active:scale-95 shrink-0"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80%] flex flex-col animate-fade-in">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Import Context</h3>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-gray-100 rounded-full active:scale-95">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {savedGuides.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No saved guides yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedGuides.map(guide => (
                    <button
                      key={guide.id}
                      onClick={() => handleImportGuide(guide)}
                      className="w-full text-left p-3 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all group active:scale-95"
                    >
                      <div className="font-medium text-gray-800 group-hover:text-indigo-700">{guide.title}</div>
                      <div className="text-xs text-gray-400 mt-1 flex gap-2">
                        {guide.tags.map(t => <span key={t}>#{t}</span>)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SavedPageProps {
  guides: SavedGuide[];
}

const SavedPage: React.FC<SavedPageProps> = ({ guides }) => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <div className="mt-4 md:mt-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Saved Guides</h2>
          <p className="text-gray-500">Your refined roadmaps and learning materials.</p>
        </div>
        <div className="text-sm text-gray-400">{guides.length} items</div>
      </div>

      {guides.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No saved guides yet.</p>
          <p className="text-sm text-gray-400">Chat with the AI and click the save icon to refine content.</p>
          <Link to="/chat">
            <Button variant="outline" className="mt-4">Go to Chat</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((guide) => (
            <Link key={guide.id} to={`/saved/${guide.id}`}>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group h-full flex flex-col active:scale-[0.99]">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 mb-2">
                    {guide.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] uppercase font-bold tracking-wider rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ChevronRight className="text-gray-300 group-hover:text-indigo-500 transition-colors" size={20} />
                </div>
                <h3 className="font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-indigo-700">{guide.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
                  {guide.content.substring(0, 150)}...
                </p>
                <div className="text-xs text-gray-400 pt-3 border-t border-gray-50 flex items-center gap-1">
                  <Sparkles size={12} /> Refined & Saved on {new Date(guide.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

interface SavedDetailPageProps {
  guides: SavedGuide[];
  showToast: (msg: string) => void;
}

const SavedDetailPage: React.FC<SavedDetailPageProps> = ({ guides, showToast }) => {
  const { id } = useLocation().pathname.match(/\/saved\/(?<id>.*)/)?.groups || { id: '' };
  const guide = guides.find(g => g.id === id) || guides.find(g => window.location.hash.includes(g.id));
  const navigate = useNavigate();

  if (!guide) {
    return (
      <div className="p-8 text-center">
        <p>Guide not found.</p>
        <Button onClick={() => navigate('/saved')} className="mt-4">Back to Saved</Button>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(guide.content).then(() => {
      showToast("Content copied to clipboard!");
    });
  };

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-[90vh] md:rounded-2xl shadow-sm border border-gray-200 mt-2 md:mt-8">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
        <button
          onClick={() => navigate('/saved')}
          className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm font-medium active:scale-95 transition-transform"
        >
          <ChevronRight className="rotate-180" size={16} /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg active:scale-95 transition-transform"
            title="Copy to Clipboard"
          >
            <Copy size={18} />
          </button>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{guide.title}</h1>
        <div className="flex gap-2 mb-8 text-sm text-gray-500">
          <span>{new Date(guide.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>{guide.tags.join(', ')}</span>
        </div>

        <div className="prose prose-indigo max-w-none">
          <MarkdownRenderer content={guide.content} />
        </div>
      </div>
    </div>
  );
};

export default App;