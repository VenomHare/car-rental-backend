import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRouter from "./routers/auth.router";
import bookingRouter from "./routers/booking.router";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/bookings", bookingRouter)

app.listen(3000, () => {
    console.log("App running on port 3000");
});

