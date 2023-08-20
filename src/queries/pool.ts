import { Pool, PoolConfig } from 'pg'

const config: PoolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
    min: 0,
    max: 10,
    idleTimeoutMillis: 20000
}

const pool = new Pool(config)

export default pool