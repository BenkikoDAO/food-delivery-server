import express from "express"
import morgan from "morgan"
import bodyParser from "body-parser";
import dotenv from 'dotenv';
import helmet from 'helmet'
import cors from 'cors';
import { connectDB } from "./config/db.js"
import customerRoute from './routes/customerRoute.js'

const app = express();
const PORT = process.env.PORT || 5500
dotenv.config()
// Middleware setup
app.use(morgan('combined'));
connectDB()
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(helmet())
import session from "express-session";
import MongoStore from "connect-mongo";

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_CONNECTION_URL}),
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true, // Ensures cookie is not accessible via client-side JavaScript
        maxAge: 1000 * 60 * 60 * 24, // cookie will expire after 1 day (in milliseconds)
    },
  }));

  app.use("/auth", customerRoute)


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
