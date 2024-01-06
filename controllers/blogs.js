const blogsRouter = require("express").Router();
const Blog = require("../models/blogs");
const middleware = require("../utils/middleware");

blogsRouter.get("/blogs", async (request, response) => {
  const blogs = await Blog.find({}).populate("user");
  response.json(blogs);
});

blogsRouter.post(
  "/blogs",
  middleware.userExtractor,
  async (request, response) => {
    const user = request.user;
    const { title, author, url, likes } = request.body;
    const blog = new Blog({
      title,
      author,
      url,
      likes,
      user: user._id,
    });
    await blog.save();
    user.blogs = user.blogs.concat(blog._id);
    await user.save();
    response.status(201).json(blog);
  }
);

blogsRouter.delete(
  "/blogs/:id",
  middleware.userExtractor,
  async (request, response) => {
    if (!request.user.blogs.includes(request.params.id)) {
      console.log(request.user.blogs);
      return response.status(401).json({ error: "unauthorized" });
    }
    const index = request.user.blogs.indexOf(request.params.id);
    request.user.blogs.splice(index, 1);
    await request.user.save();
    await Blog.findByIdAndDelete(request.params.id);
    response.status(204).end();
  }
);

blogsRouter.put(
  "/blogs/:id",
  middleware.userExtractor,
  async (request, response) => {
    const res = await Blog.findByIdAndUpdate(request.params.id, request.body);
    response.status(200).json(res);
  }
);

module.exports = blogsRouter;
