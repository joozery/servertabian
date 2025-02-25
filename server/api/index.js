const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(cors());
app.use(express.json());

// เชื่อมต่อ SQLite (ต้องใช้แบบ In-Memory หรือ Database ออนไลน์)
const db = new sqlite3.Database(":memory:");

// สร้างตาราง
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS plates (id INTEGER PRIMARY KEY, plate TEXT, price TEXT, status TEXT)");
});

// API: ดึงข้อมูลทะเบียน
app.get("/plates", (req, res) => {
  db.all("SELECT * FROM plates", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// API: เพิ่มทะเบียนใหม่
app.post("/plates", (req, res) => {
  const { plate, price, status } = req.body;
  db.run("INSERT INTO plates (plate, price, status) VALUES (?, ?, ?)", [plate, price, status], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, plate, price, status });
  });
});

// Export API เป็น Serverless
module.exports = app;