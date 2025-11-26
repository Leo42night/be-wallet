const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;

const pool = new Pool({
  host: process.env.DB_HOST || '/cloudsql/main-478815:asia-southeast1:e-wallet',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  database: 'postgres',
  port: 5432
});

// TEST KONEKSI
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Gagal terhubung ke PostgreSQL:", err.code, err.message);
  } else {
    console.log("✅ Berhasil terhubung ke PostgreSQL!", process.env.DB_NAME);
    release();
  }
});

app.get('/', async (req, res) => {
  res.send(`Hello World! ${process.env.DB_NAME}`);
});

// Login/Register endpoint
app.post('/api/auth/google', async (req, res) => {
  console.log("req.body /api/auth/google' : ", req.body);
  const name = req.body?.name || '';
  const email = req.body?.email || '';
  const photo_url = req.body?.photo_url || '';
  const telp = req.body?.phone_number || '';

  try {
    // Check if user exists
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log("result.rows : ", result.rows);
    if (result.rows.length === 0) {
      // Create new user
      result = await pool.query(
        'INSERT INTO users (name, email, photo_url, telp, balance) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, email, photo_url, telp, 100_000]
      );
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error });
  }
});

// Get user data by id
app.get('/api/user/id/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if(result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user data by email
app.get('/api/user/email', async (req, res) => {
  console.log("req.query : ", req.query);
  try {
    const email = req.query.email;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    console.log("result.rows : ", result.rows);
    if(result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user data by telp
app.get('/api/user/telp', async (req, res) => {
  console.log("req.query : ", req.query);
  try {
    const telp = req.query.telp;
    const result = await pool.query('SELECT * FROM users WHERE telp = $1', [telp]);
    console.log("result.rows : ", result.rows);
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Top up balance
app.put('/api/user/balance/email', async (req, res) => {
  console.log("req.query : ", req.query);
  try {
    const email = req.query.email;
    const result = await pool.query('UPDATE users SET balance = balance + $1 WHERE email = $2 RETURNING *', [req.body.amount, req.params.email]);
    console.log("result.rows : ", result.rows);
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// make transaction
app.post('/api/transaction/transfer', async (req, res) => {
  console.log("req.body : ", req.body);
  try {
    const result = await pool.query('INSERT INTO transactions (from_id, to_id, amount, message) VALUES ($1, $2, $3, $4) RETURNING *', 
        [req.body.from_id, req.body.to_id, req.body.amount, req.body.message]);
    console.log("result.rows : ", result.rows);

    // update balance
    await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [req.body.amount, req.body.from_id]);
    await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [req.body.amount, req.body.to_id]);
    res.json({ success: true, transaction: result.rows[0] });
  } catch (error) {
    console.log("error : ", error);
    if (error.code === '23514') {
      return res.status(400).json({ success: false, error: "Saldo tidak cukup" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// get transaction histories
app.get('/api/transaction/history/:id', async (req, res) => {
  console.log("req.params : ", req.params);
  try {
    const result = await pool.query('SELECT * FROM transactions WHERE from_id = $1 OR to_id = $2', [req.params.id, req.params.id]);
    console.log("result.rows : ", result.rows);
    res.json({ success: true, transactions: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// otp number & token
app.get('/api/otps/telp', async (req, res) => {
  console.log("req.query : ", req.query);
  try {
    const telp = req.query.telp;
    const result = await pool.query('SELECT * FROM otps WHERE telp = $1', [telp]);
    console.log("result.rows : ", result.rows);
    res.json({ success: true, otp: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
