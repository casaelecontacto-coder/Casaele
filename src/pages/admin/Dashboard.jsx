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
  const colorClasses = {
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} text-white shadow-lg`}>
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
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
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
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
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const getIconForType = (type) => {
    switch (type) {
      case 'order':
        return <FiShoppingCart className="w-5 h-5 text-green-600" />;
      case 'user':
        return <FiUserPlus className="w-5 h-5 text-blue-600" />;
      case 'product':
        return <FiBox className="w-5 h-5 text-purple-600" />;
      default:
        return <FiPackage className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              {getIconForType(item.type)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{item.title}</p>
              <p className="text-sm text-gray-500">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {item.amount && (
            <span className="font-semibold text-gray-900">${item.amount}</span>
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
    { label: 'Total Users', value: stats.users.toLocaleString(), icon: FiUsers, color: 'blue' },
    { label: 'Total Orders', value: stats.orders.toLocaleString(), icon: FiShoppingCart, color: 'green' },
    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: FiDollarSign, color: 'red' },
    {
      label: 'Content',
      value: (stats.products + stats.materials + stats.courses).toLocaleString(),
      icon: FiBox,
      color: 'purple'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/60">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening.</p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="text-sm font-medium text-red-800">{error}</div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Sales Chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Sales Overview</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#ef4444"
                    strokeWidth={3}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
            <RecentActivityList items={recentActivity} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}