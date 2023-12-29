const lodash = require("lodash");
const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0);
};

const favoriteBlog = (blogs) => {
  return blogs.reduce((max, blog) => (blog.likes > max.likes ? blog : max));
};

const mostBlogs = (blogs) => {
  const blogsCopy = lodash.cloneDeep(blogs);
  const result = blogsCopy.reduce(
    (acc, blog) => {
      acc.countByAuthor[blog.author] =
        (acc.countByAuthor[blog.author] || 0) + 1;
      acc.maxAuthor = acc.maxAuthor > blog.author ? acc.maxAuthor : blog.author;
      return acc;
    },
    { countByAuthor: {}, maxAuthor: "" }
  );
  return { [result.maxAuthor]: result.countByAuthor[result.maxAuthor] };
};
const mostLikes = (blogs) => {
  const blogsCopy = lodash.cloneDeep(blogs);
  const result = blogsCopy.reduce(
    (acc, blog) => {
      acc.likesByAuthor[blog.author] =
        (acc.likesByAuthor[blog.author] || 0) + blog.likes;
      acc.maxAuthor =
        acc.maxAuthor > acc.likesByAuthor[blog.author]
          ? acc.maxAuthor
          : { [blog.author]: acc.likesByAuthor[blog.author] };
      return acc;
    },
    { likesByAuthor: {}, maxAuthor: "" }
  );
  console.log(result);
  return { [result.maxAuthor]: result.likesByAuthor[result.maxAuthor] };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
