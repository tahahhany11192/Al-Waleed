/*
  Hayroo API server
  - Upload folders are created automatically on server startup.
  - Public shop routes stay readable by guests.
  - Admin write/read management APIs are protected by JWT + admin role middleware.
*/

const express = require("express");
const app = express();
require("dotenv").config();
const mongoose = require("mongoose");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");

let helmet = null;
let rateLimit = null;
try {
  helmet = require("helmet");
} catch (err) {
  console.warn("helmet is not installed. Run npm install in the server folder to enable security headers.");
}
try {
  rateLimit = require("express-rate-limit");
} catch (err) {
  console.warn("express-rate-limit is not installed. Run npm install in the server folder to enable rate limiting.");
}

// Import Router
const authRouter = require("./routes/auth");
const categoryRouter = require("./routes/categories");
const productRouter = require("./routes/products");
//const brainTreeRouter = require("./routes/braintree");
const orderRouter = require("./routes/orders");
const usersRouter = require("./routes/users");
const customizeRouter = require("./routes/customize");
const CreateAllFolder = require("./config/uploadFolderCreateScript");

CreateAllFolder();

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    console.log("==============Mongodb Database Connected Successfully==============")
  )
  .catch((err) => {
    console.error("Database Not Connected !!!", err.message);
    process.exit(1);
  });

app.disable("x-powered-by");
if (helmet) {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
}

if (rateLimit) {
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: "Too many requests, please try again later" },
    })
  );
}

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(morgan("dev"));
app.use(cookieParser());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(express.json({ limit: "1mb" }));

app.use("/api", authRouter);
app.use("/api/user", usersRouter);
app.use("/api/category", categoryRouter);
app.use("/api/product", productRouter);
//app.use("/api", brainTreeRouter);
app.use("/api/order", orderRouter);
app.use("/api/customize", customizeRouter);

app.use((req, res) => {
  res.status(404).json({ error: "API route not found" });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on 0.0.0.0:${PORT}`);
});
