import { Request, Response } from "express";

import LogModel from "../models/logs";
export async function queryLogsByDate(req: Request, res: Response) {
  try {
    // Define the date for October 17, 2023
    const startDate = new Date("2023-10-17T00:00:00.000Z"); // Start of the day
    const endDate = new Date("2023-10-17T23:59:59.999Z"); // End of the day

    // Query the logs within the date range
    const logs = await LogModel.find({
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    }).exec();

    res.status(200).json(logs);

    // Process and return the logs
    return logs;
  } catch (error) {
    console.log(error);
    //   logger.error(`Error querying logs: ${error}`);
    //   throw error;
  }
}
