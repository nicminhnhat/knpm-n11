const prisma = require("../lib/prisma");
const { postInclude } = require("../utils/constants");

class PostService {
  async getPublicPosts(where, skip, take) {
    const [posts, total] = await Promise.all([
      prisma.post.findMany({ where, include: postInclude, orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }], skip, take }),
      prisma.post.count({ where })
    ]);
    return { posts, total };
  }

  async getPublicPostById(id) {
    return prisma.post.findFirst({
      where: { id, status: "APPROVED", room: { status: "AVAILABLE" } },
      include: postInclude
    });
  }
}

module.exports = new PostService();
