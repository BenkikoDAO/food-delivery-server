import Vendor from "../models/vendor.js";
import Rider from "../models/rider.js";
import bcrypt from "bcrypt";
import sgMail from "@sendgrid/mail";
import jwt from "jsonwebtoken";
const bcryptSalt = process.env.BCRYPT_SALT;

export async function createVendor(req, res) {
  try {
    const { name, email, password, phoneNumber, location, openingHours, closingHours, businessRegistration,} = req.body;
    if (!name || !email || !password || !phoneNumber || !location || !openingHours || !closingHours) {
      return res.status(400).json({ message: "Please enter all the required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, Number(bcryptSalt));

    const newVendor = new Vendor({ name, email, phoneNumber, password: hashedPassword, location, openingHours, closingHours, businessRegistration,});

    // Save the customer to the database
    const savedVendor = await newVendor.save();

    const sessionId = req.session.id;

    res.status(201).json({
      _id: savedVendor.id,
      name: savedVendor.name,
      email: savedVendor.email,
      phoneNumber: savedVendor.phoneNumber,
      location: savedVendor.location,
      openingHours: savedVendor.openingHours,
      closingHours: savedVendor.closingHours,
      businessRegistration: savedVendor.businessRegistration,
      token: generateToken(savedVendor.id),
      sessionId,
    });
  } catch (error) {
    console.error("Error registering vendor:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}

export async function loginVendor(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Please enter all the required fields");
    }

    const user = await Vendor.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Generate a token for the user
      const token = generateToken(user._id);

      // Get sessionID
      const sessionId = req.session.id;

      res.status(200).json({
        _id: user._id,
        username: user.name,
        email: user.email,
        location: user.location,
        phoneNumber: user.phoneNumber,
        openingHours: user.openingHours,
        closingHours: user.closingHours,
        businessRegistration: user.businessRegistration,
        token,
        sessionId,
      });
    } else {
      res.status(400);
      throw new Error("The credentials you entered are invalid");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}

export const resetPassword = async (req, res) => {
  const { email } = req.body;

  sgMail.setApiKey(process.env.SENDGRID_APIKEY);

  if (!email) {
    res.status(400).json({ error: "Please provide an email address" });
    return;
  }
  try {
    const user = await Vendor.findOne({ email });

    if (!user) throw new Error("User does not exist");

    const userId = user.id; // Get the user's ID

    const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); // Generate the reset token

    const resetLink = `https://e-commerce-munene-m/reset-password?token=${resetToken}`; //remember to change this to a client side route with the form to reset credentials

    const msg = {
      to: email,
      from: "macmunene364@gmail.com", //remember to change this to the official client side email
      subject: "Reset Your Password",
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
    console.log(error);
    res.status(500).json({ error: "Failed to initiate password reset" });
  }
};

export const updatePassword = async (req, res) => {
  const { token, newPassword } = req.body; //in the client side, extract token from the reset link url and send it in a hidden input where you set value=<TOKEN>

  try {
    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Extract the user ID from the decoded token
    const userId = decodedToken.userId;

    // Find the user in the database by their ID
    const user = await Vendor.findOne({ _id: userId });

    if (!user) {
      throw new Error("User not found");
    }

    // Update the user's password
    const hashedPassword = await bcrypt.hash(newPassword, Number(bcryptSalt));
    user.password = hashedPassword;

    // Save the updated user in the database
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Failed to update password" });
  }
};

export async function getVendor(req, res) {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      res.status(400);
      throw new Error("This vendor does not exist");
    } else {
      res.status(200).json(vendor);
    }
  } catch (error) {
    console.error("Error getting vendors:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}

export async function getVendors(req, res) {
  try {
    const vendors = await Vendor.find();

    if (!vendors) {
      res.status(400);
      throw new Error("There are no vendors in the database");
    } else {
      res.status(200).json(vendors);
    }
  } catch (error) {
    console.error("Error getting vendors:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}

export async function addRider(req, res) {
  try {
    const { vendorId, riderId } = req.body;

    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Check if the rider is already associated with the vendor
    const isRiderAssociated = vendor.riders.includes(riderId);

    if (isRiderAssociated) {
      return res.status(400).json({ error: 'Rider is already associated with this vendor' });
    }

    const rider = await Rider.findById(riderId);

    if (!rider) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    // Add the rider details to the vendor's riders array
    const riderInfo = {
      riderId: rider._id,
      name: rider.name,
      phoneNumber: rider.phoneNumber
    };
    vendor.riders.push(riderInfo);
    await vendor.save();

    res.status(200).json({ message: "Rider added to the vendor's riders successfully" });
  } catch (error) {
    console.error('Error adding rider to vendor:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
}


export async function deleteVendor(req, res) {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      res.status(404);
      throw new Error("Vendor not found ");
    } else {
      await Vendor.findByIdAndDelete(req.params.id);
      res.status(200).json({ id: req.params.id, message: "Vendor deleted" });
    }
  } catch (error) {
    console.error("Error getting vendors:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

export default {
  createVendor,
  loginVendor,
  resetPassword,
  updatePassword,
  getVendor,
  getVendors,
  addRider,
  deleteVendor
};
