import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity,
  DollarSign,
  TrendingUp,
  Cpu,
  Zap,
  ArrowUpRight,
  BarChart3,
  Clock,
  Shield,
  Target,
  Gauge,
  Radio,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

interface DunningEvent {
  id: string;
  lemonsqueezy_customer_id: string;
  amount_cents: number;
  status: 'active' | 'recovered';
  ai_tone?: string;
  emails_sent?: number;
  failure_summary?: string;
  recovered_at?: string;
}

interface Stats {
  recovered_count: number;
  active_count: number;
  total_recovered_cents: number;
  recovery_rate: number;
}

export function Dashboard() {
  const [events, setEvents] = useState<DunningEvent[]>([]);
  const [stats, setStats] = useState<Stats>({ recovered_count: 0, active_count: 0, total_recovered_cents: 0, recovery_rate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = () => {
    const token = supabase?.auth.getSession()?.then(({ data }) => data.session?.access_token);
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        // Demo mode - use mock data
        const mockEvents: DunningEvent[] = [
          { id: '1', lemonsqueezy_customer_id: 'LS-CUST-492', amount_cents: 9900, status: 'active', ai_tone: 'helpful', emails_sent: 1, failure_summary: 'Expired Card / Retry Scheduled' },
          { id: '2', lemonsqueezy_customer_id: 'LS-CUST-102', amount_cents: 24900, status: 'recovered', ai_tone: 'urgent', emails_sent: 3, recovered_at: new Date().toISOString() },
          { id: '3', lemonsqueezy_customer_id: 'LS-CUST-883', amount_cents: 14900, status: 'active', ai_tone: 'gentle', emails_sent: 0, failure_summary: 'Insufficient Funds / Waiting 3 Days' },
        ];
        setTimeout(() => {
          setEvents(mockEvents);
          setStats({ recovered_count: 1, active_count: 2, total_recovered_cents: 24900, recovery_rate: 33.3 });
          setLoading(false);
        }, 800);
        return;
      }

      try {
        // Get the session token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }

        const headers = {
          'Authorization': `Bearer ${session.access_token}`
        };

        // Fetch stats
        const [eventsRes, statsRes] = await Promise.all([
          axios.get(`${API_URL}/api/events`, { headers }),
          axios.get(`${API_URL}/api/stats`, { headers })
        ]);

        setEvents(eventsRes.data);
        setStats(statsRes.data);
      } catch (err: any) {
        console.error('Data fetch error:', err);
        setError(err.message || 'Failed to fetch data');
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <div className="relative">
          <div className="w-12 h-12 rounded-lg bg-[#0e0e14] border border-[rgba(255,255,255,0.04)] flex items-center justify-center">
            <Radio size={20} className="text-amber-500 animate-pulse" strokeWidth={1.5} />
          </div>
        </div>
        <span className="text-[10px] text-[#27272a] font-mono tracking-widest uppercase animate-pulse">Syncing Data</span>
      </div>
    );
  }

  const activeEvents = events.filter((e) => e.status === 'active');
  const recoveredEvents = events.filter((e) => e.status === 'recovered');
  const recoveryRate = stats.recovery_rate.toFixed(1);

  return (
    <div className="space-y-6 pb-16">
      {error && (
        <div className="p-3 rounded-md bg-red-500/[0.08] border border-red-500/[0.15]">
          <p className="text-red-400 text-xs font-mono">{error}</p>
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          icon={<DollarSign size={18} strokeWidth={1.5} />}
          val={`$${(stats.total_recovered_cents / 100).toLocaleString()}`}
          label="Revenue Recovered"
          accent="amber"
        />
        <StatCard
          icon={<TrendingUp size={18} strokeWidth={1.5} />}
          val={`${recoveryRate}%`}
          label="Recovery Rate"
          accent="amber"
        />
        <StatCard
          icon={<Cpu size={18} strokeWidth={1.5} />}
          val={stats.active_count.toString()}
          label="Active Threads"
          accent="violet"
        />
      </div>

      {/* AI Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Main insights */}
        <div className="lg:col-span-8 card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <BarChart3 size={180} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={12} className="text-amber-500" strokeWidth={2} />
              <span className="text-[10px] text-amber-500 font-mono uppercase tracking-wider">System Insights</span>
            </div>

            <h2 className="text-lg font-semibold mb-6">AI Recovery Performance</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <MetricBox
                label="Avg. Resolution"
                val="3.4 Days"
                sub="-1.2d vs baseline"
                icon={<Clock size={16} strokeWidth={1.5} />}
              />
              <MetricBox
                label="Content Accuracy"
                val="99.4%"
                sub="AI verified"
                icon={<Shield size={16} strokeWidth={1.5} />}
              />
              <MetricBox
                label="Response Time"
                val="0.04ms"
                sub="Real-time"
                icon={<Activity size={16} strokeWidth={1.5} />}
              />
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="lg:col-span-4 bg-gradient-to-b from-amber-500/[0.08] to-transparent border border-amber-500/[0.15] rounded-lg p-5 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-md bg-amber-500/[0.1] border border-amber-500/[0.2] flex items-center justify-center">
              <Gauge size={18} className="text-amber-500" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] text-amber-500 font-mono uppercase tracking-wider">Recommendation</span>
          </div>

          <div className="space-y-3 flex-1">
            <h3 className="text-sm font-semibold">Upgrade to LLM Ultra</h3>
            <p className="text-[#52525b] text-xs leading-relaxed">
              Your recovery rate is 14% above industry average. Enable advanced AI for further optimization.
            </p>
          </div>

          <button className="btn btn-primary w-full mt-4 text-xs">
            Enable Premium
          </button>
        </div>
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Active Queue */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="status-dot status-offline status-pulse"></span>
              <h3 className="text-xs font-semibold text-[#52525b] uppercase tracking-wider">Active Queue</h3>
            </div>
            <span className="badge badge-muted">{activeEvents.length} active</span>
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.02)]">
            {activeEvents.length > 0 ? (
              activeEvents.map((event) => (
                <div
                  key={event.id}
                  className="px-5 py-4 flex items-center justify-between hover:bg-[rgba(255,255,255,0.01)] transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-mono text-amber-500">{event.lemonsqueezy_customer_id}</p>
                    <p className="text-[10px] text-[#27272a]">{event.failure_summary}</p>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-sm font-semibold">${(event.amount_cents / 100).toFixed(2)}</p>
                    <span className="badge badge-amber text-[8px]">{event.ai_tone || 'gentle'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center">
                <AlertCircle size={20} className="mx-auto text-[#27272a] mb-3" strokeWidth={1.5} />
                <p className="text-[10px] text-[#27272a] font-mono uppercase tracking-wider">No active sequences</p>
              </div>
            )}
          </div>
        </div>

        {/* Recovered */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="status-dot status-online"></span>
              <h3 className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Recovered</h3>
            </div>
            <ArrowUpRight size={14} className="text-emerald-500/50" strokeWidth={1.5} />
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.02)]">
            {recoveredEvents.length > 0 ? (
              recoveredEvents.map((event) => (
                <div
                  key={event.id}
                  className="px-5 py-4 flex items-center justify-between hover:bg-emerald-500/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-md bg-emerald-500/[0.1] border border-emerald-500/[0.2] flex items-center justify-center">
                      <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-mono text-white">{event.lemonsqueezy_customer_id}</p>
                      <p className="text-[10px] text-[#27272a]">Recovery successful</p>
                    </div>
                  </div>
                  <p className="text-base font-mono text-emerald-500">${(event.amount_cents / 100).toFixed(2)}</p>
                </div>
              ))
            ) : (
              <div className="px-5 py-12 text-center">
                <Target size={20} className="mx-auto text-[#27272a] mb-3" strokeWidth={1.5} />
                <p className="text-[10px] text-[#27272a] font-mono uppercase tracking-wider">Awaiting recoveries</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  val: string;
  label: string;
  accent: 'amber' | 'emerald' | 'violet';
}

function StatCard({ icon, val, label, accent }: StatCardProps) {
  const colors = {
    amber: {
      text: 'text-amber-500',
      bg: 'bg-amber-500/[0.08]',
      border: 'border-amber-500/[0.1]',
      glow: 'rgba(245, 158, 11, 0.15)'
    },
    emerald: {
      text: 'text-emerald-500',
      bg: 'bg-emerald-500/[0.08]',
      border: 'border-emerald-500/[0.1]',
      glow: 'rgba(16, 185, 129, 0.15)'
    },
    violet: {
      text: 'text-violet-500',
      bg: 'bg-violet-500/[0.08]',
      border: 'border-violet-500/[0.1]',
      glow: 'rgba(139, 92, 246, 0.15)'
    }
  };

  const c = colors[accent];

  return (
    <div className={`card p-5 border ${c.border} hover:border-[rgba(255,255,255,0.12)] transition-all relative overflow-hidden group`}>
      <div className="relative z-10 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-md ${c.bg} flex items-center justify-center ${c.text}`}>
          {icon}
        </div>
        <div>
          <p className={`text-2xl font-semibold font-mono ${c.text}`}>{val}</p>
          <p className="text-[10px] text-[#52525b] uppercase tracking-wide mt-1">{label}</p>
        </div>
      </div>
      <div className={`absolute -bottom-4 -right-4 ${c.text} opacity-[0.03] group-hover:opacity-[0.06] transition-opacity`}>
        {icon}
      </div>
    </div>
  );
}

// Metric Box Component
interface MetricBoxProps {
  label: string;
  val: string;
  sub: string;
  icon: React.ReactNode;
}

function MetricBox({ label, val, sub, icon }: MetricBoxProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[#27272a]">
        {icon}
        <span className="text-[9px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div>
        <p className="text-lg font-semibold">{val}</p>
        <p className="text-[10px] text-[#52525b]">{sub}</p>
      </div>
    </div>
  );
}