import customer from "../models/customer.js";
import bcrypt from "bcrypt"
import session from "express-session";
import jwt from 'jsonwebtoken'

//Register customer
export async function createCustomer (req, res){ 
    try {
        const { username, email, password, phoneNumber, location } = req.body

        const existingCustomer = await customer.findOne({email})
        if (existingCustomer) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newCustomer = new customer({
            username,
            email,
            phoneNumber,
            password: hashedPassword,
            location
          });
      
          // Save the customer to the database
          const savedCustomer = await newCustomer.save();

      
          res.status(201).json({
            _id: savedCustomer.id,
            username: savedCustomer.username,
            email: savedCustomer.email,
            phoneNumber: savedCustomer.phoneNumber,
            location: savedCustomer.location,
            token: generateToken(savedCustomer._id),
          });

    } catch (error) {
        console.error('Error registering customer:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
}

export async function loginCustomer(req, res) {
    try {
      const { email, password } = req.body;
  
      if (!email || !password) {
        res.status(400);
        throw new Error("Please enter all the required fields");
      }
  
      const user = await customer.findOne({ email });
  
      if (user && (await bcrypt.compare(password, user.password))) {
        // Generate a token for the user
        const token = generateToken(user._id);
  
        // Create a session for the user
        req.session.customerId = user._id;
  
        res.status(200).json({
          _id: user._id,
          username: user.username,
          email: user.email,
          location: user.location,
          phoneNumber: user.phoneNumber,
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

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  };

export default { createCustomer, loginCustomer }