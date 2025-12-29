"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, MessageCircle, Users, User, Mic, Send, Camera, 
  AlertOctagon, Plus, Phone, Droplet, Clock, Calendar, 
  Stethoscope, Activity, ChevronRight, LogOut, Lock, 
  MapPin, Heart, Baby, Timer, Pill, Utensils, Search,
  CheckCircle, X, ArrowLeft
} from "lucide-react";

// Firebase Imports
import { db, rtdb } from "@/lib/firebase"; 
import { collection, query, orderBy, onSnapshot, addDoc, getDocs, where } from "firebase/firestore";
import { ref, set, push, onValue, update, remove } from "firebase/database";

// --- Types ---
type Theme = "pink" | "blue";
type Tab = "home" | "care" | "tools" | "community" | "profile"; 
type Message = { id?: string; role: "user" | "ai" | "doctor"; content: string; timestamp: number };
type VitalLog = { weight: string; bp: string; date: string }; // Fixed Type Definition

// --- Mock User Data (Simulated Auth) ---
const MOCK_USER = {
  uid: "rahima_123",
  name: "Rahima Begum",
  phone: "+8801700000000",
  zone: "Dhanmondi",
  gestationWeek: 24
};

export default function PatientApp() {
  // --- Global State ---
  const [user, setUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [theme, setTheme] = useState<Theme>("pink");

  // --- Auth Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(MOCK_USER); // Simulating Login
  };

  const handleLogout = () => {
    if(confirm("Sign out of Matri-Force?")) setUser(null);
  };

  // --- Dynamic Styling ---
  const colors = {
    bg: theme === "pink" ? "bg-rose-50" : "bg-sky-50",
    primary: theme === "pink" ? "bg-rose-500" : "bg-sky-600",
    text: theme === "pink" ? "text-rose-600" : "text-sky-600",
    navActive: theme === "pink" ? "text-rose-600" : "text-sky-600",
  };

  if (!user) {
    return <AuthScreen onLogin={handleLogin} colors={colors} />;
  }

  return (
    <div className={`min-h-screen ${colors.bg} flex flex-col font-sans transition-colors duration-500 pb-20`}>
      
      {/* Header */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-40">
        <div>
          <p className="text-gray-500 text-xs font-mono uppercase tracking-wider">
            Week {user.gestationWeek} • {theme === "pink" ? "Pregnancy" : "Post-Partum"}
          </p>
          <h1 className="text-xl font-bold text-gray-800">Hi, {user.name.split(' ')[0]}</h1>
        </div>
        <button onClick={() => setActiveTab("profile")} className={`h-10 w-10 rounded-full ${colors.primary} flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white`}>
          {user.name[0]}
        </button>
      </header>

      {/* Body */}
      <main className="flex-1 overflow-y-auto px-4 scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === "home" && <HomeTab key="home" user={user} colors={colors} />}
          {activeTab === "care" && <CareCenterTab key="care" user={user} colors={colors} />}
          {activeTab === "tools" && <ToolsTab key="tools" colors={colors} />}
          {activeTab === "community" && <CommunityTab key="community" user={user} colors={colors} />}
          {activeTab === "profile" && <ProfileTab key="profile" user={user} onLogout={handleLogout} colors={colors} theme={theme} setTheme={setTheme} />}
        </AnimatePresence>
      </main>

      {/* Navbar */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-100 px-2 py-3 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 rounded-t-2xl">
        <NavIcon icon={Home} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")} color={colors.navActive} />
        <NavIcon icon={Stethoscope} label="Care" active={activeTab === "care"} onClick={() => setActiveTab("care")} color={colors.navActive} />
        <NavIcon icon={Activity} label="Tools" active={activeTab === "tools"} onClick={() => setActiveTab("tools")} color={colors.navActive} />
        <NavIcon icon={Users} label="Social" active={activeTab === "community"} onClick={() => setActiveTab("community")} color={colors.navActive} />
        <NavIcon icon={User} label="Me" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} color={colors.navActive} />
      </nav>
    </div>
  );
}

// ----------------------------------------------------------------------
// 🔐 AUTH SCREEN
// ----------------------------------------------------------------------
function AuthScreen({ onLogin, colors }: any) {
  return (
    <div className={`min-h-screen ${colors.bg} flex flex-col items-center justify-center p-6`}>
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center">
        <div className={`h-16 w-16 mx-auto ${colors.primary} rounded-full flex items-center justify-center mb-4`}>
          <Heart className="text-white" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Matri-Force</h1>
        <p className="text-gray-500 text-sm mb-6">Maternal Health Super App</p>
        <form onSubmit={onLogin} className="space-y-4">
          <input type="email" placeholder="Email / Phone" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
          <input type="password" placeholder="Password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm" required />
          <button type="submit" className={`w-full ${colors.primary} text-white font-bold py-3 rounded-xl shadow-lg hover:opacity-90 transition`}>
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 🏠 HOME TAB (Dashboard + Vitals + SOS)
// ----------------------------------------------------------------------
function HomeTab({ user, colors }: any) {
  const [sosActive, setSosActive] = useState(false);
  const [vitals, setVitals] = useState<VitalLog[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLog, setNewLog] = useState({ weight: "", bp: "" });
  
  // SOS Logic (Syncs with Doctor/Driver)
  const triggerSOS = () => {
    if (!navigator.geolocation) return alert("Enable GPS!");
    navigator.geolocation.getCurrentPosition(pos => {
      set(ref(rtdb, `sos_alerts/${user.uid}`), {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        status: "RED",
        timestamp: Date.now(),
        user_name: user.name,
        phone: user.phone
      });
      setSosActive(true);
      alert("🚨 SOS Broadcasted to Nearby Doctors & Drivers!");
    });
  };

  const cancelSOS = async () => {
    if(confirm("Cancel Emergency Alert?")) {
      await remove(ref(rtdb, `sos_alerts/${user.uid}`));
      setSosActive(false);
    }
  };

  // Vitals Logic
  const saveLog = () => {
    if(!newLog.weight || !newLog.bp) return;
    const logData: VitalLog = {
      weight: newLog.weight,
      bp: newLog.bp,
      date: new Date().toISOString()
    };
    setVitals([logData, ...vitals]); 
    setShowLogModal(false);
    setNewLog({ weight: "", bp: "" });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-24">
      
      {/* Active SOS Banner */}
      {sosActive && (
        <div className="bg-red-600 text-white p-4 rounded-xl shadow-xl animate-pulse flex justify-between items-center">
          <div>
            <h3 className="font-bold flex items-center gap-2"><AlertOctagon /> HELP REQUESTED</h3>
            <p className="text-xs opacity-90">Tracking Location...</p>
          </div>
          <button onClick={cancelSOS} className="bg-white text-red-600 px-3 py-1 rounded text-xs font-bold">CANCEL</button>
        </div>
      )}

      {/* SOS Button */}
      <div className="flex justify-center py-4">
        <button
          onClick={sosActive ? () => {} : triggerSOS}
          className={`
            relative w-48 h-48 rounded-full flex items-center justify-center 
            ${sosActive ? "bg-gray-400" : "bg-gradient-to-br from-red-500 to-rose-600"} 
            shadow-2xl ring-8 ring-red-100 transition-all active:scale-95
          `}
        >
          <div className="text-center text-white z-10">
            <AlertOctagon size={48} className="mx-auto mb-2" />
            <span className="text-xl font-black tracking-widest block">SOS</span>
            <span className="text-[10px] opacity-80 uppercase tracking-wide">Emergency Only</span>
          </div>
          {!sosActive && <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>}
        </button>
      </div>

      {/* Vitals Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-rose-500" size={18} /> Health Tracker
          </h3>
          <button onClick={() => setShowLogModal(true)} className="text-xs bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-bold">+ Log Data</button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Weight</p>
            <p className="text-xl font-bold text-gray-800">{vitals[0]?.weight || "64"} <span className="text-xs font-normal text-gray-400">kg</span></p>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Blood Pressure</p>
            <p className="text-xl font-bold text-gray-800">{vitals[0]?.bp || "120/80"}</p>
          </div>
        </div>
      </div>

      {/* Add Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs p-6 rounded-2xl animate-in fade-in zoom-in">
            <h3 className="font-bold text-lg mb-4">Add Today's Vitals</h3>
            <input 
              type="number" placeholder="Weight (kg)" 
              className="w-full mb-3 p-3 bg-gray-50 rounded-xl text-sm"
              value={newLog.weight} onChange={e => setNewLog({...newLog, weight: e.target.value})}
            />
            <input 
              type="text" placeholder="BP (e.g., 120/80)" 
              className="w-full mb-4 p-3 bg-gray-50 rounded-xl text-sm"
              value={newLog.bp} onChange={e => setNewLog({...newLog, bp: e.target.value})}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowLogModal(false)} className="flex-1 py-2 bg-gray-200 rounded-xl font-bold text-gray-600">Cancel</button>
              <button onClick={saveLog} className="flex-1 py-2 bg-rose-500 rounded-xl font-bold text-white">Save</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ----------------------------------------------------------------------
// 🩺 CARE CENTER (Doctor Chat + AI)
// ----------------------------------------------------------------------
function CareCenterTab({ user }: any) {
  const [activeChat, setActiveChat] = useState<'ai' | 'doctor'>('ai');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<any>(null);

  useEffect(() => {
    if (activeChat === 'doctor') {
      const chatRef = ref(rtdb, `chats/${user.uid}`);
      const unsub = onValue(chatRef, (snapshot) => {
        const data = snapshot.val();
        if (data) setMessages(Object.values(data));
      });
      return () => unsub();
    } else {
      setMessages([{ role: "ai", content: "Hello Rahima! I am your AI assistant. How are you feeling?", timestamp: Date.now() }]);
    }
  }, [activeChat]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsg = { role: "user", content: input, timestamp: Date.now() };

    if (activeChat === 'doctor') {
      await push(ref(rtdb, `chats/${user.uid}`), newMsg);
    } else {
      setMessages(prev => [...prev, newMsg as Message]);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "ai", content: "That sounds normal. Drink plenty of water.", timestamp: Date.now() }]);
      }, 1000);
    }
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex mb-4">
        <button onClick={() => setActiveChat('ai')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeChat==='ai'?'bg-rose-100 text-rose-600':'text-gray-400'}`}>AI Assistant</button>
        <button onClick={() => setActiveChat('doctor')} className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeChat==='doctor'?'bg-emerald-100 text-emerald-600':'text-gray-400'}`}>Dr. Ayesha</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 p-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-rose-500 text-white rounded-br-none' : 'bg-white shadow-sm border border-gray-100 rounded-bl-none'}`}>
              <p>{m.content}</p>
              <p className="text-[10px] opacity-70 mt-1 text-right">{new Date(m.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-2 bg-white rounded-full shadow-lg border border-gray-100 flex gap-2 items-center mt-2">
        <input 
          className="flex-1 bg-transparent px-4 text-sm outline-none" 
          placeholder={activeChat === 'ai' ? "Ask anything..." : "Message Dr. Ayesha..."}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage} className={`p-2 rounded-full text-white ${activeChat==='ai'?'bg-rose-500':'bg-emerald-500'}`}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 🛠️ TOOLS TAB (Functional Tools)
// ----------------------------------------------------------------------
function ToolsTab({ colors }: any) {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [kickCount, setKickCount] = useState(0);

  const tools = [
    { id: "kick", icon: Baby, label: "Kick Counter", desc: "Track movement" },
    { id: "hosp", icon: MapPin, label: "Find Hospital", desc: "Google Maps" },
    { id: "sched", icon: Calendar, label: "Scheduler", desc: "Book Visit" },
    { id: "meds", icon: Pill, label: "Meds", desc: "Reminders" },
  ];

  const renderToolContent = () => {
    switch(activeTool) {
      case "kick":
        return (
          <div className="text-center p-6">
            <h3 className="text-xl font-bold mb-4">Baby Kicks Today</h3>
            <div className="text-6xl font-black text-rose-500 mb-6">{kickCount}</div>
            <button onClick={() => setKickCount(c => c + 1)} className="w-full bg-rose-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition">TAP TO COUNT</button>
            <button onClick={() => setKickCount(0)} className="mt-4 text-xs text-gray-400">Reset</button>
          </div>
        );
      case "hosp":
        return (
          <div className="text-center p-6">
             <MapPin size={48} className="mx-auto text-rose-500 mb-4"/>
             <h3 className="font-bold text-lg mb-2">Find Nearby Care</h3>
             <p className="text-sm text-gray-500 mb-6">This will open Google Maps to show hospitals near you.</p>
             <button onClick={() => window.open("https://www.google.com/maps/search/hospitals+near+me", "_blank")} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Open Maps</button>
          </div>
        );
      case "sched":
         return (
           <div className="p-4">
             <h3 className="font-bold mb-4">Book Appointment</h3>
             <input type="date" className="w-full p-3 bg-gray-50 rounded-xl mb-4" />
             <input type="time" className="w-full p-3 bg-gray-50 rounded-xl mb-4" />
             <button onClick={() => alert("Request sent to Doctor!")} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold">Schedule Now</button>
           </div>
         );
      default: return <p>Select a tool</p>;
    }
  }

  return (
    <div className="space-y-4">
      {/* Tool Modal */}
      {activeTool && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="bg-gray-50 p-3 flex justify-between items-center border-b">
               <h3 className="font-bold text-gray-700 capitalize">{tools.find(t=>t.id===activeTool)?.label}</h3>
               <button onClick={() => setActiveTool(null)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20}/></button>
             </div>
             {renderToolContent()}
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-gray-800">Pregnancy Toolkit</h2>
      <div className="grid grid-cols-2 gap-3">
        {tools.map((t) => (
          <button key={t.id} onClick={() => setActiveTool(t.id)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2 hover:bg-gray-50 transition active:scale-95">
            <div className={`h-12 w-12 rounded-full ${colors.bg} flex items-center justify-center text-gray-700`}>
              <t.icon size={24} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-800">{t.label}</h3>
              <p className="text-[10px] text-gray-400">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 👥 COMMUNITY TAB
// ----------------------------------------------------------------------
function CommunityTab({ user }: any) {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const postsRef = ref(rtdb, 'community_posts');
    onValue(postsRef, (snap) => {
      const data = snap.val();
      if(data) setPosts(Object.values(data));
      else {
        setPosts([
          { title: "Iron Tablets?", author: "Fatima", content: "Which brand is best?", likes: 12 },
          { title: "Swollen Feet", author: "Nusrat", content: "Is this normal at 30 weeks?", likes: 8 },
        ]);
      }
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-800">Mayer Kotha</h2>
        <button className="bg-rose-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-md">+ New Post</button>
      </div>
      <div className="space-y-3">
        {posts.map((p, i) => (
          <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">{p.title}</h3>
            <p className="text-xs text-gray-400 mb-2">by {p.author}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{p.content}</p>
            <div className="mt-3 flex gap-4 text-xs text-gray-400">
              <button className="flex items-center gap-1 hover:text-rose-500"><Heart size={12}/> {p.likes} Likes</button>
              <button className="flex items-center gap-1 hover:text-blue-500"><MessageCircle size={12}/> Reply</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 👤 PROFILE TAB
// ----------------------------------------------------------------------
function ProfileTab({ user, onLogout, theme, setTheme }: any) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-center">
        <div className="h-20 w-20 bg-rose-100 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-rose-500">
          {user.name[0]}
        </div>
        <h2 className="font-bold text-lg">{user.name}</h2>
        <p className="text-sm text-gray-500">{user.phone} • {user.zone}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button onClick={() => setTheme(theme==='pink'?'blue':'pink')} className="w-full p-4 flex justify-between items-center hover:bg-gray-50 border-b border-gray-50">
          <span className="text-sm font-medium">Switch Mode ({theme==='pink'?'Pregnancy':'Post-Partum'})</span>
          <ChevronRight size={16} className="text-gray-400"/>
        </button>
        <button className="w-full p-4 flex justify-between items-center hover:bg-gray-50 border-b border-gray-50">
          <span className="text-sm font-medium">Medical History</span>
          <ChevronRight size={16} className="text-gray-400"/>
        </button>
        <button onClick={onLogout} className="w-full p-4 flex justify-between items-center hover:bg-red-50 text-red-500">
          <span className="text-sm font-bold">Sign Out</span>
          <LogOut size={16}/>
        </button>
      </div>
    </div>
  );
}

// --- Helper Component ---
function NavIcon({ icon: Icon, label, active, onClick, color }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 w-16 transition-all active:scale-95">
      <Icon size={24} className={active ? color : "text-gray-300"} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-[10px] font-medium ${active ? color : "text-gray-400"}`}>{label}</span>
    </button>
  );
}