import Customer from "../models/customer.js";
import Token from "../models/token.js"
import bcrypt from "bcrypt"
import session from "express-session";
import jwt from 'jsonwebtoken'
import crypto from "crypto"
const bcryptSalt = process.env.BCRYPT_SALT

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
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'An error occurred' });
    }
  }

  export async function resetPassword (req, res){
    const { email } = req.body;

    // Validate the email address
    if (!email) {
      res.status(400).json({ error: 'Please provide an email address' });
      return;
    }
    try {
      const user = await Customer.findOne({ email });

      if (!user) throw new Error("User does not exist");

      let token = await Token.findOne({ userId: user._id });
      if (token) await token.deleteOne();
      let resetToken = crypto.randomBytes(32).toString("hex");
      const hash = await bcrypt.hash(resetToken, Number(bcryptSalt));

      await new Token({
        userId: user._id,
        token: hash,
        createdAt: Date.now(),
      }).save();

      // Send the password reset email to the user
    const resetLink = `https://your-website.com/reset-password?token=${resetToken}`;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'your-email@example.com',
        pass: 'your-email-password',
      },
    });

    const mailOptions = {
      from: 'your-email@example.com',
      to: user.email,
      subject: 'Password Reset',
      text: `Dear ${user.username},\n\nPlease click the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset email sent' });

    } catch (error) {
      console.log(error)
    }
  }

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  };

export default { createCustomer, loginCustomer }