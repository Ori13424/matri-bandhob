"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, Stethoscope, Ambulance, ChevronRight, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 flex flex-col items-center justify-center p-6 font-sans text-slate-900 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-rose-100 rounded-full blur-3xl opacity-40 animate-pulse delay-1000"></div>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="text-center mb-12 z-10"
      >
        <div className="flex justify-center mb-4">
          <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-rose-100 ring-4 ring-rose-50 transform rotate-3">
             <Heart className="text-rose-500 fill-rose-500" size={40} />
          </div>
        </div>
        <h1 className="text-5xl font-black text-slate-800 tracking-tight mb-3">
          Matri-Force
        </h1>
        <p className="text-lg text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
          The Smart Maternal Health Safety Net for Bangladesh.
        </p>
      </motion.div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl z-10">
        
        {/* OPTION 1: MOTHER */}
        <RoleCard 
          href="/patient"
          title="I am a Mother"
          desc="Access care, SOS & advice"
          icon={Heart}
          color="rose"
          delay={0.1}
        />

        {/* OPTION 2: DOCTOR */}
        <RoleCard 
          href="/doctor"
          title="I am a Doctor"
          desc="Monitor & Triage Patients"
          icon={Stethoscope}
          color="emerald"
          delay={0.2}
        />

        {/* OPTION 3: DRIVER */}
        <RoleCard 
          href="/driver"
          title="I am a Driver"
          desc="Ambulance & Emergency"
          icon={Ambulance}
          color="blue"
          delay={0.3}
        />

      </div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.5 }}
        className="mt-16 text-center z-10"
      >
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
          <ShieldCheck size={14} />
          <span>Secure & Encrypted Platform</span>
        </div>
      </motion.div>
    </div>
  );
}

// --- Helper Component for Cards ---
function RoleCard({ href, title, desc, icon: Icon, color, delay }: any) {
  const colorStyles: any = {
    rose: "hover:border-rose-400 hover:shadow-rose-100 group-hover:bg-rose-500 group-hover:text-white",
    emerald: "hover:border-emerald-400 hover:shadow-emerald-100 group-hover:bg-emerald-500 group-hover:text-white",
    blue: "hover:border-blue-400 hover:shadow-blue-100 group-hover:bg-blue-500 group-hover:text-white"
  };

  const iconColors: any = {
    rose: "text-rose-500",
    emerald: "text-emerald-500",
    blue: "text-blue-500"
  };

  return (
    <Link href={href} className="block w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay }}
        className={`
          group relative bg-white p-8 rounded-3xl shadow-sm border border-slate-100 
          transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer
          flex flex-col items-center text-center h-full justify-center
          ${colorStyles[color]}
        `}
      >
        <div className={`
          h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4 
          transition-colors duration-300 group-hover:bg-white/20
          ${iconColors[color]} group-hover:text-white
        `}>
          <Icon size={32} />
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-white transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 group-hover:text-white/80 transition-colors">
          {desc}
        </p>

        <div className="mt-6 h-8 w-8 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-white/30 group-hover:text-white transition-all">
           <ChevronRight size={16} />
        </div>
      </motion.div>
    </Link>
  );
}