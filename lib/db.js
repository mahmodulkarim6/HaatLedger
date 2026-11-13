import mysql from 'mysql2/promise';
import { dbConfig } from './dbconfig.mjs';

let pool;
export function db() {
  if (!pool) pool = mysql.createPool({ ...dbConfig(), waitForConnections: true, connectionLimit: 3 });
  return pool;
}
