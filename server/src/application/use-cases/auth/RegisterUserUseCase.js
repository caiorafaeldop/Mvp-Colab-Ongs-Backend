const bcrypt = require('bcrypt');

/**
 * Use Case para registro de usuário
 * Responsabilidade única: registrar um novo usuário no sistema
 */
class RegisterUserUseCase {
  constructor(userRepository, logger) {
    this.userRepository = userRepository;
    this.logger = logger;
  }

  /**
   * Executa o caso de uso de registro
   * @param {CreateUserDTO} createUserDTO - DTO com dados validados
   * @returns {Promise<Object>} Resultado do registro
   */
  async execute(createUserDTO) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Iniciando registro de usuário', {
        useCase: 'RegisterUserUseCase',
        userData: createUserDTO.toLogObject()
      });

      // 1. Verificar se usuário já existe
      const existingUser = await this.userRepository.findByEmail(createUserDTO.getEmail());
      
      if (existingUser) {
        this.logger.warn('Tentativa de registro com email já existente', {
          email: createUserDTO.getEmail(),
          useCase: 'RegisterUserUseCase'
        });
        
        throw new Error('Email já está em uso');
      }

      // 2. Hash da senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(createUserDTO.getPassword(), saltRounds);

      // 3. Preparar dados para persistência
      const userData = {
        ...createUserDTO.toPlainObject(),
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        emailVerified: false
      };

      // 4. Criar usuário no banco
      const createdUser = await this.userRepository.create(userData);

      // 5. Preparar resposta (sem dados sensíveis)
      const userResponse = {
        id: createdUser.id || createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        phone: createdUser.phone,
        organizationType: createdUser.organizationType,
        description: createdUser.description,
        address: createdUser.address,
        isActive: createdUser.isActive,
        emailVerified: createdUser.emailVerified,
        createdAt: createdUser.createdAt
      };

      const executionTime = Date.now() - startTime;
      
      this.logger.info('Usuário registrado com sucesso', {
        useCase: 'RegisterUserUseCase',
        userId: userResponse.id,
        email: userResponse.email,
        executionTime: `${executionTime}ms`
      });

      return {
        success: true,
        user: userResponse,
        message: 'Usuário registrado com sucesso'
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error('Erro ao registrar usuário', {
        useCase: 'RegisterUserUseCase',
        error: error.message,
        stack: error.stack,
        userData: createUserDTO.toLogObject(),
        executionTime: `${executionTime}ms`
      });

      // Re-throw com informação mais amigável se necessário
      if (error.message === 'Email já está em uso') {
        throw error;
      }

      throw new Error('Erro interno ao registrar usuário');
    }
  }

  /**
   * Valida se o repositório está disponível
   * @returns {boolean} True se válido
   */
  isValid() {
    return this.userRepository && typeof this.userRepository.create === 'function';
  }

  /**
   * Retorna informações sobre o Use Case
   * @returns {Object} Metadados do Use Case
   */
  getMetadata() {
    return {
      name: 'RegisterUserUseCase',
      description: 'Registra um novo usuário no sistema',
      version: '1.0.0',
      dependencies: ['userRepository', 'logger'],
      inputs: ['CreateUserDTO'],
      outputs: ['UserResponse']
    };
  }
}

module.exports = RegisterUserUseCase;
