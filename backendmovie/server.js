// File: server.js - UPDATED VERSION v3 (thêm CRUD Rạp + sửa /tickets/pay)
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
    if (!pool || !pool.connected) {
      pool = await sql.connect(config);
    }
    next();
  } catch (err) {
    console.error('DB connection error in middleware:', err);
    res.status(500).json({ error: 'Lỗi kết nối database' });
  }
}

app.use(ensureConnection);

// ============================================================
// WRAPPER PROCEDURES
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

// 2.x) CRUD for Rap (Theaters)

// Create
app.post('/theaters', async (req, res) => {
  try {
    const { MaRap, TenRap, DiaChi, ThanhPho, SoDienThoai, Email } = req.body || {};
    if (!MaRap || !TenRap) {
      return res.status(400).json({
        returnValue: -1,
        ThongBao: 'Mã rạp và Tên rạp không được để trống'
      });
    }

    const request = pool.request()
      .input('MaRap', sql.VarChar(10), MaRap)
      .input('TenRap', sql.NVarChar(100), TenRap)
      .input('DiaChi', sql.NVarChar(255), DiaChi || null)
      .input('ThanhPho', sql.NVarChar(50), ThanhPho || null)
      .input('SoDienThoai', sql.VarChar(15), SoDienThoai || null)
      .input('Email', sql.VarChar(50), Email || null)
      .output('ThongBao', sql.NVarChar(255));

    const result = await request.execute('Rap_Insert');

    return res.status(200).json({
      returnValue: result.returnValue,
      ThongBao: result.output.ThongBao
    });
  } catch (err) {
    console.error('Error POST /theaters:', err);
    return res.status(500).json({
      returnValue: -1,
      ThongBao: err.message || 'Lỗi thêm rạp'
    });
  }
});

// Update
app.put('/theaters/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { TenRap, DiaChi, ThanhPho, SoDienThoai, Email } = req.body || {};

    if (!TenRap) {
      return res.status(400).json({
        returnValue: -1,
        ThongBao: 'Tên rạp không được để trống'
      });
    }

    const request = pool.request()
      .input('MaRap', sql.VarChar(10), id)
      .input('TenRap', sql.NVarChar(100), TenRap)
      .input('DiaChi', sql.NVarChar(255), DiaChi || null)
      .input('ThanhPho', sql.NVarChar(50), ThanhPho || null)
      .input('SoDienThoai', sql.VarChar(15), SoDienThoai || null)
      .input('Email', sql.VarChar(50), Email || null)
      .output('ThongBao', sql.NVarChar(255));

    const result = await request.execute('Rap_Update');

    return res.status(200).json({
      returnValue: result.returnValue,
      ThongBao: result.output.ThongBao
    });
  } catch (err) {
    console.error('Error PUT /theaters/:id:', err);
    return res.status(500).json({
      returnValue: -1,
      ThongBao: err.message || 'Lỗi cập nhật rạp'
    });
  }
});

// Delete
app.delete('/theaters/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const request = pool.request()
      .input('MaRap', sql.VarChar(10), id)
      .output('ThongBao', sql.NVarChar(255));

    const result = await request.execute('Rap_Delete');

    return res.status(200).json({
      returnValue: result.returnValue,
      ThongBao: result.output.ThongBao
    });
  } catch (err) {
    console.error('Error DELETE /theaters/:id:', err);
    return res.status(500).json({
      returnValue: -1,
      ThongBao: err.message || 'Lỗi xóa rạp'
    });
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

// 5) GetSeatsByShowtime
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
app.get('/stats/showtime-seats/:movieId/:showtimeId', async (req, res) => {
  try {
    const result = await pool.request()
      .input('MaPhim', sql.VarChar(10), req.params.movieId)
      .input('MaSuat', sql.VarChar(10), req.params.showtimeId)
      .execute('GetShowtimeSeatStats');

    return res.json(result.recordset[0] || { TongSoGhe: 0, SoGheKhongTrong: 0 });
  } catch (err) {
    console.error('Error /stats/showtime-seats:', err);
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
// CORE STORED PROCEDURES
// ============================================================

// 7) DatVe - Book ticket
app.post('/bookings', async (req, res) => {
  try {
    const { movieId, showtimeId, theaterId, roomName, seatId, promoCode } = req.body;

    const request = pool.request()
      .input('MaKH', sql.VarChar(10), 'KH01')
      .input('MaPhim', sql.VarChar(10), movieId)
      .input('MaSuat', sql.VarChar(10), showtimeId)
      .input('MaRap', sql.VarChar(10), theaterId)
      .input('TenPhong', sql.NVarChar(50), roomName)
      .input('MaGhe', sql.VarChar(10), seatId)
      .input('MaKM', sql.VarChar(20), promoCode || null)
      .output('MaVe', sql.VarChar(20))
      .output('MaGD', sql.VarChar(20))
      .output('GiaCuoi', sql.Decimal(18, 0))
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
    return res.status(500).send(err.message || 'Lỗi đặt vé');
  }
});

// 8) HuyVe - Cancel ticket
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
// Hủy nhiều vé - gọi HuyVe cho từng vé
// Hủy nhiều vé - gọi HuyVe cho từng vé
app.post('/tickets/bulk-cancel', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        error: 'Không có vé nào được chọn'
      });
    }

    const results = [];

    for (const id of ids) {
      try {
        const request = pool.request()
          .input('MaVe', sql.VarChar(20), id)
          .output('ThongBao', sql.NVarChar(255));

        const result = await request.execute('HuyVe');

        results.push({
          id,
          success: result.returnValue === 0,
          message: result.output.ThongBao
        });
      } catch (err) {
        console.error(`Error cancel ticket ${id}:`, err);
        results.push({
          id,
          success: false,
          message: err.message || 'Lỗi hủy vé'
        });
      }
    }

    return res.json({ results });
  } catch (err) {
    console.error('Error /tickets/bulk-cancel:', err);
    return res.status(500).json({ error: err.message });
  }
});


// 8.x) ThanhToanVe - Pay SINGLE ticket (nhận MaVe, tìm MaGD, gọi ThanhToanVe)
app.post('/tickets/pay', async (req, res) => {
  try {
    const { ticketId, phuongThuc } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        returnValue: -1,
        ThongBao: 'Thiếu ticketId'
      });
    }
    if (!phuongThuc) {
      return res.status(400).json({
        returnValue: -1,
        ThongBao: 'Thiếu phương thức thanh toán'
      });
    }

    // Lấy MaGiaoDich từ vé
    const ticketResult = await pool.request()
      .input('MaVe', sql.VarChar(20), ticketId)
      .query(`
        SELECT v.MaGiaoDich, gd.TongSoTien
        FROM VePhim v
        LEFT JOIN GiaoDich gd ON v.MaGiaoDich = gd.MaGiaoDich
        WHERE v.MaVe = @MaVe
      `);

    if (!ticketResult.recordset || ticketResult.recordset.length === 0) {
      return res.status(404).json({
        returnValue: -1,
        ThongBao: 'Vé không tồn tại'
      });
    }

    const row = ticketResult.recordset[0];
    const maGD = row.MaGiaoDich;

    if (!maGD) {
      return res.status(400).json({
        returnValue: -1,
        ThongBao: 'Vé chưa có giao dịch để thanh toán'
      });
    }

    const payReq = pool.request()
      .input('MaGD', sql.VarChar(20), maGD)
      .input('PhuongThucTT', sql.NVarChar(50), phuongThuc)
      .output('ThongBao', sql.NVarChar(255));

    const payResult = await payReq.execute('ThanhToanVe');

    return res.status(200).json({
      returnValue: payResult.returnValue,
      MaGD: maGD,
      TongTien: row.TongSoTien || null,
      ThongBao: payResult.output.ThongBao
    });
  } catch (err) {
    console.error('Error /tickets/pay:', err);
    return res.status(500).json({
      returnValue: -1,
      ThongBao: err.message || 'Lỗi thanh toán'
    });
  }
});

// 9) Thanh toán nhiều vé (vẫn dùng proc ThanhToanNhieuVe nếu bạn đã tạo)
app.post('/tickets/pay-multiple', async (req, res) => {
  try {
    const { ticketIds, phuongThuc } = req.body;  // ticketIds: ["VE001", "VE002"]
    
    if (!ticketIds || ticketIds.length === 0) {
      return res.status(400).json({ error: 'Chưa chọn vé nào' });
    }

    const request = pool.request()
      .input('MaKH', sql.VarChar(10), 'KH01')
      .input('DanhSachMaVe', sql.NVarChar(sql.MAX), JSON.stringify(ticketIds))
      .input('PhuongThucTT', sql.NVarChar(50), phuongThuc)
      .output('MaGD', sql.VarChar(20))
      .output('TongTien', sql.Decimal(18,0))
      .output('ThongBao', sql.NVarChar(255));

    const result = await request.execute('ThanhToanNhieuVe');

    return res.json({
      returnValue: result.returnValue,
      MaGD: result.output.MaGD,
      TongTien: result.output.TongTien,
      ThongBao: result.output.ThongBao
    });
  } catch (err) {
    console.error('Error /tickets/pay-multiple:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 10) Get seat price
app.get('/seats/price', async (req, res) => {
  try {
    let { seatType } = req.query;

    if (!seatType) {
      return res.status(400).json({ error: "Missing seatType" });
    }

    const normalizeVietnamese = (str) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const normalized = normalizeVietnamese(String(seatType)).toLowerCase();

    const priceMap = {
      vip: 150000,
      couple: 200000,
      imax: 180000,
      thuong: 100000,
    };

    const price = priceMap[normalized] ?? 100000;

    return res.json({
      seatType,
      normalizedType: normalized,
      price,
    });
  } catch (err) {
    console.error("ERROR /seats/price:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// 11) GetTicketDetail
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
// STATISTICS ENDPOINTS
// ============================================================

// GetSavings
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

// GetSpending
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

// GetBookedSeats
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

// GetTicketCount
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
// GetPoints
app.get('/stats/points/:customerId', async (req, res) => {
  try {
    const result = await pool.request()
      .input('MaKH', sql.VarChar(10), req.params.customerId)
      .execute('GetPoints');

    // Nếu không có dòng nào thì trả 0
    const row = result.recordset && result.recordset[0]
      ? result.recordset[0]
      : { Points: 0 };

    return res.json(row);
  } catch (err) {
    console.error('Error /stats/points:', err);
    return res.status(500).json({ error: err.message });
  }
});
// ============================================================
// UTILITY ENDPOINTS
// ============================================================

app.post('/admin/cleanup-expired', async (req, res) => {
  try {
    await pool.request().execute('XoaVeQuaHan');
    return res.json({ message: 'Cleanup completed' });
  } catch (err) {
    console.error('Error /admin/cleanup-expired:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: pool && pool.connected ? 'Connected' : 'Disconnected'
  });
});

app.get('/api/endpoints', (req, res) => {
  res.json({
    tickets: [
      'GET /tickets?customerId=KH01',
      'GET /ticket/detail/:id',
      'POST /bookings',
      'POST /tickets/cancel',
      'POST /tickets/pay',
      'POST /tickets/pay-multiple'
    ],
    theaters: [
      'GET /theaters',
      'POST /theaters',
      'PUT /theaters/:id',
      'DELETE /theaters/:id',
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
      'GET /stats/points/:customerId',
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
  } catch (e) {
    console.error('Error closing database:', e);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM signal...');
  try {
    if (pool) await pool.close();
  } catch (e) {
    console.error('Error closing database:', e);
  }
  process.exit(0);
});
