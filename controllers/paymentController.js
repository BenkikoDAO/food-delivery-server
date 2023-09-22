import Payment from "../models/payments.js";
import logger from "../helpers/logging.js";

export async function handleCallback(req, res) {  
    try {
      // Save the response data to your database (all responses, regardless of success)
      const paymentResponse = new Payment({
        data: req.body,
        timestamp: new Date(),
      });
  
      await paymentResponse.save();

      logger.info(`Payment response sent - ${paymentResponse.data.Message}`)
  
      // Respond with the saved payment response data
      res.status(200).json({ message: "Callback response received", paymentResponse });
    } catch (error) {
      // Handle errors and send an appropriate response
      logger.error('Error occured while handling callback: ', error)
      res.status(500).json({ message: "An error occurred while handling callback" });
    }
  }

  export async function getCallbackResponse(req, res) {
    try {
      const { transactionRef } = req.body;
  
      const response = await Payment.findOne({ 'data.transaction_reference': transactionRef });
  
    //   if (!response) {
    //     logger.error(`No record found for transactionRef: ${transactionRef}`);
    //     res.status(404).json({ message: 'No record found for transactionRef' });
    //   } else {
        const success = response.data.Success;
        res.status(200).json({ success });
    //   }
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: 'An error occurred when fetching your response' });
    }
  }

  export async function getPayoutResponse(req, res) {
    try {
      const { payoutRef, transactionType, vendorId } = req.body;
  
      const response = await Payment.findOne({ 'data.payout_reference': payoutRef });
      response.transactionType = transactionType
      response.vendorId = vendorId
      await response.save()
  
    //   if (!response) {
    //     logger.error(`No record found for transactionRef: ${transactionRef}`);
    //     res.status(404).json({ message: 'No record found for transactionRef' });
    //   } else {
        const success = response.data.success;
        res.status(200).json({ success, response: response.data });
    //   }
    } catch (error) {
      logger.error(error);
      res.status(500).json({ message: 'An error occurred when fetching your response' });
    }
  }