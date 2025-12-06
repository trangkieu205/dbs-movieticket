USE master;
GO

ALTER DATABASE MovieTicketDB
SET SINGLE_USER 
WITH ROLLBACK IMMEDIATE;
GO

DROP DATABASE MovieTicketDB
GO
CREATE DATABASE MovieTicketDB
GO
USE MovieTicketDB
GO
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_VePhim_GiaoDich')
    ALTER TABLE VePhim DROP CONSTRAINT FK_VePhim_GiaoDich;

-- Xóa bảng 
DROP TABLE IF EXISTS DiemThayDoi;
DROP TABLE IF EXISTS LichSuDiem;
DROP TABLE IF EXISTS Thuoc; 
DROP TABLE IF EXISTS VePhim;
DROP TABLE IF EXISTS GiaoDich; 
DROP TABLE IF EXISTS DuocChieu;
DROP TABLE IF EXISTS MaKhuyenMai;
DROP TABLE IF EXISTS SuKienKhuyenMai;
DROP TABLE IF EXISTS NhanVien;
DROP TABLE IF EXISTS KhachHang;
DROP TABLE IF EXISTS TaiKhoan;
DROP TABLE IF EXISTS Ghe;
DROP TABLE IF EXISTS SuatChieu;
DROP TABLE IF EXISTS Phim;
DROP TABLE IF EXISTS PhongChieu;
DROP TABLE IF EXISTS Rap;
GO

-- --- 1.1. TẠO BẢNG ---

-- 1. Bảng Rạp
CREATE TABLE Rap (
    MaRap VARCHAR(10) NOT NULL,
    TenRap NVARCHAR(100) NOT NULL,
    DiaChi NVARCHAR(255),
    ThanhPho NVARCHAR(50),
    SoDienThoai VARCHAR(15),
    Email VARCHAR(50),
    PRIMARY KEY (MaRap)
);

-- 2. Bảng Phòng Chiếu
CREATE TABLE PhongChieu (
    MaRap VARCHAR(10) NOT NULL,
    TenPhong NVARCHAR(50) NOT NULL,
    SucChua INT CHECK (SucChua > 0),
    LoaiPhong NVARCHAR(50),
    PRIMARY KEY (MaRap, TenPhong),
    FOREIGN KEY (MaRap) REFERENCES Rap(MaRap)
);

-- 3. Bảng Phim
CREATE TABLE Phim (
    MaPhim VARCHAR(10) NOT NULL,
    TenPhim NVARCHAR(100) NOT NULL,
    MoTa NVARCHAR(MAX),
    ThoiLuong INT CHECK (ThoiLuong > 0),
    DaoDien NVARCHAR(100),
    DienVienChinh NVARCHAR(255),
    NgayKhoiChieu DATE,
    NamPhatHanh INT,
    Poster VARCHAR(255),
    PRIMARY KEY (MaPhim)
);

-- 4. Bảng Suất Chiếu
CREATE TABLE SuatChieu (
    MaPhim VARCHAR(10) NOT NULL,
    MaSuat VARCHAR(10) NOT NULL,
    NgayChieu DATE,
    GioChieu TIME,
    PRIMARY KEY (MaPhim, MaSuat),
    FOREIGN KEY (MaPhim) REFERENCES Phim(MaPhim)
);

-- 5. Bảng Ghế
CREATE TABLE Ghe (
    MaRap VARCHAR(10) NOT NULL,
    TenPhong NVARCHAR(50) NOT NULL,
    MaGhe VARCHAR(10) NOT NULL,
    TinhTrang NVARCHAR(20) DEFAULT N'Trống',
    LoaiGhe NVARCHAR(20),
    PRIMARY KEY (MaRap, TenPhong, MaGhe),
    FOREIGN KEY (MaRap, TenPhong) REFERENCES PhongChieu(MaRap, TenPhong)
);

-- 6. Bảng Tài Khoản 
CREATE TABLE TaiKhoan (
    MaTK VARCHAR(10) NOT NULL,
    TenDangNhap VARCHAR(50) NOT NULL UNIQUE,
    MatKhau VARCHAR(255) NOT NULL,
    TrangThai NVARCHAR(20),
    NgayTao DATE DEFAULT GETDATE(),
    SoDienThoai VARCHAR(10),
    Email VARCHAR(50),
    NgaySinh DATE,
    GioiTinh NVARCHAR(10),
    PRIMARY KEY (MaTK)
);

-- 7. Bảng Khách Hàng
CREATE TABLE KhachHang (
    MaKhachHang VARCHAR(10) NOT NULL,
    MaTK VARCHAR(10) NOT NULL,
    DiemTichLuy INT DEFAULT 0,
    PRIMARY KEY (MaKhachHang),
    FOREIGN KEY (MaTK) REFERENCES TaiKhoan(MaTK)
);

-- 8. Bảng Nhân Viên
CREATE TABLE NhanVien (
    MaNhanVien VARCHAR(10) NOT NULL,
    MaTK VARCHAR(10) NOT NULL,
    MaRap VARCHAR(10) NOT NULL,
    PRIMARY KEY (MaNhanVien),
    FOREIGN KEY (MaTK) REFERENCES TaiKhoan(MaTK),
    FOREIGN KEY (MaRap) REFERENCES Rap(MaRap)
);

-- 9. Bảng Sự Kiện Khuyến Mãi
CREATE TABLE SuKienKhuyenMai (
    TenDotKM NVARCHAR(100) NOT NULL, 
    NgayBatDau DATE,
    NgayKetThuc DATE,
    DieuKienNhan NVARCHAR(255) NOT NULL,
    PRIMARY KEY (TenDotKM)
);

-- 10. Bảng Mã Khuyến Mãi
CREATE TABLE MaKhuyenMai (
    MaKM VARCHAR(20) NOT NULL,
    TenDotKM NVARCHAR(100),
    PhanTramGiam FLOAT NOT NULL CHECK (PhanTramGiam BETWEEN 0 AND 100),
    DieuKienApDung NVARCHAR(255) NOT NULL,
    HanSuDung DATE,
    SoLuong INT CHECK (SoLuong >= 0),
    PRIMARY KEY (MaKM),
    FOREIGN KEY (TenDotKM) REFERENCES SuKienKhuyenMai(TenDotKM)
);

-- 11. Bảng Được Chiếu
CREATE TABLE DuocChieu (
    MaRap VARCHAR(10) NOT NULL,
    TenPhong NVARCHAR(50) NOT NULL,
    MaPhim VARCHAR(10) NOT NULL,
    MaSuat VARCHAR(10) NOT NULL,
    PRIMARY KEY (MaRap, TenPhong, MaPhim, MaSuat),
    FOREIGN KEY (MaRap, TenPhong) REFERENCES PhongChieu(MaRap, TenPhong),
    FOREIGN KEY (MaPhim, MaSuat) REFERENCES SuatChieu(MaPhim, MaSuat)
);

-- 12. Bảng Giao Dịch 
CREATE TABLE GiaoDich (
    MaGiaoDich VARCHAR(20) NOT NULL,
    TongSoTien DECIMAL(18,0),
    ThoiGianThucHien DATETIME DEFAULT GETDATE(),
    PhuongThucTT NVARCHAR(50),
    MaKM VARCHAR(20),
    MaKhachHangDat VARCHAR(10),
    TrangThai NVARCHAR(20) DEFAULT N'Chưa thanh toán', 
    PRIMARY KEY (MaGiaoDich),
    FOREIGN KEY (MaKM) REFERENCES MaKhuyenMai(MaKM),
    FOREIGN KEY (MaKhachHangDat) REFERENCES KhachHang(MaKhachHang)
);

-- 13. Bảng Vé Phim
CREATE TABLE VePhim (
    MaVe VARCHAR(20) NOT NULL,
    MaKhachHang VARCHAR(10) NOT NULL,
    MaGiaoDich VARCHAR(20) NULL,
    GiaVe DECIMAL(18,0) CHECK (GiaVe >= 0),
    TrangThai NVARCHAR(20) DEFAULT N'Chưa thanh toán',
    ThoiGianDat DATETIME DEFAULT GETDATE(),
    PRIMARY KEY (MaVe),
    FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    FOREIGN KEY (MaGiaoDich) REFERENCES GiaoDich(MaGiaoDich)
);


-- 14. Bảng Thuộc (ChiTietVe)
CREATE TABLE Thuoc (
    MaVe VARCHAR(20) NOT NULL, 
    MaPhim VARCHAR(10) NOT NULL,
    MaSuat VARCHAR(10) NOT NULL,
    MaRap VARCHAR(10) NOT NULL,
    TenPhong NVARCHAR(50) NOT NULL,
    MaGhe VARCHAR(10) NOT NULL,
    PRIMARY KEY (MaVe),
    FOREIGN KEY (MaVe) REFERENCES VePhim(MaVe),
    FOREIGN KEY (MaPhim, MaSuat) REFERENCES SuatChieu(MaPhim, MaSuat),
    FOREIGN KEY (MaRap, TenPhong, MaGhe) REFERENCES Ghe(MaRap, TenPhong, MaGhe),
    CONSTRAINT UQ_Suat_Ghe UNIQUE (MaPhim, MaSuat, MaRap, TenPhong, MaGhe)
);

-- 15. Bảng Lịch Sử Điểm
CREATE TABLE LichSuDiem (
    MaLichSu VARCHAR(20) NOT NULL,
    MaKhachHang VARCHAR(10) NOT NULL,
    NgayThayDoi DATE DEFAULT GETDATE(),
    PRIMARY KEY (MaLichSu),
    FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang)
);

-- 16. Bảng Điểm Thay Đổi
CREATE TABLE DiemThayDoi (
    MaLichSu VARCHAR(20) NOT NULL,
    MaThanhToan VARCHAR(50) NOT NULL, 
    SoDiemThayDoi INT NOT NULL,
    PRIMARY KEY (MaLichSu, MaThanhToan),
    FOREIGN KEY (MaLichSu) REFERENCES LichSuDiem(MaLichSu)
);

GO
-- 18. Trigger
-- Tự động cập nhật trạng thái ghế và vé sang "Đã đặt" nếu "TrangThai" GiaoDich 
-- từ "Chưa thanh toán" -> "Thành công"
CREATE OR ALTER TRIGGER CapNhatTrangThaiVeVaGhe
ON GiaoDich
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(TrangThai) 
    BEGIN
        -- Update ghe
        UPDATE Ghe
        SET TinhTrang = N'Đã đặt'
        FROM Ghe g
        JOIN Thuoc t ON g.MaRap = t.MaRap AND g.TenPhong = t.TenPhong AND g.MaGhe = t.MaGhe
        JOIN VePhim v ON t.MaVe = v.MaVe
        JOIN Inserted i ON v.MaGiaoDich = i.MaGiaoDich
        WHERE i.TrangThai IN (N'Thành công');
        -- Update ve
        UPDATE VePhim
        SET TrangThai = N'Đã đặt'
        FROM VePhim v
        JOIN Inserted i ON v.MaGiaoDich = i.MaGiaoDich
        WHERE i.TrangThai IN (N'Thành công');
    END
END;
GO


-- --- 1.2: TẠO DỮ LIỆU MẪU ---

-- 1. Rạp
INSERT INTO Rap (MaRap, TenRap, DiaChi, ThanhPho, SoDienThoai) VALUES
('R01', N'CGV Vincom Đồng Khởi', N'72 Lê Thánh Tôn', N'Hồ Chí Minh', '0281234567'),
('R02', N'CGV Aeon Bình Tân', N'1 Đường số 17A', N'Hồ Chí Minh', '0287654321'),
('R03', N'CGV Landmark 81', N'208 Nguyễn Hữu Cảnh', N'Hồ Chí Minh', '0289999888'),
('R04', N'CGV Indochina Plaza', N'241 Xuân Thủy', N'Hà Nội', '0241234567'),
('R05', N'CGV Vincom Đà Nẵng', N'910A Ngô Quyền', N'Đà Nẵng', '0236123456');

-- 2. Phòng Chiếu
INSERT INTO PhongChieu (MaRap, TenPhong, SucChua, LoaiPhong) VALUES
('R01', 'P01', 100, '2D Standard'), 
('R01', 'P02', 80, '3D IMAX'),
('R02', 'P01', 120, '2D Standard'), 
('R02', 'P02', 50, 'Gold Class'),
('R03', 'P01', 200, 'IMAX Laser'),
('R04', 'P01', 150, '2D Standard');

-- 3. Phim
INSERT INTO Phim (MaPhim, TenPhim, ThoiLuong, DaoDien, NgayKhoiChieu) VALUES
('MV01', N'Mai', 131, N'Trấn Thành', '2024-02-10'),
('MV02', N'Dune: Part Two', 166, N'Denis Villeneuve', '2024-03-01'),
('MV03', N'Kung Fu Panda 4', 94, N'Mike Mitchell', '2024-03-08'),
('MV04', N'Exhuma: Quật Mộ Trùng Ma', 134, N'Jang Jae-hyun', '2024-03-15'),
('MV05', N'Godzilla x Kong', 115, N'Adam Wingard', '2024-03-29');

-- 4. Suất Chiếu
INSERT INTO SuatChieu (MaPhim, MaSuat, NgayChieu, GioChieu) VALUES
('MV01', 'S01', '2025-11-20', '19:00:00'),
('MV02', 'S01', '2025-11-20', '18:00:00'),
('MV03', 'S01', '2025-11-21', '10:00:00'),
('MV04', 'S01', '2025-11-21', '23:00:00'),
('MV05', 'S01', '2025-11-22', '20:00:00'),
('MV01', 'S02', '2025-11-20', '21:30:00');

-- 5. Được Chiếu
INSERT INTO DuocChieu (MaRap, TenPhong, MaPhim, MaSuat) VALUES
('R01', 'P01', 'MV01', 'S01'),
('R01', 'P02', 'MV02', 'S01'), 
('R02', 'P01', 'MV03', 'S01'),
('R03', 'P01', 'MV04', 'S01'),
('R04', 'P01', 'MV05', 'S01'),
('R01', 'P01', 'MV01', 'S02');

-- 6. Ghế 
INSERT INTO Ghe (MaRap, TenPhong, MaGhe, LoaiGhe, TinhTrang) VALUES
('R01', 'P01', 'A1', N'Thường', N'Đã đặt'), ('R01', 'P01', 'A2', N'Thường', N'Trống'),
('R01', 'P01', 'A3', N'Thường', N'Chờ'), ('R01', 'P01', 'A4', N'Thường', N'Đã đặt'), 
('R01', 'P01', 'C1', N'VIP', N'Đã đặt'),    ('R01', 'P01', 'C2', N'VIP', N'Đã đặt'), 
('R01', 'P01', 'C3', N'VIP', N'Đã đặt'),                                
('R02', 'P01', 'A1', N'Thường', N'Trống'), ('R03', 'P01', 'A1', N'IMAX', N'Trống'),
('R04', 'P01', 'A1', N'Thường', N'Trống');

-- 7. Tài Khoản
INSERT INTO TaiKhoan (MaTK, TenDangNhap, MatKhau, Email, SoDienThoai) VALUES
('TK01', 'nguyenvana', 'pass', 'vana@gmail.com', '0909001'),
('TK02', 'tranthib', 'pass', 'thib@gmail.com', '0909002'),
('TK03', 'lethic', 'pass', 'thic@gmail.com', '0909003'),
('TK04', 'phamvand', 'pass', 'vand@gmail.com', '0909004'),
('TK05', 'hoangthie', 'pass', 'thie@gmail.com', '0909005'),
('TK06', 'staff_r01', 'admin', 'staff1@cgv.vn', '0912001'),
('TK07', 'staff_r02', 'admin', 'staff2@cgv.vn', '0912002'),
('TK08', 'staff_r03', 'admin', 'staff3@cgv.vn', '0912003'),
('TK09', 'staff_r04', 'admin', 'staff4@cgv.vn', '0912004'),
('TK10', 'staff_r05', 'admin', 'staff5@cgv.vn', '0912005');

-- 8. Khách Hàng
INSERT INTO KhachHang (MaKhachHang, MaTK, DiemTichLuy) VALUES
('KH01', 'TK01', 5000),
('KH02', 'TK02', 12000), 
('KH03', 'TK03', 0),
('KH04', 'TK04', 2000),
('KH05', 'TK05', 15000);

-- 9. Nhân Viên
INSERT INTO NhanVien (MaNhanVien, MaTK, MaRap) VALUES
('NV01', 'TK06', 'R01'),
('NV02', 'TK07', 'R02'),
('NV03', 'TK08', 'R03'),
('NV04', 'TK09', 'R04'),
('NV05', 'TK10', 'R05');

-- 10. Sự kiện Khuyến Mãi
INSERT INTO SuKienKhuyenMai (TenDotKM, NgayBatDau, NgayKetThuc, DieuKienNhan) VALUES
(N'Chào Hè 2025', '2025-05-01', '2025-07-31', N'Tất cả khách hàng'),
(N'Thành Viên Mới', '2025-01-01', '2025-12-31', N'Đăng ký mới'),
(N'Black Friday', '2025-11-25', '2025-11-30', N'Hóa đơn > 200k'),
(N'Tết Nguyên Đán', '2026-02-01', '2026-02-14', N'Tất cả khách hàng'),
(N'Ngày Hội Cinema', '2025-09-01', '2025-09-05', N'HSSV');

-- 11. Mã Khuyến Mãi
INSERT INTO MaKhuyenMai (MaKM, TenDotKM, PhanTramGiam, SoLuong, DieuKienApDung) VALUES
('HE2025', N'Chào Hè 2025', 10, 100, N'Hóa đơn > 100k'),
('NEW', N'Thành Viên Mới', 20, 50, N'Lần đầu mua'),
('BF2025', N'Black Friday', 50, 20, N'Hóa đơn > 500k'),
('TET26', N'Tết Nguyên Đán', 15, 200, N'Mua 2 vé trở lên'),
('CINE25', N'Ngày Hội Cinema', 30, 100, N'Thẻ HSSV');

-- 12: Giao Dịch (5 Mẫu, KH01)
INSERT INTO GiaoDich (MaGiaoDich, TongSoTien, PhuongThucTT, MaKhachHangDat, MaKM, TrangThai) VALUES
('GD001', 100000, N'Momo',     'KH01', 'HE2025', N'Thành công'), 
('GD002', 0,      NULL,       'KH01', NULL,     N'Thất bại'),  
('GD003', 100000, N'Visa',     'KH01', NULL,     N'Chưa thanh toán'),  
('GD004', 100000, N'Tiền mặt', 'KH01', NULL,     N'Thành công'), 
('GD005', 450000, N'ZaloPay',  'KH01', NULL,     N'Thành công');

-- 13: Vé Phim (7 Mẫu, KH01)
INSERT INTO VePhim (MaVe, MaKhachHang, MaGiaoDich, GiaVe, TrangThai) VALUES
('VE001', 'KH01', 'GD001', 100000, N'Đã đặt'),
('VE002', 'KH01', 'GD002', 100000, N'Đã hủy'),
('VE003', 'KH01', 'GD003', 100000, N'Chưa thanh toán'),
('VE004', 'KH01', 'GD004', 100000, N'Đã đặt'),
('VE005', 'KH01', 'GD005', 150000, N'Đã đặt'),
('VE006', 'KH01', 'GD005', 150000, N'Đã đặt'),
('VE007', 'KH01', 'GD005', 150000, N'Đã đặt');

-- 14: Chi tiết vé (Thuộc) - ĐÃ SỬA LỖI TẠI ĐÂY (6 cột)
INSERT INTO Thuoc (MaVe, MaPhim, MaSuat, MaRap, TenPhong, MaGhe) VALUES
('VE001', 'MV01', 'S01', 'R01', 'P01', 'A1'), 
('VE002', 'MV01', 'S01', 'R01', 'P01', 'A2'),
('VE003', 'MV01', 'S01', 'R01', 'P01', 'A3'), 
('VE004', 'MV01', 'S01', 'R01', 'P01', 'A4'),
('VE005', 'MV01', 'S01', 'R01', 'P01', 'C1'), 
('VE006', 'MV01', 'S01', 'R01', 'P01', 'C2'),
('VE007', 'MV01', 'S01', 'R01', 'P01', 'C3');

-- 13. Lịch Sử Điểm
INSERT INTO LichSuDiem (MaLichSu, MaKhachHang, NgayThayDoi) VALUES
('LS001', 'KH01', '2025-11-20'),
('LS002', 'KH01', '2025-11-21'),
('LS003', 'KH01', '2025-11-22'),
('LS004', 'KH01', '2025-11-23'),
('LS005', 'KH01', '2025-01-01');

-- 14. Điểm Thay Đổi
INSERT INTO DiemThayDoi (MaLichSu, MaThanhToan, SoDiemThayDoi) VALUES
('LS001', 'GD001', 100),
('LS002', 'GD002', 0), 
('LS003', 'GD003', 0),    
('LS004', 'GD004', 100), 
('LS005', 'GD005', 450); 

GO
CREATE FUNCTION fn_TongTienTietKiemCuaKH(@MaKH VARCHAR(10))
RETURNS DECIMAL(18,0)
AS
BEGIN
    DECLARE @TongTietKiem DECIMAL(18,0) = 0;
    DECLARE @MaGD VARCHAR(20);
    DECLARE @PhanTramGiam FLOAT;
    DECLARE @TongTien DECIMAL(18,0);

    IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE MaKhachHang = @MaKH)
        RETURN -1; 

    DECLARE cur CURSOR FOR
        SELECT MaGiaoDich
        FROM GiaoDich
        WHERE MaKhachHangDat = @MaKH
          AND TrangThai = N'Thành công'
          AND MaKM IS NOT NULL;

    OPEN cur;
    FETCH NEXT FROM cur INTO @MaGD;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SELECT @PhanTramGiam = mk.PhanTramGiam,
               @TongTien = gd.TongSoTien
        FROM GiaoDich gd
        JOIN MaKhuyenMai mk ON gd.MaKM = mk.MaKM
        WHERE gd.MaGiaoDich = @MaGD;

        SET @TongTietKiem = @TongTietKiem + (@TongTien * @PhanTramGiam / 100.0);

        FETCH NEXT FROM cur INTO @MaGD;
    END

    CLOSE cur;
    DEALLOCATE cur;

    RETURN @TongTietKiem;
END
GO




----------2.4.2------------

GO
CREATE FUNCTION fn_TongSoGheDaDatTheoSuat(
    @MaPhim VARCHAR(10),
    @MaSuat VARCHAR(10)
)
RETURNS INT
AS
BEGIN
    DECLARE @SoLuong INT = 0;
    DECLARE @MaVe VARCHAR(20);

    IF NOT EXISTS (
        SELECT 1 FROM SuatChieu 
        WHERE MaPhim = @MaPhim AND MaSuat = @MaSuat
    )
        RETURN -1;  

    DECLARE cur CURSOR FOR
        SELECT MaVe
        FROM Thuoc
        WHERE MaPhim = @MaPhim AND MaSuat = @MaSuat;

    OPEN cur;
    FETCH NEXT FROM cur INTO @MaVe;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF EXISTS (
            SELECT 1 FROM VePhim 
            WHERE MaVe = @MaVe
              AND TrangThai = N'Đã đặt'
        )
            SET @SoLuong = @SoLuong + 1;

        FETCH NEXT FROM cur INTO @MaVe;
    END

    CLOSE cur;
    DEALLOCATE cur;

    RETURN @SoLuong;
END
GO

-- 2.2--
--2.2.1--
GO
CREATE OR ALTER TRIGGER trg_KiemTraGheTrong
ON Thuoc
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM inserted i
        JOIN Thuoc t ON 
            t.MaPhim   = i.MaPhim AND
            t.MaSuat   = i.MaSuat AND
            t.MaRap    = i.MaRap AND
            t.TenPhong = i.TenPhong AND
            t.MaGhe    = i.MaGhe
        JOIN VePhim v ON t.MaVe = v.MaVe
        WHERE v.TrangThai IN (N'Đã đặt', N'Chưa thanh toán')
    )
    BEGIN
        RAISERROR(N'Ghế này đã được đặt ở suất chiếu này!', 16, 1);
        RETURN;
    END

    INSERT INTO Thuoc (MaVe, MaPhim, MaSuat, MaRap, TenPhong, MaGhe)
    SELECT MaVe, MaPhim, MaSuat, MaRap, TenPhong, MaGhe
    FROM inserted;
END;
GO


--2.2.2--

GO
CREATE OR ALTER TRIGGER trg_CongDiemKhachHang
ON GiaoDich
AFTER INSERT, UPDATE
AS
BEGIN
    ;WITH GD AS (
        SELECT 
            i.MaKhachHangDat,
            i.TongSoTien
        FROM inserted i
        WHERE i.TrangThai = N'Thành công'
    )
    UPDATE KhachHang
    SET DiemTichLuy = DiemTichLuy + (GD.TongSoTien * 0.1)
    FROM KhachHang KH
    JOIN GD ON KH.MaKhachHang = GD.MaKhachHangDat;
END
GO

--2.4--
GO
CREATE OR ALTER FUNCTION fn_TongTienKhachHangDaTieu (@MaKH VARCHAR(10))
RETURNS DECIMAL(18,0)
AS
BEGIN
    DECLARE @TongTien DECIMAL(18,0) = 0;
    DECLARE @Tien DECIMAL(18,0);

    IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE MaKhachHang = @MaKH)
        RETURN -1; 

    DECLARE cur CURSOR FOR 
        SELECT TongSoTien
        FROM GiaoDich
        WHERE MaKhachHangDat = @MaKH
          AND TrangThai = N'Thành công';

    OPEN cur;
    FETCH NEXT FROM cur INTO @Tien;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @TongTien = @TongTien + @Tien;
        FETCH NEXT FROM cur INTO @Tien;
    END

    CLOSE cur;
    DEALLOCATE cur;

    RETURN @TongTien;
END
GO
--------------------------
GO
CREATE OR ALTER FUNCTION fn_DemSoVeTheoPhim(@MaPhim VARCHAR(10))
RETURNS INT
AS
BEGIN
    DECLARE @SoLuong INT = 0;
    DECLARE @MaVe VARCHAR(20);

    IF NOT EXISTS (SELECT 1 FROM Phim WHERE MaPhim = @MaPhim)
        RETURN -1;

    DECLARE cur CURSOR FOR 
        SELECT MaVe
        FROM Thuoc
        WHERE MaPhim = @MaPhim;

    OPEN cur;
    FETCH NEXT FROM cur INTO @MaVe;

    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF EXISTS (
            SELECT 1 FROM VePhim 
            WHERE MaVe = @MaVe 
              AND TrangThai = N'Đã đặt'
        )
            SET @SoLuong = @SoLuong + 1;

        FETCH NEXT FROM cur INTO @MaVe;
    END

    CLOSE cur;
    DEALLOCATE cur;

    RETURN @SoLuong;
END
GO

----------------------------------- TÁC VỤ

-- 1. Stored Procedure: Đặt vé (tích hợp tất cả logic)
GO
CREATE OR ALTER PROCEDURE DatVe
    @MaKH VARCHAR(10),
    @MaPhim VARCHAR(10),
    @MaSuat VARCHAR(10),
    @MaRap VARCHAR(10),
    @TenPhong NVARCHAR(50),
    @MaGhe VARCHAR(10),
    @MaKM VARCHAR(20) = NULL,
    @MaVe VARCHAR(20) OUTPUT,
    @MaGD VARCHAR(20) OUTPUT,
    @GiaCuoi DECIMAL(18,0) OUTPUT,
    @ThongBao NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Kiểm tra khách hàng
        IF NOT EXISTS (SELECT 1 FROM KhachHang WHERE MaKhachHang = @MaKH)
        BEGIN
            SET @ThongBao = N'Khách hàng không tồn tại';
            ROLLBACK TRANSACTION;
            RETURN -1;
        END
        
        -- Kiểm tra ghế có trống không
        IF EXISTS (
            SELECT 1 FROM Thuoc t
            JOIN VePhim v ON t.MaVe = v.MaVe
            WHERE t.MaPhim = @MaPhim 
              AND t.MaSuat = @MaSuat
              AND t.MaRap = @MaRap
              AND t.TenPhong = @TenPhong
              AND t.MaGhe = @MaGhe
              AND v.TrangThai IN (N'Đã đặt', N'Chưa thanh toán')
        )
        BEGIN
            SET @ThongBao = N'Ghế đã được đặt';
            ROLLBACK TRANSACTION;
            RETURN -2;
        END
        
        -- Lấy loại ghế và tính giá
        DECLARE @LoaiGhe NVARCHAR(20);
        DECLARE @GiaGoc DECIMAL(18,0);
        
        SELECT @LoaiGhe = LoaiGhe
        FROM Ghe
        WHERE MaRap = @MaRap AND TenPhong = @TenPhong AND MaGhe = @MaGhe;
        
        -- Bảng giá ghế
        SET @GiaGoc = CASE @LoaiGhe
            WHEN 'VIP' THEN 150000
            WHEN 'Couple' THEN 200000
            WHEN 'IMAX' THEN 180000
            ELSE 100000
        END;
        
        SET @GiaCuoi = @GiaGoc;
        
        -- Xử lý mã khuyến mãi
        DECLARE @PhanTramGiam FLOAT = 0;
        
        IF @MaKM IS NOT NULL
        BEGIN
            SELECT @PhanTramGiam = PhanTramGiam
            FROM MaKhuyenMai
            WHERE MaKM = @MaKM 
              AND HanSuDung >= GETDATE()
              AND SoLuong > 0;
            
            IF @PhanTramGiam IS NOT NULL AND @PhanTramGiam > 0
            BEGIN
                SET @GiaCuoi = @GiaGoc * (1 - @PhanTramGiam / 100.0);
                
                -- Giảm số lượng mã KM
                UPDATE MaKhuyenMai
                SET SoLuong = SoLuong - 1
                WHERE MaKM = @MaKM;
            END
            ELSE
            BEGIN
                SET @MaKM = NULL; -- Mã không hợp lệ
            END
        END
        
        -- Tạo mã giao dịch và mã vé
        SET @MaGD = 'GD' + FORMAT(GETDATE(), 'yyyyMMddHHmmss') + RIGHT('000' + CAST(ABS(CHECKSUM(NEWID())) % 1000 AS VARCHAR), 3);
        SET @MaVe = 'VE' + FORMAT(GETDATE(), 'yyyyMMddHHmmss') + RIGHT('000' + CAST(ABS(CHECKSUM(NEWID())) % 1000 AS VARCHAR), 3);
        
        -- Tạo giao dịch
        INSERT INTO GiaoDich (MaGiaoDich, TongSoTien, PhuongThucTT, MaKM, MaKhachHangDat, TrangThai)
        VALUES (@MaGD, @GiaCuoi, N'Chưa chọn', @MaKM, @MaKH, N'Chưa thanh toán');
        
        -- Tạo vé
        INSERT INTO VePhim (MaVe, MaKhachHang, MaGiaoDich, GiaVe, TrangThai)
        VALUES (@MaVe, @MaKH, @MaGD, @GiaCuoi, N'Chưa thanh toán');
        
        -- Tạo chi tiết vé (trigger trg_KiemTraGheTrong sẽ kiểm tra lần nữa)
        INSERT INTO Thuoc (MaVe, MaPhim, MaSuat, MaRap, TenPhong, MaGhe)
        VALUES (@MaVe, @MaPhim, @MaSuat, @MaRap, @TenPhong, @MaGhe);
        
        SET @ThongBao = N'Đặt vé thành công';
        COMMIT TRANSACTION;
        RETURN 0;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ThongBao = ERROR_MESSAGE();
        RETURN -999;
    END CATCH
END
GO

-- 2. Stored Procedure: Hủy vé
GO
CREATE OR ALTER PROCEDURE HuyVe
    @MaVe      VARCHAR(20),
    @ThongBao  NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Kiểm tra vé tồn tại
    IF NOT EXISTS (SELECT 1 FROM VePhim WHERE MaVe = @MaVe)
    BEGIN
        SET @ThongBao = N'Vé không tồn tại';
        RETURN -1;
    END

    DECLARE @TrangThai NVARCHAR(20);
    DECLARE @MaGD      VARCHAR(20);

    SELECT @TrangThai = TrangThai, @MaGD = MaGiaoDich
    FROM VePhim
    WHERE MaVe = @MaVe;

    -- 2. Không cho hủy vé đã đặt (đã thanh toán)
    IF (@TrangThai = N'Đã đặt')
    BEGIN
        SET @ThongBao = N'Không thể hủy vé đã đặt';
        RETURN -2;
    END

    -- 3. Nếu đã hủy rồi thì thôi
    IF (@TrangThai = N'Đã hủy')
    BEGIN
        SET @ThongBao = N'Vé đã được hủy trước đó';
        RETURN -3;
    END

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 4. Giải phóng ghế: đưa về Trống
        UPDATE g
        SET g.TinhTrang = N'Trống'
        FROM Ghe g
        JOIN Thuoc t
          ON  g.MaRap    = t.MaRap
          AND g.TenPhong = t.TenPhong
          AND g.MaGhe    = t.MaGhe
        WHERE t.MaVe = @MaVe;

        -- 5. XÓA mapping ghế–vé trong Thuoc
        DELETE FROM Thuoc
        WHERE MaVe = @MaVe;

        -- 6. Cập nhật trạng thái vé -> Đã hủy
        UPDATE VePhim
        SET TrangThai = N'Đã hủy'
        WHERE MaVe = @MaVe;

        -- 7. Cập nhật trạng thái giao dịch (nếu có)
        IF @MaGD IS NOT NULL
        BEGIN
            UPDATE GiaoDich
            SET TrangThai = N'Đã hủy'
            WHERE MaGiaoDich = @MaGD;
        END

        SET @ThongBao = N'Hủy vé thành công';
        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SET @ThongBao = ERROR_MESSAGE();
        RETURN -99;
    END CATCH
END;
GO



-- 3. Stored Procedure: Thanh toán vé
GO
CREATE OR ALTER PROCEDURE ThanhToanVe
    @MaGD VARCHAR(20),
    @PhuongThucTT NVARCHAR(50),
    @ThongBao NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @TrangThai NVARCHAR(20);
        
        SELECT @TrangThai = TrangThai
        FROM GiaoDich
        WHERE MaGiaoDich = @MaGD;
        
        IF @TrangThai IS NULL
        BEGIN
            SET @ThongBao = N'Giao dịch không tồn tại';
            ROLLBACK TRANSACTION;
            RETURN -1;
        END
        
        IF @TrangThai = N'Thành công'
        BEGIN
            SET @ThongBao = N'Giao dịch đã được thanh toán';
            ROLLBACK TRANSACTION;
            RETURN -2;
        END
        
        IF @TrangThai = N'Đã hủy'
        BEGIN
            SET @ThongBao = N'Không thể thanh toán giao dịch đã hủy';
            ROLLBACK TRANSACTION;
            RETURN -3;
        END
        
        -- Cập nhật giao dịch
        UPDATE GiaoDich
        SET TrangThai = N'Thành công',
            PhuongThucTT = @PhuongThucTT
        WHERE MaGiaoDich = @MaGD;
        
        -- Trigger CapNhatTrangThaiVeVaGhe sẽ tự động cập nhật vé và ghế
        
        SET @ThongBao = N'Thanh toán thành công';
        COMMIT TRANSACTION;
        RETURN 0;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @ThongBao = ERROR_MESSAGE();
        RETURN -999;
    END CATCH
END
GO

-- 4. Function: Kiểm tra ghế có trống không
GO
CREATE OR ALTER FUNCTION fn_KiemTraGheTrong(
    @MaPhim VARCHAR(10),
    @MaSuat VARCHAR(10),
    @MaRap VARCHAR(10),
    @TenPhong NVARCHAR(50),
    @MaGhe VARCHAR(10)
)
RETURNS BIT
AS
BEGIN
    DECLARE @KetQua BIT = 1; -- 1 = trống, 0 = đã đặt
    
    IF EXISTS (
        SELECT 1 FROM Thuoc t
        JOIN VePhim v ON t.MaVe = v.MaVe
        WHERE t.MaPhim = @MaPhim 
          AND t.MaSuat = @MaSuat
          AND t.MaRap = @MaRap
          AND t.TenPhong = @TenPhong
          AND t.MaGhe = @MaGhe
          AND v.TrangThai IN (N'Đã đặt', N'Chưa thanh toán')
    )
        SET @KetQua = 0;
    
    RETURN @KetQua;
END
GO

-- 5. Function: Lấy thông tin chi tiết vé
GO
CREATE OR ALTER FUNCTION fn_ThongTinChiTietVe(@MaVe VARCHAR(20))
RETURNS TABLE
AS
RETURN
(
    SELECT 
        v.MaVe,
        p.TenPhim,
        r.TenRap,
        t.TenPhong,
        t.MaGhe,
        g.LoaiGhe,
        sc.NgayChieu,
        sc.GioChieu,
        v.GiaVe,
        v.TrangThai,
        v.MaGiaoDich AS MaGiaoDich,  
        gd.MaKM,
        gd.PhuongThucTT,
        gd.ThoiGianThucHien,
        kh.MaKhachHang,
        tk.TenDangNhap,
        tk.Email,
        tk.SoDienThoai
    FROM VePhim v
    JOIN Thuoc t ON v.MaVe = t.MaVe
    JOIN SuatChieu sc ON t.MaPhim = sc.MaPhim AND t.MaSuat = sc.MaSuat
    JOIN Phim p ON t.MaPhim = p.MaPhim
    JOIN Rap r ON t.MaRap = r.MaRap
    JOIN Ghe g ON t.MaRap = g.MaRap AND t.TenPhong = g.TenPhong AND t.MaGhe = g.MaGhe
    JOIN KhachHang kh ON v.MaKhachHang = kh.MaKhachHang
    JOIN TaiKhoan tk ON kh.MaTK = tk.MaTK
    LEFT JOIN GiaoDich gd ON v.MaGiaoDich = gd.MaGiaoDich
    WHERE v.MaVe = @MaVe
)
GO

-- 6. Trigger: Tự động xóa vé chưa thanh toán sau 15 phút
GO
CREATE OR ALTER TRIGGER trg_XoaVeQuaHan
ON VePhim
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Tạo job để kiểm tra sau 15 phút (demo: chỉ log)
    -- Trong thực tế, dùng SQL Server Agent Job hoặc xử lý từ backend
    
    DECLARE @MaVe VARCHAR(20);
    DECLARE @ThoiGianDat DATETIME;
    
    SELECT @MaVe = MaVe, @ThoiGianDat = ThoiGianDat
    FROM inserted
    WHERE TrangThai = N'Chưa thanh toán';
    
    -- Log để backend xử lý
    PRINT N'Vé ' + @MaVe + N' cần kiểm tra sau 15 phút từ ' + CONVERT(VARCHAR, @ThoiGianDat, 120);
END
GO

-- 7. Stored Procedure: Xóa vé quá hạn (chạy định kỳ)
GO
CREATE OR ALTER PROCEDURE XoaVeQuaHan
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Xóa vé chưa thanh toán quá 15 phút
        UPDATE VePhim
        SET TrangThai = N'Đã hủy'
        WHERE TrangThai = N'Chưa thanh toán'
          AND DATEDIFF(MINUTE, ThoiGianDat, GETDATE()) > 15;
        
        -- Cập nhật giao dịch tương ứng
        UPDATE GiaoDich
        SET TrangThai = N'Hết hạn'
        WHERE TrangThai = N'Chưa thanh toán'
          AND MaGiaoDich IN (
              SELECT MaGiaoDich FROM VePhim
              WHERE TrangThai = N'Đã hủy'
                AND DATEDIFF(MINUTE, ThoiGianDat, GETDATE()) > 15
          );
        
        PRINT N'Đã xóa vé quá hạn: ' + CAST(@@ROWCOUNT AS VARCHAR) + N' vé';
    END TRY
    BEGIN CATCH
        PRINT N'Lỗi: ' + ERROR_MESSAGE();
    END CATCH
END
GO

-- 8. View: Thống kê theo phim
GO
CREATE OR ALTER VIEW vw_ThongKePhim
AS
SELECT 
    p.MaPhim,
    p.TenPhim,
    COUNT(DISTINCT t.MaVe) as TongSoVe,
    COUNT(DISTINCT CASE WHEN v.TrangThai = N'Đã đặt' THEN t.MaVe END) as SoVeDaDat,
    SUM(CASE WHEN v.TrangThai = N'Đã đặt' THEN v.GiaVe ELSE 0 END) as TongDoanhThu,
    COUNT(DISTINCT sc.MaSuat) as SoSuatChieu
FROM Phim p
LEFT JOIN SuatChieu sc ON p.MaPhim = sc.MaPhim
LEFT JOIN Thuoc t ON p.MaPhim = t.MaPhim AND sc.MaSuat = t.MaSuat
LEFT JOIN VePhim v ON t.MaVe = v.MaVe
GROUP BY p.MaPhim, p.TenPhim
GO

-- 9. View: Thống kê theo khách hàng
GO
CREATE OR ALTER VIEW vw_ThongKeKhachHang
AS
SELECT 
    kh.MaKhachHang,
    tk.TenDangNhap,
    tk.Email,
    kh.DiemTichLuy,
    COUNT(DISTINCT v.MaVe) as TongSoVe,
    COUNT(DISTINCT CASE WHEN v.TrangThai = N'Đã đặt' THEN v.MaVe END) as SoVeDaDat,
    SUM(CASE WHEN gd.TrangThai = N'Thành công' THEN gd.TongSoTien ELSE 0 END) as TongChiTieu,
    dbo.fn_TongTienTietKiemCuaKH(kh.MaKhachHang) as TongTietKiem
FROM KhachHang kh
JOIN TaiKhoan tk ON kh.MaTK = tk.MaTK
LEFT JOIN VePhim v ON kh.MaKhachHang = v.MaKhachHang
LEFT JOIN GiaoDich gd ON v.MaGiaoDich = gd.MaGiaoDich
GROUP BY kh.MaKhachHang, tk.TenDangNhap, tk.Email, kh.DiemTichLuy
GO
-- ============================================================
-- WRAPPER STORED PROCEDURES
-- ============================================================

-- 1. Wrapper: GetTicketsByCustomer
GO
CREATE OR ALTER PROCEDURE GetTicketsByCustomer
    @MaKH VARCHAR(10)
AS
BEGIN
    SELECT 
        v.MaVe as id,
        p.TenPhim as movieName,
        r.TenRap as theater,
        t.TenPhong as room,
        t.MaGhe as seat,
        CONVERT(VARCHAR(10), sc.NgayChieu, 120) as showDate,
        CONVERT(VARCHAR(5), sc.GioChieu, 108) as startTime,
        CASE 
            WHEN v.TrangThai = N'Đã đặt' THEN 'DaDat'
            WHEN v.TrangThai = N'Chưa thanh toán' THEN 'ChuaThanhToan'
            WHEN v.TrangThai = N'Đã hủy' THEN 'Huy'
            ELSE 'ChuaThanhToan'
        END as statusText,
        gd.MaKM as promoCode,
        v.GiaVe as price,
        v.MaGiaoDich as MaGiaoDich    
    FROM VePhim v
    JOIN Thuoc t  ON v.MaVe = t.MaVe
    JOIN SuatChieu sc ON t.MaPhim = sc.MaPhim AND t.MaSuat = sc.MaSuat
    JOIN Phim p   ON t.MaPhim = p.MaPhim
    JOIN Rap r    ON t.MaRap = r.MaRap
    LEFT JOIN GiaoDich gd ON v.MaGiaoDich = gd.MaGiaoDich
    WHERE v.MaKhachHang = @MaKH
    ORDER BY v.ThoiGianDat DESC;
END
GO
-- 2. Wrapper: GetTheaters
GO
CREATE OR ALTER PROCEDURE GetTheaters
AS
BEGIN
    SELECT 
        MaRap,
        TenRap,
        DiaChi,
        ThanhPho,
        SoDienThoai,
        Email
    FROM Rap
    ORDER BY TenRap;
END
GO

-- 3. Wrapper: GetMoviesByTheater
GO
CREATE OR ALTER PROCEDURE GetMoviesByTheater
    @MaRap VARCHAR(10)
AS
BEGIN
    SELECT DISTINCT
        p.MaPhim,
        p.TenPhim,
        p.MoTa,
        p.ThoiLuong,
        p.DaoDien,
        p.DienVienChinh,
        p.NgayKhoiChieu,
        p.NamPhatHanh,
        p.Poster
    FROM Phim p
    JOIN DuocChieu dc ON p.MaPhim = dc.MaPhim
    WHERE dc.MaRap = @MaRap
    ORDER BY p.TenPhim;
END
GO

-- 4. Wrapper: GetShowtimes
GO
CREATE OR ALTER PROCEDURE GetShowtimes
    @MaRap VARCHAR(10),
    @MaPhim VARCHAR(10)
AS
BEGIN
    SELECT DISTINCT
        sc.MaSuat,
        sc.NgayChieu,
        sc.GioChieu,
        dc.TenPhong
    FROM SuatChieu sc
    JOIN DuocChieu dc ON sc.MaPhim = dc.MaPhim AND sc.MaSuat = dc.MaSuat
    WHERE dc.MaRap = @MaRap AND dc.MaPhim = @MaPhim
    ORDER BY sc.NgayChieu, sc.GioChieu;
END
GO

-- 5. Wrapper: GetSeatsByShowtime
GO
CREATE OR ALTER PROCEDURE GetSeatsByShowtime
    @MaRap VARCHAR(10),
    @TenPhong NVARCHAR(50),
    @MaPhim VARCHAR(10),
    @MaSuat VARCHAR(10)
AS
BEGIN
    SELECT 
        g.MaGhe,
        g.LoaiGhe,
        CASE 
            -- Kiểm tra ghế đã được đặt trong suất chiếu này
            WHEN EXISTS (
                SELECT 1 
                FROM Thuoc t
                JOIN VePhim v ON t.MaVe = v.MaVe
                WHERE t.MaRap = g.MaRap 
                  AND t.TenPhong = g.TenPhong
                  AND t.MaGhe = g.MaGhe
                  AND t.MaPhim = @MaPhim
                  AND t.MaSuat = @MaSuat
                  AND v.TrangThai IN (N'Đã đặt', N'Chưa thanh toán')
            ) THEN 
                CASE 
                    WHEN EXISTS (
                        SELECT 1 
                        FROM Thuoc t
                        JOIN VePhim v ON t.MaVe = v.MaVe
                        WHERE t.MaRap = g.MaRap 
                          AND t.TenPhong = g.TenPhong
                          AND t.MaGhe = g.MaGhe
                          AND t.MaPhim = @MaPhim
                          AND t.MaSuat = @MaSuat
                          AND v.TrangThai = N'Chưa thanh toán'
                    ) THEN N'Chờ'
                    ELSE N'Đã đặt'
                END
            ELSE N'Trống'
        END as TinhTrang
    FROM Ghe g
    WHERE g.MaRap = @MaRap AND g.TenPhong = @TenPhong
    ORDER BY g.MaGhe;
END
GO

-- 6. Wrapper: CheckPromo
GO
CREATE OR ALTER PROCEDURE CheckPromo
    @MaKM VARCHAR(20)
AS
BEGIN
    SELECT 
        MaKM,
        TenDotKM,
        PhanTramGiam,
        DieuKienApDung,
        HanSuDung,
        SoLuong
    FROM MaKhuyenMai
    WHERE MaKM = @MaKM
      AND HanSuDung >= CAST(GETDATE() AS DATE)
      AND SoLuong > 0;
END
GO

-- 7. Wrapper: GetTicketDetail (sử dụng function fn_ThongTinChiTietVe)
GO
CREATE OR ALTER PROCEDURE GetTicketDetail
    @MaVe VARCHAR(20)
AS
BEGIN
    SELECT * FROM fn_ThongTinChiTietVe(@MaVe);
END
GO

-- 8. Wrapper: GetSavings (sử dụng function fn_TongTienTietKiemCuaKH)
GO
CREATE OR ALTER PROCEDURE GetSavings
    @MaKH VARCHAR(10)
AS
BEGIN
    DECLARE @Savings DECIMAL(18,0);
    SET @Savings = dbo.fn_TongTienTietKiemCuaKH(@MaKH);
    
    IF @Savings = -1
        SET @Savings = 0;
    
    SELECT @Savings as savings;
END
GO

-- 9. Wrapper: GetSpending (sử dụng function fn_TongTienKhachHangDaTieu)
GO
CREATE OR ALTER PROCEDURE GetSpending
    @MaKH VARCHAR(10)
AS
BEGIN
    DECLARE @Spending DECIMAL(18,0);
    SET @Spending = dbo.fn_TongTienKhachHangDaTieu(@MaKH);
    
    IF @Spending = -1
        SET @Spending = 0;
    
    SELECT @Spending as spending;
END
GO

-- 10. Wrapper: GetBookedSeats (sử dụng function fn_TongSoGheDaDatTheoSuat)
GO
CREATE OR ALTER PROCEDURE GetBookedSeats
    @MaPhim VARCHAR(10),
    @MaSuat VARCHAR(10)
AS
BEGIN
    DECLARE @Count INT;
    SET @Count = dbo.fn_TongSoGheDaDatTheoSuat(@MaPhim, @MaSuat);
    
    IF @Count = -1
        SET @Count = 0;
    
    SELECT @Count as bookedSeats;
END
GO

-- 11. Wrapper: GetTicketCount (sử dụng function fn_DemSoVeTheoPhim)
GO
CREATE OR ALTER PROCEDURE GetTicketCount
    @MaPhim VARCHAR(10)
AS
BEGIN
    DECLARE @Count INT;
    SET @Count = dbo.fn_DemSoVeTheoPhim(@MaPhim);
    
    IF @Count = -1
        SET @Count = 0;
    
    SELECT @Count as ticketCount;
END
GO

-- 12. Wrapper: CancelTicket 
GO
CREATE OR ALTER PROCEDURE CancelTicket
    @MaVe VARCHAR(20)
AS
BEGIN
    DECLARE @ThongBao NVARCHAR(255);
    DECLARE @ReturnValue INT;
    
    EXEC @ReturnValue = HuyVe @MaVe = @MaVe, @ThongBao = @ThongBao OUTPUT;
    
    SELECT @ReturnValue as returnValue, @ThongBao as ThongBao;
END
GO

-- ============================================================
-- FIX EXISTING FUNCTIONS TO MATCH SQL STANDARDS
-- ============================================================


GO
CREATE OR ALTER PROCEDURE Rap_Insert
    @MaRap       VARCHAR(10),
    @TenRap      NVARCHAR(100),
    @DiaChi      NVARCHAR(255) = NULL,
    @ThanhPho    NVARCHAR(50)  = NULL,
    @SoDienThoai VARCHAR(15)   = NULL,
    @Email       VARCHAR(50)   = NULL,
    @ThongBao    NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ThongBao = N'';

    -- Kiểm tra mã rạp
    IF (@MaRap IS NULL OR LTRIM(RTRIM(@MaRap)) = '')
    BEGIN
        SET @ThongBao = N'Mã rạp không được để trống';
        RETURN -1;
    END

    IF EXISTS (SELECT 1 FROM Rap WHERE MaRap = @MaRap)
    BEGIN
        SET @ThongBao = N'Mã rạp đã tồn tại';
        RETURN -2;
    END

    -- Kiểm tra tên rạp
    IF (@TenRap IS NULL OR LTRIM(RTRIM(@TenRap)) = '')
    BEGIN
        SET @ThongBao = N'Tên rạp không được để trống';
        RETURN -3;
    END

    -- Kiểm tra số điện thoại (nếu có)
    IF (@SoDienThoai IS NOT NULL AND LTRIM(RTRIM(@SoDienThoai)) <> '')
    BEGIN
        IF @SoDienThoai LIKE '%[^0-9]%' OR LEN(@SoDienThoai) < 8 OR LEN(@SoDienThoai) > 15
        BEGIN
            SET @ThongBao = N'Số điện thoại rạp không hợp lệ (8–15 chữ số)';
            RETURN -4;
        END
    END

    -- Kiểm tra email (nếu có)
    IF (@Email IS NOT NULL AND LTRIM(RTRIM(@Email)) <> '' AND @Email NOT LIKE '%_@_%._%')
    BEGIN
        SET @ThongBao = N'Email rạp không hợp lệ';
        RETURN -5;
    END

    INSERT INTO Rap (MaRap, TenRap, DiaChi, ThanhPho, SoDienThoai, Email)
    VALUES (@MaRap, @TenRap, @DiaChi, @ThanhPho, @SoDienThoai, @Email);

    SET @ThongBao = N'Thêm rạp mới thành công';
    RETURN 0;
END
GO

GO
CREATE OR ALTER PROCEDURE Rap_Update
    @MaRap       VARCHAR(10),
    @TenRap      NVARCHAR(100),
    @DiaChi      NVARCHAR(255) = NULL,
    @ThanhPho    NVARCHAR(50)  = NULL,
    @SoDienThoai VARCHAR(15)   = NULL,
    @Email       VARCHAR(50)   = NULL,
    @ThongBao    NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ThongBao = N'';

    IF NOT EXISTS (SELECT 1 FROM Rap WHERE MaRap = @MaRap)
    BEGIN
        SET @ThongBao = N'Rạp không tồn tại';
        RETURN -1;
    END

    IF (@TenRap IS NULL OR LTRIM(RTRIM(@TenRap)) = '')
    BEGIN
        SET @ThongBao = N'Tên rạp không được để trống';
        RETURN -2;
    END

    IF (@SoDienThoai IS NOT NULL AND LTRIM(RTRIM(@SoDienThoai)) <> '')
    BEGIN
        IF @SoDienThoai LIKE '%[^0-9]%' OR LEN(@SoDienThoai) < 8 OR LEN(@SoDienThoai) > 15
        BEGIN
            SET @ThongBao = N'Số điện thoại rạp không hợp lệ (8–15 chữ số)';
            RETURN -3;
        END
    END

    IF (@Email IS NOT NULL AND LTRIM(RTRIM(@Email)) <> '' AND @Email NOT LIKE '%_@_%._%')
    BEGIN
        SET @ThongBao = N'Email rạp không hợp lệ';
        RETURN -4;
    END

    UPDATE Rap
    SET TenRap      = @TenRap,
        DiaChi      = @DiaChi,
        ThanhPho    = @ThanhPho,
        SoDienThoai = @SoDienThoai,
        Email       = @Email
    WHERE MaRap = @MaRap;

    SET @ThongBao = N'Cập nhật thông tin rạp thành công';
    RETURN 0;
END
GO

GO
CREATE OR ALTER PROCEDURE Rap_Delete
    @MaRap    VARCHAR(10),
    @ThongBao NVARCHAR(255) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @ThongBao = N'';

    IF NOT EXISTS (SELECT 1 FROM Rap WHERE MaRap = @MaRap)
    BEGIN
        SET @ThongBao = N'Rạp không tồn tại';
        RETURN -1;
    END

    -- Không cho xóa rạp đang có phòng chiếu / ghế / nhân viên / suất chiếu
    IF EXISTS (SELECT 1 FROM PhongChieu WHERE MaRap = @MaRap)
       OR EXISTS (SELECT 1 FROM Ghe        WHERE MaRap = @MaRap)
       OR EXISTS (SELECT 1 FROM NhanVien   WHERE MaRap = @MaRap)
       OR EXISTS (SELECT 1 FROM DuocChieu  WHERE MaRap = @MaRap)
    BEGIN
        SET @ThongBao = N'Không thể xóa rạp đang có phòng chiếu, ghế, nhân viên hoặc suất chiếu liên quan';
        RETURN -2;
    END

    DELETE FROM Rap WHERE MaRap = @MaRap;

    SET @ThongBao = N'Xóa rạp thành công';
    RETURN 0;
END
GO
GO

CREATE OR ALTER PROCEDURE GetPoints
    @MaKH VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        DiemTichLuy AS Points
    FROM KhachHang
    WHERE MaKhachHang = @MaKH;
END;
GO
GO
CREATE OR ALTER PROCEDURE GetShowtimeSeatStats
    @MaPhim VARCHAR(10),
    @MaSuat VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        COUNT(g.MaGhe) AS TongSoGhe,
        COUNT(CASE WHEN v.TrangThai IN (N'Đã đặt', N'Chưa thanh toán') THEN 1 END) AS SoGheKhongTrong
    FROM Ghe g
    JOIN Thuoc t ON g.MaRap = t.MaRap 
                AND g.TenPhong = t.TenPhong
                AND g.MaGhe = t.MaGhe
    LEFT JOIN VePhim v ON t.MaVe = v.MaVe
    WHERE t.MaPhim = @MaPhim
      AND t.MaSuat = @MaSuat
    GROUP BY t.MaPhim, t.MaSuat
    HAVING COUNT(g.MaGhe) > 0;
END;
GO

DELETE t
FROM Thuoc t
JOIN VePhim v ON t.MaVe = v.MaVe
WHERE v.TrangThai = N'Đã hủy';

