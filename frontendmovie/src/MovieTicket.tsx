import React, { useState, useEffect, useMemo } from 'react';
import './MovieTicket.css';

/* =========================================
   TYPES
========================================= */
interface CancelResult {
  id: string;
  success: boolean;
  message: string;
}

interface Ticket {
  id: string;
  movieName: string;
  theater: string;
  room: string;
  seat: string;
  showDate: string;
  startTime: string;
  statusText: 'DaDat' | 'ChuaThanhToan' | 'Huy';
  promoCode: string | null;
  price: number;
  transactionId?: string | null;
}

interface Theater {
  MaRap: string;
  TenRap: string;
  DiaChi?: string;
  ThanhPho?: string;
  SoDienThoai?: string;
  Email?: string;
}

interface Movie {
  MaPhim: string;
  TenPhim: string;
  ThoiLuong: number;
  DaoDien: string;
  Poster?: string;
}

interface Showtime {
  MaSuat: string;
  NgayChieu: string;
  GioChieu: string;
  TenPhong: string;
}

interface Seat {
  MaGhe: string;
  LoaiGhe: string;
  TinhTrang: string;
}

interface BookingResult {
  returnValue: number;
  MaVe?: string;
  MaGD?: string;
  GiaCuoi?: number;
  GiaSauGiam?: number;
  ThongBao?: string;
}

interface Stats {
  savings?: number;
  spending?: number;
  points?: number;
}

type BookingStep = 'theater' | 'movies' | 'showtime' | 'seat' | 'confirm';
type Tab = 'tickets' | 'stats' | 'theaters';

type TheaterForm = {
  MaRap: string;
  TenRap: string;
  DiaChi: string;
  ThanhPho: string;
  SoDienThoai: string;
  Email: string;
};

const API_BASE_URL = 'http://localhost:3001';

/* =========================================
   API SERVICE
========================================= */

class ApiService {
  static async fetchTickets(customerId: string = 'KH01'): Promise<Ticket[]> {
    const res = await fetch(`${API_BASE_URL}/tickets?customerId=${customerId}`);
    if (!res.ok) throw new Error('Không thể tải danh sách vé');
    return res.json();
  }

  static async fetchTheaters(): Promise<Theater[]> {
    const res = await fetch(`${API_BASE_URL}/theaters`);
    if (!res.ok) throw new Error('Không thể tải danh sách rạp');
    return res.json();
  }

  static async createTheater(theater: TheaterForm) {
    const res = await fetch(`${API_BASE_URL}/theaters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theater),
    });
    const data = await res.json();
    if (!res.ok || data.returnValue < 0) {
      throw new Error(data.ThongBao || 'Lỗi thêm rạp');
    }
    return data;
  }

  static async updateTheater(id: string, theater: TheaterForm) {
    const res = await fetch(`${API_BASE_URL}/theaters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theater),
    });
    const data = await res.json();
    if (!res.ok || data.returnValue < 0) {
      throw new Error(data.ThongBao || 'Lỗi cập nhật rạp');
    }
    return data;
  }

  static async deleteTheater(id: string) {
    const res = await fetch(`${API_BASE_URL}/theaters/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok || data.returnValue < 0) {
      throw new Error(data.ThongBao || 'Lỗi xóa rạp');
    }
    return data;
  }

  static async fetchMovies(theaterId: string): Promise<Movie[]> {
    const res = await fetch(`${API_BASE_URL}/theaters/${theaterId}/movies`);
    if (!res.ok) throw new Error('Không thể tải danh sách phim');
    return res.json();
  }

  static async fetchShowtimes(theaterId: string, movieId: string): Promise<Showtime[]> {
    const res = await fetch(`${API_BASE_URL}/theaters/${theaterId}/movies/${movieId}/showtimes`);
    if (!res.ok) throw new Error('Không thể tải suất chiếu');
    return res.json();
  }

  static async fetchSeats(
    theaterId: string,
    roomName: string,
    movieId: string,
    showtimeId: string
  ): Promise<Seat[]> {
    const res = await fetch(
      `${API_BASE_URL}/seats?theaterId=${theaterId}&roomName=${encodeURIComponent(
        roomName
      )}&movieId=${movieId}&showtimeId=${showtimeId}`
    );
    if (!res.ok) throw new Error('Không thể tải danh sách ghế');
    return res.json();
  }

  static async checkPromo(code: string) {
    const res = await fetch(`${API_BASE_URL}/promo/${code}`);
    if (!res.ok) throw new Error('Mã khuyến mãi không hợp lệ hoặc đã hết hạn');
    return res.json();
  }

  static async bookTicket(body: any): Promise<BookingResult> {
    const res = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || 'Lỗi đặt vé');
    }
    return res.json();
  }

  static async cancelMany(ids: string[]) {
    const res = await fetch(`${API_BASE_URL}/tickets/bulk-cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Lỗi hủy vé');
    return res.json();
  }

  static async getTicketDetail(ticketId: string) {
    const res = await fetch(`${API_BASE_URL}/ticket/detail/${ticketId}`);
    if (!res.ok) throw new Error('Không thể tải chi tiết vé');
    return res.json();
  }

  static async getSavings(customerId: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/stats/savings/${customerId}`);
    if (!res.ok) throw new Error('Không thể tải thống kê tiết kiệm');
    const data = await res.json();
    return data.savings ?? 0;
  }

  static async getSpending(customerId: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/stats/spending/${customerId}`);
    if (!res.ok) throw new Error('Không thể tải thống kê chi tiêu');
    const data = await res.json();
    return data.spending ?? 0;
  }

  static async getPoints(customerId: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/stats/points/${customerId}`);
    if (!res.ok) throw new Error('Không thể tải điểm tích lũy');
    const data = await res.json();
    return data.Points ?? data.DiemTichLuy ?? 0;
  }

   static async payTicket(ticketId: string, method: string, promoCode?: string | null) {
    const res = await fetch(`${API_BASE_URL}/tickets/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId,
        phuongThuc: method,
        promoCode: promoCode || null,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.returnValue < 0) {
      throw new Error(data.ThongBao || 'Lỗi thanh toán');
    }
    return data;
  }

}

/* =========================================
   MAIN COMPONENT
========================================= */

const MovieTicketSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tickets');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [customerId] = useState('KH01');

  // booking
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>('theater');
  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);

  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);

  const [basePrice, setBasePrice] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);

  // detail
  const [detailTicket, setDetailTicket] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTicket, setPaymentTicket] = useState<Ticket | null>(null);
  const [showMultiPaymentModal, setShowMultiPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Momo');
  // payment promo (single)
  const [paymentPromoCode, setPaymentPromoCode] = useState('');
  const [paymentPromoDiscount, setPaymentPromoDiscount] = useState(0);
  const [paymentPromoError, setPaymentPromoError] = useState<string | null>(null);

  // payment promo (multi)
  const [multiPaymentPromoCode, setMultiPaymentPromoCode] = useState('');
  const [multiPaymentPromoDiscount, setMultiPaymentPromoDiscount] = useState(0);
  const [multiPaymentPromoError, setMultiPaymentPromoError] = useState<string | null>(null);

  // stats
  const [stats, setStats] = useState<Stats>({});
  const [statsLoading, setStatsLoading] = useState(false);

  // theaters management
  const [theaterSearch, setTheaterSearch] = useState('');
  const [theaterForm, setTheaterForm] = useState<TheaterForm>({
    MaRap: '',
    TenRap: '',
    DiaChi: '',
    ThanhPho: '',
    SoDienThoai: '',
    Email: '',
  });
  const [editingTheaterId, setEditingTheaterId] = useState<string | null>(null);
  const [theaterFormError, setTheaterFormError] = useState<string | null>(null);

  /* =========================================
     EFFECTS
  ========================================= */
  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    }
    if (activeTab === 'theaters') {
      loadTheatersList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (showBookingModal || showDetailModal || showPaymentModal || showMultiPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBookingModal, showDetailModal, showPaymentModal, showMultiPaymentModal]);

  /* =========================================
     LOAD FUNCTIONS
  ========================================= */
  const loadTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ApiService.fetchTickets(customerId);
      setTickets(
        Array.isArray(data)
          ? data.map((t: any) => ({
              id: t.MaVe ?? t.id,
              movieName: t.TenPhim ?? t.movieName ?? '-',
              theater: t.TenRap ?? t.theater ?? '-',
              room: t.TenPhong ?? t.room ?? '-',
              seat: t.MaGhe ?? t.seat ?? '-',
              showDate: t.NgayChieu ?? t.showDate ?? '',
              startTime: t.GioChieu ?? t.startTime ?? '',
              statusText:
                (t.TrangThai === 'DaDat' ||
                t.TrangThai === 'Huy' ||
                t.TrangThai === 'ChuaThanhToan'
                  ? t.TrangThai
                  : t.statusText) ?? 'ChuaThanhToan',
              promoCode: t.MaKM ?? t.promoCode ?? null,
              price: t.GiaVe ?? t.price ?? 0,
              transactionId: t.MaGiaoDich ?? t.MaGD ?? t.transactionId ?? null,
            }))
          : []
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải vé');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTheatersList = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.fetchTheaters();
      setTheaters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải rạp');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const [savings, spending, points] = await Promise.all([
        ApiService.getSavings(customerId).catch(() => 0),
        ApiService.getSpending(customerId).catch(() => 0),
        ApiService.getPoints(customerId).catch(() => 0),
      ]);
      setStats({ savings, spending, points });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const openBookingModal = async () => {
    setShowBookingModal(true);
    setBookingStep('theater');
    await loadTheatersList();
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingStep('theater');
    setSelectedTheater(null);
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setSelectedSeat(null);
    setSelectedRoomName(null);
    setSeats([]);
    setBasePrice(0);
    setFinalPrice(0);
    setPromoCode('');
    setPromoError(null);
    setPromoDiscount(0);
    setError(null);
  };

  const handleTheaterSelect = async (theater: Theater) => {
    setSelectedTheater(theater);
    setBookingStep('movies');
    try {
      setIsLoading(true);
      const data = await ApiService.fetchMovies(theater.MaRap);
      setMovies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải phim');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovieSelect = async (movie: Movie) => {
    setSelectedMovie(movie);
    setBookingStep('showtime');
    if (selectedTheater) {
      try {
        setIsLoading(true);
        const data = await ApiService.fetchShowtimes(selectedTheater.MaRap, movie.MaPhim);
        setShowtimes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi tải suất chiếu');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleShowtimeSelect = async (showtime: Showtime) => {
    setSelectedShowtime(showtime);
    setSelectedRoomName(showtime.TenPhong);
    setBookingStep('seat');
    if (selectedTheater && selectedMovie) {
      try {
        setIsLoading(true);
        const data = await ApiService.fetchSeats(
          selectedTheater.MaRap,
          showtime.TenPhong,
          selectedMovie.MaPhim,
          showtime.MaSuat
        );
        setSeats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi tải ghế');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSeatSelect = async (seat: Seat) => {
    if (seat.TinhTrang !== 'Trống') return;

    setSelectedSeat(seat);

    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/seats/price?seatType=${seat.LoaiGhe}`);
      if (!res.ok) throw new Error('Không thể lấy giá ghế');
      const data = await res.json();

      setBasePrice(data.price ?? 0);
      setFinalPrice(data.price ?? 0);
      setPromoCode('');
      setPromoError(null);
      setPromoDiscount(0);
      setBookingStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lấy giá ghế');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckPromo = async () => {
    if (!promoCode) {
      setPromoError('Vui lòng nhập mã khuyến mãi');
      return;
    }
    try {
      setIsLoading(true);
      setPromoError(null);
      const data = await ApiService.checkPromo(promoCode);
      const percent = data.discountPercent ?? data.percent ?? data.value ?? 0;
      setPromoDiscount(percent);
      const newFinal = Math.round(basePrice * (1 - percent / 100));
      setFinalPrice(newFinal);
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Mã khuyến mãi không hợp lệ');
      setPromoDiscount(0);
      setFinalPrice(basePrice);
    } finally {
      setIsLoading(false);
    }
  };
  const handleCheckPaymentPromo = async () => {
    if (!paymentPromoCode.trim()) {
      setPaymentPromoError('Vui lòng nhập mã khuyến mãi');
      return;
    }
    try {
      setIsLoading(true);
      setPaymentPromoError(null);
      const data = await ApiService.checkPromo(paymentPromoCode.trim());
      const percent =
        data.discountPercent ??
        data.PhanTramGiam ??
        data.percent ??
        data.value ??
        0;
      setPaymentPromoDiscount(percent);
    } catch (err) {
      setPaymentPromoError(
        err instanceof Error ? err.message : 'Mã khuyến mãi không hợp lệ'
      );
      setPaymentPromoDiscount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckMultiPaymentPromo = async () => {
    if (!multiPaymentPromoCode.trim()) {
      setMultiPaymentPromoError('Vui lòng nhập mã khuyến mãi');
      return;
    }
    try {
      setIsLoading(true);
      setMultiPaymentPromoError(null);
      const data = await ApiService.checkPromo(multiPaymentPromoCode.trim());
      const percent =
        data.discountPercent ??
        data.PhanTramGiam ??
        data.percent ??
        data.value ??
        0;
      setMultiPaymentPromoDiscount(percent);
    } catch (err) {
      setMultiPaymentPromoError(
        err instanceof Error ? err.message : 'Mã khuyến mãi không hợp lệ'
      );
      setMultiPaymentPromoDiscount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedTheater || !selectedMovie || !selectedShowtime || !selectedSeat) {
      setError('Thiếu dữ liệu đặt vé');
      return;
    }

    try {
      setIsLoading(true);
      const result = await ApiService.bookTicket({
        movieId: selectedMovie.MaPhim,
        showtimeId: selectedShowtime.MaSuat,
        theaterId: selectedTheater.MaRap,
        roomName: selectedRoomName,
        seatId: selectedSeat.MaGhe,
        promoCode: promoCode || null,
      });

      if (result.returnValue === 0) {
        const price = result.GiaSauGiam ?? result.GiaCuoi ?? finalPrice ?? basePrice;
        const newTicket: Ticket = {
          id: result.MaVe ?? `TICKET_${Date.now()}`,
          movieName: selectedMovie.TenPhim,
          theater: selectedTheater.TenRap,
          room: selectedRoomName ?? '',
          seat: selectedSeat.MaGhe,
          showDate: selectedShowtime.NgayChieu,
          startTime: selectedShowtime.GioChieu,
          statusText: 'ChuaThanhToan',
          promoCode: promoDiscount > 0 ? promoCode : null,
          price: price ?? 0,
          transactionId: null,
        };

        setTickets((prev) => [newTicket, ...prev]);
        closeBookingModal();
        alert(`✅ ${result.ThongBao ?? 'Đặt vé thành công'}\nMã vé: ${newTicket.id}`);
      } else {
        setError(result.ThongBao ?? 'Đặt vé thất bại');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt vé thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // ============= TICKET MANAGEMENT =============
  const handleCancelSelected = async () => {
    const ids = Array.from(selectedTickets);
    if (ids.length === 0) return;

    if (!window.confirm(`Bạn có chắc muốn hủy ${ids.length} vé?`)) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await ApiService.cancelMany(ids);
      if (result.results) {
        const results = result.results as CancelResult[];
        const successIds = results.filter((r) => r.success).map((r) => r.id);
        const failedResults = results.filter((r) => !r.success);

        setTickets((prev) =>
          prev.map((t) => (successIds.includes(t.id) ? { ...t, statusText: 'Huy' } : t))
        );
        setSelectedTickets(new Set());

        if (failedResults.length > 0) {
          const msgs = failedResults.map((r) => `• Vé ${r.id}: ${r.message}`).join('\n');
          alert(`Không thể hủy một số vé:\n${msgs}`);
        } else {
          alert(`Đã hủy ${successIds.length} vé thành công`);
        }
      } else {
        setError('Kết quả hủy không đúng định dạng');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hủy vé thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedTickets((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleTickets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filtered = tickets.filter(
      (t) => t.statusText === 'DaDat' || t.statusText === 'Huy' || t.statusText === 'ChuaThanhToan'
    );
    if (!query) return filtered;
    return filtered.filter((t) =>
      [t.id, t.movieName, t.theater, t.room, t.seat, t.showDate, t.startTime, t.promoCode ?? ''].some((v) =>
        String(v).toLowerCase().includes(query)
      )
    );
  }, [tickets, searchTerm]);

  const selectAllVisibleUnpaid = (checked: boolean) => {
    if (checked) {
      const unpaidIds = visibleTickets.filter((t) => t.statusText === 'ChuaThanhToan').map((t) => t.id);
      setSelectedTickets(new Set(unpaidIds));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const allVisibleUnpaidSelected = useMemo(() => {
    const unpaidVisible = visibleTickets.filter((t) => t.statusText === 'ChuaThanhToan');
    return (
      unpaidVisible.length > 0 &&
      unpaidVisible.every((t) => selectedTickets.has(t.id)) &&
      selectedTickets.size > 0
    );
  }, [visibleTickets, selectedTickets]);

  const renderStatusBadge = (status: Ticket['statusText']) => {
    if (status === 'DaDat') return <span className="badge badge-paid">Đã đặt</span>;
    if (status === 'ChuaThanhToan') return <span className="badge badge-unpaid">Chưa Thanh Toán</span>;
    return <span className="badge badge-cancel">Hủy</span>;
  };

  const formatCurrency = (n: number) => (n ?? 0).toLocaleString('vi-VN') + ' đ';

  // ============= DETAIL / PAYMENT HANDLERS =============
  const handleViewDetail = async (ticket: Ticket) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const data = await ApiService.getTicketDetail(ticket.id);
      const dt = Array.isArray(data) ? data[0] ?? data : data;
      setDetailTicket(dt ?? ticket);
    } catch (err) {
      setDetailTicket(ticket);
      console.error('Error loading detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

    const handlePayTicket = (ticket: Ticket) => {
    setPaymentTicket(ticket);
    // reset promo khi mở modal
    setPaymentPromoCode('');
    setPaymentPromoDiscount(0);
    setPaymentPromoError(null);
    setShowPaymentModal(true);
  };


    const handlePaySelectedTickets = async () => {
    const unpaidSelected = Array.from(selectedTickets).filter((id) => {
      const ticket = tickets.find((t) => t.id === id);
      return ticket && ticket.statusText === 'ChuaThanhToan';
    });

    if (unpaidSelected.length === 0) {
      alert('Chỉ có thể thanh toán vé chưa thanh toán');
      return;
    }

    // reset promo khi mở modal
    setMultiPaymentPromoCode('');
    setMultiPaymentPromoDiscount(0);
    setMultiPaymentPromoError(null);

    setShowMultiPaymentModal(true);
  };


  // Thanh toán 1 vé
    const handleConfirmPayment = async () => {
    if (!paymentTicket) return;

    try {
      setIsLoading(true);
      setError(null);

      const promoToSend =
        paymentPromoDiscount > 0 ? paymentPromoCode.trim() : null;

      const result = await ApiService.payTicket(
        paymentTicket.id,
        paymentMethod,
        promoToSend
      );

      setShowPaymentModal(false);
      setPaymentTicket(null);

      alert(`✅ ${result.ThongBao ?? 'Thanh toán thành công'}`);

      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thanh toán thất bại');
    } finally {
      setIsLoading(false);
    }
  };


  // Thanh toán nhiều vé
  const handleConfirmMultiPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const ticketIds = Array.from(selectedTickets).filter((id) => {
        const ticket = tickets.find((t) => t.id === id);
        return ticket && ticket.statusText === 'ChuaThanhToan';
      });

            const promoToSend =
        multiPaymentPromoDiscount > 0 ? multiPaymentPromoCode.trim() : null;

      const response = await fetch(`${API_BASE_URL}/tickets/pay-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketIds,
          phuongThuc: paymentMethod,
          promoCode: promoToSend,
        }),
      });


      const data = await response.json();

      if (response.ok && data.returnValue === 0) {
        setSelectedTickets(new Set());
        setShowMultiPaymentModal(false);

        alert(`✅ ${data.ThongBao ?? `Thanh toán thành công ${ticketIds.length} vé`}`);

        // Reload từ DB sau khi trigger cập nhật trạng thái vé
        await loadTickets();
      } else {
        setError(data.ThongBao ?? 'Thanh toán thất bại');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thanh toán thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  // ============= THEATER MANAGEMENT HANDLERS =============
  const handleTheaterFormChange = (field: keyof TheaterForm, value: string) => {
    setTheaterForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateTheaterForm = (): string | null => {
    if (!theaterForm.MaRap.trim()) return 'Mã rạp không được để trống';
    if (!theaterForm.TenRap.trim()) return 'Tên rạp không được để trống';
    if (theaterForm.SoDienThoai && !/^\d{8,15}$/.test(theaterForm.SoDienThoai)) {
      return 'Số điện thoại không hợp lệ (8–15 chữ số)';
    }
    if (theaterForm.Email && !/.+@.+\..+/.test(theaterForm.Email)) {
      return 'Email không hợp lệ';
    }
    return null;
  };

  const resetTheaterForm = () => {
    setTheaterForm({
      MaRap: '',
      TenRap: '',
      DiaChi: '',
      ThanhPho: '',
      SoDienThoai: '',
      Email: '',
    });
    setEditingTheaterId(null);
    setTheaterFormError(null);
  };

  const handleSubmitTheaterForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = validateTheaterForm();
    if (msg) {
      setTheaterFormError(msg);
      return;
    }
    try {
      setIsLoading(true);
      setTheaterFormError(null);
      if (editingTheaterId) {
        await ApiService.updateTheater(editingTheaterId, theaterForm);
        alert('✅ Cập nhật rạp thành công');
      } else {
        await ApiService.createTheater(theaterForm);
        alert('✅ Thêm rạp mới thành công');
      }
      await loadTheatersList();
      resetTheaterForm();
    } catch (err) {
      setTheaterFormError(err instanceof Error ? err.message : 'Lỗi lưu rạp');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTheater = (th: Theater) => {
    setEditingTheaterId(th.MaRap);
    setTheaterForm({
      MaRap: th.MaRap,
      TenRap: th.TenRap,
      DiaChi: th.DiaChi ?? '',
      ThanhPho: th.ThanhPho ?? '',
      SoDienThoai: th.SoDienThoai ?? '',
      Email: th.Email ?? '',
    });
    setTheaterFormError(null);
  };

  const handleDeleteTheater = async (th: Theater) => {
    if (!window.confirm(`Bạn có chắc muốn xóa rạp "${th.TenRap}" (${th.MaRap})?`)) return;
    try {
      setIsLoading(true);
      const data = await ApiService.deleteTheater(th.MaRap);
      alert(`✅ ${data.ThongBao ?? 'Xóa rạp thành công'}`);
      await loadTheatersList();
      if (editingTheaterId === th.MaRap) resetTheaterForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi xóa rạp');
    } finally {
      setIsLoading(false);
    }
  };

  const visibleTheaters = useMemo(() => {
    const q = theaterSearch.trim().toLowerCase();
    if (!q) return theaters;
    return theaters.filter((th) =>
      [
        th.MaRap,
        th.TenRap,
        th.DiaChi ?? '',
        th.ThanhPho ?? '',
        th.SoDienThoai ?? '',
        th.Email ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [theaters, theaterSearch]);

  // ============= SEAT STATS (tính trực tiếp từ seats) =============
  const totalSeats = useMemo(() => seats.length, [seats]);
  const bookedSeatCount = useMemo(
    () => seats.filter((s) => s.TinhTrang !== 'Trống').length,
    [seats]
  );
  const singlePaymentBasePrice = paymentTicket?.price ?? 0;
  const singlePaymentFinalPrice = Math.round(
    singlePaymentBasePrice * (1 - paymentPromoDiscount / 100)
  );

  const multiPaymentBaseTotal = useMemo(() => {
    return Array.from(selectedTickets).reduce((sum, id) => {
      const ticket = tickets.find((t) => t.id === id);
      if (ticket && ticket.statusText === 'ChuaThanhToan') {
        return sum + (ticket.price || 0);
      }
      return sum;
    }, 0);
  }, [selectedTickets, tickets]);

  const multiPaymentFinalTotal = Math.round(
    multiPaymentBaseTotal * (1 - multiPaymentPromoDiscount / 100)
  );

  // ============= RENDER =============
  return (
    <div className="mt-root">
      {/* Header */}
      <header className="mt-header">
        <div className="mt-header-inner">
          <div className="mt-logo">🎟️</div>
          <h1 className="mt-title">QUẢN LÝ VÉ XEM PHIM</h1>
          <div className="mt-actions">
            <button className="btn btn-ghost" onClick={() => setActiveTab('tickets')}>
              Vé
            </button>
            <button className="btn btn-ghost" onClick={() => setActiveTab('theaters')}>
              Rạp
            </button>
            <button className="btn btn-ghost" onClick={() => setActiveTab('stats')}>
              Thống kê
            </button>
            <button className="btn btn-primary" onClick={openBookingModal}>
              <svg width="20" height="20" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z" fill="#FEF7FF" />
              </svg>
              Đặt vé
            </button>
          </div>
        </div>
      </header>

      <main className="mt-container">
        {/* Search & Controls (dành cho tab Vé) */}
        {activeTab === 'tickets' && (
          <>
            <div className="mt-toolbar">
              <input
                className="mt-search"
                placeholder="Tìm theo mã vé, phim, rạp, phòng, ghế, ngày, giờ, mã KM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="mt-toolbar-right">
                <button
                  className="btn btn-primary"
                  onClick={handlePaySelectedTickets}
                  disabled={selectedTickets.size === 0 || isLoading}
                >
                  Thanh toán {selectedTickets.size} vé
                </button>

                <button
                  className="btn btn-danger"
                  onClick={handleCancelSelected}
                  disabled={selectedTickets.size === 0 || isLoading}
                >
                  Hủy vé đã chọn
                </button>
              </div>
            </div>

            {/* Select all unpaid */}
            {visibleTickets.filter((t) => t.statusText === 'ChuaThanhToan').length > 0 && (
              <div className="mt-select-all">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={allVisibleUnpaidSelected}
                    onChange={(e) => selectAllVisibleUnpaid(e.target.checked)}
                  />
                  Chọn tất cả vé chưa thanh toán
                </label>
              </div>
            )}
          </>
        )}

        {/* Content by tab */}
        {activeTab === 'tickets' ? (
          <>
            {isLoading && visibleTickets.length === 0 ? (
              <div className="mt-empty-card mt-loading">
                <div className="mt-emoji">⏳</div>
                <div className="mt-empty-text">Đang tải dữ liệu...</div>
              </div>
            ) : visibleTickets.length === 0 ? (
              <div className="mt-empty-card">
                <div className="mt-emoji">🎬</div>
                <div className="mt-empty-text">Không có vé nào</div>
              </div>
            ) : (
              <div className="mt-grid">
                {visibleTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`mt-card ${selectedTickets.has(ticket.id) ? 'selected' : ''} ${
                      ticket.statusText === 'Huy' ? 'muted' : ''
                    }`}
                  >
                    <div className="mt-card-top">
                      <div className="mt-card-left">
                        <h3 className="mt-movie">{ticket.movieName}</h3>
                        <div className="mt-meta">
                          <span className="mt-ticket-id">#{ticket.id}</span>
                          <span className="mt-dot">•</span>
                          <span>{ticket.theater}</span>
                        </div>
                        <div className="mt-meta small">
                          {ticket.room} • Ghế {ticket.seat}
                        </div>
                        <div className="mt-meta small">
                          {ticket.showDate.slice(0,10)} {ticket.startTime}
                        </div>
                      </div>
                      <div className="mt-card-right">
                        {renderStatusBadge(ticket.statusText)}
                        <div className="mt-price">{formatCurrency(ticket.price)}</div>
                      </div>
                    </div>

                    <div className="mt-card-actions">
                      <label className="checkbox-inline">
                        <input
                          type="checkbox"
                          checked={selectedTickets.has(ticket.id)}
                          onChange={() => toggleSelect(ticket.id)}
                        />
                        Chọn
                      </label>

                      <div className="mt-actions-row">
                        <button className="link" onClick={() => handleViewDetail(ticket)}>
                          Chi tiết
                        </button>
                        {ticket.statusText === 'ChuaThanhToan' && (
                          <button className="link" onClick={() => handlePayTicket(ticket)}>
                            Thanh toán
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'stats' ? (
          <section className="mt-stats">
            {statsLoading ? (
              <div>Đang tải thống kê...</div>
            ) : (
              <div className="mt-stats-grid">
                <div className="stat-card">
                  <div className="stat-title">Tiết kiệm</div>
                  <div className="stat-value">{(stats.savings ?? 0).toLocaleString('vi-VN')} đ</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Chi tiêu</div>
                  <div className="stat-value">{(stats.spending ?? 0).toLocaleString('vi-VN')} đ</div>
                </div>
                <div className="stat-card">
                  <div className="stat-title">Điểm tích lũy</div>
                  <div className="stat-value">{stats.points ?? 0}</div>
                </div>
              </div>
            )}
          </section>
        ) : (
          // Tab RẠP
          <section className="mt-theaters">
            <div className="mt-toolbar">
              <input
                className="mt-search"
                placeholder="Tìm theo mã rạp, tên rạp, địa chỉ, thành phố..."
                value={theaterSearch}
                onChange={(e) => setTheaterSearch(e.target.value)}
              />
              <div className="mt-toolbar-right">
                <button className="btn btn-outline" onClick={resetTheaterForm} disabled={isLoading}>
                  Làm mới form
                </button>
              </div>
            </div>

            <div className="mt-grid">
              {/* Form thêm / sửa rạp */}
              <div className="mt-card">
                <h3 className="mt-movie">
                  {editingTheaterId ? 'Cập nhật thông tin rạp' : 'Thêm rạp mới'}
                </h3>
                <form onSubmit={handleSubmitTheaterForm}>
                  <div className="mt-meta small">Thông tin cơ bản</div>
                  <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
                    <input
                      placeholder="Mã rạp (ví dụ: R06)"
                      value={theaterForm.MaRap}
                      disabled={!!editingTheaterId}
                      onChange={(e) => handleTheaterFormChange('MaRap', e.target.value)}
                      className="mt-search"
                      style={{ boxShadow: 'none', color: 'black' }}
                    />
                    <input
                      placeholder="Tên rạp"
                      value={theaterForm.TenRap}
                      onChange={(e) => handleTheaterFormChange('TenRap', e.target.value)}
                      className="mt-search"
                      style={{ boxShadow: 'none', color: 'black' }}
                    />
                    <input
                      placeholder="Địa chỉ"
                      value={theaterForm.DiaChi}
                      onChange={(e) => handleTheaterFormChange('DiaChi', e.target.value)}
                      className="mt-search"
                      style={{ boxShadow: 'none', color: 'black' }}
                    />
                    <input
                      placeholder="Thành phố"
                      value={theaterForm.ThanhPho}
                      onChange={(e) => handleTheaterFormChange('ThanhPho', e.target.value)}
                      className="mt-search"
                      style={{ boxShadow: 'none', color: 'black' }}
                    />
                    <input
                      placeholder="Số điện thoại"
                      value={theaterForm.SoDienThoai}
                      onChange={(e) => handleTheaterFormChange('SoDienThoai', e.target.value)}
                      className="mt-search"
                      style={{ boxShadow: 'none', color: 'black' }}
                    />
                    <input
                      placeholder="Email"
                      value={theaterForm.Email}
                      onChange={(e) => handleTheaterFormChange('Email', e.target.value)}
                      className="mt-search"
                      style={{ boxShadow: 'none', color: 'black' }}
                    />
                  </div>

                  {theaterFormError && <div className="mt-error">{theaterFormError}</div>}

                  <div className="confirm-actions" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" type="button" onClick={resetTheaterForm}>
                      Hủy / Nhập lại
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={isLoading}>
                      {editingTheaterId ? 'Lưu thay đổi' : 'Thêm rạp'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Danh sách rạp */}
              {visibleTheaters.map((th) => (
                <div key={th.MaRap} className="mt-card">
                  <div className="mt-card-top">
                    <div className="mt-card-left">
                      <h3 className="mt-movie">{th.TenRap}</h3>
                      <div className="mt-meta small">
                        <span className="mt-ticket-id">#{th.MaRap}</span>
                        {th.ThanhPho && (
                          <>
                            <span className="mt-dot">•</span>
                            <span>{th.ThanhPho}</span>
                          </>
                        )}
                      </div>
                      {th.DiaChi && <div className="mt-meta small">{th.DiaChi}</div>}
                      {(th.SoDienThoai || th.Email) && (
                        <div className="mt-meta small">
                          {th.SoDienThoai && <span>☎ {th.SoDienThoai}</span>}
                          {th.SoDienThoai && th.Email && <span className="mt-dot">•</span>}
                          {th.Email && <span>✉ {th.Email}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-card-actions">
                    <div className="mt-actions-row">
                      <button className="link" onClick={() => handleEditTheater(th)}>
                        Sửa
                      </button>
                      <button className="link" onClick={() => handleDeleteTheater(th)}>
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {visibleTheaters.length === 0 && (
                <div className="mt-empty-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="mt-emoji">🏙️</div>
                  <div className="mt-empty-text">Không tìm thấy rạp nào</div>
                </div>
              )}
            </div>
          </section>
        )}

        {error && <div className="mt-error" style={{ marginTop: 12 }}>{error}</div>}
      </main>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="mt-modal">
          <div className="mt-modal-backdrop" onClick={closeBookingModal}></div>
          <div className="mt-modal-panel">
            <div className="mt-modal-header">
              <h3>Đặt vé - Bước: {bookingStep}</h3>
              <button className="btn-icon" onClick={closeBookingModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" fill="#1D1B20"/>
                </svg>

              </button>
            </div>
            <div className="mt-modal-body">
              {bookingStep === 'theater' && (
                <div className="booking-list">
                  {theaters.map((th) => (
                    <div key={th.MaRap} className="booking-item" onClick={() => handleTheaterSelect(th)}>
                      <div className="booking-title">{th.TenRap}</div>
                      <div className="booking-sub">{th.DiaChi}</div>
                    </div>
                  ))}
                </div>
              )}

              {bookingStep === 'movies' && (
                <div className="booking-list">
                  {movies.map((mv) => (
                    <div key={mv.MaPhim} className="booking-item" onClick={() => handleMovieSelect(mv)}>
                      <div className="booking-title">{mv.TenPhim}</div>
                      <div className="booking-sub">
                        {mv.ThoiLuong} phút • {mv.DaoDien}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {bookingStep === 'showtime' && (
                <div className="booking-list">
                  {showtimes.map((st) => (
                    <div key={st.MaSuat} className="booking-item" onClick={() => handleShowtimeSelect(st)}>
                      <div className="booking-title">
                        {st.NgayChieu.slice(0,10)} vào {st.GioChieu}
                      </div>
                      <div className="booking-sub">Phòng: {st.TenPhong}</div>
                    </div>
                  ))}
                </div>
              )}

              {bookingStep === 'seat' && (
                <div>
                  <div className="seat-stats">
                    Đã có <strong>{bookedSeatCount}</strong> / <strong>{totalSeats}</strong> ghế được đặt (
                    {totalSeats > 0 ? Math.round((bookedSeatCount / totalSeats) * 100) : 0}% sức chứa).
                  </div>

                  <div className="seat-grid">
                    {seats.map((s) => (
                      <button
                        key={s.MaGhe}
                        className={`seat ${
                          s.TinhTrang === 'Trống'
                            ? 'seat-available'
                            : s.TinhTrang === 'Chờ'
                            ? 'seat-pending'
                            : 'seat-taken'
                        }`}
                        onClick={() => handleSeatSelect(s)}
                        disabled={s.TinhTrang !== 'Trống'}
                      >
                        {s.MaGhe}
                      </button>
                    ))}
                  </div>

                  <div className="seat-note">
                    <span className="seat seat-available sample" /> Trống
                    <span className="seat seat-pending sample" /> Chờ thanh toán
                    <span className="seat seat-taken sample" /> Đã đặt
                  </div>
                </div>
              )}

              {bookingStep === 'confirm' && selectedSeat && (
                <div className="confirm-panel">
                  <div>
                    <strong>Rạp:</strong> {selectedTheater?.TenRap}
                  </div>
                  <div>
                    <strong>Phim:</strong> {selectedMovie?.TenPhim}
                  </div>
                  <div>
                    <strong>Suất:</strong> {selectedShowtime?.NgayChieu.slice(0,10)} {selectedShowtime?.GioChieu}
                  </div>
                  <div>
                    <strong>Phòng / Ghế:</strong> {selectedRoomName} / {selectedSeat.MaGhe}
                  </div>

                  <div className="promo-row">
                    <input
                      placeholder="Mã khuyến mãi (nếu có)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button className="btn" onClick={handleCheckPromo}>
                      Áp dụng
                    </button>
                  </div>
                  {promoError && <div className="mt-error">{promoError}</div>}

                  <div className="price-row">
                    <div>Giá gốc: {formatCurrency(basePrice)}</div>
                    <div>Giảm: {promoDiscount}%</div>
                    <div className="final-price">Tổng: {formatCurrency(finalPrice)}</div>
                  </div>

                  <div className="confirm-actions">
                    <button className="btn btn-outline" onClick={() => setBookingStep('seat')}>
                      Quay lại
                    </button>
                    <button className="btn btn-primary" onClick={handleConfirmBooking} disabled={isLoading}>
                      {isLoading ? 'Đang xử lý...' : 'Xác nhận đặt vé'}
                    </button>
                  </div>
                </div>
              )}

              {error && <div className="mt-error">{error}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="mt-modal">
          <div className="mt-modal-backdrop" onClick={() => setShowDetailModal(false)}></div>
          <div className="mt-modal-panel">
            <div className="mt-modal-header">
              <h3>Chi tiết vé</h3>
              <button className="btn-icon" onClick={() => setShowDetailModal(false)}>
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z"
                    fill="#1D1B20"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-modal-body">
              {detailLoading ? (
                <div>Đang tải...</div>
              ) : detailTicket ? (
                <div className="detail-grid">
                  <div>
                    <b>Mã vé:</b> {detailTicket.MaVe ?? detailTicket.id}
                  </div>
                  <div>
                    <b>Phim:</b> {detailTicket.TenPhim ?? detailTicket.movieName}
                  </div>
                  <div>
                    <b>Rạp:</b> {detailTicket.TenRap ?? detailTicket.theater}
                  </div>
                  <div>
                    <b>Phòng:</b> {detailTicket.TenPhong ?? detailTicket.room}
                  </div>
                  <div>
                    <b>Ghế:</b> {detailTicket.MaGhe ?? detailTicket.seat}
                  </div>
                  <div>
                    <b>Loại ghế:</b> {detailTicket.LoaiGhe ?? '-'}
                  </div>
                  <div>
                    <b>Ngày chiếu:</b> {detailTicket.NgayChieu.slice(0,10) ?? detailTicket.showDate}
                  </div>
                  <div>
                    <b>Giờ chiếu:</b> {detailTicket.GioChieu.slice(11,16) ?? detailTicket.startTime}
                  </div>
                  <div>
                    <b>Trạng thái:</b> {detailTicket.TrangThai ?? detailTicket.statusText}
                  </div>
                  <div>
                    <b>Giá vé:</b>{' '}
                    {detailTicket.GiaVe
                      ? `${detailTicket.GiaVe.toLocaleString('vi-VN')} đ`
                      : formatCurrency(detailTicket.price ?? 0)}
                  </div>
                  <div>
                    <b>Mã KM:</b> {detailTicket.MaKM ?? detailTicket.promoCode ?? '-'}
                  </div>
                  <div>
                    <b>Mã giao dịch:</b>{' '}
                    {detailTicket.MaGiaoDich ?? detailTicket.MaGD ?? detailTicket.transactionId ?? '-'}
                  </div>
                  <div>
                    <b>Phương thức TT:</b> {detailTicket.PhuongThucTT ?? '-'}
                  </div>
                </div>
              ) : (
                <div>Không có dữ liệu</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && paymentTicket && (
        <div className="mt-modal">
          <div className="mt-modal-backdrop" onClick={() => setShowPaymentModal(false)}></div>
          <div className="mt-modal-panel">
            <div className="mt-modal-header">
              <h3>Thanh toán vé</h3>
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" fill="#1D1B20"/>
                </svg>

              </button>
            </div>
            <div className="mt-modal-body">
                            <div className="payment-summary">
                <div>
                  <strong>Phim:</strong> {paymentTicket.movieName}
                </div>
                <div>
                  <strong>Ghế:</strong> {paymentTicket.seat}
                </div>
                <div className="pay-amount">
                  <strong>Số tiền phải trả:</strong>{' '}
                  {formatCurrency(singlePaymentFinalPrice)}
                </div>
                {paymentPromoDiscount > 0 && (
                  <div className="mt-meta small">
                    Giá gốc: {formatCurrency(singlePaymentBasePrice)} • Giảm:{' '}
                    {paymentPromoDiscount}%
                  </div>
                )}
              </div>
              <label className="label">Mã khuyến mãi (nếu có)</label>
              <div className="promo-row">
                <input
                  placeholder="Nhập mã khuyến mãi"
                  value={paymentPromoCode}
                  onChange={(e) => setPaymentPromoCode(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleCheckPaymentPromo}
                  disabled={isLoading}
                >
                  Áp dụng
                </button>
              </div>
              {paymentPromoError && (
                <div className="mt-error">{paymentPromoError}</div>
              )}


              <label className="label">Chọn phương thức</label>
              <select
                className="mt-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Momo">Momo</option>
                <option value="ZaloPay">ZaloPay</option>
                <option value="Visa">Visa</option>
                <option value="Tiền mặt">Tiền mặt</option>
              </select>

              <button className="btn btn-primary full" onClick={handleConfirmPayment} disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi Payment Modal */}
      {showMultiPaymentModal && (
        <div className="mt-modal">
          <div className="mt-modal-backdrop" onClick={() => setShowMultiPaymentModal(false)}></div>
          <div className="mt-modal-panel">
            <div className="mt-modal-header">
              <h3>Thanh toán {selectedTickets.size} vé</h3>
              <button className="btn-icon" onClick={() => setShowMultiPaymentModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.4 19L5 17.6L10.6 12L5 6.4L6.4 5L12 10.6L17.6 5L19 6.4L13.4 12L19 17.6L17.6 19L12 13.4L6.4 19Z" fill="#1D1B20"/>
                </svg>

              </button>
            </div>
            <div className="mt-modal-body">
                            <div className="payment-summary">
                <div>
                  <strong>Số vé:</strong> {selectedTickets.size}
                </div>
                <div className="pay-amount">
                  <strong>Tổng phải trả:</strong>{' '}
                  {formatCurrency(multiPaymentFinalTotal)}
                </div>
                <div className="mt-meta small">
                  Tổng gốc: {formatCurrency(multiPaymentBaseTotal)}
                  {multiPaymentPromoDiscount > 0 && (
                    <> • Giảm: {multiPaymentPromoDiscount}%</>
                  )}
                </div>
              </div>
              <label className="label">Mã khuyến mãi (nếu có)</label>
              <div className="promo-row">
                <input
                  placeholder="Nhập mã khuyến mãi"
                  value={multiPaymentPromoCode}
                  onChange={(e) => setMultiPaymentPromoCode(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={handleCheckMultiPaymentPromo}
                  disabled={isLoading}
                >
                  Áp dụng
                </button>
              </div>
              {multiPaymentPromoError && (
                <div className="mt-error">{multiPaymentPromoError}</div>
              )}


              <label className="label">Chọn phương thức</label>
              <select
                className="mt-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Momo">Momo</option>
                <option value="ZaloPay">ZaloPay</option>
                <option value="Visa">Visa</option>
                <option value="Tiền mặt">Tiền mặt</option>
              </select>

              <button
                className="btn btn-primary full"
                onClick={handleConfirmMultiPayment}
                disabled={isLoading}
              >
                {isLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieTicketSystem;
