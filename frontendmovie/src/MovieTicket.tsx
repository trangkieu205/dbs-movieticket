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
}

interface Theater {
  MaRap: string;
  TenRap: string;
  DiaChi?: string;
  ThanhPho?: string;
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
  MaVe: string;
  MaGD: string;
  GiaCuoi: number;
  ThongBao: string;
}

interface Stats {
  savings?: number;
  spending?: number;
  bookedSeats?: number;
  ticketCount?: number;
}

type BookingStep = 'theater' | 'movies' | 'showtime' | 'seat' | 'confirm';
type Tab = 'tickets' | 'stats';

const API_BASE_URL = 'http://localhost:3001';

const SEAT_PRICE: Record<string, number> = {
  VIP: 150000,
  Couple: 200000,
  IMAX: 180000,
  Thuong: 100000,
};

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

  static async fetchSeats(theaterId: string, roomName: string, movieId: string, showtimeId: string): Promise<Seat[]> {
    const res = await fetch(
      `${API_BASE_URL}/seats?theaterId=${theaterId}&roomName=${encodeURIComponent(roomName)}&movieId=${movieId}&showtimeId=${showtimeId}`
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
    if (!res.ok) throw new Error('Lỗi đặt vé');
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
    return data.savings;
  }

  static async getSpending(customerId: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/stats/spending/${customerId}`);
    if (!res.ok) throw new Error('Không thể tải thống kê chi tiêu');
    const data = await res.json();
    return data.spending;
  }
static async getBookedSeats(movieId: string, showtimeId: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/stats/seats/${movieId}/${showtimeId}`);
    if (!res.ok) throw new Error('Không thể tải thống kê ghế');
    const data = await res.json();
    return data.bookedSeats;
  }

  static async getTicketCount(movieId: string): Promise<number> {
    const res = await fetch(`${API_BASE_URL}/stats/tickets/${movieId}`);
    if (!res.ok) throw new Error('Không thể tải thống kê vé');
    const data = await res.json();
    return data.ticketCount;
  }
  static async payTicket(transactionId: string, method: string) {
    const res = await fetch(`${API_BASE_URL}/tickets/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maGD: transactionId, phuongThuc: method }),
    });
    if (!res.ok) throw new Error('Lỗi thanh toán');
    return res.json();
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

  // Booking modal
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

  // Detail modal
  const [detailTicket, setDetailTicket] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTicket, setPaymentTicket] = useState<Ticket | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Momo');

  // Stats
  const [stats, setStats] = useState<Stats>({});
  const [statsLoading, setStatsLoading] = useState(false);
  const [bookedSeatsCount, setBookedSeatsCount] = useState<number | null>(null);
  const [ticketCountForMovie, setTicketCountForMovie] = useState<number | null>(null);

  /* =========================================
     EFFECTS
  ========================================= */
  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (showBookingModal || showDetailModal || showPaymentModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showBookingModal, showDetailModal, showPaymentModal]);

  useEffect(() => {
    if (selectedMovie && selectedShowtime && bookingStep === 'seat') {
      loadShowtimeStats();
    }
  }, [selectedMovie, selectedShowtime, bookingStep]);

  /* =========================================
     LOAD FUNCTIONS
  ========================================= */
  const loadTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ApiService.fetchTickets(customerId);
      setTickets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải vé');
    } finally {
      setIsLoading(false);
    }
  };
  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const [savings, spending] = await Promise.all([
        ApiService.getSavings?.(customerId).catch(() => 0),
        ApiService.getSpending?.(customerId).catch(() => 0),
      ]);
      setStats({ savings, spending });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadShowtimeStats = async () => {
    if (!selectedMovie || !selectedShowtime) return;
    try {
      const [bookedSeats, ticketCount] = await Promise.all([
        ApiService.getBookedSeats?.(selectedMovie.MaPhim, selectedShowtime.MaSuat).catch(() => 0),
        ApiService.getTicketCount?.(selectedMovie.MaPhim).catch(() => 0),
      ]);
      setBookedSeatsCount(bookedSeats);
      setTicketCountForMovie(ticketCount);
    } catch (err) {
      console.error('Error loading showtime stats:', err);
    }
  };

  const openBookingModal = async () => {
    setShowBookingModal(true);
    setBookingStep('theater');
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

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingStep('theater');
    setSelectedTheater(null);
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setSelectedSeat(null);
    setSelectedRoomName(null);
    setBasePrice(0);
    setFinalPrice(0);
    setPromoCode('');
    setPromoError(null);
    setPromoDiscount(0);
    setBookedSeatsCount(null);
    setTicketCountForMovie(null);
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

  const handleSeatSelect = (seat: Seat) => {
    if (seat.TinhTrang !== 'Trống') return;
    setSelectedSeat(seat);
    const price = SEAT_PRICE[seat.LoaiGhe] ?? 100000;
    setBasePrice(price);
    setFinalPrice(price);
    setPromoCode('');
    setPromoError(null);
    setPromoDiscount(0);
    setBookingStep('confirm');
  };

  const handleCheckPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Vui lòng nhập mã khuyến mãi');
      return;
    }
    try {
      setIsLoading(true);
      setPromoError(null);
      const data = await ApiService.checkPromo(promoCode);
      const discount = data.PhanTramGiam ?? 0;
      setPromoDiscount(discount);
      setFinalPrice(Math.round(basePrice * (1 - discount / 100)));
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : 'Mã không hợp lệ');
      setFinalPrice(basePrice);
      setPromoDiscount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedMovie || !selectedShowtime || !selectedTheater || !selectedSeat) {
      setError('Vui lòng chọn đầy đủ thông tin');
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
        const newTicket: Ticket = {
          id: result.MaVe,
          movieName: selectedMovie.TenPhim,
          theater: selectedTheater.TenRap,
          room: selectedRoomName || selectedShowtime.TenPhong,
          seat: selectedSeat.MaGhe,
          showDate: selectedShowtime.NgayChieu,
          startTime: selectedShowtime.GioChieu,
          statusText: 'ChuaThanhToan',
          promoCode: promoDiscount > 0 ? promoCode : null,
          price: result.GiaCuoi,
        };

        setTickets((prev) => [newTicket, ...prev]);
        closeBookingModal();
        setError(null);
        alert(`✅ ${result.ThongBao}\nMã vé: ${result.MaVe}\nMã GD: ${result.MaGD}`);
      } else {
        setError(result.ThongBao || 'Đặt vé thất bại');
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

    if (!confirm(`Bạn có chắc muốn hủy ${ids.length} vé?`)) return;

    try {
      setIsLoading(true);
      setError(null);
      // use ApiService.cancelMany if exists, else fallback to cancel individually
      if ((ApiService as any).cancelMany) {
        const result = await (ApiService as any).cancelMany(ids);
        // expecting structure: { results: [{ id, success, message }] } or { successIds: [] }
        if (result.results) {
  const results = result.results as CancelResult[];

  const successIds = results.filter(r => r.success).map(r => r.id);
  const failedResults = results.filter(r => !r.success);

  setTickets(prev =>
    prev.map(t =>
      successIds.includes(t.id) ? { ...t, statusText: 'Huy' as const } : t
    )
  );
  setSelectedTickets(new Set());

  if (failedResults.length > 0) {
    setError(`Một số vé không thể hủy: ${failedResults.map(r => r.message).join(', ')}`);
  } else {
    alert(`✅ Đã hủy ${successIds.length} vé thành công`);
  }
        } else if (result.successIds) {
          const successIds = result.successIds;
          setTickets((prev) =>
            prev.map((t) => (successIds.includes(t.id) ? { ...t, statusText: 'Huy' as const } : t))
          );
          setSelectedTickets(new Set());
          alert(`✅ Đã hủy ${successIds.length} vé thành công`);
        } else {
          // fallback
          setError('Kết quả hủy không đúng định dạng');
        }
      } else {
        // fallback: try cancel individually via cancelMany simulation
        const results: Array<{ id: string; success: boolean; message: string }> = [];
        for (const id of ids) {
          try {
            const res = await fetch(`${API_BASE_URL}/tickets/cancel`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ticketId: id }),
            });
            const data = await res.json();
            results.push({ id, success: res.ok, message: data.ThongBao || data.error || 'Ok' });
          } catch (err) {
            results.push({ id, success: false, message: err instanceof Error ? err.message : 'Failed' });
          }
        }
        const successIds = results.filter(r => r.success).map(r => r.id);
        const failedResults = results.filter(r => !r.success);
        setTickets((prev) =>
          prev.map((t) => (successIds.includes(t.id) ? { ...t, statusText: 'Huy' as const } : t))
        );
        setSelectedTickets(new Set());
        if (failedResults.length > 0) {
          setError(`Một số vé không thể hủy: ${failedResults.map(r => r.message).join(', ')}`);
        } else {
          alert(`✅ Đã hủy ${successIds.length} vé thành công`);
        }
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

  const selectAllVisibleUnpaid = (checked: boolean) => {
    if (checked) {
      const unpaidIds = visibleTickets
        .filter((t) => t.statusText === 'ChuaThanhToan')
        .map((t) => t.id);
      setSelectedTickets(new Set(unpaidIds));
    } else {
      setSelectedTickets(new Set());
    }
  };
  const handleViewDetail = async (ticket: Ticket) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const data = await ApiService.getTicketDetail(ticket.id);
      setDetailTicket(data[0] || ticket);
    } catch (err) {
      setDetailTicket(ticket);
      console.error('Error loading detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePayTicket = (ticket: Ticket) => {
    setPaymentTicket(ticket);
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async () => {
    if (!paymentTicket) return;

    try {
      setIsLoading(true);
      // Get transaction ID from ticket (assuming it's stored or can be fetched)
      const transactionId = `GD${paymentTicket.id.replace('VE', '')}`;

      const result = await ApiService.payTicket(transactionId, paymentMethod);

      setTickets((prev) =>
        prev.map((t) =>
          t.id === paymentTicket.id ? { ...t, statusText: 'DaDat' as const } : t
        )
      );

      setShowPaymentModal(false);
      setPaymentTicket(null);
      alert(`✅ ${result.ThongBao || 'Thanh toán thành công'}`);
      await loadTickets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Thanh toán thất bại');
    } finally {
      setIsLoading(false);
    }
  };
  // ============= COMPUTED VALUES =============
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

  const allVisibleUnpaidSelected = useMemo(() => {
    const unpaidVisible = visibleTickets.filter((t) => t.statusText === 'ChuaThanhToan');
    return (
      unpaidVisible.length > 0 &&
      unpaidVisible.every((t) => selectedTickets.has(t.id)) &&
      selectedTickets.size > 0
    );
  }, [visibleTickets, selectedTickets]);

  // ============= RENDER HELPERS =============
  const renderStatusBadge = (status: Ticket['statusText']) => {
    if (status === 'DaDat') return <span className="badge badge-paid">Đã đặt</span>;
    if (status === 'ChuaThanhToan') return <span className="badge badge-unpaid">Chưa TT</span>;
    return <span className="badge badge-cancel">Hủy</span>;
  };

  const formatCurrency = (n: number) =>
    n.toLocaleString('vi-VN') + ' đ';
  // ============= RENDER =============
  return (
    <div className="mt-root">
      {/* Header */}
      <header className="mt-header">
        <div className="mt-header-inner">
          <div className="mt-logo">🎟️</div>
          <h1 className="mt-title">QUẢN LÝ VÉ XEM PHIM</h1>
          <div className="mt-actions">
            <button className="btn btn-ghost" onClick={() => setActiveTab('tickets')}>Vé</button>
            <button className="btn btn-ghost" onClick={() => setActiveTab('stats')}>Thống kê</button>
            <button className="btn btn-primary" onClick={openBookingModal}>+ Đặt vé</button>
          </div>
        </div>
      </header>

      <main className="mt-container">
        {/* Search & Controls */}
        <div className="mt-toolbar">
          <input
            className="mt-search"
            placeholder="Tìm theo mã vé, phim, rạp, phòng, ghế, ngày, giờ, mã KM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="mt-toolbar-right">
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

        {/* Content */}
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
                    className={`mt-card ${selectedTickets.has(ticket.id) ? 'selected' : ''} ${ticket.statusText === 'Huy' ? 'muted' : ''}`}
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
                          {ticket.showDate} {ticket.startTime}
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
                        <button className="link" onClick={() => handleViewDetail(ticket)}>Chi tiết</button>
                        {ticket.statusText === 'ChuaThanhToan' && (
                          <button className="btn btn-sm" onClick={() => handlePayTicket(ticket)}>Thanh toán</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
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
              </div>
            )}
          </section>
        )}
      </main>
      {/* Booking Modal */}
      {showBookingModal && (
        <div className="mt-modal">
          <div className="mt-modal-backdrop" onClick={closeBookingModal}></div>
          <div className="mt-modal-panel">
            <div className="mt-modal-header">
              <h3>Đặt vé - Bước: {bookingStep}</h3>
              <button className="btn-icon" onClick={closeBookingModal}>✕</button>
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
                      <div className="booking-sub">{mv.ThoiLuong} phút • {mv.DaoDien}</div>
                    </div>
                  ))}
                </div>
              )}

              {bookingStep === 'showtime' && (
                <div className="booking-list">
                  {showtimes.map((st) => (
                    <div key={st.MaSuat} className="booking-item" onClick={() => handleShowtimeSelect(st)}>
                      <div className="booking-title">{st.NgayChieu} {st.GioChieu}</div>
                      <div className="booking-sub">Phòng: {st.TenPhong}</div>
                    </div>
                  ))}
                </div>
              )}

              {bookingStep === 'seat' && (
                <div>
                  <div className="seat-grid">
                    {seats.map((s) => (
                      <button
                        key={s.MaGhe}
                        className={`seat ${s.TinhTrang === 'Trống' ? 'seat-available' : s.TinhTrang === 'Chờ' ? 'seat-pending' : 'seat-taken'}`}
                        onClick={() => handleSeatSelect(s)}
                        disabled={s.TinhTrang !== 'Trống'}
                      >
                        {s.MaGhe}
                      </button>
                    ))}
                  </div>
                  <div className="seat-note">Ghế trống: click để chọn</div>
                </div>
              )}

              {bookingStep === 'confirm' && selectedSeat && (
                <div className="confirm-panel">
                  <div><strong>Rạp:</strong> {selectedTheater?.TenRap}</div>
                  <div><strong>Phim:</strong> {selectedMovie?.TenPhim}</div>
                  <div><strong>Suất:</strong> {selectedShowtime?.NgayChieu} {selectedShowtime?.GioChieu}</div>
                  <div><strong>Phòng / Ghế:</strong> {selectedRoomName} / {selectedSeat.MaGhe}</div>

                  <div className="promo-row">
                    <input placeholder="Mã khuyến mãi (nếu có)" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                    <button className="btn" onClick={handleCheckPromo}>Áp dụng</button>
                  </div>

                  <div className="price-row">
                    <div>Giá gốc: {formatCurrency(basePrice)}</div>
                    <div>Giảm: {promoDiscount}%</div>
                    <div className="final-price">Tổng: {formatCurrency(finalPrice)}</div>
                  </div>

                  <div className="confirm-actions">
                    <button className="btn btn-outline" onClick={() => setBookingStep('seat')}>Quay lại</button>
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
              <button className="btn-icon" onClick={() => setShowDetailModal(false)}>✕</button>
            </div>
            <div className="mt-modal-body">
              {detailLoading ? (
                <div>Đang tải...</div>
              ) : detailTicket ? (
                <div className="detail-grid">
                  <div><b>Mã vé:</b> {detailTicket.MaVe ?? detailTicket.id}</div>
                  <div><b>Phim:</b> {detailTicket.TenPhim ?? detailTicket.movieName}</div>
                  <div><b>Rạp:</b> {detailTicket.TenRap ?? detailTicket.theater}</div>
                  <div><b>Phòng:</b> {detailTicket.TenPhong ?? detailTicket.room}</div>
                  <div><b>Ghế:</b> {detailTicket.MaGhe ?? detailTicket.seat}</div>
                  <div><b>Loại ghế:</b> {detailTicket.LoaiGhe ?? '-'}</div>
                  <div><b>Ngày chiếu:</b> {detailTicket.NgayChieu ?? detailTicket.showDate}</div>
                  <div><b>Giờ chiếu:</b> {detailTicket.GioChieu ?? detailTicket.startTime}</div>
                  <div><b>Trạng thái:</b> {detailTicket.TrangThai ?? detailTicket.statusText}</div>
                  <div><b>Giá vé:</b> {detailTicket.GiaVe ? `${detailTicket.GiaVe.toLocaleString('vi-VN')} đ` : formatCurrency(detailTicket.price ?? 0)}</div>
                  <div><b>Mã KM:</b> {detailTicket.MaKM ?? detailTicket.promoCode ?? '-'}</div>
                  <div><b>Phương thức TT:</b> {detailTicket.PhuongThucTT ?? '-'}</div>
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
              <button className="btn-icon" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div className="mt-modal-body">
              <div className="payment-summary">
                <div><strong>Phim:</strong> {paymentTicket.movieName}</div>
                <div><strong>Ghế:</strong> {paymentTicket.seat}</div>
                <div className="pay-amount"><strong>Số tiền:</strong> {formatCurrency(paymentTicket.price)}</div>
              </div>

              <label className="label">Chọn phương thức</label>
              <select className="mt-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
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

    </div>
  );
};

export default MovieTicketSystem;
