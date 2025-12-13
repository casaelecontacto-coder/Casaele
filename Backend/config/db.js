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
    console.error('❌ MongoDB connection error: MONGO_URI is missing in environment variables')
    console.error('Please check your .env file and ensure MONGO_URI is set')
    return null
  }
  
  console.log('🔄 Attempting to connect to MongoDB...')
  console.log('📍 Connection string (redacted):', redactMongoUri(mongoUri))
  
  try {
    // Configure Mongoose connection options (using only supported MongoDB driver options)
    const options = {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout for server selection
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      connectTimeoutMS: 30000, // 30 seconds connection timeout
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 1, // Maintain at least 1 socket connection
      retryWrites: true,
      retryReads: true,
    }

    // Disable Mongoose buffering globally (this is the correct way)
    mongoose.set('bufferCommands', false);
    // mongoose.set('bufferMaxEntries', 0);

    // Wait for connection to be established
    const conn = await mongoose.connect(mongoUri, options);
    
    // Verify connection is ready
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection not ready after connect');
    }

    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`)
    console.log(`📊 Database: ${conn.connection.name}`)
    return conn
  } catch (error) {
    console.error('❌ MongoDB connection failed!')
    console.error('Error details:', error.message)
    console.error('Connection string (redacted):', redactMongoUri(mongoUri))
    
    // Provide helpful error messages based on error type
    if (error.message.includes('ETIMEDOUT') || error.message.includes('ENOTFOUND')) {
      console.error('💡 Tip: Check if MongoDB server is running and reachable')
      console.error('💡 Tip: Verify network connectivity and firewall settings')
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Tip: Check your MongoDB username and password')
    } else if (error.message.includes('bad auth')) {
      console.error('💡 Tip: Verify your MongoDB credentials are correct')
    }
    
    return null
  }
}


