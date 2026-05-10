const userSelect = {
  id: true,
  email: true,
  phone: true,
  fullName: true,
  role: true,
  status: true,
  lockReason: true,
  avatarUrl: true,
  verificationStatus: true,
  createdAt: true,
  updatedAt: true
};

const roomInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  landlord: { select: userSelect },
  posts: { where: { status: "APPROVED" }, orderBy: { publishedAt: "desc" }, take: 1 },
  _count: { select: { favorites: true, reviews: true } }
};

const postInclude = {
  room: { include: { images: { orderBy: { sortOrder: "asc" } } } },
  landlord: { select: userSelect },
  _count: { select: { reports: true, threads: true } }
};

module.exports = {
  userSelect,
  roomInclude,
  postInclude
};
