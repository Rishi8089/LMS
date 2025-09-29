import jwt from "jsonwebtoken";

const isAuth = (req, res, next) => {
  try {
    let token = req.cookies?.token;
    console.log("Token from cookies:", token);
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) return res.status(401).json({ message: "Not authorized, no token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.employee = { id: decoded.id };
    next();
  } catch (err) {
    console.error("isAuth error:", err.message);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

export default isAuth;
