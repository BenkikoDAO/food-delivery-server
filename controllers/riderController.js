import Rider from "../models/rider.js";
import Vendor from "../models/vendor.js";
import bcrypt from "bcrypt";
import sgMail from "@sendgrid/mail";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";
import redisClient from "../helpers/redisClient.js";
dotenv.config();
const clientUrl = process.env.CLIENT_URL;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const bcryptSalt = process.env.BCRYPT_SALT;
//Register customer
export async function createRider(req, res) {
  try {
    const { vendorID, name, email, phoneNumber, availability } = req.body;
    const image = req.file;
    const result = await cloudinary.uploader.upload(image.path, {
      width: 500,
      height: 500,
      crop: "scale",
      quality: 50,
    });

    if (!name || !email || !phoneNumber) {
      return res
        .status(400)
        .json({ message: "Please enter all the required fields" });
    }
    const existingRider = await Rider.findOne({ email });
    if (existingRider) {
      return res
        .status(400)
        .json({ error: "Rider already exists in the system" });
    }

    const vendorExists = await Vendor.findById(vendorID);
    if (vendorExists) {
      const newRider = new Rider({
        vendorID,
        name,
        email,
        phoneNumber,
        image: result.secure_url,
        availability,
      });
      const savedRider = await newRider.save();
      const redisKey = `rider:${savedRider._id}`;
      await redisClient.setEx(redisKey, 3600, JSON.stringify(savedRider)); // Cache for 1 hour (adjust as needed)

      res.status(201).json({
        _id: savedRider.id,
        username: savedRider.username,
        email: savedRider.email,
        phoneNumber: savedRider.phoneNumber,
        availability: savedRider.availability,
        vendorID: savedRider.vendorID,
        token: generateToken(savedRider._id),
        image: savedRider.image,
      });
    } else {
      res.status(400).json({ error: "A vendor with that ID does not exist" });
    }
  } catch (error) {
    console.error("Error registering rider:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}

export async function loginRider(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Please enter all the required fields");
    }

    const user = await Rider.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Generate a token for the user
      const token = generateToken(user._id);

      res.status(200).json({
        _id: user._id,
        vendorID: user.vendorID,
        username: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        image: user.image,
        availability: user.availability,
        paymail: user.paymail,
        secretKey: user.secretKey,
        publicKey: user.publicKey,
        address: user.address,
        licensePlate: user.licensePlate,
        licenseExpiry: user.licenseExpiry,
        token,
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

export async function updateRider(req, res) {
  const riderId = req.params.id;
  const redisKey = `rider${riderId}`;
  const rider = await Rider.findById(riderId);

  if (!rider) {
    return res
      .status(404)
      .json({ error: "The rider you tried to update does not exist" });
  } else {
    const {
      name,
      email,
      phoneNumber,
      availability,
      password,
      paymail,
      secretKey,
      publicKey,
    } = req.body;

    let hashedPassword = null;

    if (password) {
      hashedPassword = await bcrypt.hash(password, Number(bcryptSalt));
    }
    const updatedRider = await Rider.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phoneNumber,
        availability,
        paymail,
        password: hashedPassword,
        secretKey,
        publicKey,
      },
      { new: true }
    );
    await redisClient.setEx(redisKey, 3600, JSON.stringify(updatedRider));

    res.status(200).json(updatedRider);
  }
}

export const requestResetPassword = async (req, res) => {
  const { email } = req.body;

  sgMail.setApiKey(process.env.SENDGRID_APIKEY);

  if (!email) {
    res.status(400).json({ error: "Please provide an email address" });
    return;
  }
  try {
    const user = await Rider.findOne({ email });

    if (!user) throw new Error("User does not exist");

    const userId = user.id; // Get the user's ID

    const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    }); // Generate the reset token

    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

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
    console.log(error);
    res.status(500).json({ error: "Failed to initiate password reset" });
  }
};

export async function changePassword(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please enter all the required fields" });
  }
  const rider = await Rider.findOne({ email });
  try {
    // Find the user by email
    const rider = await Rider.findOne({ email });
    if (!rider) {
      return res.status(404).json({ error: "User not found" });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, Number(bcryptSalt));

    // Update the user's password
    await Rider.findByIdAndUpdate(
      rider._id, // Assuming _id is the user's unique identifier
      { password: hashedPassword },
      { new: true }
    );
    logger.info(`${rider.email} - changed password successfully`);
    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    logger.error(`Error changing password for rider - ${rider.email}`);
    res.status(500).json({ error: "Failed to change password" });
  }
}

export async function getRider(req, res) {
  try {
    const riderId = req.params.id;
    const redisKey = `rider:${riderId}`;

    // Attempt to retrieve data from Redis
    const cachedData = await redisClient.get(redisKey);
    if (cachedData) {
      res.status(200).json(JSON.parse(cachedData));
    } else {
      const rider = await Rider.findById(req.params.id);
      if (!rider) {
        res.status(400);
        throw new Error("Rider does not exist");
      } else {
        res.status(200).json(rider);
      }
    }
  } catch (error) {
    console.error("Error getting rider:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}

export async function getRidersByVendor(req, res) {
  try {
    const vendorId = req.params.vendorId;
    const redisKey = `riders:${vendorId}`;

    // Attempt to retrieve riders from Redis
    const cachedData = await redisClient.get(redisKey);

    if (cachedData) {
      // Riders found in cache, send them as a response
      res.status(200).json(JSON.parse(cachedData));
    } else {
      // Riders not found in cache, fetch them from the database
      const riders = await Rider.find({ vendorID: vendorId });

      if (!riders || riders.length === 0) {
        res.status(400);
        throw new Error("This vendor does not have any riders yet.");
      } else {
        // Cache the fetched riders in Redis for future use
        await redisClient.setEx(redisKey, 3600, JSON.stringify(riders)); // Cache for 1 hour (adjust as needed)

        res.status(200).json(riders);
      }
    }
  } catch (error) {
    res.status(400).json({ message: "This vendor does not have any riders yet." });
  }
}

export async function getRiders(req, res) {
  try {
    const riders = await Rider.find();

    if (!riders) {
      res.status(400);
      throw new Error("There are no riders in the database");
    } else {
      res.status(200).json(riders);
    }
  } catch (error) {
    console.error("Error getting rider:", error);
    res.status(500).json({ error: "An error occurred" });
  }
}

export async function deleteRider(req, res) {
  try {
    const riderId = req.params.id;
    const redisKey = `rider:${riderId}`;

    const rider = await Rider.findById(req.params.id);
    if (!rider) {
      res.status(404);
      throw new Error("Rider not found ");
    } else {
      await Rider.findByIdAndDelete(req.params.id);
      redisClient.del(redisKey);
      
      res.status(200).json({ id: req.params.id, message: "Rider deleted" });
    }
  } catch (error) {
    res.status(400).json({ message: "Rider not found!" });
    console.error("Error getting riders:", error);
  }
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

// export default { createRider, loginRider, resetPassword, updatePassword, getRider, getRiders }
