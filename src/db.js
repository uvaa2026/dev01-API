import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

// Azure Postgres Flexible Server requires TLS. `rejectUnauthorized: false`
// trusts Azure's certificate chain without pinning a specific CA bundle —
// fine for getting connected; pin the CA cert for stricter production
// hardening if your org requires it.
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.dbSsl ? { rejectUnauthorized: false } : false,
})

pool.on('error', (err) => {
  // Errors on idle clients (e.g. connection dropped) — log, don't crash.
  console.error('Unexpected Postgres pool error', err)
})

export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
