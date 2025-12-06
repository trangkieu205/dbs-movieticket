/* ===============================================================
   DEMO BTL – HỆ THỐNG ĐẶT VÉ XEM PHIM
   Database: MovieTicketDB
   Các object đã tạo trong movie.sql (tables, proc, func, trigger)
================================================================ */
USE MovieTicketDB;
GO

/* ===============================================================
  1.1 – TẠO BẢNG (2 điểm)
  - Đủ bảng
  - Kiểu dữ liệu
  - Ràng buộc
  => Ở đây demo bằng cách SHOW cấu trúc 3 bảng chính dùng trên web:
     Rap, VePhim, Thuoc
================================================================ */

PRINT '=== 1.1. KIỂM TRA CẤU TRÚC BẢNG RAP (bảng dùng ở câu 2.1 & UI tab "Rạp") ===';
EXEC sp_help 'Rap';
EXEC sp_helpconstraint 'Rap';
PRINT '---------------------------------------------------------------------';

PRINT '=== 1.1. KIỂM TRA CẤU TRÚC BẢNG VEPHIM (bảng vé dùng ở UI tab "Vé") ===';
EXEC sp_help 'VePhim';
EXEC sp_helpconstraint 'VePhim';
PRINT '---------------------------------------------------------------------';

PRINT '=== 1.1. KIỂM TRA CẤU TRÚC BẢNG THUOC (chi tiết vé, ràng buộc ghế) ===';
EXEC sp_help 'Thuoc';
EXEC sp_helpconstraint 'Thuoc';
PRINT '=====================================================================';
GO


/* ===============================================================
  1.2 – NHẬP DỮ LIỆU (1 điểm)
  - Đủ và có nghĩa
  => Dữ liệu mẫu đã được INSERT trong movie.sql.
     Ở đây chỉ SELECT ra một vài bảng chính để minh họa.
================================================================ */

PRINT '=== 1.2. DỮ LIỆU MẪU – BẢNG RAP ===';
SELECT TOP 10 * FROM Rap;

PRINT '=== 1.2. DỮ LIỆU MẪU – BẢNG PHIM ===';
SELECT TOP 10 MaPhim, TenPhim, ThoiLuong, DaoDien FROM Phim;

PRINT '=== 1.2. DỮ LIỆU MẪU – SUẤT CHIẾU ===';
SELECT TOP 10 * FROM SuatChieu;

PRINT '=== 1.2. DỮ LIỆU MẪU – VÉ PHIM CỦA KH01 (WEB tab Vé) ===';
SELECT TOP 10 * FROM VePhim WHERE MaKhachHang = 'KH01';

PRINT '=====================================================================';
GO

