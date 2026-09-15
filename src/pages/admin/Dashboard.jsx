import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiShoppingCart,
  FiDollarSign,
  FiBox,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiArrowUpRight,
  FiRefreshCw,
  FiUserPlus,
  FiPackage
} from 'react-icons/fi';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { apiGet } from '../../utils/api'; // ✅ API helper import

// -------------------- STAT CARD COMPONENT --------------------
function StatCard({ label, value, icon: Icon, trend, trendValue, color = 'red' }) {
  // The public site's accent palette, not generic Tailwind hues.
  const tileClasses = {
    red: 'bg-casa-red text-white',
    teal: 'bg-[#93bbc0] text-casa-ink',
    green: 'bg-[#799e83] text-white',
    gold: 'bg-casa-gold text-casa-ink'
  };

  return (
    <div className="casa-card casa-card-hover group p-6">
      <div className="flex items-center justify-between mb-5">
        <div className={`p-3 rounded-2xl border-2 border-casa-ink ${tileClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-bold ${
              trend === 'up' ? 'text-[#799e83]' : 'text-casa-red'
            }`}
          >
            {trend === 'up' ? (
              <FiTrendingUp className="w-4 h-4" />
            ) : (
              <FiTrendingDown className="w-4 h-4" />
            )}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <p className="text-[12.5px] font-bold tracking-[0.1em] uppercase text-casa-ink/55 mb-1.5">{label}</p>
        <p className="font-heading text-4xl font-black tracking-tight text-casa-ink">{value}</p>
      </div>
    </div>
  );
}

// -------------------- RECENT ACTIVITY LIST --------------------
function RecentActivityList({ items, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
            <div className="w-10 h-10 bg-casa-cream rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-casa-cream rounded-full w-3/4"></div>
              <div className="h-3 bg-casa-cream rounded-full w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getIconForType = (type) => {
    switch (type) {
      case 'order':
        return <FiShoppingCart className="w-5 h-5 text-[#799e83]" />;
      case 'user':
        return <FiUserPlus className="w-5 h-5 text-[#2b5d63]" />;
      case 'product':
        return <FiBox className="w-5 h-5 text-casa-red" />;
      default:
        return <FiPackage className="w-5 h-5 text-casa-ink/60" />;
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="group flex items-center justify-between p-4 bg-white rounded-2xl border-[1.5px] border-casa-ink/15 hover:border-casa-ink/30 hover:translate-x-1 transition-all duration-200"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-casa-cream rounded-full border-[1.5px] border-casa-ink/15 flex items-center justify-center shrink-0">
              {getIconForType(item.type)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-casa-ink truncate">{item.title}</p>
              <p className="text-sm text-casa-ink/50">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {item.amount && (
            <span className="font-heading font-black text-casa-ink shrink-0">${item.amount}</span>
          )}
        </div>
      ))}
    </div>
  );
}


function useDashboardData() {
  const [data, setData] = useState({
    stats: { users: 0, orders: 0, revenue: 0, products: 0, materials: 0, courses: 0 },
    salesData: [],
    recentActivity: [],
    loading: true,
    error: null
  });

  const fetchDashboardData = async () => {
    try {
      // Set loading state and clear previous errors
      setData((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch all dashboard data concurrently
      const [stats, sales, recent] = await Promise.all([
        apiGet('/api/dashboard/stats'),
        apiGet('/api/dashboard/sales?months=7'),
        apiGet('/api/dashboard/recent'),
      ]);

      // If all requests succeed, update the state
      setData({
        stats: stats || { users: 0, orders: 0, revenue: 0, products: 0, materials: 0, courses: 0 },
        salesData: sales || [],
        recentActivity: recent || [],
        loading: false,
        error: null,
      });

    } catch (error) {
      // If ANY request fails, this block will now execute
      console.error('Dashboard fetch error:', error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: `Failed to load dashboard data: ${error.message}`, // Set the specific error message
      }));
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // We are removing the interval for now to prevent repeated errors during debugging
    // const id = setInterval(fetchDashboardData, 30000);
    // return () => clearInterval(id);
  }, []);

  return { ...data, refetch: fetchDashboardData };
}
// -------------------- MAIN DASHBOARD COMPONENT --------------------
export default function Dashboard() {
  const { stats, salesData, recentActivity, loading, error, refetch } = useDashboardData();

  const statCards = [
    { label: 'Total Users', value: stats.users.toLocaleString(), icon: FiUsers, color: 'teal' },
    { label: 'Total Orders', value: stats.orders.toLocaleString(), icon: FiShoppingCart, color: 'green' },
    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: FiDollarSign, color: 'red' },
    {
      label: 'Content',
      value: (stats.products + stats.materials + stats.courses).toLocaleString(),
      icon: FiBox,
      color: 'gold'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="casa-eyebrow mb-2.5">Behind the red door</div>
          <h1 className="font-heading text-4xl md:text-5xl font-black tracking-tight text-casa-ink">Dashboard</h1>
          <p className="text-casa-ink/70 mt-2 text-[15.5px]">Welcome back! Here's what's happening.</p>
        </div>
        <button onClick={refetch} disabled={loading} className="casa-btn-ghost">
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl bg-casa-red/8 border-2 border-casa-red/30 p-4">
          <div className="text-[14.5px] font-semibold text-casa-redDark">{error}</div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="xl:col-span-2 casa-card-bold p-7">
          <h2 className="font-heading text-2xl font-black tracking-tight text-casa-ink mb-6">Sales Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a91f24" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#a91f24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(23,17,14,.55)', fontSize: 12.5, fontWeight: 600 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(23,17,14,.55)', fontSize: 12.5, fontWeight: 600 }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fffdf8',
                    border: '2px solid #17110e',
                    borderRadius: 14,
                    boxShadow: '4px 5px 0 rgba(23,17,14,.18)',
                    fontWeight: 600
                  }}
                  labelStyle={{ color: '#17110e', fontWeight: 800 }}
                  cursor={{ stroke: 'rgba(23,17,14,.25)', strokeWidth: 1.5 }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#a91f24"
                  strokeWidth={3}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="casa-card-bold p-7">
          <h2 className="font-heading text-2xl font-black tracking-tight text-casa-ink mb-6">Recent Activity</h2>
          <RecentActivityList items={recentActivity} loading={loading} />
        </div>
      </div>
    </div>
  );
}