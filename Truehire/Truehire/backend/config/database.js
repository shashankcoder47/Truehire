const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'truehire',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true
});

// Test database connection
const testConnection = async () => {
  try {
    // First connect without database to create it if needed
    const tempPool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
      multipleStatements: true
    });

    const connection = await tempPool.getConnection();
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'truehire'}`);
    connection.release();
    tempPool.end();

    // Now test connection with database
    const dbConnection = await pool.getConnection();
    console.log('Database connected successfully');
    dbConnection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection
};
