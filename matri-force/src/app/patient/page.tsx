"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, MessageCircle, Users, User, Send, Camera, 
  AlertOctagon, ShoppingBag, Stethoscope, 
  ChevronRight, LogOut, Heart, Smartphone,
  Shield, FileText, Phone, UploadCloud, ArrowLeft,
  Wallet, Droplet, Footprints, Timer, Pill, Trash2,
  CheckCircle, Plus, Globe, Bell, Map
} from "lucide-react";
import Link from "next/link"; 

// Firebase Imports
import { db, rtdb, auth } from "@/lib/firebase"; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged, 
  signOut,
  updateProfile 
} from "firebase/auth";
import { 
  collection, doc, setDoc, getDoc, 
  addDoc, query, orderBy, getDocs, deleteDoc, where, onSnapshot 
} from "firebase/firestore";
import { ref, set, push, onValue, update, remove, increment } from "firebase/database";

// --- Types ---
type Tab = "home" | "care" | "nutrition" | "community" | "profile";
type UserMode = "mother" | "guardian";
type ChatMode = "ai" | "doctor";

export default function PatientApp() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [userMode, setUserMode] = useState<UserMode>("mother");

  // --- Auth Listener ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch extended User Data (Profile + Savings)
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        // Realtime Savings Listener
        const savingsRef = ref(rtdb, `users/${currentUser.uid}/savings`);
        onValue(savingsRef, (snap) => {
           const savings = snap.val();
           setUserData((prev: any) => ({ ...prev, ...docSnap.data(), savings: savings || { current: 0, goal: 5000 } }));
        });

      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white text-rose-500 font-bold animate-pulse">Loading Matri-Force...</div>;

  if (!user) return <AuthScreen />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col pb-20">
      
      {/* HEADER */}
      <header className="px-5 pt-8 pb-4 bg-white shadow-sm flex justify-between items-center sticky top-0 z-40">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            {userMode === 'mother' ? `Week ${userData?.gestationWeek || 24} • Pregnancy` : "Guardian Mode • Active"}
          </p>
          <h1 className="text-xl font-black text-slate-800">
            {userMode === 'mother' ? `Hi, ${user.displayName?.split(' ')[0] || 'Mother'}` : "Family Support"}
          </h1>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setUserMode((prev) => prev === 'mother' ? 'guardian' : 'mother')}
             className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${userMode === 'guardian' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
           >
             {userMode === 'mother' ? 'Guardian Mode' : 'Exit Mode'}
           </button>
           <button onClick={() => setActiveTab("profile")} className="h-10 w-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white">
             {user.displayName?.[0] || "U"}
           </button>
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeTab === "home" && <HomeTab key="home" user={user} userData={userData} mode={userMode} />}
          {activeTab === "care" && <CareTab key="care" user={user} />}
          {activeTab === "nutrition" && <NutritionTab key="nutrition" />}
          {activeTab === "community" && <CommunityTab key="community" user={user} />}
          {activeTab === "profile" && <ProfileTab key="profile" user={user} userData={userData} logout={() => signOut(auth)} />}
        </AnimatePresence>
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 px-2 py-3 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 rounded-t-2xl">
        <NavIcon icon={Home} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
        <NavIcon icon={Stethoscope} label="Care" active={activeTab === "care"} onClick={() => setActiveTab("care")} />
        <NavIcon icon={ShoppingBag} label="Diet" active={activeTab === "nutrition"} onClick={() => setActiveTab("nutrition")} />
        <NavIcon icon={Users} label="Forum" active={activeTab === "community"} onClick={() => setActiveTab("community")} />
        <NavIcon icon={User} label="Settings" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
      </nav>
    </div>
  );
}

// =========================================================================
// 🔐 AUTH SCREEN
// =========================================================================
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(res.user, { displayName: name });
        
        // Init User in Firestore
        await setDoc(doc(db, "users", res.user.uid), {
          name, email, role: "patient", gestationWeek: 12, createdAt: new Date().toISOString()
        });
        
        // Init Savings in RTDB
        await set(ref(rtdb, `users/${res.user.uid}/savings`), { current: 0, goal: 5000 });
      }
    } catch (err: any) {
      setError("Error: " + err.message.replace("Firebase: ", ""));
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-6 animate-in fade-in">
      <Link href="/" className="self-start p-2 -ml-2 text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1">
        <ArrowLeft size={16}/> Back
      </Link>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="h-16 w-16 bg-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-200">
           <Heart className="text-white" size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">{isLogin ? "Welcome Back" : "Join Matri-Force"}</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
             <input type="text" placeholder="Full Name" className="auth-input" value={name} onChange={e=>setName(e.target.value)} required />
          )}
          <input type="email" placeholder="Email Address" className="auth-input" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="auth-input" value={password} onChange={e=>setPassword(e.target.value)} required />
          
          {error && <p className="text-rose-500 text-sm bg-rose-50 p-3 rounded-lg border border-rose-100 font-medium">{error}</p>}
          <button type="submit" className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all mt-4">{isLogin ? "Sign In" : "Create Account"}</button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="text-slate-500 text-sm hover:text-rose-500 font-medium mt-6 text-center w-full block">
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
}

// =========================================================================
// 🏠 HOME TAB (Dashboard + Mayer Bank + Tools)
// =========================================================================
function HomeTab({ user, userData, mode }: { user: any, userData: any, mode: UserMode }) {
  const [sosActive, setSosActive] = useState(false);
  const [waterCount, setWaterCount] = useState(0);
  const [kickCount, setKickCount] = useState(0);

  // Mayer Bank Logic
  const savings = userData?.savings || { current: 0, goal: 5000 };
  const percentage = Math.min(100, (savings.current / savings.goal) * 100);

  const addDeposit = async () => {
    await update(ref(rtdb, `users/${user.uid}/savings`), {
      current: increment(50)
    });
  };

  const triggerSOS = () => {
    if (!navigator.geolocation) return alert("Enable GPS!");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      if (navigator.onLine) {
        await set(ref(rtdb, `sos_alerts/${user.uid}`), {
          lat: latitude, lng: longitude, status: "RED", timestamp: Date.now(), user_name: user.displayName, phone: userData?.phone || "N/A"
        });
        setSosActive(true);
      } else {
        const encryptedLoc = `SOS_LAT_${latitude}_LONG_${longitude}`;
        window.open(`sms:01711000000?body=${encodeURIComponent(`EMERGENCY! Loc: ${encryptedLoc}`)}`, '_self');
      }
    });
  };

  // Guardian Mode
  if (mode === "guardian") {
    return (
      <div className="space-y-4 animate-in slide-in-from-bottom-5">
        <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100">
           <h2 className="text-lg font-bold text-sky-900 mb-2 flex items-center gap-2"><CheckCircle size={18}/> Dad's Checklist</h2>
           <div className="space-y-3">
             {["Buy Iron Tablets (Folison)", "Ensure 2L Water Intake", "Pack Hospital Bag", "Check Blood Pressure"].map((task, i) => (
               <label key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm cursor-pointer">
                 <input type="checkbox" className="h-5 w-5 rounded text-sky-500 focus:ring-sky-500" />
                 <span className="text-slate-700 font-medium">{task}</span>
               </label>
             ))}
           </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
           <div>
              <h3 className="font-bold text-slate-800">Nearest Hospital</h3>
              <p className="text-xs text-slate-500">Dhaka Medical College (2.3km)</p>
           </div>
           <button onClick={() => window.open("https://maps.google.com/?q=hospital", "_blank")} className="bg-blue-600 text-white p-3 rounded-xl"><Map size={20}/></button>
        </div>

        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
          <h2 className="text-lg font-bold text-rose-900 mb-2">Emergency Override</h2>
          <button onClick={triggerSOS} className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
            <AlertOctagon /> TRIGGER SOS
          </button>
        </div>
      </div>
    );
  }

  // Mother Mode
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5">
      
      {/* 💰 Mayer Bank */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-3xl shadow-lg shadow-emerald-100 text-white relative overflow-hidden">
         <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
               <h2 className="font-bold text-lg flex items-center gap-2"><Wallet/> Mayer Bank</h2>
               <span className="text-xs bg-white/20 px-2 py-1 rounded">Goal: ৳{savings.goal}</span>
            </div>
            <div className="mb-4">
               <p className="text-3xl font-black">৳ {savings.current}</p>
               <p className="text-emerald-100 text-xs">Saved for emergency</p>
            </div>
            <div className="w-full bg-black/20 h-2 rounded-full mb-4">
               <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
            </div>
            <button onClick={addDeposit} className="w-full bg-white text-emerald-700 font-bold py-3 rounded-xl shadow-sm hover:bg-emerald-50 active:scale-95 transition-all">
               + Deposit ৳50
            </button>
         </div>
         <Wallet size={120} className="absolute -bottom-6 -right-6 text-white/10 rotate-12" />
      </div>

      {/* 🚨 SOS Button */}
      <div className="flex justify-center">
         <button
          onClick={sosActive ? () => setSosActive(false) : triggerSOS}
          className={`relative w-40 h-40 rounded-full flex items-center justify-center ${sosActive ? "bg-slate-600" : "bg-gradient-to-b from-rose-500 to-rose-600"} shadow-2xl shadow-rose-200 ring-4 ring-white transition-all active:scale-95`}
        >
          <div className="text-center text-white z-10 flex flex-col items-center">
            <Shield size={32} className="mb-1" />
            <span className="text-xl font-black tracking-widest block">SOS</span>
            <span className="text-[10px] opacity-80 uppercase font-bold mt-1">{navigator.onLine ? "Online" : "SMS Mode"}</span>
          </div>
          {!sosActive && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20"></span>}
        </button>
      </div>

      {/* 🧬 Research-Based Tools */}
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-2">
               <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Droplet size={18}/></div>
               <span className="text-xl font-bold text-slate-800">{waterCount}/8</span>
            </div>
            <p className="text-xs text-slate-500 font-bold mb-2">Hydration Log</p>
            <button onClick={()=>setWaterCount(c=>c+1)} className="w-full py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold">+ 1 Glass</button>
         </div>

         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-2">
               <div className="p-2 bg-rose-50 text-rose-500 rounded-lg"><Footprints size={18}/></div>
               <span className="text-xl font-bold text-slate-800">{kickCount}</span>
            </div>
            <p className="text-xs text-slate-500 font-bold mb-2">Kick Counter</p>
            <button onClick={()=>setKickCount(c=>c+1)} className="w-full py-1 bg-rose-100 text-rose-600 rounded-lg text-xs font-bold">+ 1 Kick</button>
         </div>
      </div>
    </div>
  );
}

// =========================================================================
// 🩺 CARE TAB (AI & Doctor Modes)
// =========================================================================
function CareTab({ user }: { user: any }) {
  const [mode, setMode] = useState<ChatMode>("ai");
  const [messages, setMessages] = useState<any[]>([]); 
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Switch Modes = Clear Chat (Privacy)
  useEffect(() => { setMessages([]); }, [mode]);

  // Doctor Chat Listener
  useEffect(() => {
    if (mode === "doctor") {
      const chatRef = ref(rtdb, `chats/${user.uid}`);
      return onValue(chatRef, (snap) => {
        const data = snap.val();
        if (data) setMessages(Object.values(data));
      });
    }
  }, [mode, user.uid]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input, timestamp: Date.now() };
    
    // UI Update
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    if (mode === "ai") {
      // 🤖 Call Gemini API
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({ message: userMsg.content })
        });
        const data = await res.json();
        setMessages(prev => [...prev, { role: "ai", content: data.reply, timestamp: Date.now() }]);
      } catch (e) {
        setMessages(prev => [...prev, { role: "ai", content: "Network error. Try again.", timestamp: Date.now() }]);
      }
      setIsTyping(false);
    } else {
      // 👨‍⚕️ Send to Doctor (RTDB)
      await push(ref(rtdb, `chats/${user.uid}`), userMsg);
      setIsTyping(false); // Doctor reply is async
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      {/* Toggle */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
        <button onClick={() => setMode("ai")} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${mode==='ai'?'bg-rose-500 text-white':'text-slate-500'}`}>
           <Smartphone size={16}/> Ask AI
        </button>
        <button onClick={() => setMode("doctor")} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${mode==='doctor'?'bg-emerald-500 text-white':'text-slate-500'}`}>
           <Stethoscope size={16}/> Live Doctor
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {messages.length === 0 && (
             <div className="text-center mt-20 opacity-50">
               {mode === 'ai' ? <Smartphone size={40} className="mx-auto mb-2 text-rose-300"/> : <Stethoscope size={40} className="mx-auto mb-2 text-emerald-300"/>}
               <p className="text-sm font-bold text-slate-400">Start conversation with {mode === 'ai' ? "AI" : "Dr. Ayesha"}</p>
             </div>
           )}
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] p-3 text-sm rounded-2xl ${
                 m.role === 'user' ? 'bg-slate-800 text-white rounded-br-none' : 
                 mode === 'ai' ? 'bg-rose-50 text-rose-900 rounded-bl-none' : 'bg-emerald-50 text-emerald-900 rounded-bl-none'
               }`}>
                 {m.content}
               </div>
             </div>
           ))}
           {isTyping && <p className="text-xs text-slate-400 animate-pulse ml-2">Typing...</p>}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-100 flex gap-2 bg-slate-50">
          <input className="flex-1 bg-white px-4 rounded-full text-sm outline-none border border-slate-200 focus:border-rose-300 text-slate-900 h-10" 
            placeholder={mode === 'ai' ? "Ask about symptoms..." : "Message doctor..."} 
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={() => sendMessage()} className={`h-10 w-10 flex items-center justify-center rounded-full text-white shadow-lg ${mode==='ai'?'bg-rose-500':'bg-emerald-500'}`}><Send size={18}/></button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 🥦 NUTRITION TAB (Real Firestore Data)
// =========================================================================
function NutritionTab() {
  const [plans, setPlans] = useState<any[]>([]);
  
  // Real Data Seed (If Firestore is empty, we show this)
  const defaultPlans = [
    { name: "Iron Boost", foods: ["Spinach (Palong)", "Liver (Kolija)", "Lentils"], cost: "Low", benefit: "Prevents Anemia" },
    { name: "Protein Power", foods: ["Eggs", "Chicken", "Beans"], cost: "Medium", benefit: "Baby Growth" },
    { name: "Calcium Rich", foods: ["Milk", "Small Fish (Mola)", "Yogurt"], cost: "Medium", benefit: "Bone Strength" }
  ];

  useEffect(() => {
    // Attempt to fetch from Firestore 'diet_plans'
    // If you haven't created this collection yet, it will map defaultPlans
    const fetchDiet = async () => {
       const q = query(collection(db, "diet_plans"));
       const snap = await getDocs(q);
       if (!snap.empty) setPlans(snap.docs.map(d => d.data()));
       else setPlans(defaultPlans);
    };
    fetchDiet();
  }, []);

  return (
    <div className="space-y-4">
       <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-100 text-white">
          <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><ShoppingBag/> Smart Market Guide</h2>
          <p className="text-emerald-100 text-sm">Real-time suggestions based on local availability.</p>
       </div>

       <h3 className="font-bold text-slate-700 ml-1">Recommended Plans</h3>
       <div className="space-y-3">
         {plans.map((p, i) => (
           <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800">{p.name}</h4>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded font-bold">{p.benefit}</span>
             </div>
             <div className="flex flex-wrap gap-2 mb-2">
                {p.foods.map((f:string, j:number) => (
                   <span key={j} className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100">{f}</span>
                ))}
             </div>
             <p className="text-xs text-slate-400">Est. Cost: {p.cost}</p>
           </div>
         ))}
       </div>
    </div>
  );
}

// =========================================================================
// 👥 COMMUNITY TAB (Add/Delete Posts)
// =========================================================================
function CommunityTab({ user }: { user: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "" });

  useEffect(() => {
    const q = query(collection(db, "community_posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!newPost.title || !newPost.content) return;
    await addDoc(collection(db, "community_posts"), {
       title: newPost.title,
       content: newPost.content,
       author: user.displayName,
       authorId: user.uid,
       createdAt: new Date().toISOString(),
       likes: 0
    });
    setIsCreating(false);
    setNewPost({ title: "", content: "" });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this post?")) await deleteDoc(doc(db, "community_posts", id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-slate-800">Maa-to-Maa Forum</h2>
        <button onClick={() => setIsCreating(!isCreating)} className="bg-rose-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-md hover:bg-rose-600">
          {isCreating ? "Cancel" : "+ New Post"}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-100 animate-in fade-in">
           <input className="w-full mb-2 p-2 border border-slate-200 rounded-lg text-sm outline-none" placeholder="Title" value={newPost.title} onChange={e=>setNewPost({...newPost, title: e.target.value})} />
           <textarea className="w-full mb-2 p-2 border border-slate-200 rounded-lg text-sm outline-none" rows={3} placeholder="Share your experience..." value={newPost.content} onChange={e=>setNewPost({...newPost, content: e.target.value})} />
           <button onClick={handlePost} className="w-full bg-slate-800 text-white py-2 rounded-lg text-xs font-bold">Post Now</button>
        </div>
      )}

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative group">
            <h3 className="font-bold text-slate-800 text-sm mb-1">{p.title}</h3>
            <p className="text-slate-600 text-sm mb-3 leading-relaxed">{p.content}</p>
            <div className="text-xs text-slate-400 flex justify-between items-center">
               <span>@{p.author}</span>
               {p.authorId === user.uid && (
                 <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================================
// 👤 PROFILE / SETTINGS TAB (Advanced)
// =========================================================================
function ProfileTab({ user, userData, logout }: any) {
  return (
    <div className="space-y-5 animate-in slide-in-from-right-5">
       <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-rose-600"></div>
          <div className="h-20 w-20 bg-slate-100 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-slate-500">
             {user.displayName?.[0]}
          </div>
          <h2 className="font-bold text-lg text-slate-900">{user.displayName}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
       </div>

       <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <SettingRow icon={FileText} label="Medical ID Card" color="text-blue-500" />
          <SettingRow icon={Globe} label="Language (Bangla/Eng)" color="text-purple-500" />
          <SettingRow icon={Bell} label="Notifications" color="text-orange-500" />
          <SettingRow icon={Shield} label="Privacy & Data" color="text-slate-500" />
          
          <button onClick={logout} className="w-full p-4 flex justify-between items-center hover:bg-red-50 text-red-500 border-t border-slate-50">
             <span className="text-sm font-bold flex items-center gap-3"><LogOut size={18}/> Sign Out</span>
          </button>
       </div>
    </div>
  );
}

function SettingRow({ icon: Icon, label, color }: any) {
  return (
    <button className="w-full p-4 flex justify-between items-center hover:bg-slate-50 border-b border-slate-50 last:border-0">
       <span className="text-sm font-bold text-slate-700 flex items-center gap-3"><Icon size={18} className={color}/> {label}</span>
       <ChevronRight size={16} className="text-slate-300"/>
    </button>
  );
}

// --- Helper ---
function NavIcon({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 w-16 transition-all active:scale-95">
      <Icon size={24} className={active ? "text-rose-500" : "text-slate-300"} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-[10px] font-bold ${active ? "text-rose-500" : "text-slate-400"}`}>{label}</span>
    </button>
  );
}

// Styling for inputs
const inputStyle = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition-all";