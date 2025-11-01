import jwt from "jsonwebtoken";

const isAdmin = (req, res, next) => {
  const token = req.cookies?.adminToken || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === "admin") {
      next();
    } else {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

export default isAdmin;
