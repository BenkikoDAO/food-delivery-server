import Rider from "../models/rider.js";
import Vendor from "../models/vendor.js";
import bcrypt from "bcrypt"
import sgMail from '@sendgrid/mail'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();
const clientUrl = process.env.CLIENT_URL

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

const bcryptSalt = process.env.BCRYPT_SALT
//Register customer
export async function createRider (req, res){ 
    try {
        const { vendorID, name, email, phoneNumber, availability } = req.body
        const image = req.file;
        const result = await cloudinary.uploader.upload(image.path, {
          width: 500,
          height: 500,
          crop: "scale",
          quality: 50,
        });

        if(!name || !email || !phoneNumber){
          return res.status(400).json({ message: "Please enter all the required fields" });
        }
        const existingRider = await Rider.findOne({email})
        if (existingRider) {
            return res.status(400).json({ error: 'Rider already exists in the system' });
        }

        const vendorExists = await Vendor.findById(vendorID);
        if(vendorExists){
          const newRider = new Rider({
            vendorID,
            name,
            email,
            phoneNumber,
            image: result.secure_url,
            availability
          });
          const savedRider = await newRider.save();
          
          res.status(201).json({
            _id: savedRider.id,
            username: savedRider.username,
            email: savedRider.email,
            phoneNumber: savedRider.phoneNumber,
            availability: savedRider.availability,
            vendorID: savedRider.vendorID,
            token: generateToken(savedRider._id),
            image: savedRider.image
          });
        } else {
      res.status(400).json({ error: "A vendor with that ID does not exist" });
        }

    } catch (error) {
        console.error('Error registering rider:', error);
        res.status(500).json({ error: 'An error occurred' });
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
          username: user.username,
          email: user.email,
          phoneNumber: user.phoneNumber,
          image: user.image,
          availability: user.availability,
          paymail: user.paymail,
          secretKey: user.secretKey,
          publicKey: user.publicKey,
          token
        });
      } else {
        res.status(400);
        throw new Error("The credentials you entered are invalid");
      }
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
  }

  export async function updateRider(req, res) {
    const rider = await Rider.findById(req.params.id);
  
    if (!rider) {
      return res.status(404).json({ error: "The rider you tried to update does not exist" });
    }
     else {
      const { name, email, phoneNumber, availability, password, paymail, secretKey, publicKey } = req.body;
   
      let hashedPassword = null
      
      if (password) {
        hashedPassword = await bcrypt.hash(password, Number(bcryptSalt));
      }  
      const updatedRider = await Rider.findByIdAndUpdate(
        req.params.id,
        { name, email, phoneNumber, availability, paymail, password: hashedPassword, secretKey, publicKey, image },
        { new: true }
      );
  
      res.status(200).json(updatedRider);
    }
  }

  export const requestResetPassword = async(req, res) => {
    const {email} = req.body
  
    sgMail.setApiKey(process.env.SENDGRID_APIKEY);
  
    if (!email) {
      res.status(400).json({ error: 'Please provide an email address' });
      return;
    }
    try {
      const user = await Rider.findOne({ email });
  
      if (!user) throw new Error("User does not exist");
  
  
      const userId = user.id; // Get the user's ID
  
      const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Generate the reset token
  
      const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;
  
      const msg = {
        to: email,
        from: 'macmunene364@gmail.com',//remember to change this to the official client side email
        subject: 'Password reset for Mobile eats account',
        text: `Click the following link to reset your password: ${resetLink}`,
      };
      sgMail
      .send(msg)
      .then(() => {
        res.status(200).json({ message: 'Reset password email sent' });
      })
      .catch((error) => {
        console.error('Error sending reset password email:', error);
        res.status(500).json({ error: 'Failed to send reset password email' });
      });
    } catch (error) {
      console.log(error)
      res.status(500).json({ error: 'Failed to initiate password reset' });
    }
  }
  
  export const updatePassword = async (req, res) => {
    const { token, newPassword } = req.body; //in the client side, extract token from the reset link url and send it in a hidden input where you set value=<TOKEN>
  
    try {
      // Verify the token
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  
      // Extract the user ID from the decoded token
      const userId = decodedToken.userId;
  
      // Find the user in the database by their ID
      const user = await Rider.findOne({ _id: userId });
  
      if (!user) {
        throw new Error('User not found');
      }
  
      // Update the user's password
      const hashedPassword = await bcrypt.hash(newPassword, Number(bcryptSalt));
      user.password = hashedPassword;
  
      // Save the updated user in the database
      await user.save();
  
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: 'Failed to update password' });
    }
  };

  export async function getRider(req, res) {
    try {
        const rider = await Rider.findById(req.params.id)
        if(!rider){
            res.status(400);
            throw new Error("Rider does not exist");
        } else{
            res.status(200).json(rider)
        }
    } catch (error) {
        console.error("Error getting rider:", error);
        res.status(500).json({ error: "An error occurred" });
    }
  }

  export async function getRidersByVendor(req, res) {
    try {
      const riders = await Rider.find({ vendorID: req.params.vendorId });

      res.status(200).json(riders);
      
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
      const rider = await Rider.findById(req.params.id);
      if (!rider) {
        res.status(404);
        throw new Error("Rider not found ");
      } else {
        await Rider.findByIdAndDelete(req.params.id);
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