import { Request, Response } from "express";
import Payment from "../models/payments";
import logger from "../helpers/logging";

export async function handleCallback(req: Request, res: Response) {
  try {
    // Save the response data to your database (all responses, regardless of success)
    const paymentResponse = new Payment({
      data: req.body,
      timestamp: new Date(),
    });

    await paymentResponse.save();

    logger.info(`Payment response sent - ${paymentResponse.data.Message}`);

    // Respond with the saved payment response data
    res
      .status(200)
      .json({ message: "Callback response received", paymentResponse });
  } catch (error) {
    // Handle errors and send an appropriate response
    logger.error("Error occured while handling callback: ", error);
    res
      .status(500)
      .json({ message: "An error occurred while handling callback" });
  }
}

export async function getCallbackResponse(req: Request, res: Response) {
  try {
    const { transactionRef } = req.body;

    const response = await Payment.findOne({
      "data.transaction_reference": transactionRef,
    });

    if (!response) {
      logger.error(`No record found for transactionRef: ${transactionRef}`);
      return res
        .status(404)
        .json({ message: "No record found for transactionRef" });
    }
    const success = response.data.Success;
    res.status(200).json({ success });
    //   }
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ message: "An error occurred when fetching your response" });
  }
}

export async function getPayoutResponse(req: Request, res: Response) {
  try {
    const { payoutRef, transactionType, vendorId, riderId } = req.body;

    const response = await Payment.findOne({
      "data.payout_reference": payoutRef,
    });
    if (!response) {
      logger.error(`No record found for payoutRef: ${payoutRef}`);
      return res.status(404).json({ message: "No record found for payoutRef" });
    }
    response.transactionType = transactionType;
    response.vendorId = vendorId;
    response.riderId = riderId;
    await response.save();

    //   if (!response) {
    //     logger.error(`No record found for transactionRef: ${transactionRef}`);
    //     res.status(404).json({ message: 'No record found for transactionRef' });
    //   } else {
    const success = response.data.success;
    res.status(200).json({ success, response: response.data });
    //   }
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ message: "An error occurred when fetching your response" });
  }
}

export async function getPayouts(req: Request, res: Response) {
  const vendorId = req.params.id;
  if (!vendorId) {
    return res.status(400).json({ error: "Vendor id is required" });
  }
  try {
    const payouts = await Payment.find({ vendorId: vendorId });
    res.status(200).json(payouts);
  } catch (error) {
    return res.status(400).json({ error: "An error occured" });
  }
}

export async function getRiderPayouts(req: Request, res: Response) {
  const riderId = req.params.id;
  if (!riderId) {
    return res.status(400).json({ error: "Rider id is required" });
  }
  try {
    const payouts = await Payment.find({ riderId: riderId });
    res.status(200).json(payouts);
  } catch (error) {
    return res.status(400).json({ error: "An error occured" });
  }
}
