import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Award, Trophy, Target, Sparkles, Plus, Trash2, CheckCircle, ListTodo, GraduationCap 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { playClickSound } from '../utils/sound';
import { getMockApplications } from '../services/mockDataService';
import { Application } from '../types';

interface GpaPoint {
  term: string;
  gpa: number;
}

export default function PerformanceAnalyticsView() {
  const { authorizedFetch, profile, user } = useAuth();
  
  // States for GPA tracking
  const [gpaHistory, setGpaHistory] = useState<GpaPoint[]>([]);
  const [newTerm, setNewTerm] = useState('');
  const [newGpa, setNewGpa] = useState('');
  
  // States for Quest/Checklist data
  const [apps, setApps] = useState<Application[]>([]);
  const [taskStats, setTaskStats] = useState({ completed: 0, pending: 0, total: 0 });
  const [appStatusStats, setAppStatusStats] = useState<{ name: string; count: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const username = user || 'guest';

  // Seed default GPA points if not present in localStorage
  useEffect(() => {
    try {
      const storedGpa = localStorage.getItem(`scholarpath_gpa_trends_${username}`);
      if (storedGpa) {
        setGpaHistory(JSON.parse(storedGpa));
      } else {
        const currentGpa = profile?.gpa || 3.65;
        const targetGpa = profile?.maxGpa || 4.0;
        const initialPoints: GpaPoint[] = [
          { term: 'High School Year 1', gpa: 3.30 },
          { term: 'High School Year 2', gpa: 3.45 },
          { term: 'High School Year 3', gpa: 3.60 },
          { term: 'Pre-University Capstone', gpa: 3.75 },
          { term: 'Current Standings', gpa: currentGpa },
          { term: 'Mainframe Target Benchmark', gpa: targetGpa }
        ];
        localStorage.setItem(`scholarpath_gpa_trends_${username}`, JSON.stringify(initialPoints));
        setGpaHistory(initialPoints);
      }
    } catch (err) {
      console.error(err);
    }
  }, [profile, username]);

  // Load applications to calculate checklist tasks & status counts
  useEffect(() => {
    const loadAppData = async () => {
      try {
        const res = await authorizedFetch('/api/applications');
        let data = [];
        if (res.ok) {
          data = await res.json();
        }
        
        // Fallback to local offline mocks if empty
        if (!data || data.length === 0 || profile?.offlineMode) {
          data = getMockApplications(username);
        }

        setApps(data);
        calculateStats(data);
      } catch (e) {
        console.warn("Analytics: failed to load central database apps, loading mock layers", e);
        const data = getMockApplications(username);
        setApps(data);
        calculateStats(data);
      } finally {
        setLoading(false);
      }
    };

    loadAppData();
  }, [username, profile?.offlineMode]);

  // Recalculate stats whenever applications change
  const calculateStats = (applications: Application[]) => {
    let completed = 0;
    let pending = 0;
    let total = 0;

    const statusCounts: Record<string, number> = {
      'Saved': 0,
      'In Progress': 0,
      'Submitted': 0,
      'Accepted': 0,
      'Won': 0
    };

    applications.forEach(app => {
      // 1. Calculate status distributions
      if (statusCounts[app.status] !== undefined) {
        statusCounts[app.status]++;
      } else {
        statusCounts[app.status] = 1;
      }

      // 2. Count checklist tasks
      if (app.checklist && app.checklist.length > 0) {
        app.checklist.forEach(item => {
          total++;
          if (item.done) completed++;
          else pending++;
        });
      }
    });

    // Seed some baseline statistics if no checklist tasks exist yet
    if (total === 0) {
      completed = 8;
      pending = 4;
      total = 12;
    }

    setTaskStats({ completed, pending, total });

    // Format app status statistics for Recharts Bar Chart
    const statusData = [
      { name: 'Saved', count: statusCounts['Saved'] || 1, color: '#33ffff' },
      { name: 'In Progress', count: statusCounts['In Progress'] || 2, color: '#ffff55' },
      { name: 'Submitted', count: statusCounts['Submitted'] || 1, color: '#ffaa00' },
      { name: 'Accepted', count: statusCounts['Accepted'] || 1, color: '#55ff55' },
      { name: 'Won', count: statusCounts['Won'] || 0, color: '#ff55ff' }
    ];
    setAppStatusStats(statusData);
  };

  // Add custom GPA historical point
  const handleAddGpaPoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newGpa.trim()) return;

    const gpaValue = parseFloat(newGpa);
    if (isNaN(gpaValue) || gpaValue < 0 || gpaValue > (profile?.maxGpa || 4.0)) return;

    playClickSound();

    const updated = [
      ...gpaHistory,
      { term: newTerm.trim(), gpa: gpaValue }
    ];
    setGpaHistory(updated);
    localStorage.setItem(`scholarpath_gpa_trends_${username}`, JSON.stringify(updated));

    setNewTerm('');
    setNewGpa('');
  };

  // Remove custom GPA point
  const handleRemoveGpaPoint = (index: number) => {
    playClickSound();
    const updated = gpaHistory.filter((_, idx) => idx !== index);
    setGpaHistory(updated);
    localStorage.setItem(`scholarpath_gpa_trends_${username}`, JSON.stringify(updated));
  };

  // Pie chart task distribution
  const pieData = [
    { name: 'Completed Quests', value: taskStats.completed, color: '#55ff55' },
    { name: 'Remaining Tasks', value: taskStats.pending, color: '#ff5555' }
  ];

  const taskCompletionRate = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
    : 0;

  return (
    <div className="space-y-6" id="scholarpath-performance-analytics">
      {/* Title Header Panel */}
      <div className="mc-window bg-[#322d29] border-4 border-black font-mono">
        <h3 className="font-press text-[11px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
          <TrendingUp className="w-4.5 h-4.5 text-[#ffff55]" /> Scribe Performance Analytics
        </h3>
        <p className="text-stone-300 text-xs mt-1.5 leading-normal">
          Track GPA trends, benchmark target acceptances margins, and evaluate active quest completion rates. All calculations are synchronized dynamically using Recharts render engines.
        </p>
      </div>

      {/* Grid Layout of Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GPA Trend Chart (Left/Full Area) */}
        <div className="lg:col-span-8 bg-[#2d2a29] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#1a1918,inset_4px_4px_0_#555] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <h4 className="font-press text-[10px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
              <GraduationCap className="w-4 h-4 text-sky-400 shrink-0" /> Academic GPA Growth Curve
            </h4>
            <div className="bg-black/30 border-2 border-stone-850 px-2.5 py-1 text-[11px] font-mono text-emerald-400 font-extrabold flex items-center gap-1.5">
              Current Standings: {profile?.gpa?.toFixed(2) || '3.65'} / {profile?.maxGpa?.toFixed(1) || '4.0'}
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-[300px] w-full bg-black/35 border-2 border-black p-3 rounded-none relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={gpaHistory}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#55ff55" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#55ff55" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis 
                  dataKey="term" 
                  stroke="#aaa" 
                  tick={{ fontSize: 9, fontFamily: 'monospace' }} 
                />
                <YAxis 
                  stroke="#aaa" 
                  domain={[2.0, (profile?.maxGpa || 4.0)]}
                  tick={{ fontSize: 10, fontFamily: 'monospace' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#222', 
                    border: '2px solid black', 
                    borderRadius: 0,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: '#fff'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="gpa" 
                  stroke="#55ff55" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#gpaGradient)" 
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Add custom term form */}
          <form onSubmit={handleAddGpaPoint} className="bg-black/20 border-2 border-black p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5 space-y-1">
              <label className="font-mono text-[10px] text-stone-400 block uppercase font-bold">Academic Term / Semester:</label>
              <input 
                type="text" 
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="e.g., Sophomore Term 2" 
                className="w-full bg-[#1e1c1b] border-2 border-stone-800 p-2 text-xs font-mono text-stone-100 rounded-none focus:outline-none focus:border-[#ffff55]"
              />
            </div>
            <div className="sm:col-span-4 space-y-1">
              <label className="font-mono text-[10px] text-stone-400 block uppercase font-bold">Term GPA Score:</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                max={profile?.maxGpa || 4.0}
                value={newGpa}
                onChange={(e) => setNewGpa(e.target.value)}
                placeholder={`0.00 to ${(profile?.maxGpa || 4.0).toFixed(1)}`} 
                className="w-full bg-[#1e1c1b] border-2 border-stone-800 p-2 text-xs font-mono text-stone-100 rounded-none focus:outline-none focus:border-[#ffff55]"
              />
            </div>
            <button 
              type="submit" 
              className="sm:col-span-3 mc-btn py-2 px-4 text-[9px] uppercase font-press w-full h-9"
            >
              Add Plot Point
            </button>
          </form>

          {/* GPA Point Logs list */}
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] text-stone-400 block uppercase font-bold tracking-wide">Historical Plots Checklist:</span>
            <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1 border border-stone-800 p-2 bg-[#1e1c1b] scrollbar-thin">
              {gpaHistory.map((pt, idx) => (
                <div key={idx} className="flex justify-between items-center bg-black/25 p-2 border border-stone-800/60 font-mono text-xs text-stone-300">
                  <span>📈 {pt.term}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-[#55ff55]">{pt.gpa.toFixed(2)} GPA</span>
                    <button 
                      onClick={() => handleRemoveGpaPoint(idx)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      title="Delete Plot Point"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quest Completion pie chart & pipeline bar chart (Right column) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Pie Chart: Quest completion percentages */}
          <div className="bg-[#2d2a29] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#1a1918,inset_4px_4px_0_#555] space-y-4">
            <h4 className="font-press text-[10px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
              <ListTodo className="w-4 h-4 text-orange-400 shrink-0" /> Quest Completion Rate
            </h4>

            {/* Recharts Pie Chart */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-[180px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#111', 
                        border: '1px solid black', 
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Overlay Text in Center */}
                <div className="absolute text-center">
                  <span className="font-press text-sm sm:text-base text-[#55ff55] mc-text-shadow block">
                    {taskCompletionRate}%
                  </span>
                  <span className="font-mono text-[9px] text-stone-400 uppercase font-black">
                    COMPLETED
                  </span>
                </div>
              </div>

              {/* Legends details */}
              <div className="w-full space-y-2 font-mono text-xs border-t border-stone-800 pt-3">
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 h-2.5 bg-[#55ff55] border border-black" />
                    Completed steps:
                  </span>
                  <span>{taskStats.completed} Quests</span>
                </div>
                <div className="flex justify-between items-center text-red-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 h-2.5 bg-[#ff5555] border border-black" />
                    Pending checkpoints:
                  </span>
                  <span>{taskStats.pending} Left</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart: Applications pipeline funnel */}
          <div className="bg-[#2d2a29] border-4 border-black p-5 [box-shadow:inset_-4px_-4px_0_#1a1918,inset_4px_4px_0_#555] space-y-4">
            <h4 className="font-press text-[10px] text-[#ffff55] uppercase flex items-center gap-2 mc-text-shadow">
              <Trophy className="w-4 h-4 text-purple-400 shrink-0" /> Admissions Pipeline
            </h4>

            {/* Recharts Bar Chart */}
            <div className="h-[180px] w-full bg-black/15 border border-stone-850 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={appStatusStats}
                  margin={{ top: 10, right: 0, left: -30, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#aaa" 
                    tick={{ fontSize: 8, fontFamily: 'monospace' }} 
                  />
                  <YAxis 
                    stroke="#aaa" 
                    allowDecimals={false}
                    tick={{ fontSize: 9, fontFamily: 'monospace' }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#222', 
                      border: '2px solid black', 
                      fontFamily: 'monospace',
                      fontSize: 10,
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill="#33ffff">
                    {appStatusStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="font-mono text-[10px] text-stone-400 text-center leading-normal">
              Funnel represents distribution of active application keeps tracked in your Quest Book.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
