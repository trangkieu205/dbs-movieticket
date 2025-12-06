
/* ===============================================================
  2.1 – THỦ TỤC THÊM / SỬA / XÓA (1 điểm)
  Bảng: RAP
  - Thêm: kiểm tra ràng buộc, phù hợp nghiệp vụ
  - Sửa: kiểm tra ràng buộc, phù hợp nghiệp vụ
  - Xóa: kiểm tra ràng buộc, phù hợp nghiệp vụ

  => Sử dụng các proc:
     - Rap_Insert
     - Rap_Update
     - Rap_Delete
     (tab "Rạp" trên web gọi các proc này thông qua API /theaters)
================================================================ */

DECLARE @ThongBao NVARCHAR(255);
DECLARE @ReturnValue INT;

PRINT '=== 2.1.a. THÊM RẠP MỚI BẰNG Rap_Insert ===';
EXEC @ReturnValue = Rap_Insert
    @MaRap       = 'R99',
    @TenRap      = N'Rạp Demo 99',
    @DiaChi      = N'123 Đường Demo, Quận 1',
    @ThanhPho    = N'Hồ Chí Minh',
    @SoDienThoai = '0909123456',
    @Email       = 'demo99@cgv.vn',
    @ThongBao    = @ThongBao OUTPUT;

PRINT 'ReturnValue = ' + CAST(@ReturnValue AS VARCHAR(10));
PRINT 'ThongBao    = ' + ISNULL(@ThongBao, N'NULL');

PRINT '=> Sau khi chạy, mở web tab "Rạp" sẽ thấy thêm Rạp Demo 99 (R99).';
PRINT '---------------------------------------------------------------------';

PRINT '=== 2.1.b. CẬP NHẬT THÔNG TIN RẠP R99 BẰNG Rap_Update ===';
EXEC @ReturnValue = Rap_Update
    @MaRap       = 'R99',
    @TenRap      = N'Rạp Demo 99 (ĐÃ SỬA)',
    @DiaChi      = N'456 Đường Mới, Quận 3',
    @ThanhPho    = N'Hồ Chí Minh',
    @SoDienThoai = '0909988888',
    @Email       = 'updated99@cgv.vn',
    @ThongBao    = @ThongBao OUTPUT;

PRINT 'ReturnValue = ' + CAST(@ReturnValue AS VARCHAR(10));
PRINT 'ThongBao    = ' + ISNULL(@ThongBao, N'NULL');
PRINT '=> Web tab "Rạp" refresh sẽ thấy tên rạp đã đổi.';
PRINT '---------------------------------------------------------------------';

PRINT '=== 2.1.c. THỬ XÓA RẠP ĐANG CÓ LIÊN QUAN – VÍ DỤ R01 (SẼ BỊ CHẶN) ===';
EXEC @ReturnValue = Rap_Delete
    @MaRap    = 'R01',
    @ThongBao = @ThongBao OUTPUT;

PRINT 'ReturnValue = ' + CAST(@ReturnValue AS VARCHAR(10));
PRINT 'ThongBao    = ' + ISNULL(@ThongBao, N'NULL');
PRINT '=> Do R01 đang có phòng/ghế/nhân viên/suất chiếu, proc sẽ không cho xóa.';
PRINT '---------------------------------------------------------------------';

PRINT '=== 2.1.d. XÓA RẠP DEMO 99 (KHÔNG CÓ RÀNG BUỘC LIÊN QUAN) ===';
EXEC @ReturnValue = Rap_Delete
    @MaRap    = 'R99',
    @ThongBao = @ThongBao OUTPUT;

PRINT 'ReturnValue = ' + CAST(@ReturnValue AS VARCHAR(10));
PRINT 'ThongBao    = ' + ISNULL(@ThongBao, N'NULL');
PRINT '=> Web tab "Rạp" refresh sẽ không còn thấy Ráp Demo 99 nữa.';
PRINT '=====================================================================';
GO


/* ===============================================================
  2.2 – TRIGGER (1 điểm)
  Trigger 1: Ràng buộc – ghế chỉ được đặt 1 lần cho 1 suất
      => trg_KiemTraGheTrong ON Thuoc (INSTEAD OF INSERT)
  Trigger 2: Tính toán – cộng điểm tích lũy theo giao dịch
      => trg_CongDiemKhachHang ON GiaoDich (AFTER INSERT, UPDATE)
================================================================ */

PRINT '=== 2.2.1 – DEMO TRIGGER trg_KiemTraGheTrong (ràng buộc ghế trùng) ===';
PRINT 'Thử insert vào Thuoc một ghế đã tồn tại cho cùng suất chiếu (VE001)...';

BEGIN TRY
    INSERT INTO Thuoc (MaVe, MaPhim, MaSuat, MaRap, TenPhong, MaGhe)
    SELECT TOP 1
        'VE_DEMO_TRUNG',    -- MaVe mới
        MaPhim,
        MaSuat,
        MaRap,
        TenPhong,
        MaGhe
    FROM Thuoc
    WHERE MaVe = 'VE001';   -- copy đúng ghế/suất của vé VE001 để bị trùng
END TRY
BEGIN CATCH
    PRINT 'Lỗi (kỳ vọng): ' + ERROR_MESSAGE();
END CATCH;

PRINT '=> Trigger INSTEAD OF INSERT sẽ chặn việc thêm và báo: Ghế này đã được đặt ở suất chiếu này!';
PRINT '---------------------------------------------------------------------';

PRINT '=== 2.2.2 – DEMO TRIGGER trg_CongDiemKhachHang (tính điểm tích lũy) ===';

DECLARE @DiemTruoc DECIMAL(18,2);
DECLARE @DiemSau   DECIMAL(18,2);

SELECT @DiemTruoc = CAST(DiemTichLuy AS DECIMAL(18,2))
FROM KhachHang
WHERE MaKhachHang = 'KH03';

PRINT 'Điểm tích lũy KH03 trước khi giao dịch: ' + CAST(ISNULL(@DiemTruoc,0) AS VARCHAR(50));

PRINT '--- Thêm 1 giao dịch thành công mới cho KH03, TongSoTien = 200000 ---';

INSERT INTO GiaoDich (MaGiaoDich, TongSoTien, PhuongThucTT, MaKM, MaKhachHangDat, TrangThai)
VALUES ('GD_DEMO_KH03', 200000, N'Momo', NULL, 'KH03', N'Thành công');

SELECT @DiemSau = CAST(DiemTichLuy AS DECIMAL(18,2))
FROM KhachHang
WHERE MaKhachHang = 'KH03';

PRINT 'Điểm tích lũy KH03 sau khi giao dịch: ' + CAST(ISNULL(@DiemSau,0) AS VARCHAR(50));
PRINT '=> Trigger trg_CongDiemKhachHang cộng thêm 10% TongSoTien vào DiemTichLuy.';
PRINT '   Trên web: Tab "Thống kê" → Điểm tích lũy sẽ tăng tương ứng (GetPoints).';
PRINT '=====================================================================';
GO


/* ===============================================================
  2.3 – THỦ TỤC (1 điểm)

  YÊU CẦU:
   - Liên quan tới bảng 2.1 (Rap) hoặc > 2 bảng
   - Có ý nghĩa nghiệp vụ
   - (Đề gốc: 1 truy vấn JOIN + WHERE + ORDER BY, 1 truy vấn
     có aggregate/group by/having – ở đây ta phân công như sau:)

   Thủ tục 1: GetTicketsByCustomer
     - JOIN nhiều bảng (VePhim, Thuoc, SuatChieu, Phim, Rap, GiaoDich)
     - WHERE theo MaKH, ORDER BY ThoiGianDat DESC
     - Được UI tab "Vé" gọi qua API /tickets

   Thủ tục 2: GetTicketCount
     - Thống kê số vé đã đặt theo phim, dùng hàm fn_DemSoVeTheoPhim
     - Được server.js expose qua /stats/tickets/:movieId (web có gọi
       trong quá trình chọn suất chiếu, nếu cần có thể hiển thị thêm)
================================================================ */

PRINT '=== 2.3.1 – THỦ TỤC GetTicketsByCustomer (dùng cho UI tab "Vé") ===';
PRINT '-> Lấy danh sách vé của khách hàng KH01, JOIN > 4 bảng, WHERE + ORDER BY';
EXEC GetTicketsByCustomer @MaKH = 'KH01';
PRINT '---------------------------------------------------------------------';

PRINT '=== 2.3.2 – THỦ TỤC GetTicketCount (thống kê vé theo phim) ===';
PRINT '-> Đếm số vé đã ĐẶT cho phim MV01 bằng cách gọi fn_DemSoVeTheoPhim bên trong';
EXEC GetShowtimeSeatStats 'MV01', 'S01';
PRINT '=> Có thể gắn với giao diện (ví dụ hiển thị "Số vé đã bán" của phim MV01).';
PRINT '=====================================================================';
GO


/* ===============================================================
  2.4 – HÀM (1 điểm)

  Hàm 1: fn_TongTienTietKiemCuaKH
    - Có CURSOR, tính toán tổng tiền được giảm từ khuyến mãi
    - Được dùng bởi proc GetSavings → UI tab "Thống kê"

  Hàm 2: fn_TongTienKhachHangDaTieu
    - Có CURSOR, tính tổng tiền đã chi với giao dịch Thành công
    - Được dùng bởi proc GetSpending → UI tab "Thống kê"
================================================================ */

PRINT '=== 2.4.1 – HÀM fn_TongTienTietKiemCuaKH (tổng tiền tiết kiệm) ===';
PRINT 'Gọi trực tiếp hàm:';
SELECT dbo.fn_TongTienTietKiemCuaKH('KH01') AS TongTienTietKiem;

PRINT 'Gọi thông qua thủ tục GetSavings (web đang dùng /stats/savings/KH01):';
EXEC GetSavings @MaKH = 'KH01';
PRINT '---------------------------------------------------------------------';

PRINT '=== 2.4.2 – HÀM fn_TongTienKhachHangDaTieu (tổng tiền đã chi) ===';
PRINT 'Gọi trực tiếp hàm:';
SELECT dbo.fn_TongTienKhachHangDaTieu('KH01') AS TongTienDaTieu;

PRINT 'Gọi thông qua thủ tục GetSpending (web đang dùng /stats/spending/KH01):';
EXEC GetSpending @MaKH = 'KH01';
PRINT '=====================================================================';
GO
