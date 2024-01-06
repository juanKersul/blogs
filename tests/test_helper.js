const User = require("../models/user");
const Blog = require("../models/blogs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const config = require("../utils/config");
const initialBlogs = [
  {
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
  },
  {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
  },
  {
    title: "Canonical string reduction",
    author: "Edsger W. Dijkstra",
    url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    likes: 12,
  },
  {
    title: "First class tests",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    likes: 10,
  },
  {
    title: "TDD harms architecture",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
    likes: 0,
  },
  {
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    likes: 2,
  },
];
const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

const generateToken = async () => {
  const rootUser = await User.findOne({ username: "root" });
  const userForToken = {
    username: rootUser.username,
    id: rootUser._id,
  };
  const token = jwt.sign(userForToken, config.SECRET);
  return token;
};

const createRootUser = async () => {
  await User.deleteMany({});
  const passwordHash = await bcrypt.hash("sekret", 10);
  const user = { username: "root", password: passwordHash, name: "Superuser" };
  return new User(user).save();
};

const createInitialBlogs = async (user) => {
  await Blog.deleteMany({});
  const blogObjects = initialBlogs.map(
    (blog) => new Blog({ ...blog, user: user._id })
  );
  const promiseArray = blogObjects.map((blog) => blog.save());
  user.blogs = blogObjects.map((blog) => blog._id);
  await user.save();
  return Promise.all(promiseArray);
};

module.exports = {
  initialBlogs,
  usersInDb,
  generateToken,
  createRootUser,
  createInitialBlogs,
};
