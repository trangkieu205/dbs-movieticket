
USE MovieTicketDB;
GO

/* ===============================================================
  1.1 – TẠO BẢNG (2 điểm)
================================================================ */

PRINT '=== 1.1. "Rạp") ===';
EXEC sp_help 'Rap';
EXEC sp_helpconstraint 'Rap';
PRINT '---------------------------------------------------------------------';

PRINT '=== 1.1. "Vé") ===';
EXEC sp_help 'VePhim';
EXEC sp_helpconstraint 'VePhim';
PRINT '---------------------------------------------------------------------';

PRINT '=== 1.1. BẢNG THUOC (chi tiết vé, ràng buộc ghế) ===';
EXEC sp_help 'Thuoc';
EXEC sp_helpconstraint 'Thuoc';
PRINT '=====================================================================';
GO


/* ===============================================================
  1.2 – NHẬP DỮ LIỆU (1 điểm)
================================================================ */

PRINT '=== 1.2. DỮ LIỆU MẪU – BẢNG RAP ===';
SELECT TOP 10 * FROM Rap;

PRINT '=== 1.2. DỮ LIỆU MẪU – BẢNG PHIM ===';
SELECT TOP 10 MaPhim, TenPhim, ThoiLuong, DaoDien FROM Phim;

PRINT '=== 1.2. DỮ LIỆU MẪU – SUẤT CHIẾU ===';
SELECT TOP 10 * FROM SuatChieu;

PRINT '=== 1.2. DỮ LIỆU MẪU – VÉ PHIM CỦA KH01  ===';
SELECT TOP 10 * FROM VePhim WHERE MaKhachHang = 'KH01';

PRINT '=====================================================================';
GO

