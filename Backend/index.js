import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cmsRoutes from './routes/cmsRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/reviews', reviewRoutes);
app.use('/api/cms', cmsRoutes);
app.get('/', (req, res) => {
  res.send('API is running...')
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  (`Server running on port ${PORT}`)
})


