import mongoose from 'mongoose'
import logger   from '../utils/logger.js'

const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI

  if (!uri) {
    logger.error('MONGO_URI is not defined in environment variables')
    process.exit(1)
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: process.env.NODE_ENV !== 'production',
    })

    logger.info(`MongoDB connected → ${conn.connection.host}`)

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`)
    })

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected')
    })

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected')
    })

  } catch (err) {
    logger.error(`MongoDB connection failed: ${(err as Error).message}`)
    process.exit(1)
  }
}

// ── Graceful Shutdown ─────────────────────────────────
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  logger.info('MongoDB connection closed — app terminated')
  process.exit(0)
})

export default connectDB