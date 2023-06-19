import express from "express"
import morgan from "morgan"
import bodyParser from "body-parser";
import dotenv from 'dotenv';
import helmet from 'helmet'
import cors from 'cors';
import session from "express-session";
import MongoStore from "connect-mongo";
import { connectDB } from "./config/db.js"
import customerRoute from './routes/customerRoute.js'
import vendorRoute from './routes/vendorRoute.js'
import menuRoute from './routes/menuRoute.js'
import orderRoute from './routes/orderRoute.js'

const app = express();
const PORT = process.env.PORT || 5000
dotenv.config()
// Middleware setup
app.use(morgan('dev'));
connectDB()
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(helmet())

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_CONNECTION_URL, collectionName: "food-delivery-sessions"}),
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true, // Ensures cookie is not accessible via client-side JavaScript
        maxAge: 1000 * 60 * 60 * 24, // cookie will expire after 1 day (in milliseconds)
    },
  }));

  app.use("/api/v1/customer-auth", customerRoute)
  app.use("/api/v1/vendor-auth", vendorRoute)
  app.use("/api/v1/menu", menuRoute)
  app.use("/api/v1/order", orderRoute)

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
