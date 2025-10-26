// Interface removida na limpeza
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../../domain/entities/User');
const { getVerificationCodeRepository } = require('../repositories/VerificationCodeRepository');
const { getEmailService } = require('./EmailService');

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

    // Serviços para verificação de email
    this.verificationCodeRepository = getVerificationCodeRepository();
    this.emailService = getEmailService();
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
   * Registro simplificado - NOVO FLUXO COM VERIFICAÇÃO DE EMAIL
   */
  async register(userData) {
    try {
      console.log('[SIMPLE JWT AUTH] Registro iniciado:', { email: userData?.email });

      // Validação básica
      this.validateRegistrationData(userData);

      // USAR RegisterUserUseCase com VerifyEmailUseCase
      const RegisterUserUseCase = require('../../application/use-cases/RegisterUserUseCase');
      const VerifyEmailUseCase = require('../../application/use-cases/VerifyEmailUseCase');
      const {
        MongoVerificationCodeRepository,
      } = require('../repositories/MongoVerificationCodeRepository');
      const { getEmailService } = require('./EmailService');
      const { getDatabase } = require('../database/mongodb');

      const db = getDatabase();
      const verificationCodeRepository = new MongoVerificationCodeRepository(db);
      const emailService = getEmailService();
      const verifyEmailUseCase = new VerifyEmailUseCase(
        this.userRepository,
        verificationCodeRepository,
        emailService
      );

      const registerUserUseCase = new RegisterUserUseCase(
        this.userRepository,
        console, // logger
        verifyEmailUseCase
      );

      // Executar registro (envia email mas NÃO cria usuário ainda)
      const result = await registerUserUseCase.execute({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone || '',
        userType: userData.userType || 'common',
      });

      console.log('[SIMPLE JWT AUTH] Código de verificação enviado:', result);

      // Retornar resposta indicando que precisa verificar email
      return {
        message: result.message,
        requiresVerification: true,
        data: {
          email: result.data.email,
          emailPreviewUrl: result.data.emailPreviewUrl,
        },
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

    // VALIDAÇÃO TEMPORARIAMENTE DESATIVADA
    // if (!password || typeof password !== 'string' || password.length < 6) {
    //   throw new Error('Password must be at least 6 characters long');
    // }

    // NOTA: userType não é validado aqui pois RegisterUserUseCase sempre força 'common'
    // Apenas organizações podem ter outros tipos, criados manualmente
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
      const saltRounds = process.env.NODE_ENV === 'production' ? 8 : 10;
      const salt = await bcrypt.genSalt(saltRounds);
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

  /**
   * Enviar email de verificação
   */
  async sendVerificationEmail(email, name) {
    try {
      // Verificar rate limiting (máximo 3 códigos em 5 minutos)
      const recentAttempts = await this.verificationCodeRepository.countRecentAttempts(
        email,
        'email_verification',
        5
      );

      if (recentAttempts >= 3) {
        throw new Error('Muitas tentativas. Aguarde 5 minutos antes de solicitar um novo código.');
      }

      // Invalidar códigos anteriores
      await this.verificationCodeRepository.invalidatePreviousCodes(email, 'email_verification');

      // Gerar novo código
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Salvar código no banco
      await this.verificationCodeRepository.create({
        email,
        code,
        type: 'email_verification',
        expiresAt,
      });

      // Enviar email
      const emailResult = await this.emailService.sendVerificationEmail(email, name, code);

      return emailResult;
    } catch (error) {
      console.error('[SIMPLE JWT AUTH] Erro ao enviar email de verificação:', error.message);
      throw error;
    }
  }
}

module.exports = SimpleJwtAuthService;
