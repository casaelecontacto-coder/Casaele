import mongoose from 'mongoose'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Material from '../models/Material.js'
import Course from '../models/Course.js'
import User from '../models/User.js'
import { auth } from '../config/firebaseAdmin.js'; // Import auth directly

// GET /api/dashboard/stats
// Returns totals: users, orders, revenue, products
export async function getDashboardStats(req, res) {
  try {
    // 1. Fetch Users (with fallback)
    let totalUsers = 0;
    if (auth) {
        try {
            const result = await auth.listUsers(1000); // Simple count for now
            totalUsers = result.users.length; // Note: For >1000 users, you'd need to paginate
        } catch (e) {
            console.error("Firebase user listing failed. Falling back to local DB.", e.message);
            totalUsers = await User.countDocuments({});
        }
    } else {
        console.warn("Firebase auth not initialized. Counting local DB users.");
        totalUsers = await User.countDocuments({});
    }


    // 2. Fetch all other stats concurrently for performance
    const [
      totalOrders,
      totalRevenue,
      totalProducts,
      totalMaterials,
      totalCourses,
    ] = await Promise.all([
      Order.countDocuments({}),
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Product.countDocuments({}),
      Material.countDocuments({}),
      Course.countDocuments({}),
    ]);

    // 3. Send the complete stats object as a response
    res.status(200).json({
      users: totalUsers,
      orders: totalOrders,
      revenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      products: totalProducts,
      materials: totalMaterials,
      courses: totalCourses,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
}

// GET /api/dashboard/sales?months=6
// Returns monthly sales summary for the chart
export async function getSalesOverview(req, res) {
  try {
    const months = Math.max(1, Math.min(24, Number(req.query.months) || 6))

    // Start date months ago, beginning of that month
    const start = new Date()
    start.setUTCDate(1)
    start.setUTCHours(0, 0, 0, 0)
    start.setUTCMonth(start.getUTCMonth() - (months - 1))

    const agg = await Order.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          sales: { $sum: '$amount' },
          orders: { $sum: 1 },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])

    // Build a continuous timeline array for the requested window
    const out = []
    const cursor = new Date(start)
    for (let i = 0; i < months; i += 1) {
      const year = cursor.getUTCFullYear()
      const month = cursor.getUTCMonth() + 1
      const key = `${year}-${month}`
      const match = agg.find(a => a._id.year === year && a._id.month === month)
      const name = cursor.toLocaleString('default', { month: 'short' })
      out.push({ name, year, month, sales: match ? match.sales : 0, orders: match ? match.orders : 0 })
      cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    }

    return res.json(out)
  } catch (error) {
    console.error('Dashboard sales error:', error)
    return res.status(500).json({ message: 'Failed to fetch sales overview' })
  }
}

// GET /api/dashboard/recent
// Returns latest 5 activities across key collections
export async function getRecentActivity(req, res) {
  try {
    const [recentOrders, recentProducts, recentMaterials, recentCourses, recentUsers] = await Promise.all([
      Order.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      Product.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      Material.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      Course.find({}).sort({ createdAt: -1 }).limit(5).lean(),
      User.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    ])

    const normalize = (items, type, titleKey = 'title', amountKey) =>
      items.map(i => ({
        id: i._id?.toString(),
        type,
        title: i[titleKey] || i.name || i.email || type,
        amount: amountKey ? i[amountKey] : undefined,
        createdAt: i.createdAt || new Date(),
      }))

    const combined = [
      ...normalize(recentCourses, 'course', 'title'),
      ...normalize(recentMaterials, 'material', 'title'),
      ...normalize(recentProducts, 'product', 'name'),
      ...normalize(recentOrders, 'order', 'id', 'amount'),
      ...normalize(recentUsers, 'user', 'name'),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

    return res.json(combined)
  } catch (error) {
    console.error('Dashboard recent error:', error)
    return res.status(500).json({ message: 'Failed to fetch recent activity' })
  }
}


