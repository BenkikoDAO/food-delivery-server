import Payment from "../models/payments.js";
import logger from "../helpers/logging.js";

export async function handleCallback(req, res) {
    const { data } = req.body;
  
    try {
      // Save the response data to your database (all responses, regardless of success)
      const paymentResponse = new Payment({
        responseData: data,
        timestamp: new Date(),
      });
  
      await paymentResponse.save();

      logger.info("Payment response sent" - paymentResponse.responseData)
  
      // Respond with the saved payment response data
      res.status(200).json({ message: "Callback response received", paymentResponse });
    } catch (error) {
      // Handle errors and send an appropriate response
      console.error("Error handling callback:", error);
      res.status(500).json({ message: "An error occurred while handling callback" });
    }
  }