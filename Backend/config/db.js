import mongoose from 'mongoose'

function redactMongoUri(uri) {
  if (!uri) return 'MONGO_URI is not set'
  try {
    const url = new URL(uri)
    const username = url.username ? '<username>' : ''
    const password = url.password ? '<password>' : ''
    url.username = username
    url.password = password
    return url.toString()
  } catch {
    return 'Invalid MONGO_URI format'
  }
}

export default async function connectDB() {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    console.error('MongoDB connection error: MONGO_URI is missing in environment variables')
    return null
  }
  try {
    const conn = await mongoose.connect(mongoUri)
    console.log(`MongoDB connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    console.error('Received MONGO_URI (redacted):', redactMongoUri(mongoUri))
    return null
  }
}


