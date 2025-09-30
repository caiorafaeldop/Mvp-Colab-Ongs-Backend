// Interface removida na limpeza
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../../domain/entities/User');

/**
 * Interface do serviço de autenticação
 * Sistema de autenticação JWT simples e eficiente
 * Baseado no sistema do projeto Maia Advocacia
 * Sem cookies complexos, apenas tokens JWT limpos
 */
class SimpleJwtAuthService {
  constructor(userRepository, jwtSecret) {
    // super() removido na limpeza
    this.userRepository = userRepository;
    this.jwtSecret = jwtSecret || process.env.JWT_SECRET || 'default-secret';
  }

  /**
   * Interface JWT Payload
   */
  createPayload(user) {
    return {
      sub: user.id || user._id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 45 * 60, // 45 minutos
    };
  }

  /**
   * Cria token JWT simples usando crypto nativo
   */
  createSimpleToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${header}.${payloadStr}`)
      .digest('base64url');

    return `${header}.${payloadStr}.${signature}`;
  }

  /**
   * Verifica token JWT usando crypto nativo
   */
  verifySimpleToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [header, payload, signature] = parts;

    // Verificar assinatura
    const expectedSignature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    // Parse payload
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());

    // Verificar expiração
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return decodedPayload;
  }

  /**
   * Gera tokens de acesso e refresh
   */
  async generateTokens(user) {
    const now = Math.floor(Date.now() / 1000);

    const accessPayload = {
      sub: user.id || user._id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      iat: now,
      exp: now + 45 * 60, // 45 minutos
    };

    const refreshPayload = {
      sub: user.id || user._id,
      email: user.email,
      name: user.name,
      userType: user.userType,
      iat: now,
      exp: now + 7 * 24 * 60 * 60, // 7 dias
    };

    const accessToken = this.createSimpleToken(accessPayload);
    const refreshToken = this.createSimpleToken(refreshPayload);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login simplificado
   */
  async login(email, password) {
    try {
      console.log('[SIMPLE JWT AUTH] Login iniciado:', { email });

      // Buscar usuário
      const user = await this.userRepository.findByEmail(email.toLowerCase().trim());

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verificar senha
      const isPasswordValid = await this.comparePassword(password, user.password);

      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Gerar tokens
      const tokens = await this.generateTokens(user);

      // Retornar dados limpos
      return {
        message: 'Login successful',
        user: {
          id: user.id || user._id,
          email: user.email,
          name: user.name,
          userType: user.userType,
          phone: user.phone,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.error('[SIMPLE JWT AUTH] Erro no login:', error.message);
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * Registro simplificado
   */
  async register(userData) {
    try {
      console.log('[SIMPLE JWT AUTH] Registro iniciado:', { email: userData?.email });

      // Validação básica
      this.validateRegistrationData(userData);

      // Verificar se usuário já existe
      const existingUser = await this.userRepository.findByEmail(
        userData.email.toLowerCase().trim()
      );
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Criar usuário (usar fábricas para manter ordem correta dos campos)
      const lowerEmail = userData.email.toLowerCase().trim();
      const user =
        userData.userType === 'organization'
          ? User.createOrganizationUser(
              userData.name.trim(),
              lowerEmail,
              userData.password,
              userData.phone?.trim()
            )
          : User.createCommonUser(
              userData.name.trim(),
              lowerEmail,
              userData.password,
              userData.phone?.trim()
            );

      // Hash da senha
      user.password = await this.hashPassword(user.password);

      // Salvar usuário
      const savedUser = await this.userRepository.save(user);

      // Gerar tokens
      const tokens = await this.generateTokens(savedUser);

      return {
        message: 'User registered successfully',
        user: {
          id: savedUser.id || savedUser._id,
          email: savedUser.email,
          name: savedUser.name,
          userType: savedUser.userType,
          phone: savedUser.phone,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      console.error('[SIMPLE JWT AUTH] Erro no registro:', error.message);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * Refresh de tokens
   */
  async refreshTokens(refreshToken) {
    try {
      const payload = this.verifySimpleToken(refreshToken);

      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        userType: payload.userType,
      };

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verificação de token de acesso
   */
  async verifyAccessToken(token) {
    try {
      const payload = this.verifySimpleToken(token);

      // Buscar usuário para garantir que ainda existe
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  /**
   * Validação de dados de registro
   */
  validateRegistrationData(userData) {
    if (!userData || typeof userData !== 'object') {
      throw new Error('User data is required');
    }

    const { name, email, password, userType } = userData;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (!email || typeof email !== 'string' || !this.isValidEmail(email)) {
      throw new Error('Valid email is required');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (userType && !['organization', 'common'].includes(userType)) {
      throw new Error('User type must be either "organization" or "common"');
    }
  }

  /**
   * Validação de email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Hash de senha
   */
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Comparação de senha
   */
  async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error(`Password comparison failed: ${error.message}`);
    }
  }

  // Métodos de compatibilidade com o sistema antigo
  async generateToken(user) {
    const tokens = await this.generateTokens(user);
    return tokens.accessToken;
  }

  async verifyToken(token) {
    return this.verifyAccessToken(token);
  }

  async generateAccessToken(user) {
    const tokens = await this.generateTokens(user);
    return tokens.accessToken;
  }

  async generateRefreshToken(user) {
    const tokens = await this.generateTokens(user);
    return tokens.refreshToken;
  }

  async refreshAccessToken(refreshToken) {
    const tokens = await this.refreshTokens(refreshToken);
    return {
      accessToken: tokens.accessToken,
    };
  }
}

module.exports = SimpleJwtAuthService;
