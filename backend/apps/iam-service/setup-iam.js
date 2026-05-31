/**
 * IAM Service Setup Script
 * Run: node setup-iam.js
 * 
 * This script will:
 * 1. Generate strong JWT secrets
 * 2. Check database connection
 * 3. Run migrations
 * 4. Verify setup
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '../../.env' });

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASS,
  database: 'iam',
};

async function generateSecrets() {
  console.log('\n🔐 Generating JWT Secrets...\n');
  
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
  
  console.log('Copy these to your .env file:\n');
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
  console.log('\n✅ Secrets generated successfully!\n');
  
  return { jwtSecret, jwtRefreshSecret };
}

async function checkDatabaseConnection() {
  console.log('🔍 Checking database connection...\n');
  
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Database connection successful!\n');
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. MySQL is running');
    console.error('2. Database "iam" exists');
    console.error('3. Credentials in .env are correct\n');
    return false;
  }
}

async function runMigrations() {
  console.log('📦 Running migrations...\n');
  
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    // Migration 1: Account Lockout
    console.log('Running migration: 001_add_account_lockout.sql');
    const migration1 = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_add_account_lockout.sql'),
      'utf8'
    );
    
    const statements1 = migration1
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements1) {
      try {
        await connection.query(statement);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('  ⚠️  Column already exists, skipping...');
        } else {
          throw err;
        }
      }
    }
    console.log('  ✅ Migration 001 completed\n');
    
    // Migration 2: Audit Logging
    console.log('Running migration: 002_add_audit_logging.sql');
    const migration2 = fs.readFileSync(
      path.join(__dirname, 'migrations', '002_add_audit_logging.sql'),
      'utf8'
    );
    
    const statements2 = migration2
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements2) {
      try {
        await connection.query(statement);
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log('  ⚠️  Table already exists, skipping...');
        } else {
          throw err;
        }
      }
    }
    console.log('  ✅ Migration 002 completed\n');
    
    console.log('✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

async function verifySetup() {
  console.log('🔍 Verifying setup...\n');
  
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    // Check users table structure
    const [userColumns] = await connection.query('DESCRIBE users');
    const columnNames = userColumns.map(col => col.Field);
    
    const requiredColumns = [
      'id', 'username', 'password_hash', 'role',
      'failed_login_attempts', 'locked_until'
    ];
    
    console.log('Checking users table columns:');
    for (const col of requiredColumns) {
      if (columnNames.includes(col)) {
        console.log(`  ✅ ${col}`);
      } else {
        console.log(`  ❌ ${col} - MISSING!`);
      }
    }
    
    // Check audit_logs table
    console.log('\nChecking audit_logs table:');
    try {
      await connection.query('SELECT 1 FROM audit_logs LIMIT 1');
      console.log('  ✅ audit_logs table exists');
    } catch (err) {
      console.log('  ❌ audit_logs table does NOT exist');
    }
    
    // Check outbox_events table
    console.log('\nChecking outbox_events table:');
    try {
      await connection.query('SELECT 1 FROM outbox_events LIMIT 1');
      console.log('  ✅ outbox_events table exists');
    } catch (err) {
      console.log('  ❌ outbox_events table does NOT exist');
    }
    
    // Check refresh_tokens table
    console.log('\nChecking refresh_tokens table:');
    try {
      await connection.query('SELECT 1 FROM refresh_tokens LIMIT 1');
      console.log('  ✅ refresh_tokens table exists');
    } catch (err) {
      console.log('  ❌ refresh_tokens table does NOT exist');
    }
    
    console.log('\n✅ Verification complete!\n');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await connection.end();
  }
}

async function main() {
  console.log('═══════════════════════════════════════');
  console.log('   IAM SERVICE SETUP');
  console.log('═══════════════════════════════════════\n');
  
  try {
    // Step 1: Generate secrets
    await generateSecrets();
    
    // Step 2: Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.log('❌ Setup aborted due to database connection failure.\n');
      process.exit(1);
    }
    
    // Step 3: Run migrations
    await runMigrations();
    
    // Step 4: Verify setup
    await verifySetup();
    
    console.log('═══════════════════════════════════════');
    console.log('   ✅ IAM SERVICE SETUP COMPLETE!');
    console.log('═══════════════════════════════════════\n');
    console.log('Next steps:');
    console.log('1. Update JWT secrets in .env file');
    console.log('2. Start IAM service: npm start');
    console.log('3. Test endpoints with the frontend\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
