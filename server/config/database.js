const { Pool } = require('pg');
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// PostgreSQL connection for structured data
const pgPool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'testforge',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// MongoDB connection for unstructured data
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/testforge';

const connectDB = async () => {
  try {
    // Connect to PostgreSQL
    await pgPool.connect();
    logger.info('PostgreSQL connected successfully');

    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB connected successfully');

    // Test database connections
    await pgPool.query('SELECT NOW()');
    await mongoose.connection.db.admin().ping();
    
    logger.info('All database connections verified');
  } catch (error) {
    logger.error('Database connection error:', error);
    throw error;
  }
};

const closeDB = async () => {
  try {
    await pgPool.end();
    await mongoose.connection.close();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

// Handle graceful shutdown
process.on('SIGINT', closeDB);
process.on('SIGTERM', closeDB);

module.exports = {
  connectDB,
  closeDB,
  pgPool,
  mongoose
};

