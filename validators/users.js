const { body } = require("express-validator");

const registerValidator = [
  body("username").notEmpty().withMessage("Username is required"),
  body("username")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long"),
  body("password").notEmpty().withMessage("Password is required"),
  body("password")
    .isLength({ min: 3 })
    .withMessage("Password must be at least 3 characters long"),
];
exports.registerValidator = registerValidator;
