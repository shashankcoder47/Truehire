const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runSeeds() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'truehire',
      multipleStatements: true
    });

    console.log('Connected to database for seeding...');

    // Get all seed files
    const seedsDir = path.join(__dirname, '..', 'seeds');
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure proper order

    console.log(`Found ${seedFiles.length} seed files to execute`);

    // Execute each seed file
    for (const seedFile of seedFiles) {
      const seedPath = path.join(seedsDir, seedFile);
      const seedSQL = fs.readFileSync(seedPath, 'utf8');

      console.log(`Executing seed: ${seedFile}`);

      await connection.execute(seedSQL);
    }

    console.log('All seeds executed successfully');

  } catch (error) {
    console.error('Error running seeds:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSeeds().catch(console.error);
