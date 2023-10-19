import Customer from "../models/customer.js";
import bcrypt from "bcrypt";
import sgMail from "@sendgrid/mail";
import jwt from "jsonwebtoken";
import logger from "../helpers/logging.js";
import customer from "../models/customer.js";

let bcryptSalt = process.env.BCRYPT_SALT;
const clientUrl = process.env.CLIENT_URL;
//Register customer
export async function createCustomer(req, res) {
  try {
    const { username, email, password, phoneNumber } = req.body;

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, Number(bcryptSalt));

    const newCustomer = new Customer({
      username,
      email,
      phoneNumber,
      password: hashedPassword,
    });

    // Save the customer to the database
    const savedCustomer = await newCustomer.save();
    logger.info("Customer account created: ", newCustomer.username);

    const sessionId = req.session.id;

    res.status(201).json({
      _id: savedCustomer.id,
      username: savedCustomer.username,
      email: savedCustomer.email,
      phoneNumber: savedCustomer.phoneNumber,
      token: generateToken(savedCustomer._id),
      sessionId,
    });
  } catch (error) {
    logger.error("Error registering customer: ", error);
    res.status(400).json({ message: "Email is already in use!" });
  }
}

export async function loginCustomer(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please enter all the required fields" });
    }

    const user = await Customer.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Generate a token for the user
      const token = generateToken(user._id);
      // if (user.fcmToken) {
      //   user.fcmToken = undefined;
      // }

      // // Update the FCM token with the new one
      // user.fcmToken = fcmToken;

      // // Save the updated user document
      // await user.save();
      // Create a session for the user
      const sessionId = req.session.id;

      res.status(200).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        // fcmToken: user.fcmToken,
        token,
        sessionId,
      });
    } else {
      logger.error("Invalid password");
      return res
        .status(400)
        .json({ error: "The credentials you entered are invalid" });
    }
  } catch (error) {
    logger.error("Invalid login credentials");
    res.status(400).json({ message: "Invalid credentials", error: error });
  }
}

export const requestResetPassword = async (req, res) => {
  const { email } = req.body;

  sgMail.setApiKey(process.env.SENDGRID_APIKEY);

  if (!email) {
    return res.status(400).json({ error: "Please provide an email address" });
  }
  try {
    const user = await Customer.findOne({ email });

    if (!user) throw new Error("User does not exist");

    const userId = user._id; // Get the user's ID

    const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); // Generate the reset token

    const resetLink = `${clientUrl}/customer/reset-password?token=${resetToken}`; //remember to change this to a client side route with the form to reset credentials

    const msg = {
      to: email,
      from: "Mobileeatbyosumo@gmail.com", //remember to change this to the official client side email
      subject: "Password reset for Mobile eats account",
      text: `Click the following link to reset your password: ${resetLink}`,
    };
    sgMail
      .send(msg)
      .then(() => {
        res.status(200).json({ message: "Reset password email sent" });
      })
      .catch((error) => {
        console.error("Error sending reset password email:", error);
        res.status(500).json({ error: "Failed to send reset password email" });
      });
  } catch (error) {
    res.status(500).json({ error: "Failed to initiate password reset" });
    console.log(error);
  }
};

export async function changePassword(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please enter all the required fields" });
  }
  const customer = await Customer.findOne({ email });

  try {
    // Find the user by email
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ error: "User not found" });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, Number(bcryptSalt));

    // Update the user's password
    await Customer.findByIdAndUpdate(
      customer._id,
      { password: hashedPassword },
      { new: true }
    );
    logger.info(`${customer.username} - changed password successfully`);
    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    logger.error(`Error changing password for customer - ${customer.email}`);
    res.status(500).json({ error: "Failed to change password" });
  }
}

export async function getCustomers(req, res) {
  try {
    const customers = await Customer.find();

    res.status(200).json(customers);
  } catch (error) {
    logger.error("There are no customers yet!");
    res.status(404).json({ message: "Customers not found" });
  }
}

export async function getCustomer(req, res) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(400).json({error: "This customer does not exist"});
    } else {
      res.status(200).json(customer);
    }
  } catch (error) {
    logger.error("This customer does not exist");
    res.status(400).json({ message: "This customer does not exist!" });
  }
}
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

export default {
  createCustomer,
  loginCustomer,
  requestResetPassword,
  changePassword,
  getCustomers,
  getCustomer,
};
