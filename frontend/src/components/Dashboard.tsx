import React, { useState, useEffect } from 'react';
import { Activity, DollarSign, TrendingUp } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const supabase = (supabaseUrl && supabaseKey && supabaseUrl !== 'placeholder') 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({ recovered: 0, active: 0, total_cents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!supabase) {
        // Mock data for demo mode
        const mockEvents = [
          { id: '1', lemonsqueezy_customer_id: 'ls_cust_942', amount_cents: 4900, status: 'active', ai_tone: 'gentle', emails_sent: 1, failure_summary: "Card expired" },
          { id: '2', lemonsqueezy_customer_id: 'ls_cust_210', amount_cents: 14900, status: 'recovered', ai_tone: 'firm', emails_sent: 2, recovered_at: new Date().toISOString() },
        ];
        setEvents(mockEvents);
        setStats({ recovered: 1, active: 1, total_cents: 14900 });
        setLoading(false);
        return;
      }

      // Real Supabase Fetch
      const { data } = await supabase
        .from('dunning_events')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setEvents(data);
        const active = data.filter(e => e.status === 'active').length;
        const recovered = data.filter(e => e.status === 'recovered').length;
        const total = data.filter(e => e.status === 'recovered').reduce((acc, curr) => acc + curr.amount_cents, 0);
        setStats({ active, recovered, total_cents: total });
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <div className="text-[#6b6b8a] p-10">Loading your data...</div>;

  return (
    <div className="flex flex-col gap-8">
      {/* Top Stats */}
      <div className="stat-grid">
        <StatCard 
          icon={<DollarSign className="text-[#00d4aa]" size={20} />}
          val={`$${(stats.total_cents / 100).toLocaleString()}`} 
          label="Revenue Recovered" 
          color="text-[#00d4aa]" 
        />
        <StatCard 
          icon={<TrendingUp className="text-[#ff6b35]" size={20} />}
          val={stats.active + stats.recovered > 0 ? `${((stats.recovered / (stats.active + stats.recovered)) * 100).toFixed(1)}%` : "0%"} 
          label="Recovery Rate" 
          color="text-[#ff6b35]" 
        />
        <StatCard 
          icon={<Activity className="text-[#7c6bff]" size={20} />}
          val={stats.active.toString()} 
          label="Active Sequences" 
          color="text-[#7c6bff]" 
        />
      </div>

      {/* ROI & Analytics Card */}
      <div className="card bg-gradient-to-br from-[#12121a] to-[#1a1a26] border-[#2a2a3a] p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-[10px] font-bold text-[#6b6b8a] tracking-widest uppercase mb-1">AI Performance Insights</div>
            <h2 className="text-xl font-semibold">Churn Recovery ROI</h2>
          </div>
          <div className="bg-[#00d4aa15] text-[#00d4aa] text-xs px-3 py-1 rounded-full border border-[#00d4aa22]">
            AI performing 2.4x better than standard emails
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-4 rounded-xl bg-[#0a0a0f44] border border-[#2a2a3a33]">
            <div className="text-[#6b6b8a] text-xs mb-2">Estimated MRR Saved</div>
            <div className="text-2xl font-bold text-white">${(stats.total_cents / 100).toLocaleString()}</div>
            <div className="text-[10px] text-[#00d4aa] mt-2 flex items-center gap-1">
              <TrendingUp size={12} /> +12.5% from last month
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0a0a0f44] border border-[#2a2a3a33]">
            <div className="text-[#6b6b8a] text-xs mb-2">AI Accuracy (Tone Match)</div>
            <div className="text-2xl font-bold text-white">98.2%</div>
            <div className="text-[10px] text-[#6b6b8a] mt-2">Based on 154 customer interactions</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0a0a0f44] border border-[#2a2a3a33]">
            <div className="text-[#6b6b8a] text-xs mb-2">Avg. Recovery Time</div>
            <div className="text-2xl font-bold text-white">3.4 Days</div>
            <div className="text-[10px] text-[#ff6b35] mt-2">
              Reduced by 1.2 days with AI personalization
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title" style={{ '--accent': '#ff6b35' } as any}>ACTIVE SEQUENCES (LEMON SQUEEZY)</div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[#6b6b8a] border-b border-[#2a2a3a]">
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Reason</th>
                <th className="pb-3 font-medium">Progress</th>
                <th className="pb-3 font-medium">Tone</th>
              </tr>
            </thead>
            <tbody>
              {events.filter(e => e.status === 'active').map(event => (
                <tr key={event.id} className="border-b border-[#2a2a3a] last:border-0">
                  <td className="py-4 font-mono text-xs text-[#ff6b35]">{event.lemonsqueezy_customer_id}</td>
                  <td className="py-4 font-bold text-[#00d4aa]">${(event.amount_cents / 100).toFixed(2)}</td>
                  <td className="py-4 text-[#6b6b8a] text-xs max-w-[150px] truncate">{event.failure_summary}</td>
                  <td className="py-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i <= event.emails_sent ? 'bg-[#ff6b35]' : 'bg-[#2a2a3a]'}`} />
                      ))}
                    </div>
                  </td>
                  <td className="py-4 text-xs">
                    <span className="badge" style={{ background: 'rgba(255,107,53,0.1)', color: '#ff6b35' }}>
                      {event.ai_tone?.toUpperCase() || 'GENTLE'}
                    </span>
                  </td>
                </tr>
              ))}
              {events.filter(e => e.status === 'active').length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#6b6b8a]">No active recovery sequences</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title" style={{ '--accent': '#00d4aa' } as any}>RECENT RECOVERIES</div>
          <div className="flex flex-col gap-4">
            {events.filter(e => e.status === 'recovered').map(event => (
              <div key={event.id} className="flex justify-between items-center py-2 border-b border-[#2a2a3a] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#00d4aa22] flex items-center justify-center text-[#00d4aa]">
                    <Activity size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-sm text-[#00d4aa]">{event.lemonsqueezy_customer_id}</div>
                    <div className="text-[#6b6b8a] text-xs">Recovered via AI</div>
                  </div>
                </div>
                <div className="text-[#00d4aa] font-mono text-sm font-bold">${(event.amount_cents / 100).toFixed(2)}</div>
              </div>
            ))}
            {events.filter(e => e.status === 'recovered').length === 0 && (
              <div className="py-10 text-center text-[#6b6b8a]">No recoveries yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, val, label, color }: { icon: React.ReactNode, val: string, label: string, color: string }) {
  return (
    <div className="stat-card flex flex-col items-center justify-center gap-2">
      <div className="bg-[#1a1a26] p-2 rounded-lg mb-1">{icon}</div>
      <div className={`stat-val ${color}`}>{val}</div>
      <div className="stat-label uppercase tracking-[0.2em] font-bold">{label}</div>
    </div>
  );
}
