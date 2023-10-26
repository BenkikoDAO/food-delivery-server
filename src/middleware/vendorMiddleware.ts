import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import vendor from "../models/vendor";

interface DecodedToken extends JwtPayload {
  userId: string; // Adjust the structure as needed based on your token
}
const vendorProtect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as DecodedToken;

    const user = await vendor.findById(decoded.id).select("-password");
    if (user) {
      req.user = { id: user._id, ...user };
    }

    next();
  } else {
    res.status(401);
    throw new Error("Unauthorized attempt");
  }
  if (!token) {
    res.status(401);
    throw new Error("No authorization without token");
  }
};

export default vendorProtect;
