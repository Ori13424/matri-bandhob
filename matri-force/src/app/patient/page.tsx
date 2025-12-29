"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, MessageCircle, Users, User, Send, Camera, 
  AlertOctagon, ShoppingBag, Stethoscope, 
  ChevronRight, LogOut, Heart, Smartphone,
  Shield, FileText, Phone, UploadCloud
} from "lucide-react";

// Firebase Imports
import { db, rtdb, auth } from "@/lib/firebase"; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  updateProfile 
} from "firebase/auth";
import { 
  collection, doc, setDoc, getDoc, 
  addDoc, query, orderBy, getDocs 
} from "firebase/firestore";
import { ref, set, push } from "firebase/database";

// --- Types ---
type Tab = "home" | "care" | "nutrition" | "community" | "profile";
type UserMode = "mother" | "guardian";
type AppState = "welcome" | "auth" | "app"; // New state for flow control

export default function PatientApp() {
  const [appState, setAppState] = useState<AppState>("welcome");
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
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserData(docSnap.data());
        setAppState("app"); // Auto-redirect to app if logged in
      } else {
        setUser(null);
        setUserData(null);
        // If not logged in, we stay on 'welcome' or 'auth' depending on user action
        if (appState === "app") setAppState("welcome");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [appState]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white text-rose-500 font-bold">Loading Matri-Force...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: WELCOME SCREEN */}
        {appState === "welcome" && (
          <WelcomeScreen onStart={() => setAppState("auth")} key="welcome" />
        )}

        {/* VIEW 2: AUTH SCREEN (Sign In/Up) */}
        {appState === "auth" && (
          <AuthScreen 
            onBack={() => setAppState("welcome")} 
            key="auth" 
          />
        )}

        {/* VIEW 3: MAIN APP DASHBOARD */}
        {appState === "app" && user && (
          <MainApp 
            user={user} 
            userData={userData} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            userMode={userMode} 
            setUserMode={setUserMode}
          />
        )}

      </AnimatePresence>
    </div>
  );
}

// =========================================================================
// 👋 WELCOME SCREEN (New Landing Page)
// =========================================================================
function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-rose-50 to-white relative overflow-hidden"
    >
      {/* Decoration Circles */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-rose-200 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-30"></div>

      <div className="w-full max-w-sm text-center z-10">
        <div className="h-24 w-24 mx-auto bg-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-rose-100 ring-4 ring-rose-50">
          <Heart className="text-rose-500 fill-rose-500" size={48} />
        </div>
        
        <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Matri-Force</h1>
        <p className="text-slate-500 text-lg mb-12">Safe Motherhood, Smart Care.</p>

        <button 
          onClick={onStart}
          className="w-full bg-rose-500 text-white font-bold text-lg py-5 rounded-2xl shadow-lg shadow-rose-200 hover:bg-rose-600 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
        >
          <span>I am a Mother</span>
          <ChevronRight size={20} className="opacity-80"/>
        </button>

        <p className="mt-6 text-xs text-slate-400">
          Powered by AI & Community Support
        </p>
      </div>
    </motion.div>
  );
}

// =========================================================================
// 🔐 AUTH SCREEN (Fixed UI Colors)
// =========================================================================
function AuthScreen({ onBack }: { onBack: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
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
        await setDoc(doc(db, "users", res.user.uid), {
          name, email, phone, role: "patient", gestationWeek: 12, createdAt: new Date().toISOString()
        });
      }
      // AppState handles redirection in parent
    } catch (err: any) {
      setError("Error: " + err.message.replace("Firebase: ", ""));
    }
  };

  return (
    <motion.div 
      initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
      className="min-h-screen bg-white flex flex-col p-6"
    >
      <button onClick={onBack} className="self-start p-2 -ml-2 text-slate-400 hover:text-slate-600 mb-4">
        Back
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <h2 className="text-3xl font-black text-slate-800 mb-2">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-slate-500 mb-8">
          {isLogin ? "Sign in to monitor your health" : "Join Matri-Force today"}
        </p>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
             <>
               {/* FIXED: Dark Text on Light Background */}
               <input type="text" placeholder="Full Name" 
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors"
                 value={name} onChange={e=>setName(e.target.value)} required 
               />
               <input type="tel" placeholder="Phone Number" 
                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors"
                 value={phone} onChange={e=>setPhone(e.target.value)} required 
               />
             </>
          )}
          
          <input type="email" placeholder="Email Address" 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors"
            value={email} onChange={e=>setEmail(e.target.value)} required 
          />
          
          <input type="password" placeholder="Password" 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors"
            value={password} onChange={e=>setPassword(e.target.value)} required 
          />
          
          {error && <p className="text-rose-500 text-sm bg-rose-50 p-3 rounded-lg border border-rose-100">{error}</p>}
          
          <button type="submit" className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-rose-600 transition-all mt-4">
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-slate-500 text-sm hover:text-rose-500 font-medium">
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// =========================================================================
// 📱 MAIN APP COMPONENT (Dashboard)
// =========================================================================
function MainApp({ user, userData, activeTab, setActiveTab, userMode, setUserMode }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-screen pb-20">
      
      {/* HEADER */}
      <header className="px-5 pt-8 pb-4 bg-white shadow-sm flex justify-between items-center sticky top-0 z-40">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            {userMode === 'mother' ? `Week ${userData?.gestationWeek || 24} • Pregnancy` : "Guardian Mode Active"}
          </p>
          <h1 className="text-xl font-black text-slate-800">
            {userMode === 'mother' ? `Hi, ${user.displayName?.split(' ')[0] || 'Mother'}` : "Household Tasks"}
          </h1>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setUserMode((prev:any) => prev === 'mother' ? 'guardian' : 'mother')}
             className={`px-3 py-1 rounded-full text-xs font-bold border ${userMode === 'guardian' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}
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
    </motion.div>
  );
}

// =========================================================================
// 🏠 HOME TAB
// =========================================================================
function HomeTab({ user, userData, mode }: { user: any, userData: any, mode: UserMode }) {
  const [sosActive, setSosActive] = useState(false);

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
        const smsBody = `EMERGENCY! I need help. Location Code: ${encryptedLoc}.`;
        window.open(`sms:01711000000?body=${encodeURIComponent(smsBody)}`, '_self');
      }
    });
  };

  if (mode === "guardian") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100">
           <h2 className="text-lg font-bold text-sky-900 mb-2">Guardian Tasks</h2>
           <p className="text-sm text-sky-700 mb-4">Daily responsibilities.</p>
           <div className="space-y-3">
             {["Buy Iron Tablets (Folison)", "Ensure 2L Water Intake", "Prepare Hospital Bag"].map((task, i) => (
               <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm">
                 <div className="h-6 w-6 rounded-full border-2 border-sky-500" />
                 <span className="text-slate-700 font-medium">{task}</span>
               </div>
             ))}
           </div>
        </div>
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
          <h2 className="text-lg font-bold text-rose-900 mb-2">Emergency</h2>
          <button onClick={triggerSOS} className="w-full py-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
            <AlertOctagon /> TRIGGER SOS FOR PATIENT
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col items-center justify-center py-2">
         <button
          onClick={sosActive ? () => setSosActive(false) : triggerSOS}
          className={`relative w-48 h-48 rounded-full flex items-center justify-center ${sosActive ? "bg-slate-600" : "bg-gradient-to-br from-rose-500 to-red-600"} shadow-2xl shadow-rose-200 ring-4 ring-white transition-all active:scale-95`}
        >
          <div className="text-center text-white z-10 flex flex-col items-center">
            <Shield size={40} className="mb-1" />
            <span className="text-2xl font-black tracking-widest block">SOS</span>
            {navigator.onLine ? 
               <span className="text-[10px] bg-white/20 px-2 rounded-full mt-1">ONLINE MODE</span> : 
               <span className="text-[10px] bg-yellow-400 text-black font-bold px-2 rounded-full mt-1 flex gap-1 items-center"><Smartphone size={8}/> SMS FALLBACK</span>
            }
          </div>
          {!sosActive && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20"></span>}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Next Checkup</p>
            <h3 className="text-slate-800 font-bold">Oct 24</h3>
            <p className="text-xs text-rose-500">Square Hospital</p>
         </div>
         <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Kick Count</p>
            <h3 className="text-slate-800 font-bold">12 Kicks</h3>
            <p className="text-xs text-emerald-500">Active Baby</p>
         </div>
      </div>
    </motion.div>
  );
}

// =========================================================================
// 🩺 CARE TAB (Symptom Cam + Fresh Chat)
// =========================================================================
function CareTab({ user }: { user: any }) {
  const [messages, setMessages] = useState<any[]>([]); 
  const [input, setInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [riskAlert, setRiskAlert] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setRiskAlert("Pre-eclampsia Signs Detected: High Swelling");
        sendMessage("System: User uploaded a symptom photo. AI Analysis: High Swelling/Risk.");
      }, 2000);
    }
  };

  const sendMessage = async (text: string = input) => {
    if (!text.trim()) return;
    const newMsg = { role: "user", content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    await push(ref(rtdb, `chats/${user.uid}`), newMsg);
    await addDoc(collection(db, "users", user.uid, "chat_history"), {
      content: text, role: "user", timestamp: new Date().toISOString()
    });
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] space-y-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
          <Camera size={18} className="text-rose-500"/> AI Symptom Check
        </h3>
        {riskAlert ? (
           <div className="bg-red-50 p-3 rounded-xl border border-red-100 flex items-center justify-between">
             <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <AlertOctagon size={16}/> {riskAlert}
             </div>
             <button onClick={() => setRiskAlert(null)} className="text-xs underline text-red-500">Dismiss</button>
           </div>
        ) : (
          <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
             <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
             {analyzing ? <span className="text-rose-500 font-bold animate-pulse">AI Analysis in Progress...</span> : <span className="text-slate-400 text-sm flex items-center gap-2"><UploadCloud size={16}/> Upload Photo</span>}
          </label>
        )}
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-100 text-center">
           <span className="text-xs font-bold text-slate-500 uppercase">Live Doctor Consult</span>
           <p className="text-[10px] text-slate-400">Previous chats stored in Settings</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && <p className="text-center text-slate-300 text-sm mt-10">Start a new conversation...</p>}
          {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[85%] p-3 text-sm rounded-2xl ${m.role === 'user' ? 'bg-rose-500 text-white rounded-br-none' : 'bg-slate-100 text-slate-800'}`}>
                 {m.content}
               </div>
             </div>
          ))}
        </div>
        <div className="p-3 border-t border-slate-100 flex gap-2">
          <input className="flex-1 bg-slate-50 px-4 rounded-full text-sm outline-none border border-transparent focus:border-rose-300 text-slate-900" 
            placeholder="Type message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={() => sendMessage()} className="p-2 bg-rose-500 rounded-full text-white shadow-lg shadow-rose-200"><Send size={18}/></button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// 🥦 NUTRITION & 👥 COMMUNITY & 👤 PROFILE
// =========================================================================
function NutritionTab() {
  const recommendations = [
    { item: "Spinach (Palong Shak)", price: "20৳", benefit: "High Iron", replace: "Apples (280৳)" },
    { item: "Lentils (Dal)", price: "110৳", benefit: "Protein", replace: "Chicken (190৳)" },
  ];
  return (
    <div className="space-y-4">
       <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-100 text-white">
          <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><ShoppingBag/> Smart Market Guide</h2>
          <p className="text-emerald-100 text-sm">Save money, eat healthy.</p>
       </div>
       <h3 className="font-bold text-slate-700 ml-1">Today's Smart Buys</h3>
       <div className="space-y-3">
         {recommendations.map((rec, i) => (
           <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
             <div>
               <h4 className="font-bold text-slate-800">{rec.item}</h4>
               <p className="text-emerald-600 text-xs font-bold">{rec.price} / kg</p>
               <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded mt-1 inline-block">{rec.benefit}</span>
             </div>
             <div className="text-right">
               <p className="text-[10px] text-slate-400">Instead of</p>
               <p className="text-xs text-red-400 line-through">{rec.replace}</p>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
}

function CommunityTab({ user }: { user: any }) {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, "community_posts"), orderBy("createdAt", "desc"));
    getDocs(q).then(snap => {
      const list = snap.docs.map(d => d.data());
      setPosts(list.length ? list : [{title:"No posts yet", content: "Be the first to share!", author: "Admin"}]);
    });
  }, []);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black text-slate-800">Maa-to-Maa Forum</h2>
        <button className="bg-rose-500 text-white text-xs px-4 py-2 rounded-full font-bold shadow-md hover:bg-rose-600">+ Post</button>
      </div>
      <div className="space-y-3">
        {posts.map((p, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-1">{p.title}</h3>
            <p className="text-slate-600 text-sm mb-3 leading-relaxed">{p.content}</p>
            <div className="text-xs text-slate-400 flex justify-between">
               <span>@{p.author}</span>
               <span>{p.likes || 0} Likes</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileTab({ user, userData, logout }: any) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const fetchHistory = async () => {
    setHistoryOpen(true);
    const q = query(collection(db, "users", user.uid, "chat_history"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(d => d.data()));
  };

  if (historyOpen) {
    return (
      <div className="space-y-4">
        <button onClick={() => setHistoryOpen(false)} className="flex items-center gap-2 text-slate-500 font-bold mb-4">
           <ChevronRight className="rotate-180"/> Back to Settings
        </button>
        <h2 className="font-bold text-slate-800">Chat Archive</h2>
        <div className="space-y-2">
           {history.map((h, i) => (
             <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 text-sm">
               <p className="text-slate-800">{h.content}</p>
               <p className="text-[10px] text-slate-400 mt-1">{new Date(h.timestamp).toLocaleString()}</p>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
       <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
          <div className="h-20 w-20 bg-slate-100 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-slate-500">
             {user.displayName?.[0]}
          </div>
          <h2 className="font-bold text-lg text-slate-900">{user.displayName}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
       </div>
       <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <button onClick={fetchHistory} className="w-full p-4 flex justify-between items-center hover:bg-slate-50 border-b border-slate-50">
             <span className="text-sm font-bold text-slate-700 flex items-center gap-3"><FileText size={18} className="text-rose-500"/> Chat History</span>
             <ChevronRight size={16} className="text-slate-300"/>
          </button>
          <button onClick={logout} className="w-full p-4 flex justify-between items-center hover:bg-red-50 text-red-500">
             <span className="text-sm font-bold flex items-center gap-3"><LogOut size={18}/> Sign Out</span>
          </button>
       </div>
    </div>
  );
}

function NavIcon({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 w-16 transition-all active:scale-95">
      <Icon size={24} className={active ? "text-rose-500" : "text-slate-300"} strokeWidth={active ? 2.5 : 2} />
      <span className={`text-[10px] font-bold ${active ? "text-rose-500" : "text-slate-400"}`}>{label}</span>
    </button>
  );
}