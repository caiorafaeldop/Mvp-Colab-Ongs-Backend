/**
 * Índice de todos os Use Cases da aplicação
 * Facilita importação e organização
 */

// Use Cases de Autenticação
const RegisterUserUseCase = require('./auth/RegisterUserUseCase');
const LoginUserUseCase = require('./auth/LoginUserUseCase');

// Use Cases de Doações
const CreateDonationUseCase = require('./donations/CreateDonationUseCase');

// Factory para criação de Use Cases com dependências injetadas
class UseCaseFactory {
  constructor(repositories, services, adapters, logger) {
    this.repositories = repositories;
    this.services = services;
    this.adapters = adapters;
    this.logger = logger;
  }

  /**
   * Cria instância do RegisterUserUseCase
   * @returns {RegisterUserUseCase}
   */
  createRegisterUserUseCase() {
    return new RegisterUserUseCase(
      this.repositories.userRepository,
      this.logger
    );
  }

  /**
   * Cria instância do LoginUserUseCase
   * @returns {LoginUserUseCase}
   */
  createLoginUserUseCase() {
    return new LoginUserUseCase(
      this.repositories.userRepository,
      this.services.authService,
      this.logger
    );
  }

  /**
   * Cria instância do CreateDonationUseCase
   * @returns {CreateDonationUseCase}
   */
  createCreateDonationUseCase() {
    return new CreateDonationUseCase(
      this.repositories.donationRepository,
      this.repositories.userRepository,
      this.adapters.paymentAdapter,
      this.logger
    );
  }

  /**
   * Cria todos os Use Cases de uma vez
   * @returns {Object} Objeto com todos os Use Cases
   */
  createAllUseCases() {
    return {
      registerUserUseCase: this.createRegisterUserUseCase(),
      loginUserUseCase: this.createLoginUserUseCase(),
      createDonationUseCase: this.createCreateDonationUseCase()
    };
  }

  /**
   * Valida se todas as dependências estão disponíveis
   * @returns {boolean} True se válido
   */
  isValid() {
    return this.repositories && 
           this.services && 
           this.adapters && 
           this.logger;
  }

  /**
   * Retorna informações sobre os Use Cases disponíveis
   * @returns {Array} Lista de metadados dos Use Cases
   */
  getAvailableUseCases() {
    const useCases = this.createAllUseCases();
    
    return Object.values(useCases).map(useCase => {
      if (typeof useCase.getMetadata === 'function') {
        return useCase.getMetadata();
      }
      return { name: useCase.constructor.name };
    });
  }
}

module.exports = {
  // Use Cases individuais
  RegisterUserUseCase,
  LoginUserUseCase,
  CreateDonationUseCase,
  
  // Factory
  UseCaseFactory
};
