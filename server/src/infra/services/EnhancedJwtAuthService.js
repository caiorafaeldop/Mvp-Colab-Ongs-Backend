const IAuthService = require("../../domain/contracts/AuthServiceContract");
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

  // CHAIN OF RESPONSIBILITY PATTERN: Pipeline de validação de registro
  // Cada etapa valida um aspecto e passa para a próxima se bem-sucedida
  async register(userData) {
    try {
      console.log("[ENHANCED JWT AUTH] Registro iniciado:", { email: userData?.email });
      
      // CHAIN STEP 1: Validação e sanitização dos dados de entrada
      const sanitizedData = this._validateAndSanitizeRegistrationData(userData);
      console.log("[ENHANCED JWT AUTH] Dados validados e sanitizados");
      
      // CHAIN STEP 2: Verificar se usuário já existe
      const existingUser = await this.userRepository.findByEmail(sanitizedData.email);
      if (existingUser) {
        console.log("[ENHANCED JWT AUTH] Usuário já existe:", sanitizedData.email);
        throw new Error("User already exists with this email");
      }

      // CHAIN STEP 3: Criar entidade de usuário baseada no tipo
      let user;
      if (sanitizedData.userType === "organization") {
        console.log("[ENHANCED JWT AUTH] Criando usuário organizacional");
        user = new User(sanitizedData.name, sanitizedData.email, sanitizedData.password, "organization", sanitizedData.phone);
      } else {
        console.log("[ENHANCED JWT AUTH] Criando usuário comum");
        user = new User(sanitizedData.name, sanitizedData.email, sanitizedData.password, "common", sanitizedData.phone);
      }

      // CHAIN STEP 4: Hash da senha
      console.log("[ENHANCED JWT AUTH] Fazendo hash da senha");
      user.password = await this.hashPassword(user.password);

      // CHAIN STEP 5: Salvar usuário
      console.log("[ENHANCED JWT AUTH] Salvando usuário no banco");
      const savedUser = await this.userRepository.create(user);
      console.log("[ENHANCED JWT AUTH] Usuário salvo com sucesso:", savedUser.id);

      // CHAIN STEP 6: Gerar tokens (final da cadeia)
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

  // CHAIN OF RESPONSIBILITY PATTERN: Pipeline de validação de login
  // Cada etapa valida um aspecto e passa para a próxima se bem-sucedida
  async login(email, password) {
    try {
      console.log("[ENHANCED JWT AUTH] Login iniciado:", { email });
      
      // CHAIN STEP 1: Validação dos dados de entrada
      const sanitizedCredentials = this._validateAndSanitizeLoginData({ email, password });
      console.log("[ENHANCED JWT AUTH] Credenciais validadas");
      
      // CHAIN STEP 2: Buscar usuário por email
      const user = await this.userRepository.findByEmail(sanitizedCredentials.email);
      console.log("[ENHANCED JWT AUTH] Usuário encontrado:", !!user);

      if (!user) {
        console.log("[ENHANCED JWT AUTH] Usuário não encontrado");
        throw new Error("Invalid credentials");
      }

      // CHAIN STEP 3: Verificar senha
      console.log("[ENHANCED JWT AUTH] Verificando senha");
      const isValidPassword = await this.comparePassword(sanitizedCredentials.password, user.password);
      console.log("[ENHANCED JWT AUTH] Senha válida:", isValidPassword);

      if (!isValidPassword) {
        throw new Error("Invalid credentials");
      }

      // CHAIN STEP 4: Gerar tokens (final da cadeia)
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

  /**
   * Valida e sanitiza dados de registro
   * @param {Object} userData - Dados do usuário
   * @returns {Object} Dados sanitizados
   * @private
   */
  _validateAndSanitizeRegistrationData(userData) {
    if (!userData || typeof userData !== 'object') {
      throw new Error('User data is required');
    }

    const { name, email, password, userType, phone } = userData;

    // Validações obrigatórias
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (!email || typeof email !== 'string' || !this._isValidEmail(email)) {
      throw new Error('Valid email is required');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (!userType || !['organization', 'common'].includes(userType)) {
      throw new Error('User type must be either "organization" or "common"');
    }

    if (!phone || typeof phone !== 'string' || !this._isValidPhone(phone)) {
      throw new Error('Valid phone number is required');
    }

    // Sanitização
    return {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      userType: userType,
      phone: phone.trim()
    };
  }

  /**
   * Valida e sanitiza dados de login
   * @param {Object} credentials - Credenciais de login
   * @returns {Object} Credenciais sanitizadas
   * @private
   */
  _validateAndSanitizeLoginData(credentials) {
    if (!credentials || typeof credentials !== 'object') {
      throw new Error('Login credentials are required');
    }

    const { email, password } = credentials;

    if (!email || typeof email !== 'string' || !this._isValidEmail(email)) {
      throw new Error('Valid email is required');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      throw new Error('Password is required');
    }

    return {
      email: email.toLowerCase().trim(),
      password: password
    };
  }

  /**
   * Valida formato de email
   * @param {string} email - Email para validar
   * @returns {boolean} True se válido
   * @private
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de telefone
   * @param {string} phone - Telefone para validar
   * @returns {boolean} True se válido
   * @private
   */
  _isValidPhone(phone) {
    // Aceita formatos: +5511999999999, 5511999999999, 11999999999
    const phoneRegex = /^(\+?55)?[1-9]{2}9?[0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }
}

module.exports = EnhancedJwtAuthService;
