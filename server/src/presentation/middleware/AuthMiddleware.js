const authMiddleware = (authService) => {
  return async (req, res, next) => {
    console.log("[AUTH MIDDLEWARE] Headers:", req.headers);
    try {
      const token = req.headers.authorization?.replace("Bearer ", "");
      console.log("[AUTH MIDDLEWARE] Token:", token);

      if (!token) {
        console.log("[AUTH MIDDLEWARE] No token provided");
        return res.status(401).json({
          success: false,
          message: "Access token required",
        });
      }

      const decoded = await authService.verifyToken(token);
      console.log("[AUTH MIDDLEWARE] Decoded token:", decoded);
      req.user = decoded;
      next();
    } catch (error) {
      console.log("[AUTH MIDDLEWARE] Error verifying token:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  };
};

const organizationMiddleware = () => {
  return (req, res, next) => {
    if (req.user.userType !== "organization") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only organizations can perform this action.",
      });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  organizationMiddleware,
};
