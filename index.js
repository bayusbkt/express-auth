import express from "express";
import dotenv from "dotenv";
import router from "./routes/api.js";
import cookieParser from "cookie-parser";
import cors from 'cors';
import { connection }  from "./database/config.js";

dotenv.config();
const app = express();
const port = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use(cookieParser());
app.use(express.json());
app.use(cors({
    credentials: true,
    origin: "http://localhost:5173"
}))

app.use(router);

connection();
app.listen(port, () => {
  console.log(`App Running in http://localhost:${port}`);
});
