const express = require("express");
const serverless = require("serverless-http");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();
const router = express.Router();

app.use(cors());
app.use(bodyParser.json());

// 🛠 ใช้ path ที่ Netlify Lambda หาเจอ
const dbPath = path.join(process.env.LAMBDA_TASK_ROOT || process.cwd(), "database.db");

// 🔹 ตรวจสอบว่าไฟล์ฐานข้อมูลมีอยู่หรือไม่ (ป้องกัน Error)
if (!fs.existsSync(dbPath)) {
  console.error("❌ Database file not found:", dbPath);
} else {
  console.log("✅ Database file found:", dbPath);
}

// 🔹 เชื่อมต่อ SQLite Database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// ✅ API ดึงข้อมูลทั้งหมด
router.get("/plates", (req, res) => {
  db.all("SELECT * FROM plates", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 🛠 ใช้ Netlify Functions
app.use("/.netlify/functions", router);
module.exports = app;
module.exports.handler = serverless(app);