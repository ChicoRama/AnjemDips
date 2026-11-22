import 'dotenv/config';
import jwt from 'jsonwebtoken';

export default function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token autentikasi tidak ditemukan.',
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      message: expired
        ? 'Sesi telah berakhir. Silakan login kembali.'
        : 'Token tidak valid.',
    });
  }
}