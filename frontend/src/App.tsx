import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LayoutDashboard,
  Activity,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Zap,
  Bell,
  Shield,
  Globe,
  Cpu,
  Clock,
  Search,
  Layers,
  ChevronRight,
  Radio,
  Terminal
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { supabase } from './lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

// Navigation configuration
const NAV_ITEMS = [
  { id: 'Dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'Sequences', label: 'Recovery Queue', icon: Layers },
  { id: 'Rules', label: 'AI Strategies', icon: Zap },
  { id: 'Performance', label: 'Analytics', icon: BarChart3 },
];

function App() {
  const [session, setSession] = useState<any>(null);
  const [init, setInit] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setInit(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInit(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("Check your email for verification.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  const handleSync = async () => {
    if (!supabase) return;
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await axios.post(`${API_URL}/api/sync`, {}, {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
      }
      // Trigger a refresh by re-rendering
      window.location.reload();
    } catch (err) {
      console.error('Sync failed:', err);
    }
    setSyncing(false);
  };

  // Loading screen
  if (!init) return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 tech-grid opacity-50"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/[0.03] blur-[150px] rounded-full pointer-events-none"></div>

      <div className="flex flex-col items-center gap-8 relative z-10 animate-fade-in">
        <div className="w-16 h-16 rounded-lg bg-[#0e0e14] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
          <Terminal size={28} className="text-amber-500" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="status-dot status-online status-pulse"></div>
            <span className="text-[11px] text-[#52525b] font-mono tracking-widest uppercase">System Boot</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Login screen
  if (supabase && !session) {
    return (
      <div className="flex min-h-screen bg-[#050507] items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 tech-grid opacity-30"></div>
        <div className="absolute top-[15%] left-[20%] w-[400px] h-[400px] bg-amber-500/[0.04] blur-[150px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[15%] right-[20%] w-[300px] h-[300px] bg-emerald-500/[0.03] blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-[380px] relative z-10">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-lg bg-[#0e0e14] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mb-5">
              <Terminal size={26} className="text-amber-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Churn<span className="text-[#52525b]">Recovery</span></h1>
            <p className="text-[#52525b] text-xs mt-1.5 font-mono">Dunning Automation System v2.4</p>
          </div>

          {/* Form card */}
          <div className="bg-[#0e0e14] border border-[rgba(255,255,255,0.06)] rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="operator@company.io"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="label">Access Token</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-500/[0.08] border border-red-500/[0.15]">
                  <p className="text-red-400 text-xs font-mono">{error}</p>
                </div>
              )}
              {message && (
                <div className="p-3 rounded-md bg-emerald-500/[0.08] border border-emerald-500/[0.15]">
                  <p className="text-emerald-400 text-xs font-mono">{message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Radio size={14} className="animate-pulse" />
                    Authenticating...
                  </span>
                ) : (
                  'Access Console'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.04)] text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
                className="text-[#52525b] hover:text-[#a1a1aa] text-xs font-mono transition-colors"
              >
                {isSignUp ? '← Return to login' : '+ Create new organization'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-[#27272a] text-[10px] font-mono">Protected by enterprise-grade security</p>
          </div>
        </div>
      </div>
    );
  }

  // Main app layout
  return (
    <div className="flex h-screen bg-[#050507] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-[rgba(255,255,255,0.04)] bg-[#09090d] shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-[rgba(255,255,255,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#0e0e14] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
              <Terminal size={18} className="text-amber-500" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-sm font-semibold">Churn<span className="text-[#52525b]">Recovery</span></span>
              <span className="text-[9px] text-[#27272a] font-mono block ml-1">v2.4.0</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500/[0.08] text-amber-500 border border-amber-500/[0.15]'
                    : 'text-[#a1a1aa] hover:text-white hover:bg-[rgba(255,255,255,0.02)] border border-transparent'
                }`}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span className="text-[13px] font-medium">{item.label}</span>
                {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
              </button>
            );
          })}

          <div className="h-px bg-[rgba(255,255,255,0.04)] my-4"></div>

          <button
            onClick={() => setActiveTab('Settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-left transition-all duration-200 ${
              activeTab === 'Settings'
                ? 'bg-amber-500/[0.08] text-amber-500 border border-amber-500/[0.15]'
                : 'text-[#a1a1aa] hover:text-white hover:bg-[rgba(255,255,255,0.02)] border border-transparent'
            }`}
          >
            <SettingsIcon size={18} strokeWidth={1.5} />
            <span className="text-[13px] font-medium">Configuration</span>
            {activeTab === 'Settings' && <ChevronRight size={14} className="ml-auto opacity-50" />}
          </button>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.04)] bg-[#070709]">
          <div className="flex items-center gap-3 p-3 rounded-md bg-[#0e0e14] border border-[rgba(255,255,255,0.04)]">
            <div className="w-8 h-8 rounded bg-[#14141c] flex items-center justify-center text-[#52525b] text-xs font-mono font-semibold">
              {session?.user.email?.[0].toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate text-[#a1a1aa]">{session?.user.email?.split('@')[0] || 'Admin'}</p>
              <p className="text-[9px] text-[#52525b] flex items-center gap-1.5">
                <span className="status-dot status-online"></span>
                Online
              </p>
            </div>
          </div>
          <button
            onClick={() => supabase?.auth.signOut()}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-md text-[#52525b] hover:text-[#a1a1aa] hover:bg-[rgba(255,255,255,0.02)] transition-all text-[11px] font-mono"
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 px-6 flex items-center justify-between border-b border-[rgba(255,255,255,0.04)] bg-[#050507]/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-semibold text-[#52525b] uppercase tracking-widest">{activeTab}</h2>
            <div className="h-4 w-px bg-[rgba(255,255,255,0.04)]"></div>
            <div className="flex items-center gap-2">
              <span className={`status-dot ${!supabase ? 'status-offline' : 'status-online'} status-pulse`}></span>
              <span className="text-[10px] text-[#52525b] font-mono uppercase">{!supabase ? 'Demo Mode' : 'Live'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#27272a]" size={14} />
              <input
                className="bg-[#0e0e14] border border-[rgba(255,255,255,0.04)] rounded-md py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-amber-500/[0.3] w-48 placeholder:text-[#27272a]"
                placeholder="Search records..."
              />
            </div>
            <div className="h-6 w-px bg-[rgba(255,255,255,0.04)]"></div>
            <button className="p-2 rounded-md text-[#52525b] hover:text-white hover:bg-[rgba(255,255,255,0.02)] transition-colors">
              <Bell size={16} />
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="btn btn-primary text-xs py-1.5 px-3"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="absolute inset-0 tech-grid opacity-[0.2] pointer-events-none"></div>

          <div className="p-6 relative z-10">
            {activeTab === 'Dashboard' && <Dashboard />}
            {activeTab === 'Sequences' && <SequencesView />}
            {activeTab === 'Rules' && <RulesView />}
            {activeTab === 'Performance' && <PerformanceView />}
            {activeTab === 'Settings' && <SettingsView />}
          </div>
        </div>
      </main>
    </div>
  );
}

// Sequences view
function SequencesView() {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">Recovery Queue</h2>
          <p className="text-[#52525b] text-sm mt-1">Active failed payment sequences</p>
        </div>
        <button className="btn btn-secondary text-xs">
          <Activity size={14} /> Refresh
        </button>
      </div>

      <div className="card p-16 text-center">
        <div className="w-16 h-16 rounded-lg bg-[#14141c] border border-[rgba(255,255,255,0.04)] flex items-center justify-center mx-auto mb-5">
          <Layers size={24} className="text-[#27272a]" />
        </div>
        <h3 className="text-[#52525b] font-medium">No active sequences</h3>
        <p className="text-[#27272a] text-sm mt-2 max-w-sm mx-auto">Waiting for failed payment webhooks from your payment provider.</p>
      </div>
    </div>
  );
}

// Rules/AI Strategies view
function RulesView() {
  const [strategies, setStrategies] = useState({
    smartTiming: true,
    adaptiveTone: true,
    globalSync: true,
    llmEngine: true,
    maxAttempts: 4,
    defaultTone: 'gentle'
  });

  const handleToggle = (key: string) => {
    setStrategies(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  const features = [
    { icon: Clock, title: 'Smart Timing', desc: 'AI calculates optimal retry windows based on 14 behavioral data points.', key: 'smartTiming' },
    { icon: Shield, title: 'Adaptive Tone', desc: 'Automatic voice modulation between 4 modes based on customer engagement.', key: 'adaptiveTone' },
    { icon: Globe, title: 'Global Sync', desc: 'Timezone-aware delivery scheduling for maximum open rates.', key: 'globalSync' },
    { icon: Cpu, title: 'LLM Engine', desc: 'Advanced language model verification for all outbound communications.', key: 'llmEngine' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-xl font-semibold">AI Recovery Strategies</h2>
        <p className="text-[#52525b] text-sm mt-1">Configure intelligent recovery logic</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          const enabled = strategies[feature.key as keyof typeof strategies];
          return (
            <div
              key={feature.title}
              className={`card p-6 hover:border-[rgba(255,255,255,0.12)] transition-all ${enabled ? 'border-amber-500/30' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-[#14141c] border border-[rgba(255,255,255,0.04)] flex items-center justify-center shrink-0">
                  <Icon size={18} className={enabled ? 'text-amber-500' : 'text-[#27272a]'} strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{feature.title}</h3>
                    <button
                      onClick={() => handleToggle(feature.key)}
                      className={`w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-amber-500' : 'bg-[#27272a]'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <p className="text-[#52525b] text-xs leading-relaxed mt-2">{feature.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold">Recovery Parameters</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[9px] text-[#27272a] font-mono uppercase tracking-wider">Max Attempts</label>
            <select
              value={strategies.maxAttempts}
              onChange={(e) => setStrategies(prev => ({ ...prev, maxAttempts: Number(e.target.value) }))}
              className="input mt-1"
            >
              <option value={3}>3 attempts</option>
              <option value={4}>4 attempts</option>
              <option value={5}>5 attempts</option>
              <option value={6}>6 attempts</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] text-[#27272a] font-mono uppercase tracking-wider">Default Tone</label>
            <select
              value={strategies.defaultTone}
              onChange={(e) => setStrategies(prev => ({ ...prev, defaultTone: e.target.value }))}
              className="input mt-1"
            >
              <option value="gentle">Gentle</option>
              <option value="friendly">Friendly</option>
              <option value="firm">Firm</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary text-xs">
          Save Configuration
        </button>
      </div>
    </div>
  );
}

// Performance view
function PerformanceView() {
  return (
    <div className="py-32 text-center animate-fade-in">
      <BarChart3 size={48} className="mx-auto text-[#27272a] mb-4" />
      <h2 className="text-lg font-medium text-[#52525b]">Analytics Pipeline</h2>
      <p className="text-[#27272a] text-sm mt-2">Detailed metrics coming soon</p>
    </div>
  );
}

// Settings view
function SettingsView() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await axios.get(`${API_URL}/api/config`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          setConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch config:', err);
      }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Radio size={20} className="text-amber-500 animate-pulse" />
      </div>
    );
  }

  const configs = config ? [
    { label: 'WEBHOOK_ENDPOINT', val: config.webhook_url || 'Not configured' },
    { label: 'AI_MODEL', val: config.ai_model || 'Llama-3.3-70b-Versatile' },
    { label: 'EMAIL_PROVIDER', val: config.email_provider || 'Resend' },
    { label: 'RETRY_STRATEGY', val: config.retry_strategy || 'Exponential Backoff (4 attempts)' },
  ] : [
    { label: 'WEBHOOK_ENDPOINT', val: 'https://churn-recovery-production.up.railway.app/webhook/lemonsqueezy' },
    { label: 'AI_MODEL', val: 'Llama-3.3-70b-Versatile' },
    { label: 'EMAIL_PROVIDER', val: 'Resend' },
    { label: 'RETRY_STRATEGY', val: 'Exponential Backoff (4 attempts)' },
  ];

  return (
    <div className="max-w-2xl space-y-6 animate-slide-up">
      <div>
        <h2 className="text-xl font-semibold">System Configuration</h2>
        <p className="text-[#52525b] text-sm mt-1">API endpoints and service integration</p>
      </div>

      <div className="space-y-2">
        {configs.map((config) => (
          <div key={config.label} className="card p-4 flex items-center justify-between group">
            <div>
              <p className="text-[9px] text-[#27272a] font-mono uppercase tracking-wider">{config.label}</p>
              <p className="text-sm font-mono text-[#a1a1aa] mt-1">{config.val}</p>
            </div>
            <button className="btn btn-secondary text-[10px] py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity">
              Edit
            </button>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-semibold mb-3">Integration Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#52525b]">Supabase</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Connected
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#52525b]">Lemon Squeezy</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Webhook Active
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#52525b]">Resend</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Email Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;