const express = require("express");
const cors = require("cors");
const cartsRouter = require("./routes/carts");
const ordersRouter = require("./routes/orders");
const internalRouter = require("./routes/internal");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "ordering-service",
    message: "Ordering service is running",
    endpoints: {
      health: "/health",
      carts: "/api/v1/carts",
      orders: "/api/v1/orders",
      internal: "/api/v1/internal",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    service: "ordering-service",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/carts", cartsRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/internal", internalRouter);

app.use(errorHandler);

module.exports = app;
