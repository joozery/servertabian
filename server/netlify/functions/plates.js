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

// 🛠 Netlify Lambda ไม่เก็บไฟล์ถาวร ต้องสร้าง database.db ใหม่ทุกครั้ง
const dbPath = path.join("/tmp", "database.db");

// 🛠 ตรวจสอบว่าไฟล์ Database มีอยู่หรือไม่
if (!fs.existsSync(dbPath)) {
  console.log("⚠️ Database file not found, creating a new one...");

  // ✅ คัดลอก database.db จากโปรเจ็กต์ไปที่ /tmp/
  const sourceDbPath = path.join(process.cwd(), "database.db");
  if (fs.existsSync(sourceDbPath)) {
    fs.copyFileSync(sourceDbPath, dbPath);
    console.log("✅ Copied database file to /tmp/");
  } else {
    console.log("❌ No source database found. Creating an empty database...");
    fs.writeFileSync(dbPath, "");
  }
}

// 🔹 เชื่อมต่อ SQLite Database
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database at", dbPath);

    // ✅ **สร้างตารางใหม่ถ้ายังไม่มี**
    db.run(`
      CREATE TABLE IF NOT EXISTS plates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plate TEXT NOT NULL,
        total INTEGER,
        price TEXT NOT NULL,
        status TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error("❌ Error creating table:", err.message);
      } else {
        console.log("✅ Table 'plates' is ready");
      }
    });
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

// ✅ API เพิ่มป้ายทะเบียน
router.post("/addPlate", (req, res) => {
  const { plate, total, price, status } = req.body;
  if (!plate || !price) {
    return res.status(400).json({ error: "ต้องใส่หมายเลขทะเบียนและราคา" });
  }

  const sql = `INSERT INTO plates (plate, total, price, status) VALUES (?, ?, ?, ?)`;
  db.run(sql, [plate, total, price, status], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, plate, total, price, status });
  });
});

// ✅ API อัปเดตสถานะ
router.put("/updateStatus/:id", (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  db.run(`UPDATE plates SET status = ? WHERE id = ?`, [status, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "อัปเดตสถานะเรียบร้อย", id, status });
  });
});

// ✅ API ลบทะเบียน
router.delete("/deletePlate/:id", (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM plates WHERE id = ?`, id, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "ลบทะเบียนเรียบร้อย", id });
  });
});

// 🛠 ใช้ Netlify Functions
app.use("/.netlify/functions", router);
module.exports = app;
module.exports.handler = serverless(app);