"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, MessageCircle, Users, User, Mic, Send, Camera, 
  AlertOctagon, Plus, Phone, Droplet, Clock, Calendar, 
  Stethoscope, Activity, ChevronRight
} from "lucide-react";

// Firebase Imports
import { db, rtdb } from "@/lib/firebase"; 
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { ref, set, push, onValue } from "firebase/database";

// --- Types ---
type Theme = "pink" | "blue";
type Tab = "home" | "care" | "community" | "profile"; // Renamed 'ai' to 'care'
type Message = { role: "user" | "ai" | "doctor"; content: string; image?: string; timestamp?: number };

// --- Mock User ID for Demo ---
const USER_ID = "rahima_123"; 

export default function PatientApp() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [theme, setTheme] = useState<Theme>("pink");

  // Dynamic Theme Colors
  const colors = {
    bg: theme === "pink" ? "bg-gradient-to-br from-pink-50 to-rose-100" : "bg-gradient-to-br from-blue-50 to-sky-100",
    primary: theme === "pink" ? "bg-rose-500" : "bg-blue-600",
    primaryText: theme === "pink" ? "text-rose-600" : "text-blue-600",
    navActive: theme === "pink" ? "text-rose-600" : "text-blue-600",
    card: "bg-white/80 backdrop-blur-md border border-white/50 shadow-sm",
  };

  return (
    <div className={`min-h-screen ${colors.bg} flex flex-col font-sans transition-colors duration-500`}>
      
      {/* Dynamic Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <h1 className="text-2xl font-bold text-gray-800">
            Good Morning, Rahima
          </h1>
        </div>
        <div className={`h-10 w-10 rounded-full ${colors.primary} flex items-center justify-center text-white font-bold shadow-lg`}>
          R
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === "home" && <HomeTab key="home" colors={colors} />}
          {activeTab === "care" && <CareCenterTab key="care" colors={colors} />}
          {activeTab === "community" && <CommunityTab key="community" colors={colors} />}
          {activeTab === "profile" && <ProfileTab key="profile" colors={colors} theme={theme} setTheme={setTheme} />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <NavIcon icon={Home} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")} color={colors.navActive} />
        <NavIcon icon={Stethoscope} label="Care Center" active={activeTab === "care"} onClick={() => setActiveTab("care")} color={colors.navActive} />
        <NavIcon icon={Users} label="Community" active={activeTab === "community"} onClick={() => setActiveTab("community")} color={colors.navActive} />
        <NavIcon icon={User} label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} color={colors.navActive} />
      </nav>
    </div>
  );
}

// --- TAB 1: HOME (Dashboard + SOS + Wallet + Vitals) ---
function HomeTab({ colors }: { colors: any }) {
  const [balance, setBalance] = useState(500);
  const [sosActive, setSosActive] = useState(false);
  const sosTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // SOS Logic
  const startSOS = () => {
    setSosActive(true);
    sosTimeoutRef.current = setTimeout(triggerEmergency, 3000); 
  };

  const cancelSOS = () => {
    setSosActive(false);
    if (sosTimeoutRef.current) clearTimeout(sosTimeoutRef.current);
  };

  const triggerEmergency = () => {
    if (!navigator.geolocation) return alert("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set(ref(rtdb, `sos_alerts/${USER_ID}`), {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          status: "RED",
          timestamp: Date.now(),
        });
        alert("🚨 SOS SENT! Doctors notified.");
        setSosActive(false);
      },
      () => alert("Location access denied.")
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      
      {/* Appointment Card (New Feature) */}
      <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Next Checkup</p>
          <h3 className="font-bold text-gray-800">Dr. Ayesha Siddiqua</h3>
          <p className="text-sm text-purple-600 font-medium">Tomorrow, 10:00 AM</p>
        </div>
        <div className="h-10 w-10 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
          <Calendar size={20} />
        </div>
      </div>

      {/* SOS Module */}
      <div className="flex flex-col items-center justify-center py-2">
        <button
          onMouseDown={startSOS}
          onMouseUp={cancelSOS}
          onMouseLeave={cancelSOS}
          onTouchStart={startSOS}
          onTouchEnd={cancelSOS}
          className={`
            relative w-40 h-40 rounded-full flex items-center justify-center 
            bg-gradient-to-b from-red-500 to-red-600 shadow-xl 
            transition-transform duration-200 active:scale-95
          `}
        >
          <span className="absolute w-full h-full rounded-full bg-red-500 opacity-20 animate-ping"></span>
          <span className={`absolute w-full h-full rounded-full border-4 border-white/30 transition-all duration-[3000ms] ${sosActive ? "scale-100" : "scale-100"}`} style={{ clipPath: sosActive ? "circle(100%)" : "circle(0%)" }}></span>
          
          <div className="flex flex-col items-center text-white z-10 pointer-events-none">
            <AlertOctagon size={40} className="mb-1" />
            <span className="font-bold text-base">SOS</span>
            <span className="text-[10px] opacity-80">Hold 3s</span>
          </div>
        </button>
      </div>

      {/* Vitals Tracker (New Feature) */}
      <div className={`p-5 rounded-xl ${colors.card}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Activity size={18} className="text-rose-500" /> Health Log
          </h3>
          <button className="text-xs bg-white border px-2 py-1 rounded shadow-sm">+ Add Log</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Weight</p>
            <p className="text-xl font-bold text-gray-800">62 <span className="text-xs font-normal">kg</span></p>
            <p className="text-[10px] text-emerald-500">+0.5kg this week</p>
          </div>
          <div className="bg-white/60 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-500">Blood Pressure</p>
            <p className="text-xl font-bold text-gray-800">120/80</p>
            <p className="text-[10px] text-emerald-500">Normal</p>
          </div>
        </div>
      </div>

      {/* Wallet Preview */}
      <div className={`p-5 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-gray-400">Mayer Bank Balance</p>
            <h3 className="text-2xl font-bold mt-1">৳ {balance}</h3>
          </div>
          <button onClick={() => setBalance(b => b + 100)} className="bg-white/20 p-2 rounded-lg hover:bg-white/30"><Plus size={18} /></button>
        </div>
      </div>

    </motion.div>
  );
}

// --- TAB 2: CARE CENTER (AI + DOCTOR CHAT) ---
function CareCenterTab({ colors }: { colors: any }) {
  const [mode, setMode] = useState<'bot' | 'doctor'>('bot');

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-[calc(100vh-180px)] flex flex-col">
      {/* Toggle Header */}
      <div className="bg-white/50 p-1 rounded-xl flex mb-4 border border-white/50">
        <button 
          onClick={() => setMode('bot')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'bot' ? 'bg-white shadow-sm text-rose-600' : 'text-gray-500'}`}
        >
          Ask AI Assistant
        </button>
        <button 
          onClick={() => setMode('doctor')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'doctor' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500'}`}
        >
          Chat with Doctor
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative rounded-2xl bg-white/40 border border-white/50 shadow-inner">
         {mode === 'bot' ? <AIChatModule colors={colors} /> : <DoctorChatModule />}
      </div>
    </motion.div>
  );
}

// --- Sub-Module: AI Chat (Existing) ---
function AIChatModule({ colors }: { colors: any }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I am your AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Local AI / OpenAI connection
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ message: userMsg.content })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", content: data.message }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", content: "Connection error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
              m.role === "user" ? "bg-rose-500 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && <p className="text-xs text-gray-500 p-4">AI is thinking...</p>}
      </div>
      <div className="p-3 bg-white border-t flex gap-2">
        <input 
          className="flex-1 bg-gray-100 rounded-full px-4 text-sm outline-none" 
          placeholder="Ask about symptoms..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} className="p-2 bg-rose-500 rounded-full text-white"><Send size={18} /></button>
      </div>
    </div>
  );
}

// --- Sub-Module: Doctor Chat (New & Connected) ---
function DoctorChatModule() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    // Realtime Listener for Doctor Messages
    const chatRef = ref(rtdb, `chats/${USER_ID}`);
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data) as Message[];
        // Simple sort by timestamp if available, else standard order
        setMessages(list);
      }
    });
    return () => unsubscribe();
  }, []);

  const sendToDoctor = async () => {
    if (!input.trim()) return;
    const msg: Message = { role: "user", content: input, timestamp: Date.now() };
    
    // Optimistic UI Update
    // setMessages(prev => [...prev, msg]); // Optional, the listener handles it fast enough usually
    
    // Send to Firebase Realtime DB
    await push(ref(rtdb, `chats/${USER_ID}`), msg);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="p-3 bg-emerald-600 text-white flex items-center gap-3 shadow-md z-10">
        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
          <Stethoscope size={16} />
        </div>
        <div>
          <h3 className="text-sm font-bold">Dr. Ayesha (Online)</h3>
          <p className="text-[10px] opacity-80">Usually replies in 5 mins</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center mt-10 opacity-50 text-sm">
            <p>Start a consultation...</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
              m.role === "user" 
                ? "bg-emerald-600 text-white rounded-br-none" 
                : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
            }`}>
              {m.role === 'doctor' && <span className="block text-[10px] font-bold text-emerald-600 mb-1">Dr. Ayesha</span>}
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white border-t flex gap-2">
        <input 
          className="flex-1 bg-gray-100 rounded-full px-4 text-sm outline-none" 
          placeholder="Message doctor..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendToDoctor()}
        />
        <button onClick={sendToDoctor} className="p-2 bg-emerald-600 rounded-full text-white"><Send size={18} /></button>
      </div>
    </div>
  );
}

// --- TAB 3: COMMUNITY ---
function CommunityTab({ colors }: { colors: any }) {
  // Static content for display
  const posts = [
    { title: "Best Iron Tablets?", author: "Fatima", content: "Doctor suggested Folison, is it good?", likes: 12 },
    { title: "Warning Signs", author: "Dr. Ayesha", content: "If feet swell suddenly, please visit clinic.", likes: 45 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-gray-800">Mayer Kotha</h2>
        <button className="text-xs bg-white border px-3 py-1 rounded-full text-gray-600">Top Posts</button>
      </div>
      <div className="space-y-3">
        {posts.map((post, i) => (
          <div key={i} className={`p-4 rounded-xl ${colors.card}`}>
            <h3 className="font-bold text-gray-800 text-sm">{post.title}</h3>
            <p className="text-xs text-gray-500 mb-2">by {post.author}</p>
            <p className="text-sm text-gray-600">{post.content}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// --- TAB 4: PROFILE ---
function ProfileTab({ colors, theme, setTheme }: { colors: any, theme: Theme, setTheme: any }) {
  const toggleTheme = () => setTheme(theme === "pink" ? "blue" : "pink");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className={`p-4 rounded-xl ${colors.card} flex items-center justify-between`}>
        <div>
          <h3 className="font-bold text-gray-800">App Mode</h3>
          <p className="text-xs text-gray-500">{theme === "pink" ? "Pregnancy Care" : "Child Care"}</p>
        </div>
        <button onClick={toggleTheme} className={`px-4 py-2 rounded-lg text-sm font-bold text-white ${theme === "pink" ? "bg-rose-400" : "bg-blue-500"}`}>
          {theme === "pink" ? "Switch to Baby" : "Switch to Mom"}
        </button>
      </div>
    </motion.div>
  );
}

// --- HELPER COMPONENTS ---
function NavIcon({ icon: Icon, label, active, onClick, color }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 w-14 transition-all">
      <Icon size={24} className={active ? color : "text-gray-400"} />
      <span className={`text-[10px] font-medium ${active ? color : "text-gray-400"}`}>{label}</span>
    </button>
  );
}