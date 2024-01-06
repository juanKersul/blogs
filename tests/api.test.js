const mongoose = require("mongoose");
const supertest = require("supertest");
const helper = require("./test_helper");
const app = require("../app");
const api = supertest(app);
const bcrypt = require("bcrypt");
const Blog = require("../models/blogs");
const User = require("../models/user");
const { forEach } = require("lodash");

beforeEach(async () => {
  const user = await helper.createRootUser();
  await helper.createInitialBlogs(user);
});
describe("when there is initially some blogs saved", () => {
  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("all blogs are returned", async () => {
    const response = await api.get("/api/blogs");
    expect(response.body).toHaveLength(helper.initialBlogs.length);
  });
});

describe("unique identifier propety of the blog posts is named id", () => {
  test("id is defined", async () => {
    const response = await api.get("/api/blogs");
    forEach(response.body, (blog) => {
      expect(blog.id).toBeDefined();
    });
  });
});

describe("addition of a new blog", () => {
  test("a valid blog can be added", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "John Doe",
      url: "https://example.com",
      likes: 10,
    };
    const initialBlogs = helper.initialBlogs;
    const RootToken = await helper.generateToken();
    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${RootToken}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);
    const updatedBlogs = await Blog.find({});
    expect(updatedBlogs).toHaveLength(initialBlogs.length + 1);
    const blog = updatedBlogs[updatedBlogs.length - 1];
    expect(blog.title).toBe(newBlog.title);
    expect(blog.author).toBe(newBlog.author);
    expect(blog.url).toBe(newBlog.url);
    expect(blog.likes).toBe(newBlog.likes);
  });
});

describe("missing likes property from the request", () => {
  test("default likes to 0", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "John Doe",
      url: "https://example.com",
    };
    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${await helper.generateToken()}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);
    const updatedBlogs = await Blog.find({});
    const blog = updatedBlogs[updatedBlogs.length - 1];
    expect(blog.likes).toBe(0);
  });
});

describe("missing title  property from the request", () => {
  test("respond with 400", async () => {
    const newBlog = {
      author: "John Doe",
      url: "https://example.com",
      likes: 10,
    };
    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${await helper.generateToken()}`)
      .send(newBlog)
      .expect(400);
  });
});

describe("missing author  property from the request", () => {
  test("respond with 400", async () => {
    const newBlog = {
      title: "Test Blog",
      url: "https://example.com",
      likes: 10,
    };
    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${await helper.generateToken()}`)
      .send(newBlog)
      .expect(400);
  });
});

describe("delete a blog", () => {
  test("delete a blog", async () => {
    const initialBlogs = await Blog.find({});
    const blogToDelete = initialBlogs[0].toJSON();
    const user = await User.findOne({ _id: blogToDelete.user });
    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${await helper.generateToken()}`)
      .send()
      .expect(204);
    const updatedBlogs = await Blog.find({});
    expect(updatedBlogs).toHaveLength(initialBlogs.length - 1);
    const titles = updatedBlogs.map((blog) => blog.title);
    expect(titles).not.toContain(blogToDelete.title);
  });
});

describe("update a blog", () => {
  test("update a blog", async () => {
    const initialBlogs = await Blog.find({});
    const blogToUpdate = initialBlogs[0].toJSON();
    const newBlog = { ...blogToUpdate, likes: 100 };
    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set("Authorization", `Bearer ${await helper.generateToken()}`)
      .send(newBlog)
      .expect(200);
    const updatedBlog = await Blog.findById(blogToUpdate.id);
    expect(updatedBlog.likes).toBe(100);
  });
});

describe("when there is initially one user at db", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({ username: "root", passwordHash });
    await user.save();
  });
  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await helper.usersInDb();
    const newUser = {
      username: "mluukkai",
      name: "Matti Luukkainen",
      password: "salainen",
    };
    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);
    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);
    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames).toContain(newUser.username);
  });

  test("creation fails with proper statuscode and message if username already taken", async () => {
    const usersAtStart = await helper.usersInDb();
    const newUser = {
      username: "root",
      name: "Superuser",
      password: "salainen",
    };
    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);
    expect(result.body.error).toContain("expected `username` to be unique");
    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });
});

describe("get all users when 2 are stored in db", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({ username: "root", passwordHash });
    await user.save();
    const passwordHash2 = await bcrypt.hash("sekret2", 10);
    const user2 = new User({ username: "root2", passwordHash2 });
    await user2.save();
  });
  test("get all users", async () => {
    const users = await helper.usersInDb();
    const response = await api.get("/api/users");
    expect(response.body).toHaveLength(users.length);
  });
});

describe("create a new user with bad username or password lenght", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });
  test("create a new user with bad username", async () => {
    const newUser = {
      username: "ro",
      name: "Superuser",
      password: "salainen",
    };
    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(422)
      .expect("Content-Type", /application\/json/);
    expect(result.body.error).toContain(
      "Username must be at least 3 characters long"
    );
  });
  test("create a new user with bad password", async () => {
    const newUser = {
      username: "root",
      name: "Superuser",
      password: "sa",
    };
    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(422)
      .expect("Content-Type", /application\/json/);
    expect(result.body.error).toContain(
      "Password must be at least 3 characters long"
    );
  });
});
afterAll(async () => {
  await mongoose.connection.close();
});
