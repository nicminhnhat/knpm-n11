import { useEffect, useMemo, useState } from "react";
import PageIntro from "../components/PageIntro.jsx";
import RoomCard from "../components/RoomCard.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { apiRequest } from "../lib/api.js";

const AMENITIES = [
  { label: "Wifi", value: "wifi" },
  { label: "Chỗ để xe", value: "parking" },
  { label: "WC riêng", value: "private-bathroom" },
  { label: "Máy lạnh", value: "air-conditioner" },
  { label: "Nội thất", value: "furniture" },
  { label: "Không chung chủ", value: "no-owner" }
];

function RoomsPage() {
  const [filters, setFilters] = useState({ q: "", minPrice: "", maxPrice: "", district: "", type: "", amenities: [] });
  const [rooms, setRooms] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length) params.set(key, value.join(","));
      } else if (value) {
        params.set(key, value);
      }
    });
    return params.toString();
  }, [filters]);

  async function loadRooms() {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await apiRequest(`/api/rooms${queryString ? `?${queryString}` : ""}`);
      setRooms(response.rooms || []);
      setPagination(response.pagination || null);
    } catch (error) {
      setErrorMessage(error.message || "Không tải được danh sách phòng trọ.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRooms();
  }, [queryString]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleAmenity(value) {
    setFilters((current) => ({
      ...current,
      amenities: current.amenities.includes(value)
        ? current.amenities.filter((item) => item !== value)
        : [...current.amenities, value]
    }));
  }

  return (
    <>
      <PageIntro
        aside={<p>Danh sách phòng trọ được cập nhật từ hệ thống dữ liệu.</p>}
        description="Tìm kiếm phòng trọ theo từ khóa, khu vực, giá thuê, loại phòng và tiện ích. Chỉ các bài đăng đã được admin duyệt mới hiển thị công khai."
        eyebrow="Danh sách phòng"
        title="Tìm phòng trọ phù hợp với nhu cầu của bạn."
      />

      <section className="section-space pt-4">
        <div className="shell space-y-8">
          <div className="panel p-6 sm:p-8">
            <div className="grid gap-4 lg:grid-cols-5">
              <input className="input-shell lg:col-span-2" placeholder="Tìm đường, khu vực, trường học..." value={filters.q} onChange={(e) => updateFilter("q", e.target.value)} />
              <input className="input-shell" placeholder="Giá từ" type="number" value={filters.minPrice} onChange={(e) => updateFilter("minPrice", e.target.value)} />
              <input className="input-shell" placeholder="Giá đến" type="number" value={filters.maxPrice} onChange={(e) => updateFilter("maxPrice", e.target.value)} />
              <input className="input-shell" placeholder="Khu vực" value={filters.district} onChange={(e) => updateFilter("district", e.target.value)} />
              <select className="input-shell" value={filters.type} onChange={(e) => updateFilter("type", e.target.value)}>
                <option value="">Tất cả loại phòng</option>
                <option value="SINGLE">Phòng đơn</option>
                <option value="SHARED">Ở ghép</option>
                <option value="DORM">Ký túc xá</option>
                <option value="APARTMENT">Căn hộ</option>
                <option value="OTHER">Khác</option>
              </select>
              <button className="button-secondary" type="button" onClick={() => setFilters({ q: "", minPrice: "", maxPrice: "", district: "", type: "", amenities: [] })}>
                Xóa bộ lọc
              </button>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {AMENITIES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => toggleAmenity(item.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${filters.amenities.includes(item.value) ? "border-[color:var(--brand)] bg-orange-50 text-[color:var(--brand)]" : "border-[color:var(--line)] bg-white text-[color:var(--muted)]"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <SectionHeader
            eyebrow="Kết quả"
            title={isLoading ? "Đang tải phòng trọ..." : `${pagination?.total ?? rooms.length} phòng đang hiển thị`}
            description="Danh sách hiển thị các phòng đang được công khai trên hệ thống."
          />

          {errorMessage ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div> : null}

          {!isLoading && !errorMessage && rooms.length === 0 ? (
            <div className="panel-soft p-8 text-center">
              <h3 className="text-xl font-bold text-[color:var(--ink)]">Không tìm thấy phòng phù hợp</h3>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">Thử đổi từ khóa, giá hoặc bỏ bớt tiện ích để xem thêm kết quả.</p>
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
          </div>
        </div>
      </section>
    </>
  );
}

export default RoomsPage;
