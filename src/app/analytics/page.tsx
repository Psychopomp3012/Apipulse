"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle, BarChart3, Clock, Key, ChevronDown, Info, AlertCircle, Timer } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { auth } from "@/lib/firebase";

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("apipulse_token");
        if (!token) {
          throw new Error("User not authenticated");
        }
        const res = await fetch(`http://localhost:8080/api/apipulse/analytics?days=${days}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Failed to load analytics data");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        if (err.name === "TypeError" && err.message === "Failed to fetch") {
          window.dispatchEvent(new Event("server-offline"));
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem("apipulse_token");
    if (token) {
      setLoading(true);
      fetchData();
    } else {
      setError("Please log in to view analytics.");
      setLoading(false);
    }
  }, [days]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center min-h-[50vh]">
        <Activity className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Analytics</h2>
        <p>{error || "No data available"}</p>
      </div>
    );
  }

  const { summary, dailyLogs } = data;
  const baseColors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
  const keyUsageChart = data.keyUsageChart ? [...data.keyUsageChart].sort((a: any, b: any) => {
    const aIsOthers = a.name === 'Others' || a.isAggregated;
    const bIsOthers = b.name === 'Others' || b.isAggregated;
    if (aIsOthers && bIsOthers) return 0;
    if (aIsOthers) return 1;
    if (bIsOthers) return -1;
    return b.value - a.value;
  }).map((entry, index) => ({
    ...entry,
    fill: (entry.name === 'Others' || entry.isAggregated) ? '#94a3b8' : baseColors[index % baseColors.length]
  })) : [];
  
  const successRate = summary.totalRequests > 0 
    ? Math.round(((summary.totalRequests - summary.totalErrors) / summary.totalRequests) * 100) 
    : 0;

  const COLORS = baseColors;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#1e1e1e] border border-black/10 dark:border-white/10 p-3 rounded-lg shadow-lg">
          {label && <p className="text-gray-900 dark:text-white font-bold mb-2">{label}</p>}
          {payload.map((entry: any, index: number) => {
            const name = entry.name || "";
            const truncatedName = name.length > 20 ? name.substring(0, 20) + '...' : name;
            return (
              <p key={index} style={{ color: entry.color || entry.fill }} className="text-sm font-medium">
                {truncatedName}: {entry.value}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold mb-2 flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" /> Analytics
          </h1>
          <p className="text-gray-500">Monitor your API usage, performance, and key distribution.</p>
        </div>
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm text-gray-700 dark:text-gray-300 font-medium px-4 py-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <Clock className="h-4 w-4 text-gray-500" />
            {days === 1 ? "Last Day" : days === 7 ? "Last 7 Days" : days === 15 ? "Last 15 Days" : days === 30 ? "Last 30 Days" : "All Time"}
            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full bg-white dark:bg-gray-900 border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              {[
                { value: 1, label: "Last Day" },
                { value: 7, label: "Last 7 Days" },
                { value: 15, label: "Last 15 Days" },
                { value: 30, label: "Last 30 Days" },
                { value: -1, label: "All Time" }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setDays(option.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${days === option.value ? 'bg-primary/10 text-primary font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 border-t-4 border-t-primary relative group flex flex-col justify-between min-h-[140px]">
          <h3 className="text-gray-500 font-bold tracking-wider text-sm mb-2 flex items-center gap-2">
            TOTAL REQUESTS
            <Info className="h-4 w-4 text-gray-400 cursor-help" />
          </h3>
          
          <div className="absolute top-12 left-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs rounded-lg py-2 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-48 shadow-xl z-50 pointer-events-none">
            The total number of API calls made across all your keys in this timeframe.
          </div>
          <div className="text-4xl font-black">{summary.totalRequests.toLocaleString()}</div>
        </div>
        <div className="glass rounded-2xl p-6 border-t-4 border-t-red-500 relative group flex flex-col justify-between min-h-[140px]">
          <h3 className="text-gray-500 font-bold tracking-wider text-sm mb-2 flex items-center gap-2">
            FAILED REQUESTS
            <Info className="h-4 w-4 text-gray-400 cursor-help" />
          </h3>
          
          <div className="absolute top-12 left-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs rounded-lg py-2 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-48 shadow-xl z-50 pointer-events-none">
            The number of API calls that returned an error (such as validation errors, invalid parameters, or payload limits). You are not charged credits for these.
          </div>
          <div className="text-4xl font-black">{summary.totalErrors.toLocaleString()}</div>
        </div>
        <div className="glass rounded-2xl p-6 border-t-4 border-t-green-500 relative group flex flex-col justify-between min-h-[140px]">
          <h3 className="text-gray-500 font-bold tracking-wider text-sm mb-2 flex items-center gap-2">
            SUCCESS RATE
            <Info className="h-4 w-4 text-gray-400 cursor-help" />
          </h3>
          
          <div className="absolute top-12 left-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 text-xs rounded-lg py-2 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-48 shadow-xl z-50 pointer-events-none">
            Percentage of API requests that succeeded. If this is dropping, verify your parameters and check the error logs.
          </div>
          <div className="text-4xl font-black">{successRate === 100 ? '100' : successRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6">Traffic & Errors</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyLogs} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.2} />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => val.substring(5)} 
                    stroke="#888" 
                    fontSize={12} 
                />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" name="Success" dataKey="successfulRequests" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Errors" dataKey="failedRequests" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Usage Donut */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Key className="h-5 w-5" /> Usage by Key</h3>
          <div className="min-h-[300px] w-full flex flex-col items-center justify-center">
            {keyUsageChart && keyUsageChart.length > 0 ? (
              <>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                      data={keyUsageChart}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={1}
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                      >
                      {keyUsageChart.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill} 
                        />
                      ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-4 mt-2 w-full">
                  {keyUsageChart.map((entry: any, index: number) => (
                    <div key={`legend-${index}`} className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: entry.fill }}></div>
                      <span className="max-w-[150px] truncate block" title={entry.name}>
                        {entry.name.length > 15 ? entry.name.substring(0, 15) + '...' : entry.name}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
                <div className="text-gray-500 text-sm text-center">No key usage data found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Latency Chart */}
      <div className="grid grid-cols-1 gap-8 mt-8 pb-12">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Timer className="h-5 w-5 text-orange-500" /> API Latency (Response Time)
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyLogs} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => val ? val.substring(5) : ''}
                  stroke="#888" 
                  fontSize={12} 
                />
                <YAxis 
                  stroke="#888" 
                  fontSize={12} 
                  tickFormatter={(val) => `${val}ms`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="averageLatencyMs" 
                  name="Avg Latency (ms)"
                  stroke="#f97316" 
                  strokeWidth={3} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
