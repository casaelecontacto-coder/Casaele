import { Router } from 'express'
import { verifyFirebaseToken } from '../middleware/auth.js'

const router = Router()

router.get('/users', (req, res) => {
  res.json([
    { name: 'Alice Johnson', email: 'alice@example.com', role: 'Admin', status: 'Active' },
    { name: 'Bob Lee', email: 'bob@example.com', role: 'Editor', status: 'Active' },
    { name: 'Charlie Kim', email: 'charlie@example.com', role: 'Viewer', status: 'Suspended' },
  ])
})

// products moved to /api/products CRUD routes

router.get('/orders', (req, res) => {
  res.json([
    { id: '#1001', user: 'Alice Johnson', total: 120, status: 'Paid' },
    { id: '#1002', user: 'Bob Lee', total: 49, status: 'Pending' },
    { id: '#1003', user: 'Charlie Kim', total: 29, status: 'Refunded' },
  ])
})

export default router


