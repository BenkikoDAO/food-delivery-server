import Customer from "../models/customer.js";
import bcrypt from "bcrypt"
import sgMail from '@sendgrid/mail'
import jwt from 'jsonwebtoken'

let bcryptSalt = process.env.BCRYPT_SALT
//Register customer
export async function createCustomer (req, res){ 
    try {
        const { username, email, password, phoneNumber, location } = req.body

        const existingCustomer = await Customer.findOne({email})
        if (existingCustomer) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, Number(bcryptSalt));

        const newCustomer = new Customer({
            username,
            email,
            phoneNumber,
            password: hashedPassword,
            location
          });
      
          // Save the customer to the database
          const savedCustomer = await newCustomer.save();

        const sessionId = req.session.id;
          
          res.status(201).json({
            _id: savedCustomer.id,
            username: savedCustomer.username,
            email: savedCustomer.email,
            phoneNumber: savedCustomer.phoneNumber,
            location: savedCustomer.location,
            token: generateToken(savedCustomer._id),
            sessionId            
          });

    } catch (error) {
      res.status(400).json({ message: 'Email is already in use!' });
        console.error('Error registering customer:', error);
    }
}

export async function loginCustomer(req, res) {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        res.status(400);
        throw new Error("Please enter all the required fields");
      }
  
      const user = await Customer.findOne({ email });
  
      if (user && (await bcrypt.compare(password, user.password))) {
        // Generate a token for the user
        const token = generateToken(user._id);
  
        // Create a session for the user
        const sessionId = req.session.id;
  
        res.status(200).json({
          _id: user._id,
          username: user.username,
          email: user.email,
          location: user.location,
          phoneNumber: user.phoneNumber,
          token, sessionId
        });
      } else {
        res.status(400);
        throw new Error("The credentials you entered are invalid");
      }
    } catch (error) {
      res.status(400).json({ message: 'Invalid credentials' });
      console.error('Error logging in:', error);
    }
  }

  export const resetPassword = async(req, res) => {
    const {email} = req.body
  
    sgMail.setApiKey(process.env.SENDGRID_APIKEY);
  
    if (!email) {
      res.status(400).json({ error: 'Please provide an email address' });
      return;
    }
    try {
      const user = await Customer.findOne({ email });
  
      if (!user) throw new Error("User does not exist");
  
  
      const userId = user.id; // Get the user's ID
  
      const resetToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Generate the reset token
  
      const resetLink = `https://e-commerce-munene-m/reset-password?token=${resetToken}`;//remember to change this to a client side route with the form to reset credentials
  
      const msg = {
        to: email,
        from: 'macmunene364@gmail.com',//remember to change this to the official client side email
        subject: 'Reset Your Password',
        text: `Click the following link to reset your password: ${resetLink}`,
      };
      sgMail
      .send(msg)
      .then(() => {
        res.status(200).json({ message: 'Reset password email sent' });
      })
      .catch((error) => {
        res.status(400).json({ error: 'Failed to send reset password email' });
        console.error('Error sending reset password email:', error);
      });
    } catch (error) {
      res.status(400).json({ error: 'Failed to initiate password reset' });
      console.log(error)
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
      const user = await Customer.findOne({ _id: userId });
  
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
      res.status(400).json({ error: 'Failed to update password' });
      console.log(error);
    }
  };

  export async function getCustomers(req, res) {
    try {
      const customers = await Customer.find();
  
      if (!customers) {
        res.status(400);
        throw new Error("There are no customers in the database");
      } else {
        res.status(200).json(customers);
      }
    } catch (error) {
      res.status(500).json({ message: "Customers not found" });
      console.error("Error getting customers:", error);
    }
  }

  export async function getCustomer(req, res) {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        res.status(400);
        throw new Error("This customer does not exist");
      } else {
        res.status(200).json(customer);
      }
    } catch (error) {
      res.status(400).json({ message: "This customer does not exist!" });
      console.error("Error getting customers:", error);
    }
  }
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  };

export default { createCustomer, loginCustomer, resetPassword, updatePassword, getCustomers, getCustomer }