/**
 * @file TeacherEntry.tsx
 * @description Production-grade entry screen for HEY Teacher Mode.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LiquidButton, LiquidInput } from '../components/ui/LiquidComponents';

export default function TeacherEntry() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsAnalyzing(true);
    
    // Simulate AI routing for 1.5 seconds
    setTimeout(() => {
      const lowerInput = input.toLowerCase();
      let subject = 'General';
      let color = '#9CA3AF';
      
      if (lowerInput.includes('chem')) {
        subject = 'Chemistry';
        color = '#10B981';
      } else if (lowerInput.includes('math')) {
        subject = 'Math';
        color = '#4A9EFF';
      } else if (lowerInput.includes('art')) {
        subject = 'Art';
        color = '#F59E0B';
      }

      // Save the subject and color to localStorage
      localStorage.setItem('hey_subject', subject);
      localStorage.setItem('hey_color', color);
      
      // CRITICAL FIX: Tell the DashboardDispatcher that Teacher Mode is active
      localStorage.setItem('hey_teacher_active', 'true');
      
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[#0A0B0F] relative overflow-hidden font-sans">
      {/* Liquid Glass Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4A9EFF] opacity-[0.07] blur-[120px] rounded-full pointer-events-none" />
      
      <div className="z-10 w-full max-w-2xl px-6 flex flex-col items-center">
        <h1 className="text-[#F5F6F8] text-4xl font-bold mb-8 tracking-tight text-center">
          What do you teach?
        </h1>
        
        {isAnalyzing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-[#2A2D35] border-t-[#4A9EFF] rounded-full animate-spin" />
            <p className="text-[#9CA3AF] text-lg font-medium">Analyzing curriculum...</p>
          </div>
        ) : (
          <form onSubmit={handleEntry} className="w-full flex gap-4">
            <LiquidInput 
              placeholder="e.g., High School Chemistry..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              className="text-2xl py-6"
              autoFocus
            />
            <LiquidButton type="submit" className="px-8 text-lg">
              Enter
            </LiquidButton>
          </form>
        )}
      </div>
    </div>
  );
}