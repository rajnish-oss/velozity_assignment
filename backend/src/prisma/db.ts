// The ORM's timestamptz codec reads Temporal from the global scope. Import the
// global installer here (before creating the client) so standalone scripts,
// including the seed command, have the same runtime setup as the HTTP server.
import 'temporal-polyfill/full/global';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

// This module is evaluated once per Node.js process, so every controller and
// route that imports `db` shares the same lazy Postgres pool.
export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL'],
});
