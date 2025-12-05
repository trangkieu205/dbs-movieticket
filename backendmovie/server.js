// File: server.js - UPDATED VERSION
const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  user: 'sa',
  password: 'DB_Password',
  server: 'localhost',
  database: 'MovieTicketDB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

let pool;
async function initDB() {
  try {
    pool = await sql.connect(config);
    console.log('✅ Kết nối SQL Server thành công');
  } catch (err) {
    console.error('❌ Lỗi kết nối SQL Server:', err);
    process.exit(1);
  }
}

async function ensureConnection(req, res, next) {
  try {
    if (!pool || !pool.connected) pool = await sql.connect(config);
    next();
  } catch (err) {
    console.error('DB connection error in middleware:', err);
    res.status(500).json({ error: 'Lỗi kết nối database' });
  }
}
app.use(ensureConnection);

// ============================================================
// WRAPPER PROCEDURES - Gọi các SP wrapper
// ============================================================

// 1) GetTicketsByCustomer
app.get('/tickets', async (req, res) => {
  try {
    const customerId = req.query.customerId || 'KH01';
    const result = await pool.request()
      .input('MaKH', sql.VarChar(10), customerId)
      .execute('GetTicketsByCustomer');

    return res.json(result.recordset);
  } catch (err) {
    console.error('Error /tickets:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2) GetTheaters
app.get('/theaters', async (req, res) => {
  try {
    const result = await pool.request().execute('GetTheaters');
    return res.json(result.recordset);
  } catch (err) {
    console.error('Error /theaters:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3) GetMoviesByTheater
app.get('/theaters/:theaterId/movies', async (req, res) => {
  try {
    const { theaterId } = req.params;
    const result = await pool.request()
      .input('MaRap', sql.VarChar(10), theaterId)
      .execute('GetMoviesByTheater');

    return res.json(result.recordset);
  } catch (err) {
    console.error('Error /theaters/:movies', err);
    return res.status(500).json({ error: err.message });
  }
});

// 4) GetShowtimes
app.get('/theaters/:theaterId/movies/:movieId/showtimes', async (req, res) => {
  try {
    const { theaterId, movieId } = req.params;
    const result = await pool.request()
      .input('MaRap', sql.VarChar(10), theaterId)
      .input('MaPhim', sql.VarChar(10), movieId)
      .execute('GetShowtimes');

    return res.json(result.recordset);
  } catch (err) {
    console.error('Error /showtimes', err);
    return res.status(500).json({ error: err.message });
  }
});

// 5) GetSeatsByShowtime - FIXED: Use query params
app.get('/seats', async (req, res) => {
  try {
    const { theaterId, roomName, movieId, showtimeId } = req.query;
    
    if (!theaterId || !roomName || !movieId || !showtimeId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await pool.request()
      .input('MaRap', sql.VarChar(10), theaterId)
      .input('TenPhong', sql.NVarChar(50), roomName)
      .input('MaPhim', sql.VarChar(10), movieId)
      .input('MaSuat', sql.VarChar(10), showtimeId)
      .execute('GetSeatsByShowtime');

    return res.json(result.recordset);
  } catch (err) {
    console.error('Error /seats', err);
    return res.status(500).json({ error: err.message });
  }
});

// 6) CheckPromo
app.get('/promo/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.request()
      .input('MaKM', sql.VarChar(20), code)
      .execute('CheckPromo');

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn' });
    }
    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error /promo', err);
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CORE STORED PROCEDURES - Gọi trực tiếp các SP chính
// ============================================================

// 7) DatVe - Book ticket
app.post('/bookings', async (req, res) => {
  try {
    const { movieId, showtimeId, theaterId, roomName, seatId, promoCode } = req.body;
    
    const request = pool.request()
      .input('MaKH', sql.VarChar(10), 'KH01') // Default customer
      .input('MaPhim', sql.VarChar(10), movieId)
      .input('MaSuat', sql.VarChar(10), showtimeId)
      .input('MaRap', sql.VarChar(10), theaterId)
      .input('TenPhong', sql.NVarChar(50), roomName)
      .input('MaGhe', sql.VarChar(10), seatId)
      .input('MaKM', sql.VarChar(20), promoCode || null)
      .output('MaVe', sql.VarChar(20))
      .output('MaGD', sql.VarChar(20))
      .output('GiaCuoi', sql.Decimal(18,0))
      .output('ThongBao', sql.NVarChar(255));

    const result = await request.execute('DatVe');

    return res.json({
      returnValue: result.returnValue,
      MaVe: result.output.MaVe,
      MaGD: result.output.MaGD,
      GiaCuoi: result.output.GiaCuoi,
      ThongBao: result.output.ThongBao
    });
  } catch (err) {
    console.error('Error /bookings:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 8) HuyVe - Cancel ticket (Sử dụng SP gốc, không qua wrapper)
app.post('/tickets/cancel', async (req, res) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) return res.status(400).json({ error: 'ticketId required' });

    const request = pool.request()
      .input('MaVe', sql.VarChar(20), ticketId)
      .output('ThongBao', sql.NVarChar(255));

    const result = await request.execute('HuyVe');

    return res.json({
      returnValue: result.returnValue,
      ThongBao: result.output.ThongBao
    });
  } catch (err) {
    console.error('Error /tickets/cancel:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 9) ThanhToanVe - Pay ticket
app.post('/tickets/pay', async (req, res) => {
  try {
    const { maGD, phuongThuc } = req.body;
    if (!maGD || !phuongThuc) return res.status(400).json({ error: 'maGD and phuongThuc required' });

    const request = pool.request()
      .input('MaGD', sql.VarChar(20), maGD)
      .input('PhuongThucTT', sql.NVarChar(50), phuongThuc)
      .output('ThongBao', sql.NVarChar(255));

    const result = await request.execute('ThanhToanVe');

    return res.json({
      returnValue: result.returnValue,
      ThongBao: result.output.ThongBao
    });
  } catch (err) {
    console.error('Error /tickets/pay:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 10) GetTicketDetail - Wrapper for fn_ThongTinChiTietVe
app.get('/ticket/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.request()
      .input('MaVe', sql.VarChar(20), id)
      .execute('GetTicketDetail');

    return res.json(result.recordset);
  } catch (err) {
    console.error('Error /ticket/detail:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// STATISTICS ENDPOINTS - Sử dụng các wrapper
// ============================================================

// 11) GetSavings - fn_TongTienTietKiemCuaKH
app.get('/stats/savings/:customerId', async (req, res) => {
  try {
    const result = await pool.request()
      .input('MaKH', sql.VarChar(10), req.params.customerId)
      .execute('GetSavings');
    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error /stats/savings:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 12) GetSpending - fn_TongTienKhachHangDaTieu
app.get('/stats/spending/:customerId', async (req, res) => {
  try {
    const result = await pool.request()
      .input('MaKH', sql.VarChar(10), req.params.customerId)
      .execute('GetSpending');
    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error /stats/spending:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 13) GetBookedSeats - fn_TongSoGheDaDatTheoSuat
app.get('/stats/seats/:movieId/:showtimeId', async (req, res) => {
  try {
    const result = await pool.request()
      .input('MaPhim', sql.VarChar(10), req.params.movieId)
      .input('MaSuat', sql.VarChar(10), req.params.showtimeId)
      .execute('GetBookedSeats');
    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error /stats/seats:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 14) GetTicketCount - fn_DemSoVeTheoPhim
app.get('/stats/tickets/:movieId', async (req, res) => {
  try {
    const result = await pool.request()
      .input('MaPhim', sql.VarChar(10), req.params.movieId)
      .execute('GetTicketCount');
    return res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error /stats/tickets:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ============================================================
// UTILITY ENDPOINTS
// ============================================================

// XoaVeQuaHan - Run periodically to clean up expired tickets
app.post('/admin/cleanup-expired', async (req, res) => {
  try {
    await pool.request().execute('XoaVeQuaHan');
    return res.json({ message: 'Cleanup completed' });
  } catch (err) {
    console.error('Error /admin/cleanup-expired:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ 
  status: 'OK', 
  timestamp: new Date().toISOString(),
  database: pool && pool.connected ? 'Connected' : 'Disconnected'
}));

// List all available endpoints
app.get('/api/endpoints', (req, res) => {
  res.json({
    tickets: [
      'GET /tickets?customerId=KH01',
      'GET /ticket/detail/:id',
      'POST /bookings',
      'POST /tickets/cancel',
      'POST /tickets/pay'
    ],
    theaters: [
      'GET /theaters',
      'GET /theaters/:theaterId/movies',
      'GET /theaters/:theaterId/movies/:movieId/showtimes',
      'GET /seats?theaterId=&roomName=&movieId=&showtimeId='
    ],
    promo: [
      'GET /promo/:code'
    ],
    stats: [
      'GET /stats/savings/:customerId',
      'GET /stats/spending/:customerId',
      'GET /stats/seats/:movieId/:showtimeId',
      'GET /stats/tickets/:movieId'
    ],
    admin: [
      'POST /admin/cleanup-expired'
    ],
    utility: [
      'GET /health',
      'GET /api/endpoints'
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3001;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📋 API Documentation: http://localhost:${PORT}/api/endpoints`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  try { 
    if (pool) await pool.close(); 
    console.log('Database connection closed');
  } catch(e) {
    console.error('Error closing database:', e);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM signal...');
  try { 
    if (pool) await pool.close(); 
  } catch(e) {
    console.error('Error closing database:', e);
  }
  process.exit(0);
});