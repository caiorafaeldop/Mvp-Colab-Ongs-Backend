const Validators = require("../../utils/validators");

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  register = async (req, res) => {
    try {
      console.log("[REGISTER] Request body:", req.body);
      const userData = Validators.sanitizeObject(req.body);
      const { name, email, password, userType, phone } = userData;
      console.log("[REGISTER] Sanitized userData:", userData);

      // Validate user data
      const validation = Validators.validateUserRegistration(userData);
      console.log("[REGISTER] Validation result:", validation);
      if (!validation.isValid) {
        console.log("[REGISTER] Validation failed:", validation.errors);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const result = await this.authService.register(userData);
      console.log("[REGISTER] Registration result:", result);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      console.error("[REGISTER] Error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  login = async (req, res) => {
    try {
      console.log("[LOGIN] Request body:", req.body);
      const loginData = Validators.sanitizeObject(req.body);
      const { email, password } = loginData;
      console.log("[LOGIN] Sanitized loginData:", loginData);

      // Validate login data
      const validation = Validators.validateLogin(loginData);
      console.log("[LOGIN] Validation result:", validation);
      if (!validation.isValid) {
        console.log("[LOGIN] Validation failed:", validation.errors);
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
      }

      const result = await this.authService.login(
        loginData.email,
        loginData.password
      );
      console.log("[LOGIN] Login result:", result);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      console.error("[LOGIN] Error:", error);
      res.status(401).json({
        success: false,
        message: error.message,
      });
    }
  };

  getProfile = async (req, res) => {
    try {
      res.status(200).json({
        success: true,
        data: {
          id: req.user.id,
          email: req.user.email,
          userType: req.user.userType,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching profile",
      });
    }
  };
}

module.exports = AuthController;
