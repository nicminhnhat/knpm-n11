import roomImage1 from "../assets/anh-tro-1.jpg";
import roomImage2 from "../assets/anh-tro-2.jpg";
import roomImage3 from "../assets/anh-tro-3.jpg";

export const mainNavigation = [
  { label: "Trang chủ", to: "/" },
  { label: "Về chúng tôi", to: "/about" },
  { label: "Danh sách phòng", to: "/rooms" },
  { label: "Hướng dẫn sử dụng", to: "/rent" },
  { label: "Liên hệ", to: "/contact" }
];

export const quickLinks = [
  { label: "Đăng nhập", to: "/login" },
  { label: "Đăng ký", to: "/register" },
  { label: "Hướng dẫn sử dụng", to: "/rent" }
];

export const homeFeatures = [
  {
    icon: "spark",
    title: "Thông tin đầy đủ",
    description: "Hiển thị rõ vị trí, giá thuê, diện tích, tiện nghi và hình ảnh thực tế của từng phòng."
  },
  {
    icon: "handshake",
    title: "Kết nối trực tiếp",
    description: "Rút ngắn thời gian trao đổi giữa sinh viên và chủ trọ, giảm bớt các bước trung gian."
  },
  {
    icon: "search",
    title: "Tìm kiếm nhanh",
    description: "Lọc phòng theo khu vực, mức giá, diện tích và tiện nghi để ra quyết định sớm hơn."
  },
  {
    icon: "shield",
    title: "Minh bạch hơn",
    description: "Mỗi tin đăng hiển thị rõ thông tin quan trọng để bạn dễ so sánh và chọn phòng phù hợp."
  }
];

export const siteStats = [
  { value: "200+", label: "Tin đăng đang hiển thị" },
  { value: "24h", label: "Thời gian phản hồi trung bình" },
  { value: "93%", label: "Người dùng quay lại tìm phòng" }
];

export const rooms = [
  {
    id: "room-1",
    title: "Phòng khép kín gần Đại học Khoa học",
    address: "Đường Nguyễn Huệ, TP. Huế",
    area: 25,
    areaLabel: "25 m²",
    price: 1500000,
    priceLabel: "1.500.000 đ/tháng",
    category: "Phòng riêng",
    image: roomImage1,
    amenities: ["wifi", "parking", "security"]
  },
  {
    id: "room-2",
    title: "Trọ chung chủ, an ninh tốt tại KQH Kiểm Huệ",
    address: "Khu quy hoạch Kiểm Huệ, TP. Huế",
    area: 20,
    areaLabel: "20 m²",
    price: 1200000,
    priceLabel: "1.200.000 đ/tháng",
    category: "Ở ghép",
    image: roomImage3,
    amenities: ["wifi", "security", "no-curfew"]
  },
  {
    id: "room-3",
    title: "Căn hộ mini full nội thất ngay trung tâm",
    address: "Đường Bà Triệu, TP. Huế",
    area: 35,
    areaLabel: "35 m²",
    price: 3000000,
    priceLabel: "3.000.000 đ/tháng",
    category: "Studio",
    image: roomImage2,
    amenities: ["wifi", "aircon", "fridge", "washing-machine", "parking"]
  },
  {
    id: "room-4",
    title: "Phòng giá mềm cho sinh viên năm nhất",
    address: "Đường Hùng Vương, TP. Huế",
    area: 18,
    areaLabel: "18 m²",
    price: 1000000,
    priceLabel: "1.000.000 đ/tháng",
    category: "Tiết kiệm",
    image: roomImage3,
    amenities: ["parking", "wifi"]
  },
  {
    id: "room-5",
    title: "Phòng mới sửa gần Đại học Sư phạm",
    address: "Đường Lê Lợi, TP. Huế",
    area: 22,
    areaLabel: "22 m²",
    price: 1800000,
    priceLabel: "1.800.000 đ/tháng",
    category: "Phòng riêng",
    image: roomImage2,
    amenities: ["aircon", "wifi", "parking", "security"]
  },
  {
    id: "room-6",
    title: "Studio yên tĩnh phù hợp học tập dài hạn",
    address: "Phường An Cựu, TP. Huế",
    area: 28,
    areaLabel: "28 m²",
    price: 2400000,
    priceLabel: "2.400.000 đ/tháng",
    category: "Studio",
    image: roomImage1,
    amenities: ["aircon", "wifi", "fridge", "no-curfew"]
  }
];

export const amenityOptions = [
  { value: "aircon", label: "Điều hòa" },
  { value: "parking", label: "Bãi gửi xe" },
  { value: "fridge", label: "Tủ lạnh" },
  { value: "washing-machine", label: "Máy giặt" },
  { value: "wifi", label: "Wifi tốc độ cao" },
  { value: "no-curfew", label: "Giờ giấc tự do" },
  { value: "security", label: "Camera an ninh" }
];

export const aboutValues = [
  {
    title: "Thực tế trước, hoa mỹ sau",
    description: "Trang hiển thị thông tin quan trọng trước tiên để sinh viên đánh giá nhanh mức độ phù hợp."
  },
  {
    title: "Thiết kế để dễ hành động",
    description: "Từ danh sách phòng đến form đăng tin đều được tối ưu để giảm bớt thao tác rườm rà."
  },
  {
    title: "Tăng độ tin cậy hai chiều",
    description: "Sinh viên dễ lọc nhu cầu, còn chủ trọ dễ tiếp cận đúng nhóm người thuê."
  }
];

export const rentBenefits = [
  "Điền thông tin theo từng bước rõ ràng để hạn chế thiếu sót khi đăng tin.",
  "Phòng có hình ảnh đẹp và thông tin đầy đủ sẽ dễ được sinh viên quan tâm hơn.",
  "Nội dung đăng tin nhất quán giúp người thuê so sánh nhanh và quyết định dễ hơn."
];

export const contactCards = [
  {
    icon: "phone",
    title: "Gọi trực tiếp",
    content: "0123 456 789",
    href: "tel:0123456789"
  },
  {
    icon: "mail",
    title: "Email hỗ trợ",
    content: "hello@trosinhvienhue.vn",
    href: "mailto:hello@trosinhvienhue.vn"
  },
  {
    icon: "map",
    title: "Văn phòng",
    content: "54 Nguyễn Huệ, TP. Huế",
    href: "https://maps.google.com"
  }
];
