const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = 5200;

// เปิดฐานข้อมูล SQLite (ถ้าไม่มีไฟล์ database.sqlite มันจะสร้างให้)
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.message);
  } else {
    console.log("✅ Connected to SQLite database");
  }
});

// เปิดใช้งาน CORS และ JSON
app.use(cors());
app.use(express.json());

// สร้างตารางทะเบียนรถ (ถ้ายังไม่มี)
db.run(
  `CREATE TABLE IF NOT EXISTS plates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate TEXT NOT NULL,
    total INTEGER NOT NULL,
    price TEXT NOT NULL,
    status TEXT NOT NULL
  )`,
  (err) => {
    if (err) console.error("❌ Error creating table:", err.message);
  }
);

// 📌 ดึงข้อมูลทะเบียนทั้งหมด
app.get("/plates", (req, res) => {
  db.all("SELECT * FROM plates", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 📌 เพิ่มทะเบียนใหม่
app.post("/plates", (req, res) => {
  const { plate, total, price, status } = req.body;
  db.run(
    "INSERT INTO plates (plate, total, price, status) VALUES (?, ?, ?, ?)",
    [plate, total, price, status],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, plate, total, price, status });
    }
  );
});

// 📌 อัปเดตสถานะ
app.put("/plates/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.run("UPDATE plates SET status = ? WHERE id = ?", [status, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "อัปเดตสถานะเรียบร้อย" });
  });
});

// 📌 ลบทะเบียน
app.delete("/plates/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM plates WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "ลบทะเบียนเรียบร้อย" });
  });
});

// 📌 เปิดเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});