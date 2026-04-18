import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CreditCard, Activity, BarChart3, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== 'placeholder') 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

function App() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // For testing purposes, if no supabase client, show dashboard directly or a mock session
  const showDashboard = !supabase || session;

  if (!showDashboard) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0f] items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#12121a] p-8 rounded-xl border border-[#2a2a3a]">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-[#ff6b35] flex items-center justify-center font-bold text-white text-xl">C</div>
            <span className="font-bold text-2xl tracking-tight">ChurnAI</span>
          </div>
          <Auth 
            supabaseClient={supabase} 
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: { background: '#ff6b35', color: 'white', border: 'none' },
                anchor: { color: '#6b6b8a' },
                divider: { background: '#2a2a3a' },
                input: { background: '#1a1a26', border: '1px solid #2a2a3a', color: 'white' },
                label: { color: '#6b6b8a' }
              }
            }} 
            theme="dark"
            providers={[]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Sidebar */}
      <div className="w-64 border-r border-[#2a2a3a] p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ff6b35] flex items-center justify-center font-bold text-white">C</div>
          <span className="font-bold text-lg tracking-tight">ChurnAI</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
          <NavItem icon={<Activity size={18} />} label="Active Sequences" />
          <NavItem icon={<CreditCard size={18} />} label="Payment Gateway" />
          <NavItem icon={<BarChart3 size={18} />} label="Analytics" />
          <NavItem icon={<SettingsIcon size={18} />} label="Settings" />
        </nav>

        <div className="mt-auto">
          <button 
            onClick={() => supabase?.auth.signOut()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-[#6b6b8a] hover:bg-[#12121a] hover:text-white"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 overflow-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">AI Churn Recovery Dashboard</h1>
            <p className="text-[#6b6b8a] text-sm mt-1">
              {session ? `Logged in as ${session.user.email}` : 'Connected to Supabase'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#00d4aa22] text-[#00d4aa] text-[10px] font-bold px-2 py-1 rounded-full border border-[#00d4aa33] tracking-widest uppercase">
              Lemon Squeezy Active
            </span>
            <button className="bg-[#12121a] hover:bg-[#1a1a26] text-white border border-[#2a2a3a] px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
              <SettingsIcon size={16} />
              Setup Webhook
            </button>
          </div>
        </header>

        <Dashboard />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${active ? 'bg-[#1a1a26] text-white' : 'text-[#6b6b8a] hover:bg-[#12121a] hover:text-white'}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export default App;
