import { Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer";
import cloudinary from "cloudinary";
import logger from "../helpers/logging";
import redisClient from "../helpers/redisClient";
dotenv.config();

import Vendor from "../models/vendor";
import Rider from "../models/rider";
import bcrypt from "bcrypt";
import sgMail from "@sendgrid/mail";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongoose";
const bcryptSalt = process.env.BCRYPT_SALT;
const clientUrl = process.env.CLIENT_URL;

const options = {
  provider: "opencage",
  apiKey: process.env.OPENCAGE_GEOCODING_API_KEY,
};
// const geocoder = NodeGeocoder(options);

interface RequestFiles {
  image?: Express.Multer.File[];
  id_image?: Express.Multer.File[];
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Specify the destination folder for uploaded files
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Specify the file name for uploaded files
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Create the multer middleware with the specified storage
const upload = multer({ storage: storage });

const cloudinaryOptions = {
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};
cloudinary.v2.config(cloudinaryOptions);

export async function createVendor(req: Request, res: Response) {
  try {
    const {
      name,
      password,
      phoneNumber,
      locationName,
      longitude,
      latitude,
      fcmToken,
      businessRegNo,
      HealthCertNo,
      rating,
      cuisine,
    } = req.body;
    const businessLogo = req.file;
    if (!businessLogo) {
      return res.status(400).json({ message: "Business Logo is required" });
    }
    const result = await cloudinary.v2.uploader.upload(businessLogo.path, {
      width: 500,
      height: 500,
      crop: "scale",
    });

    if (
      !password ||
      !name ||
      !phoneNumber ||
      !latitude ||
      !longitude ||
      !cuisine
    ) {
      logger.error("Missing required fields for creating vendor");
      return res
        .status(400)
        .json({ message: "Please enter all the required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, Number(bcryptSalt));

    const existingVendor = await Vendor.findOne({ name });
    if (existingVendor) {
      logger.error("Vendor with the same username already exists");
      return res.status(409).json({ message: "Username already in use" });
    }

    const newVendor = new Vendor({
      name,
      phoneNumber,
      password: hashedPassword,
      fcmToken,
      latitude,
      longitude,
      locationName,
      // HealthCertNo,
      // businessRegNo,
      rating,
      cuisine,
      businessLogo: result.secure_url,
    });

    // Save the customer to the database
    const savedVendor = await newVendor.save();
    logger.info("Vendor created successfully");
    const redisKey = "vendors";
    const vendors = await Vendor.find();
    await redisClient.set(redisKey, JSON.stringify(vendors)); // Cache for 1 hour (adjust as needed)

    res.status(201).json({
      _id: savedVendor.id,
      name: savedVendor.name,
      phoneNumber: savedVendor.phoneNumber,
      businessLogo: savedVendor.businessLogo,
      latitude: savedVendor.latitude,
      longitude: savedVendor.longitude,
      locationName: savedVendor.locationName,
      rating: savedVendor.rating,
      cuisine: savedVendor.cuisine,
      // businessRegNo: savedVendor.businessRegNo,
      // HealthCertNo: savedVendor.HealthCertNo,
      token: generateToken(savedVendor.id),
      fcmToken: savedVendor.fcmToken,
    });
  } catch (error) {
    logger.error("Error registering vendor: ", error);
    console.log("Error registering vendor:", error);
    return res.status(400).json({ error: "An error occurred" });
  }
}

export async function updateVendor(req: Request, res: Response) {
  try {
    const vendorId = req.params.id;
    const redisKey = `vendor:${vendorId}`;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      logger.error("The vendor does not exist");
      return res.status(400).json({ error: "The vendor does not exist!" });
    } else {
      const {
        paymail,
        publicKey,
        secretKey,
        benkikoToken,
        name,
        businessRegNo,
        phoneNumber,
        rating,
        locationName,
        latitude,
        longitude,
        cuisine,
        riders,
      } = req.body;
      let businessLogo = vendor.businessLogo;

      if (req.body.itemName) {
        const dish = req.body.itemName; // Get the name to add from the request

        if (vendor.specialties.includes(dish)) {
          // Name is empty or already in specialties, do nothing
          res.status(400).json({ message: "Dish already in specialties." });
          return;
        }

        // Add the new name to specialties
        vendor.specialties.push(dish);
      }

      if (req.file) {
        // If a new image is uploaded, update it in Cloudinary
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          width: 500,
          height: 500,
          crop: "scale",
          quality: 60,
        });
        businessLogo = result.secure_url;
      }
      const updatedVendor = await Vendor.findByIdAndUpdate(
        req.params.id,
        {
          paymail,
          publicKey,
          secretKey,
          benkikoToken,
          specialties: vendor.specialties,
          name,
          locationName,
          latitude,
          longitude,
          phoneNumber,
          businessRegNo,
          rating,
          cuisine,
          businessLogo,
          riders,
        },
        { new: true }
      );

      logger.info("Vendor has been updated successfully");
      res.status(200).json(updatedVendor);
      // update vendors in cache
      const vendors = await Vendor.find();
      await redisClient.set(redisKey, JSON.stringify(vendors));
    }
  } catch (error) {
    logger.error(error);
    console.log("Error updating vendor: ", error);
    return res.status(400).json({ message: "The vendor does not exist" });
  }
}

export async function loginVendor(req: Request, res: Response) {
  try {
    const { name, password, fcmToken } = req.body;

    if (!name || !password) {
      return res
        .status(400)
        .json({ error: "Please enter all the required fields" });
    }

    const user = await Vendor.findOne({ name });

    if (
      user &&
      typeof user.password === "string" &&
      (await bcrypt.compare(password, user.password))
    ) {
      // Generate a token for the user
      const token = generateToken(user.id);
      if (user.fcmToken) {
        user.fcmToken = undefined;
      }
      // Update the FCM token with the new one
      user.fcmToken = fcmToken;
      // Save the updated user document
      await user.save();
      res.status(200).json({
        _id: user._id,
        username: user.name,
        location: user.locationName,
        phoneNumber: user.phoneNumber,
        paymail: user.paymail,
        secretKey: user.secretKey,
        publicKey: user.publicKey,
        token,
        fcmToken: user.fcmToken,
      });
    } else {
      logger.error("Invalid login credentials");
      res
        .status(400)
        .json({ error: "The credentials you entered are invalid" });
    }
  } catch (error) {
    logger.error("Invalid login credentials");
    return res
      .status(400)
      .json({ message: "The credentials you entered are invalid." });
  }
}

export const requestResetPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  sgMail.setApiKey(process.env.SENDGRID_APIKEY || "");

  if (!email) {
    res.status(400).json({ error: "Please provide an email address" });
    return;
  }
  try {
    const user = await Vendor.findOne({ email });

    if (!user) throw new Error("User does not exist");

    const userId = user.id; // Get the user's ID

    const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET || "", {
      expiresIn: "1h",
    }); // Generate the reset token

    const resetLink = `${clientUrl}/vendor/reset-password?token=${resetToken}\n\n This link expires in an hour`; //remember to change this to a client side route with the form to reset credentials

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
        res.status(400).json({ error: "Failed to send reset password email" });
      });
  } catch (error) {
    res.status(400).json({ error: "Failed to initiate password reset" });
    console.log(error);
  }
};

export async function changePassword(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please enter all the required fields" });
  }
  const vendor = await Vendor.findOne({ email });
  try {
    // Find the user by email
    const vendor = await Vendor.findOne({ email });
    if (!vendor) {
      return res.status(404).json({ error: "User not found" });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, Number(bcryptSalt));

    // Update the user's password
    await Vendor.findByIdAndUpdate(
      vendor._id, // Assuming _id is the user's unique identifier
      { password: hashedPassword },
      { new: true }
    );
    logger.info(`${vendor.name} - changed password successfully`);
    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    logger.error(`Error changing password for vendor - ${vendor?.name}`);
    res.status(400).json({ error: "Failed to change password" });
  }
}

export async function getVendor(req: Request, res: Response) {
  try {
    const vendorId = req.params.id;
    const redisKey = "vendors";
    const cachedData = await redisClient.get(redisKey);

    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      const vendor = parsedData.find((item: any) => item._id === req.params.id);
      if (vendor) {
        res.status(200).json(vendor);
      }
    }
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      res.status(404).json({ message: "Vendor not found" });
    } else {
      res.status(200).json(vendor);
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
  }
}

export async function getVendors(req: Request, res: Response) {
  try {
    const redisKey = "vendors";

    // // Attempt to retrieve data from Redis
    const cachedData = await redisClient.get(redisKey);

    if (cachedData) {
      // Data found in cache, send it as a response
      res.status(200).json(JSON.parse(cachedData));
    } else {
      // Data not found in cache, fetch it from the database
      const vendors = await Vendor.find();
      // Cache the fetched data in Redis for future use
      await redisClient.set(redisKey, JSON.stringify(vendors));

      res.status(200).json(vendors);
    }
  } catch (error) {
    res.status(400).json({ message: "Couldn't find any vendors" });
    console.error("Error getting vendors:", error);
  }
}

export async function addRider(req: Request, res: Response) {
  try {
    const { name, email, phoneNumber, availability } = req.body;
    const redisKey = "vendors";
    const image = req.file;
    if (!image) {
      return res.status(400).json({ message: "Rider's image is required" });
    }
    const result = await cloudinary.v2.uploader.upload(image.path, {
      width: 500,
      height: 500,
      crop: "scale",
      quality: 50,
    });

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(400).json({ error: "Vendor not found" });
    }

    const isRiderAssociated = vendor.riders.some(
      (riderInfo) => riderInfo.email === email
    );

    if (isRiderAssociated) {
      return res
        .status(400)
        .json({ error: "Rider is already associated with this vendor" });
    }

    const rider = await Rider.findOne({ email });
    sgMail.setApiKey(process.env.SENDGRID_APIKEY || "");

    if (rider) {
      const riderInfo = {
        riderId: rider._id,
        name: rider.name,
        phoneNumber: rider.phoneNumber,
        email: rider.email,
        image: rider.image,
        availability: rider.availability,
        password: "", // Add these properties with appropriate default values or actual values
        paymail: "",
        secretKey: "",
        publicKey: "",
        address: "",
        latitude: 0,
        longitude: 0,
        licensePlate: "",
        licenseExpiry: "",
        id_image: "",
      };
      vendor.riders.push(riderInfo);
      await vendor.save();
      logger.info("Rider added successfully");
      const vendors = await Vendor.find();
      await redisClient.set(redisKey, JSON.stringify(vendors));

      const msg = {
        to: email,
        from: "Mobileeatbyosumo@gmail.com", //remember to change this to the official client side email
        subject: "New vendor added you on mobile eat 🎊",
        text: `You have been added by ${vendor.name} as their rider on Mobile eat`,
      };
      sgMail
        .send(msg)
        .then(() => {
          logger.info(`Email sent successfully to ${riderInfo.email}`);
          // res.status(200).json({ message: `Email sent successfully to ${riderInfo.email}` });
        })
        .catch((error) => {
          // res.status(400).json({ error: "Failed to send email to rider" });
          logger.error(
            `Failed to send email to rider - ${riderInfo.email}`,
            error
          );
        });
    } else {
      const newRider = await Rider.create({
        name,
        email,
        phoneNumber,
        image: result.secure_url,
        availability,
      });

      const riderInfo = {
        riderId: newRider._id,
        name: newRider.name,
        phoneNumber: newRider.phoneNumber,
        email: newRider.email,
        image: newRider.image,
        availability: newRider.availability,
        password: "", // Add these properties with appropriate default values or actual values. This is the safer approach as it enforces type checking at compile time. If the structure of riderInfo changes, the compiler will catch any inconsistencies.
        paymail: "",
        secretKey: "",
        publicKey: "",
        address: "",
        latitude: 0, // Example default values, update them as needed
        longitude: 0,
        licensePlate: "",
        licenseExpiry: "",
        id_image: "",
      };

      vendor.riders.push(riderInfo);
      await vendor.save();
      logger.info("Rider added successfully");
      const vendors = await Vendor.find();
      await redisClient.set(redisKey, JSON.stringify(vendors));

      const confirmToken = jwt.sign(
        { riderInfo },
        process.env.JWT_SECRET || "",
        {
          expiresIn: "1h",
        }
      );
      const confirmLink = `${clientUrl}/rider/${newRider._id}/${confirmToken}/${vendor._id}`;
      const msg = {
        to: email,
        from: "Mobileeatbyosumo@gmail.com", //remember to change this to the official client side email
        subject: "Invite to join Mobile-eats as a rider",
        text: `You have been invited to offer food delivery services on Mobile Eats platform by ${vendor.name}.\nClick the link below to complete your account creation. \n${confirmLink}\n\n This link expires in an hour`,
      };
      sgMail
        .send(msg)
        .then(() => {
          logger.info(`Email sent successfully to ${riderInfo.email}`);
          // res.status(200).json({ message: `Email sent successfully to ${riderInfo.email}` });
        })
        .catch((error) => {
          // res.status(400).json({ error: "Failed to send email to rider" });
          logger.error(
            `Failed to send email to rider - ${riderInfo.email}`,
            error
          );
        });
    }

    res.status(200).json({
      message:
        "New rider added to the vendor's riders successfully and email sent",
    });
  } catch (error) {
    logger.error("Rider you tried to add was not found: ", error);
    res.status(400).json({ message: "Rider not found!" });
    console.error("Error adding rider to vendor:", error);
  }
}

export async function editRider(req: Request, res: Response) {
  const {
    name,
    email,
    phoneNumber,
    availability,
    password,
    paymail,
    secretKey,
    publicKey,
    address,
    latitude,
    longitude,
    licenseExpiry,
    licensePlate,
  } = req.body;
  const { riderId, id } = req.params;
  let image;
  let id_image;
  let hashedPassword = null;

  try {
    const vendor = await Vendor.findById(id);
    const redisKey = "vendors";
    if (!vendor) {
      return res.status(400).json({ error: "Vendor not found" });
    }

    // Find the rider in the vendor's profile
    const riderIndex = vendor.riders.findIndex(
      (rider) => rider.riderId?.toString() === riderId
    );
    if (riderIndex === -1) {
      return res
        .status(404)
        .json({ error: "Rider not found in vendor's profile" });
    }
    const reqFiles: RequestFiles = req.files as RequestFiles;

    if (reqFiles) {
      if (reqFiles.image) {
        const result = await cloudinary.v2.uploader.upload(
          reqFiles.image[0].path,
          {
            width: 500,
            height: 500,
            crop: "scale",
            quality: 60,
          }
        );
        image = result.secure_url;
      }
      if (reqFiles.id_image) {
        const result = await cloudinary.v2.uploader.upload(
          reqFiles.id_image[0].path,
          {
            width: 500,
            height: 500,
            crop: "scale",
            quality: 60,
          }
        );
        id_image = result.secure_url;
      }
    }

    if (password) {
      hashedPassword = await bcrypt.hash(password, Number(bcryptSalt));
      vendor.riders[riderIndex].password = hashedPassword;
      await Rider.findByIdAndUpdate(
        riderId,
        { password: hashedPassword },
        { new: true }
      );
    }

    // Check which fields are provided in the request and update only those fields
    if (name) vendor.riders[riderIndex].name = name;
    if (email) vendor.riders[riderIndex].email = email;
    if (phoneNumber) vendor.riders[riderIndex].phoneNumber = phoneNumber;
    if (availability) vendor.riders[riderIndex].availability = availability;
    if (paymail) vendor.riders[riderIndex].paymail = paymail;
    if (secretKey) vendor.riders[riderIndex].secretKey = secretKey;
    if (publicKey) vendor.riders[riderIndex].publicKey = publicKey;
    if (address) vendor.riders[riderIndex].address = address;
    if (latitude) vendor.riders[riderIndex].latitude = latitude;
    if (longitude) vendor.riders[riderIndex].longitude = longitude;
    if (licenseExpiry) vendor.riders[riderIndex].licenseExpiry = licenseExpiry;
    if (licensePlate) vendor.riders[riderIndex].licensePlate = licensePlate;
    if (image) vendor.riders[riderIndex].image = image;
    if (id_image) vendor.riders[riderIndex].id_image = id_image;
    vendor.markModified("riders");
    await Promise.all([
      await vendor.save(),
      await Rider.findByIdAndUpdate(
        riderId,
        {
          address,
          latitude,
          longitude,
          licenseExpiry,
          availability,
          licensePlate,
          image,
          id_image,
        },
        { new: true }
      ),
    ]);
    // Save the updated vendor document to the database
    logger.info("Rider updated successfully");
    const vendors = await Vendor.find();
    await redisClient.set(redisKey, JSON.stringify(vendors));

    res.status(200).json({
      message: "Rider updated successfully",
      rider: vendor.riders[riderIndex],
    });
  } catch (error) {
    // Handle the error, e.g., return an error response to the client
    logger.error("There was an error updating rider: ", error);
    res.status(400).json({ error: "Error updating rider" });
    console.error("Error updating rider:", error);
  }
}

export async function deleteRider(req: Request, res: Response) {
  try {
    const { riderId, vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId);
    const redisKey = "vendors";

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Check if the vendor has the rider in their riders array
    const riderIndex = vendor.riders.findIndex(
      (riderInfo: any) => riderInfo.riderId.toString() === riderId
    );

    if (riderIndex === -1) {
      return res
        .status(404)
        .json({ error: "Rider not associated with this vendor" });
    }

    // Remove the rider from the vendor's riders array and save
    vendor.riders.splice(riderIndex, 1);
    await vendor.save();
    logger.info(`Rider removed from vendor: ${vendor.name} successfully`);
    const vendors = await Vendor.find();
    await redisClient.set(redisKey, JSON.stringify(vendors));

    res
      .status(200)
      .json({ message: "Rider removed from the vendor successfully" });
  } catch (error) {
    res.status(400).json({ message: "Error removing rider from vendor" });
    console.error("Error removing rider from vendor:", error);
  }
}

export async function deleteVendor(req: Request, res: Response) {
  try {
    const vendorId = req.params.id;
    const redisKey = `vendor:${vendorId}`;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      res.status(404);
      throw new Error("Vendor not found ");
    } else {
      await Vendor.findByIdAndDelete(vendorId);
      // update cache with the new record of vendors
      const vendors = await Vendor.find();
      await redisClient.set(redisKey, JSON.stringify(vendors));

      res.status(200).json({ id: vendorId, message: "Vendor deleted" });
      logger.info(`Vendor: ${vendor.name} deleted successfully`);
    }
  } catch (error) {
    logger.error("An error occured when deleting vendor: ", error);
    res.status(400).json({ message: "Vendor not found!" });
    console.error("Error getting vendors:", error);
  }
}

const generateToken = (id: ObjectId) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "", {
    expiresIn: "1d",
  });
};

export default {
  createVendor,
  loginVendor,
  requestResetPassword,
  changePassword,
  updateVendor,
  getVendor,
  getVendors,
  addRider,
  deleteVendor,
  editRider,
  deleteRider,
};
