const express = require("express");
const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { isLoggedIn, isLoggedout } = require("../middleware/middleware");
require("dotenv").config();

const authRouter = express.Router();

// database setup
const connection = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DATABASE_PORT,
});
connection.connect(function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log("connected to mysql");
  }
});

authRouter
  .route("/register")
  .get((req, res) => {
    res.render("register");
  })
  .post((req, res) => {
    const { name, email, password, confirmpassword } = req.body;
    try {
      if (!name || !email || !password || !confirmpassword) {
        res.render("register", { message: "all fields are required" });
      }

      connection.query(
        "SELECT email FROM users WHERE email = ?",
        [email],
        async (err, result) => {
          if (err) {
            console.log(err);
          }
          if (result.length > 0) {
            return res.render("register", { message: "email already in use" });
          }
          if (password != confirmpassword) {
            return res.render("register", { message: "password do not match" });
          }

          // Store hash in your password DB.
          let salt = bcrypt.genSaltSync(10);
          let hashedPassword = await bcrypt.hashSync(password, salt);
          //console.log(hashedPassword);

          //const users = { name, email, password: hashedPassword };
          connection.query(
            "INSERT INTO users SET ?",
            { name, email, password: hashedPassword },
            function (error, results) {
              if (error) {
                console.log(error);
              }
              console.log(results);
              return res.render("login", {
                message: "user registered succsessfully",
              });
            }
          );
        }
      );
    } catch (error) {
      res.render("register", { message: "error registering user" });
    }
  });

// login users
authRouter
  .route("/login")
  .get((req, res) => {
    res.render("login");
  })
  .post(async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    try {
      await connection.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (error, results) => {
          if (
            !results ||
            !(await bcrypt.compare(password, results[0].password))
          ) {
            return res.render("login", {
              messsage: "Invalid email or password",
            });
          }
          const token = jwt.sign(
            { id: results[0].id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
          );
          console.log("token is " + token);

          const cookieOptions = {
            expires: new Date(
              Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
          };
          res.cookie("jwt", token, cookieOptions);

          res.redirect("/");
        }
      );
    } catch (error) {
      res.render("login", { message: "error logining user" });
    }
  });

//logout users
authRouter.get("/logout", isLoggedout);

authRouter.get("/profile", isLoggedIn, (req, res) => {
  //console.log(req.message);
  if (req.user) {
    res.render("profile", { user: req.user });
  } else {
    res.redirect("/auth/login");
  }
});

module.exports = authRouter;
