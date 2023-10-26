import { createLogger, format, transports } from "winston";
import {
  MongoDBTransportInstance,
  MongoDBConnectionOptions,
} from "winston-mongodb";
const {
  MongoDB,
}: { MongoDB: MongoDBTransportInstance } = require("winston-mongodb");

require("dotenv").config();

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console(), // Log to the console
    new transports.File({ filename: "logs/error.log", level: "error" }), // Log all errors to a file
    new transports.File({ filename: "logs/combined.log" }), // Log all levels to another file
    new MongoDB({
      level: "info", // Log level for this transport
      db: process.env.MONGO_CONNECTION_URL || "", // MongoDB connection URL
      collection: "mobile-eats-logs", // Collection name for log entries
      options: {
        useUnifiedTopology: true, // Use the new MongoDB driver
      },
      storeHost: true, //store os.hostName() value
    } as MongoDBConnectionOptions),
  ],
});

export default logger;
