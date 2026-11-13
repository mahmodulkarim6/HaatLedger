// Shared by the Next.js API and the setup script.
export function dbConfig() {
  const ssl = process.env.DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  const url = process.env.DATABASE_URL;
  if (url) {
    const u = new URL(url);
    return { host: u.hostname, port: Number(u.port || 3306), user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: u.pathname.slice(1), ssl, dateStrings: true, decimalNumbers: true };
  }
  return { host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, ssl, dateStrings: true, decimalNumbers: true };
}
