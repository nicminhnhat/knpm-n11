const postService = require("../services/post.service");
const { ok, fail, pageInfo, clean } = require("../utils/helpers");

class PostController {
  async getPosts(req, res) {
    const { page, limit, skip, take } = pageInfo(req.query);
    const q = clean(req.query.q || req.query.keyword || req.query.search);
    const and = [{ status: "APPROVED" }, { room: { status: "AVAILABLE" } }];
    if (q) {
      and.push({ OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { room: { title: { contains: q, mode: "insensitive" } } },
        { room: { address: { contains: q, mode: "insensitive" } } }
      ] });
    }
    const where = { AND: and };
    const { posts, total } = await postService.getPublicPosts(where, skip, take);
    return ok(res, { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  }

  async getPostById(req, res) {
    const post = await postService.getPublicPostById(req.params.id);
    if (!post) return fail(res, 404, "Tin đăng không còn tồn tại hoặc đã bị gỡ.");
    return ok(res, { post });
  }
}

module.exports = new PostController();
