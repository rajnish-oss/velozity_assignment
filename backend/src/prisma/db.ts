import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

// This module is evaluated once per Node.js process, so every controller and
// route that imports `db` shares the same lazy Postgres pool.
export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL'],
});
