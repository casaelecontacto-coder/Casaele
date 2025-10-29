import { Router } from 'express'

const router = Router()

// Demo/public list
router.get('/', (req, res) => {
  res.json([
    { title: 'Spanish A1 Basics', type: 'PDF', size: '2.3MB' },
    { title: 'Pronunciation Guide', type: 'Video', duration: '12:45' },
  ])
})

export default router


