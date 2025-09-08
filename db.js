// db.js
import "dotenv/config";
import mysql from "mysql2/promise";

export const pool = await mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "alfalah",
  waitForConnections: true,
  connectionLimit: 10,
});
