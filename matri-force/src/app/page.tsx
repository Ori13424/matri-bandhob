"use client";

import Link from "next/link";
import { 
  HeartHandshake, Stethoscope, Ambulance, 
  ChevronRight, Activity, ShieldCheck, Users 
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-emerald-50 to-transparent -z-10" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-rose-100 rounded-full blur-3xl opacity-50 -z-10" />
      <div className="absolute top-40 -left-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />

      {/* Navbar */}
      <nav className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
            M
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">
            Matri-Force
          </span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-emerald-600">About</a>
          <a href="#" className="hover:text-emerald-600">Impact</a>
          <a href="#" className="hover:text-emerald-600">Contact</a>
        </div>
        <Link 
          href="/auth/login" 
          className="px-5 py-2 bg-white border border-slate-200 rounded-full text-sm font-semibold hover:shadow-md transition"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-5xl mx-auto w-full">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live in 64 Districts
          </span>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
            Safe Motherhood for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
              Every Rural Family
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Connecting mothers with nearby doctors, ambulances, and blood donors in seconds. AI-powered care that speaks your language.
          </p>
        </motion.div>

        {/* --- ROLE SELECTION GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          
          {/* Card 1: Patient */}
          <RoleCard 
            href="/patient"
            title="I am a Mother"
            desc="Get AI advice, track pregnancy, and request emergency help."
            icon={HeartHandshake}
            theme="pink"
            delay={0.1}
          />

          {/* Card 2: Doctor */}
          <RoleCard 
            href="/doctor"
            title="I am a Doctor"
            desc="Monitor high-risk patients and manage emergency dispatch."
            icon={Stethoscope}
            theme="dark"
            delay={0.2}
          />

          {/* Card 3: Driver */}
          <RoleCard 
            href="/driver"
            title="I am a Driver"
            desc="Receive ride requests and navigate to patients instantly."
            icon={Ambulance}
            theme="yellow"
            delay={0.3}
          />

        </div>

      </main>

      {/* Footer / Trust Indicators */}
      <footer className="py-12 border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">
            © 2025 Matri-Force Initiative. Built for Bangladesh 🇧🇩
          </p>
          <div className="flex gap-8">
            <Stat icon={Users} value="12k+" label="Mothers" />
            <Stat icon={Activity} value="99.9%" label="Uptime" />
            <Stat icon={ShieldCheck} value="Secure" label="HIPAA Ready" />
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function RoleCard({ href, title, desc, icon: Icon, theme, delay }: any) {
  const themes = {
    pink: "bg-rose-50 border-rose-100 hover:border-rose-300 text-rose-900",
    dark: "bg-slate-900 border-slate-800 hover:border-emerald-500 text-white shadow-2xl",
    yellow: "bg-yellow-50 border-yellow-100 hover:border-yellow-300 text-yellow-900",
  };

  const iconColors = {
    pink: "bg-rose-200 text-rose-700",
    dark: "bg-emerald-500/20 text-emerald-400",
    yellow: "bg-yellow-200 text-yellow-700",
  };

  // Safe access to theme keys
  const activeTheme = themes[theme as keyof typeof themes];
  const activeIcon = iconColors[theme as keyof typeof iconColors];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Link href={href} className={`block p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg h-full ${activeTheme}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${activeIcon}`}>
          <Icon size={24} />
        </div>
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          {title} 
          <ChevronRight size={16} className="opacity-50" />
        </h3>
        <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
          {desc}
        </p>
      </Link>
    </motion.div>
  );
}

function Stat({ icon: Icon, value, label }: any) {
  return (
    <div className="flex items-center gap-2 text-slate-500">
      <Icon size={16} />
      <span className="font-bold text-slate-700">{value}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}