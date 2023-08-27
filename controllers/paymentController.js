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

  export async function getCallbackResponse(req, res){
    try {
        const { transactionRef } = req.body

        const response = await Payment.find({ transaction_reference: transactionRef })
    
        res.status(200).json({success: response.data.Success})
    } catch (error) {
        logger.error(error)
        res.status(500).json({message: 'An error occured when fetching your response'})
    }

  }