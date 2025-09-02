const IAuthService = require("../../domain/services/IAuthService");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../domain/entities/User");

class JwtAuthService extends IAuthService {
  constructor(userRepository, jwtSecret) {
    super();
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret;
  }

  async register(userData) {
    try {
      console.log("[REGISTER] Dados recebidos:", userData);
      const existingUser = await this.userRepository.findByEmail(
        userData.email
      );
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

      const token = await this.generateToken(savedUser);
      console.log("[REGISTER] Token gerado:", token);

      return {
        user: {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
          userType: savedUser.userType,
          phone: savedUser.phone,
        },
        token,
      };
    } catch (error) {
      console.error("[REGISTER] Erro no registro:", error.message);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(email, password) {
    try {
      console.log("[JWT LOGIN] Email recebido:", email);
      console.log("[JWT LOGIN] Senha recebida:", password);
      const user = await this.userRepository.findByEmail(email);
      console.log("[JWT LOGIN] Usuário encontrado:", user);

      if (!user) {
        console.log("[JWT LOGIN] Nenhum usuário encontrado para o email.");
        throw new Error("Invalid credentials");
      }

      console.log("[JWT LOGIN] Hash armazenado no usuário:", user.password);
      console.log("[JWT LOGIN] Chamando comparePassword do JwtAuthService");
      const isValidPassword = await this.comparePassword(
        password,
        user.password
      );
      console.log(
        "[JWT LOGIN] Resultado da comparação de senha:",
        isValidPassword
      );

      const token = await this.generateToken(user);
      console.log("[JWT LOGIN] Token gerado com sucesso.");

      return {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          phone: user.phone,
        },
        token,
      };
    } catch (error) {
      console.log("[JWT LOGIN] Erro no login:", error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async generateToken(user) {
    try {
      const payload = {
        id: user._id,
        email: user.email,
        userType: user.userType,
      };

      return jwt.sign(payload, this.jwtSecret, { expiresIn: "24h" });
    } catch (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      const user = await this.userRepository.findById(decoded.id);

      if (!user) {
        throw new Error("User not found");
      }

      return {
        id: user.id,
        email: user.email,
        userType: user.userType,
      };
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
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
      console.log("[JWT COMPARE] Senha recebida:", password);
      console.log("[JWT COMPARE] Tipo da senha:", typeof password);
      console.log("[JWT COMPARE] Comprimento da senha:", password.length);
      console.log("[JWT COMPARE] Hash armazenado:", hashedPassword);
      console.log("[JWT COMPARE] Tipo do hash:", typeof hashedPassword);
      console.log("[JWT COMPARE] Comprimento do hash:", hashedPassword.length);

      const isMatch = await bcrypt.compare(password, hashedPassword);
      console.log("[JWT COMPARE] Resultado da comparação:", isMatch);

      if (!isMatch) {
        console.log("[JWT COMPARE] Senha inválida");
        throw new Error("Invalid credentials");
      }

      return true; // Retorna explicitamente true se a comparação for bem-sucedida
    } catch (error) {
      console.error("[JWT COMPARE] Erro na comparação:", error.message);
      throw new Error(`Password comparison failed: ${error.message}`);
    }
  }
}

module.exports = JwtAuthService;
