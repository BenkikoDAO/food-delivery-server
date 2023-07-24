import jwt from 'jsonwebtoken'
import vendor from '../models/vendor.js';
const vendorProtect = async (req, res, next) => {
  let token;
  if ( req.headers.authorization && req.headers.authorization.startsWith("Bearer") ) {
    token = req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await vendor.findById(decoded.id).select("-password");

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

export default vendorProtect
