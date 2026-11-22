import 'dotenv/config'; // harus paling atas agar env terbaca sebelum modul lain dimuat
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import spotRoutes from './routes/spotRoutes.js';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET wajib diisi di .env (minimal 32 karakter).');
}

const app = express();
const PORT = process.env.PORT || 3000;

// CLIENT_URL boleh berisi beberapa origin dipisah koma.
// Default mencakup port dev Vite di vite.config.js (5175) dan default Vite (5173).
const allowedOrigins = (
  process.env.CLIENT_URL || 'http://localhost:5175,http://localhost:5173'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin tidak diizinkan oleh CORS.'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API AnjemDips berjalan normal!',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/spots', spotRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan.',
  });
});

// Penanganan error global (JSON rusak, CORS, dsb.)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.type === 'entity.parse.failed' ? 400 : err.status || 500;
  res.status(status).json({
    success: false,
    message:
      status === 400 ? 'Format request tidak valid.' : 'Terjadi kesalahan pada server.',
  });
});

app.listen(PORT, () => {
  console.log(`Server AnjemDips berjalan di http://localhost:${PORT}`);
});
