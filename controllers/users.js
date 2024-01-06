const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const User = require("../models/user");
const userValidator = require("../validators/users");
const { validationResult } = require("express-validator");

usersRouter.post(
  "/users",
  userValidator.registerValidator,
  async (request, response) => {
    const { username, name, password } = request.body;
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(422).json({ error: errors.errors[0].msg });
    }
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const user = new User({
      username,
      name,
      passwordHash,
    });
    const savedUser = await user.save();
    response.status(201).json(savedUser);
  }
);

usersRouter.get("/users", async (request, response) => {
  const users = await User.find({});
  response.json(users);
});
module.exports = usersRouter;
