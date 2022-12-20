const express = require("express");
const morgan = require("morgan");
const path = require("path");
const chalk = require("chalk");
const cors = require("cors");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
// const session = require("express-session");
const mysql = require("mysql");
const { engine } = require("express-handlebars");
const authRouter = require("./routes/authRouter");
const { isLoggedIn } = require("./middleware/middleware");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8088;

// views setup
// app.set("view engine", "hbs");
// app.set("views", "views");
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

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

//middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(
//   session({
//     secret: "secret",
//     saveUninitialized: true,
//     resave: true,
//     // cookie: { maxAge: 60000 },
//   })
// );
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/css",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/css"))
);
app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"))
);
app.use(flash());
app.use(function (req, res, next) {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

//views setup
app.get("/", isLoggedIn, (req, res) => {
  res.render("home", { user: req.user });
  console.log("hello ella");
});
app.use("/auth", authRouter);

app.listen(port, () => console.log(`${chalk.cyan("listening on port 8088")}`));
