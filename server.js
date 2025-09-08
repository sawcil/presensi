// server.js (ESM)
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./db.js"; // penting: .js

// ... imports sama
const app = express();
app.use(cors());
app.use(express.json());

// Pastikan secrets
["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"].forEach((k) => {
  if (!process.env[k]) {
    console.error(`Missing env: ${k}`);
    process.exit(1);
  }
});

// Helpers JWT
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "1h",
  });
}
function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    algorithm: "HS256",
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });
}

// Auth middleware
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.substring(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/Expired token" });
  }
}

// Helpers
function isValidEmail(v) {
  return typeof v === "string" && v.includes("@") && v.includes(".");
}

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  const { nama_lengkap, email, password, role = "guru" } = req.body || {};
  if (!nama_lengkap || !email || !password) {
    return res
      .status(400)
      .json({ message: "Nama, email, dan password wajib diisi" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Format email tidak valid" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password minimal 6 karakter" });
  }

  try {
    const [exists] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (exists.length) {
      return res.status(409).json({ message: "Email sudah terdaftar" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (nama, email, role, status, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, 'aktif', ?, NOW(), NOW())`,
      [nama_lengkap, email, role, password_hash]
    );

    // Buat baris guru terkait user_id
    await pool.query(
      `INSERT INTO guru (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())`,
      [result.insertId]
    );

    const user = { id: result.insertId, email, nama: nama_lengkap, role };
    const token = signAccessToken(user);
    const refreshToken = signRefreshToken({ id: user.id });
    return res
      .status(201)
      .json({ message: "Registrasi berhasil", user, token, refreshToken });
  } catch (e) {
    console.error("Register error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email dan password wajib diisi" });
  }
  try {
    const [rows] = await pool.query(
      "SELECT id, email, nama, role, status, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (!rows.length)
      return res.status(401).json({ message: "Email atau password salah" });
    const user = rows;

    if (user.status !== "aktif") {
      return res.status(403).json({ message: "Akun tidak aktif" });
    }

    const ok = await bcrypt.compare(password, user.password_hash || "");
    if (!ok)
      return res.status(401).json({ message: "Email atau password salah" });

    const payload = {
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
    };
    const token = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user.id });
    return res.json({ token, refreshToken, user: payload });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// GET profil
app.get("/api/guru/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      `SELECT
         u.id AS user_id, u.email, u.nama AS nama_user, u.role,
         g.id, g.nama_lengkap, g.nip, g.no_hp, g.jenis_kelamin, g.tanggal_lahir,
         g.alamat, g.mapel, g.status_kepegawaian, g.tanggal_bergabung, g.foto_url,
         g.created_at, g.updated_at
       FROM users u
       LEFT JOIN guru g ON g.user_id = u.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );
    if (!rows.length)
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    return res.json({ profile: rows }); // penting: 1 objek, bukan array
  } catch (e) {
    console.error("GET /api/guru/me error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// PUT profil
app.put("/api/guru/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      nama_lengkap,
      nip,
      no_hp,
      jenis_kelamin,
      tanggal_lahir,
      alamat,
      mapel,
      role,
      status_kepegawaian,
      tanggal_bergabung,
      foto_url,
    } = req.body || {};

    const allowedJK = ["L", "P"];
    if (jenis_kelamin && !allowedJK.includes(jenis_kelamin)) {
      return res.status(400).json({ message: "Jenis kelamin tidak valid" });
    }
    const allowedStatus = ["aktif", "cuti", "nonaktif"];
    if (status_kepegawaian && !allowedStatus.includes(status_kepegawaian)) {
      return res
        .status(400)
        .json({ message: "Status kepegawaian tidak valid" });
    }

    const [gRows] = await pool.query(
      "SELECT id FROM guru WHERE user_id = ? LIMIT 1",
      [userId]
    );
    if (!gRows.length) {
      await pool.query(
        `INSERT INTO guru (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())`,
        [userId]
      );
    }

    await pool.query(
      `UPDATE guru
       SET
         nama_lengkap = COALESCE(?, nama_lengkap),
         nip = COALESCE(?, nip),
         no_hp = COALESCE(?, no_hp),
         jenis_kelamin = COALESCE(?, jenis_kelamin),
         tanggal_lahir = COALESCE(?, tanggal_lahir),
         alamat = COALESCE(?, alamat),
         mapel = COALESCE(?, mapel),
         status_kepegawaian = COALESCE(?, status_kepegawaian),
         tanggal_bergabung = COALESCE(?, tanggal_bergabung),
         foto_url = COALESCE(?, foto_url),
         updated_at = NOW()
       WHERE user_id = ?`,
      [
        nama_lengkap ?? null,
        nip ?? null,
        no_hp ?? null,
        jenis_kelamin ?? null,
        tanggal_lahir ?? null,
        alamat ?? null,
        mapel ?? null,
        status_kepegawaian ?? null,
        tanggal_bergabung ?? null,
        foto_url ?? null,
        userId,
      ]
    );

    if (role) {
      const allowedRoles = ["kepala_sekolah", "guru", "operator"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Role tidak valid" });
      }
      await pool.query(
        `UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?`,
        [role, userId]
      );
    }

    const [rows] = await pool.query(
      `SELECT
         u.id AS user_id, u.email, u.nama AS nama_user, u.role,
         g.id, g.nama_lengkap, g.nip, g.no_hp, g.jenis_kelamin, g.tanggal_lahir,
         g.alamat, g.mapel, g.status_kepegawaian, g.tanggal_bergabung, g.foto_url,
         g.created_at, g.updated_at
       FROM users u
       LEFT JOIN guru g ON g.user_id = u.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );
    return res.json({ message: "Profil diperbarui", profile: rows });
  } catch (e) {
    console.error("PUT /api/guru/me error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const base = path
      .basename(file.originalname || "file", ext)
      .replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB (sebelumnya 2MB)
  fileFilter: (req, file, cb) => {
    const ok = ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
      file.mimetype
    );
    cb(ok ? null : new Error("Tipe file tidak didukung"));
  },
});

// Upload foto
app.post(
  "/api/upload",
  authMiddleware,
  upload.single("foto"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "File tidak ditemukan" });
      const url = `/uploads/${req.file.filename}`;
      await pool.query(
        `UPDATE guru SET foto_url = ?, updated_at = NOW() WHERE user_id = ?`,
        [url, req.user.id]
      );
      return res.json({ message: "Upload berhasil", url });
    } catch (e) {
      console.error("Upload error:", e);
      return res.status(500).json({ message: "Server error" });
    }
  }
);

app.post("/api/auth/send-verification", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Di sini Anda bisa menambahkan logika kirim email
    // Contoh: generate verification token, simpan di database, kirim email

    // Untuk sekarang, kita hanya return success
    return res.json({ message: "Email verifikasi berhasil dikirim" });
  } catch (e) {
    console.error("Send verification error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update PUT profil untuk pembatasan admin
app.put("/api/guru/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const isAdmin = userRole === "kepala_sekolah" || userRole === "operator";

    const {
      nama_lengkap,
      nip,
      no_hp,
      jenis_kelamin,
      tanggal_lahir,
      alamat,
      mapel,
      status_kepegawaian,
      tanggal_bergabung,
      foto_url,
    } = req.body || {};

    // Validasi field yang hanya bisa diubah admin
    if (
      !isAdmin &&
      (nip !== undefined ||
        mapel !== undefined ||
        status_kepegawaian !== undefined ||
        tanggal_bergabung !== undefined)
    ) {
      return res.status(403).json({
        message:
          "Field NIP, Mapel, Status, dan Tanggal Bergabung hanya dapat diubah oleh admin",
      });
    }

    const allowedJK = ["L", "P"];
    if (jenis_kelamin && !allowedJK.includes(jenis_kelamin)) {
      return res.status(400).json({ message: "Jenis kelamin tidak valid" });
    }

    const allowedStatus = ["aktif", "cuti", "nonaktif"];
    if (status_kepegawaian && !allowedStatus.includes(status_kepegawaian)) {
      return res
        .status(400)
        .json({ message: "Status kepegawaian tidak valid" });
    }

    const [gRows] = await pool.query(
      "SELECT id FROM guru WHERE user_id = ? LIMIT 1",
      [userId]
    );

    if (!gRows.length) {
      await pool.query(
        `INSERT INTO guru (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())`,
        [userId]
      );
    }

    // Build update query berdasarkan role
    let updateFields = [
      "nama_lengkap = COALESCE(?, nama_lengkap)",
      "no_hp = COALESCE(?, no_hp)",
      "jenis_kelamin = COALESCE(?, jenis_kelamin)",
      "tanggal_lahir = COALESCE(?, tanggal_lahir)",
      "alamat = COALESCE(?, alamat)",
      "foto_url = COALESCE(?, foto_url)",
      "updated_at = NOW()",
    ];

    let params = [
      nama_lengkap ?? null,
      no_hp ?? null,
      jenis_kelamin ?? null,
      tanggal_lahir ?? null,
      alamat ?? null,
      foto_url ?? null,
    ];

    // Tambahkan field admin jika user adalah admin
    if (isAdmin) {
      updateFields.splice(
        -1,
        0,
        "nip = COALESCE(?, nip)",
        "mapel = COALESCE(?, mapel)",
        "status_kepegawaian = COALESCE(?, status_kepegawaian)",
        "tanggal_bergabung = COALESCE(?, tanggal_bergabung)"
      );
      params.splice(
        -1,
        0,
        nip ?? null,
        mapel ?? null,
        status_kepegawaian ?? null,
        tanggal_bergabung ?? null
      );
    }

    params.push(userId);

    await pool.query(
      `UPDATE guru SET ${updateFields.join(", ")} WHERE user_id = ?`,
      params
    );

    const [rows] = await pool.query(
      `SELECT
        u.id AS user_id, u.email, u.nama AS nama_user, u.role,
        g.id, g.nama_lengkap, g.nip, g.no_hp, g.jenis_kelamin, g.tanggal_lahir,
        g.alamat, g.mapel, g.status_kepegawaian, g.tanggal_bergabung, g.foto_url,
        g.created_at, g.updated_at
      FROM users u
      LEFT JOIN guru g ON g.user_id = u.id
      WHERE u.id = ?
      LIMIT 1`,
      [userId]
    );

    return res.json({ message: "Profil diperbarui", profile: rows[0] });
  } catch (e) {
    console.error("PUT /api/guru/me error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/presensi/scan", authMiddleware, async (req, res) => {
  try {
    const { qr_data, scan_time } = req.body;
    const scannerId = req.user.id; // user yang melakukan scan

    // Validasi QR data
    if (!qr_data || !qr_data.userId || qr_data.type !== "presensi") {
      return res.status(400).json({ message: "QR Code tidak valid" });
    }

    const targetUserId = qr_data.userId;
    const scanTime = new Date(scan_time);
    const today = scanTime.toISOString().split("T")[0];

    // Cek apakah sudah presensi hari ini
    const [existing] = await pool.query(
      "SELECT id FROM presensi WHERE user_id = ? AND DATE(tanggal) = ? LIMIT 1",
      [targetUserId, today]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Sudah melakukan presensi hari ini" });
    }

    // Tentukan status berdasarkan waktu
    const hour = scanTime.getHours();
    let status = "HADIR";
    if (hour > 8) {
      // Misalnya terlambat jika lewat jam 8
      status = "TERLAMBAT";
    }

    // Insert presensi
    await pool.query(
      `INSERT INTO presensi (user_id, tanggal, status, waktu_presensi, keterangan, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [targetUserId, today, status, scanTime, `Scan by user ${scannerId}`]
    );

    return res.json({
      message: "Presensi berhasil dicatat",
      status: status,
      waktu: scanTime.toLocaleString("id-ID"),
    });
  } catch (e) {
    console.error("Presensi scan error:", e);
    return res.status(500).json({ message: "Server error" });
  }
});

// Health check
app.get("/api/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`\n🚀 API listening on http://localhost:${port}`);
  console.log("Endpoints:");
  console.log("- POST /api/auth/register");
  console.log("- POST /api/auth/login");
  console.log("- GET /api/dashboard");
  console.log("- GET /api/health\n");
});
