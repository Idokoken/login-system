const express = require("express");
const { promisify } = require("util");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
require("dotenv").config();

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

exports.isLoggedIn = async (req, res, next) => {
  //req.message = "inside middleware";
  console.log(req.cookies);
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      console.log(decoded);

      connection.query(
        "SELECT * FROM USERS WHERE id  = ?",
        [decoded.id],
        (error, result) => {
          console.log(result);

          if (!result) {
            return next();
          }

          req.user = result[0];
          console.log("this is user");
          console.log(req.user);
          return next();
        }
      );
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};

exports.isLoggedout = async (req, res) => {
  res.cookie("jwt", "logout", {
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });
  res.status(200).redirect("/");
};
