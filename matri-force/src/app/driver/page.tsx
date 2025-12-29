"use client";

import React, { useState, useEffect } from "react";
import { Navigation, Bell, MapPin, CheckCircle, XCircle } from "lucide-react";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";

// Hardcoded Driver ID for Demo
const DRIVER_ID = "driver_01"; 

export default function DriverApp() {
  const [status, setStatus] = useState("online");
  const [request, setRequest] = useState<any>(null);

  useEffect(() => {
    // Listen to my own driver profile
    const myRef = ref(rtdb, `drivers/${DRIVER_ID}`);
    const unsub = onValue(myRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStatus(data.status);
        if (data.status === 'busy' && data.assignedTo) {
          // Fetch the patient location if assigned
          // Simplified: In real app, we would fetch the patient data here
          setRequest({
            patientId: data.assignedTo,
            address: "Dhanmondi 32, Dhaka", // Mock address
            distance: "2.4 km",
            lat: 23.7461,
            lng: 90.3742
          });
        } else {
          setRequest(null);
        }
      }
    });
    return () => unsub();
  }, []);

  const handleAccept = () => {
    // Open Google Maps
    if (request) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${request.lat},${request.lng}`, '_blank');
    }
  };

  const handleComplete = async () => {
    await update(ref(rtdb, `drivers/${DRIVER_ID}`), {
      status: "online",
      assignedTo: null
    });
    setRequest(null);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      
      {/* Header */}
      <div className="p-6 bg-yellow-400 text-black flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black uppercase">Gram-Amb</h1>
          <p className="text-xs font-bold opacity-75">DRIVER PARTNER</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status === 'online' ? 'bg-black text-white' : 'bg-red-600 text-white'}`}>
          {status}
        </div>
      </div>

      {/* Main Status Area */}
      <main className="flex-1 p-6 flex flex-col justify-center">
        
        {request ? (
          // --- ACTIVE REQUEST VIEW ---
          <div className="bg-gray-900 rounded-3xl p-6 border-2 border-red-500 animate-pulse-slow">
            <div className="flex items-center gap-3 text-red-500 mb-6">
              <Bell className="animate-bounce" />
              <span className="font-bold text-xl">EMERGENCY RIDE</span>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <p className="text-gray-400 text-xs uppercase">Pick Up</p>
                <p className="text-xl font-bold">{request.address}</p>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-gray-400 text-xs uppercase">Distance</p>
                  <p className="text-lg font-bold text-yellow-400">{request.distance}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase">Passenger</p>
                  <p className="text-lg font-bold">Expecting Mother</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleAccept}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mb-3"
            >
              <Navigation /> START NAVIGATION
            </button>
            
            <button 
              onClick={handleComplete}
              className="w-full py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold text-lg flex items-center justify-center gap-2 text-green-500"
            >
              <CheckCircle /> COMPLETE RIDE
            </button>
          </div>
        ) : (
          // --- IDLE VIEW ---
          <div className="text-center space-y-6">
            <div className="w-40 h-40 mx-auto rounded-full border-4 border-gray-800 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gray-800 animate-pulse flex items-center justify-center">
                <MapPin size={40} className="text-gray-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">You are Online</h2>
              <p className="text-gray-500">Waiting for emergency requests...</p>
            </div>
          </div>
        )}

      </main>

      {/* Toggle Status */}
      <div className="p-6">
         <button 
           className="w-full py-4 bg-gray-900 rounded-xl text-gray-400 font-bold border border-gray-800"
           onClick={() => setStatus(status === 'online' ? 'offline' : 'online')}
         >
           {status === 'online' ? 'GO OFFLINE' : 'GO ONLINE'}
         </button>
      </div>
    </div>
  );
}