const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'aws-0-eu-central-1.pooler.supabase.co',
    port: process.env.DB_PORT || 6543,
    user: process.env.DB_USER || 'postgres.dilfksqdcdxefnxfeeza',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'postgres',
    ssl: { rejectUnauthorized: false }
});

module.exports = pool;
