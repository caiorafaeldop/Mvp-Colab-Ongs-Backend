const IAuthService = require("../../domain/services/IAuthService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../domain/entities/User");

class EnhancedJwtAuthService extends IAuthService {
  constructor(userRepository, jwtSecret, jwtRefreshSecret) {
    super();
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
    this.jwtRefreshSecret = jwtRefreshSecret;
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  }

  async register(userData) {
    try {
      console.log("[REGISTER] Dados recebidos:", userData);
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        console.log("[REGISTER] Usuário já existe:", userData.email);
        throw new Error("User already exists with this email");
      }

      let user;
      if (userData.userType === "organization") {
        console.log("[REGISTER] Criando usuário organizacional");
        user = User.createOrganizationUser(
          userData.name,
          userData.email,
          userData.password,
          userData.phone
        );
      } else {
        console.log("[REGISTER] Criando usuário comum");
        user = User.createCommonUser(
          userData.name,
          userData.email,
          userData.password,
          userData.phone
        );
      }
      console.log("[REGISTER] Usuário criado:", user);

      user.password = await this.hashPassword(user.password);
      console.log("[REGISTER] Usuário após hash:", user);

      const savedUser = await this.userRepository.save(user);
      console.log("[REGISTER] Usuário salvo:", savedUser);

      const tokens = await this.generateTokenPair(savedUser);
      console.log("[REGISTER] Tokens gerados");

      return {
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          userType: savedUser.userType,
          phone: savedUser.phone,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.error("[REGISTER] Erro no registro:", error.message);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(email, password) {
    try {
      console.log("[ENHANCED LOGIN] Email recebido:", email);
      const user = await this.userRepository.findByEmail(email);
      console.log("[ENHANCED LOGIN] Usuário encontrado:", !!user);

      if (!user) {
        console.log("[ENHANCED LOGIN] Nenhum usuário encontrado para o email.");
        throw new Error("Invalid credentials");
      }

      console.log("[ENHANCED LOGIN] Verificando senha");
      const isValidPassword = await this.comparePassword(password, user.password);
      console.log("[ENHANCED LOGIN] Senha válida:", isValidPassword);

      if (!isValidPassword) {
        throw new Error("Invalid credentials");
      }

      const tokens = await this.generateTokenPair(user);
      console.log("[ENHANCED LOGIN] Tokens gerados com sucesso");

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          phone: user.phone,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.log("[ENHANCED LOGIN] Erro no login:", error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async refreshAccessToken(refreshToken) {
    try {
      console.log("[REFRESH] Verificando refresh token");
      console.log("[REFRESH] JWT_REFRESH_SECRET usado:", this.jwtRefreshSecret ? 'DEFINIDO' : 'UNDEFINED');
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret);
      console.log("[REFRESH] Refresh token decodificado:", decoded);
      console.log("[REFRESH] ID do usuário no token:", decoded.id);
      
      const user = await this.userRepository.findById(decoded.id);
      console.log("[REFRESH] Usuário encontrado:", !!user);
      console.log("[REFRESH] Detalhes do usuário:", user ? { id: user._id, email: user.email } : 'NENHUM');

      if (!user) {
        console.error("[REFRESH] Usuário não encontrado para ID:", decoded.id);
        throw new Error("User not found");
      }

      console.log("[REFRESH] Gerando novo access token");
      const newAccessToken = await this.generateAccessToken(user);

      return {
        accessToken: newAccessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          phone: user.phone,
        },
      };
    } catch (error) {
      console.error("[REFRESH] Erro ao renovar token:", error.message);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  async generateTokenPair(user) {
    try {
      const accessToken = await this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user);

      return { accessToken, refreshToken };
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  async generateAccessToken(user) {
    try {
      console.log("[GENERATE ACCESS TOKEN] Gerando token para usuário:", user.id || user._id);
      console.log("[GENERATE ACCESS TOKEN] JWT_SECRET usado:", this.jwtSecret ? 'DEFINIDO' : 'UNDEFINED');
      console.log("[GENERATE ACCESS TOKEN] Tamanho do JWT_SECRET:", this.jwtSecret ? this.jwtSecret.length : 0);
      console.log("[GENERATE ACCESS TOKEN] Expiry:", this.accessTokenExpiry);
      
      const userId = user.id || user._id;
      console.log("[GENERATE ACCESS TOKEN] ID do usuário usado:", userId);
      
      const payload = {
        id: userId,
        email: user.email,
        userType: user.userType,
        type: "access",
      };
      console.log("[GENERATE ACCESS TOKEN] Payload:", payload);

      const token = jwt.sign(payload, this.jwtSecret, { 
        expiresIn: this.accessTokenExpiry 
      });
      console.log("[GENERATE ACCESS TOKEN] Token gerado com sucesso, tamanho:", token.length);
      return token;
    } catch (error) {
      console.error("[GENERATE ACCESS TOKEN] Erro ao gerar token:", error.message);
      throw new Error(`Access token generation failed: ${error.message}`);
    }
  }

  async generateRefreshToken(user) {
    try {
      const userId = user.id || user._id;
      console.log("[GENERATE REFRESH TOKEN] Gerando refresh token para usuário:", userId);
      console.log("[GENERATE REFRESH TOKEN] JWT_REFRESH_SECRET usado:", this.jwtRefreshSecret ? 'DEFINIDO' : 'UNDEFINED');
      console.log("[GENERATE REFRESH TOKEN] Expiry:", this.refreshTokenExpiry);
      
      const payload = {
        id: userId,
        email: user.email,
        userType: user.userType,
        type: "refresh",
      };
      console.log("[GENERATE REFRESH TOKEN] Payload:", payload);

      const token = jwt.sign(payload, this.jwtRefreshSecret, { 
        expiresIn: this.refreshTokenExpiry 
      });
      console.log("[GENERATE REFRESH TOKEN] Refresh token gerado com sucesso, tamanho:", token.length);
      return token;
    } catch (error) {
      throw new Error(`Refresh token generation failed: ${error.message}`);
    }
  }

  // Método mantido para compatibilidade
  async generateToken(user) {
    return this.generateAccessToken(user);
  }

  async verifyToken(token) {
    try {
      console.log("[VERIFY TOKEN] Token recebido:", token);
      console.log("[VERIFY TOKEN] JWT_SECRET usado:", this.jwtSecret ? 'DEFINIDO' : 'UNDEFINED');
      console.log("[VERIFY TOKEN] Tamanho do JWT_SECRET:", this.jwtSecret ? this.jwtSecret.length : 0);
      
      const decoded = jwt.verify(token, this.jwtSecret);
      console.log("[VERIFY TOKEN] Token decodificado:", decoded);
      
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        console.log("[VERIFY TOKEN] Usuário não encontrado para ID:", decoded.id);
        throw new Error("User not found");
      }
      console.log("[VERIFY TOKEN] Usuário encontrado:", !!user);
      console.log("[VERIFY TOKEN] User object completo:", user);
      console.log("[VERIFY TOKEN] user.id:", user.id);
      console.log("[VERIFY TOKEN] user._id:", user._id);
      console.log("[VERIFY TOKEN] Resultado da verificação:", {
        id: user.id,
        email: user.email,
        userType: user.userType
      });
      return user;
    } catch (error) {
      console.error("[VERIFY TOKEN] Erro na verificação:");
      console.error("[VERIFY TOKEN] Erro message:", error.message);
      console.error("[VERIFY TOKEN] Erro name:", error.name);
      console.error("[VERIFY TOKEN] JWT_SECRET disponível:", this.jwtSecret ? 'SIM' : 'NÃO');
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtRefreshSecret);
      const user = await this.userRepository.findById(decoded.id);

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user._id,
        email: user.email,
        userType: user.userType,
      };
    } catch (error) {
      throw new Error(`Refresh token verification failed: ${error.message}`);
    }
  }

  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  async comparePassword(password, hashedPassword) {
    try {
      console.log("[ENHANCED COMPARE] Verificando senha");
      const isMatch = await bcrypt.compare(password, hashedPassword);
      console.log("[ENHANCED COMPARE] Resultado da comparação:", isMatch);

      if (!isMatch) {
        console.log("[ENHANCED COMPARE] Senha inválida");
        throw new Error("Invalid credentials");
      }

      return true;
    } catch (error) {
      console.error("[ENHANCED COMPARE] Erro na comparação:", error.message);
      throw new Error(`Password comparison failed: ${error.message}`);
    }
  }
}

module.exports = EnhancedJwtAuthService;
