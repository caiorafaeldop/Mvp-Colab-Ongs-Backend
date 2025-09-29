/**
 * Use Case para criação de doação
 * Responsabilidade única: criar uma nova doação no sistema
 */
class CreateDonationUseCase {
  constructor(donationRepository, userRepository, paymentAdapter, logger) {
    this.donationRepository = donationRepository;
    this.userRepository = userRepository;
    this.paymentAdapter = paymentAdapter;
    this.logger = logger;
  }

  /**
   * Executa o caso de uso de criação de doação
   * @param {CreateDonationDTO} createDonationDTO - DTO com dados validados
   * @returns {Promise<Object>} Resultado da criação
   */
  async execute(createDonationDTO) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Iniciando criação de doação', {
        useCase: 'CreateDonationUseCase',
        donationData: createDonationDTO.toLogObject()
      });

      // 1. Validar se doador existe e está ativo
      const donor = await this.userRepository.findById(createDonationDTO.donorId);
      if (!donor) {
        throw new Error('Doador não encontrado');
      }
      if (!donor.isActive) {
        throw new Error('Doador não está ativo');
      }

      // 2. Validar se beneficiário existe e está ativo
      const recipient = await this.userRepository.findById(createDonationDTO.recipientId);
      if (!recipient) {
        throw new Error('Beneficiário não encontrado');
      }
      if (!recipient.isActive) {
        throw new Error('Beneficiário não está ativo');
      }

      // 3. Validar se não é auto-doação
      if (createDonationDTO.donorId === createDonationDTO.recipientId) {
        throw new Error('Não é possível fazer doação para si mesmo');
      }

      // 4. Criar doação no banco (status: pending)
      const donationData = {
        ...createDonationDTO.toPlainObject(),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const createdDonation = await this.donationRepository.create(donationData);
      const donationId = createdDonation.id || createdDonation._id;

      // 5. Preparar dados para pagamento
      const paymentData = {
        ...createDonationDTO.toPaymentData(),
        external_reference: `donation_${donationId}`,
        notification_url: `${process.env.BASE_URL}/api/webhooks/mercadopago`,
        payer: {
          email: donor.email,
          first_name: donor.name.split(' ')[0],
          last_name: donor.name.split(' ').slice(1).join(' ') || 'N/A'
        }
      };

      // 6. Criar preferência de pagamento no Mercado Pago
      let paymentPreference = null;
      try {
        paymentPreference = await this.paymentAdapter.createPaymentPreference(paymentData);
        
        // Atualizar doação com dados do pagamento
        await this.donationRepository.update(donationId, {
          paymentId: paymentPreference.id,
          paymentUrl: paymentPreference.init_point,
          updatedAt: new Date()
        });

      } catch (paymentError) {
        this.logger.error('Erro ao criar preferência de pagamento', {
          useCase: 'CreateDonationUseCase',
          donationId,
          error: paymentError.message,
          paymentData
        });

        // Marcar doação como falha de pagamento
        await this.donationRepository.update(donationId, {
          status: 'payment_failed',
          errorMessage: paymentError.message,
          updatedAt: new Date()
        });

        throw new Error('Erro ao processar pagamento. Tente novamente.');
      }

      // 7. Preparar resposta
      const donationResponse = {
        id: donationId,
        amount: createDonationDTO.amount,
        formattedAmount: createDonationDTO.getFormattedAmount(),
        currency: createDonationDTO.currency,
        description: createDonationDTO.description,
        paymentMethod: createDonationDTO.paymentMethod,
        isAnonymous: createDonationDTO.isAnonymous,
        status: 'pending',
        donor: createDonationDTO.isAnonymous ? null : {
          id: donor.id || donor._id,
          name: donor.name,
          organizationType: donor.organizationType
        },
        recipient: {
          id: recipient.id || recipient._id,
          name: recipient.name,
          organizationType: recipient.organizationType
        },
        payment: {
          id: paymentPreference?.id,
          url: paymentPreference?.init_point,
          qrCode: paymentPreference?.qr_code
        },
        createdAt: createdDonation.createdAt
      };

      const executionTime = Date.now() - startTime;
      
      this.logger.info('Doação criada com sucesso', {
        useCase: 'CreateDonationUseCase',
        donationId,
        amount: createDonationDTO.amount,
        donorId: createDonationDTO.donorId,
        recipientId: createDonationDTO.recipientId,
        paymentId: paymentPreference?.id,
        executionTime: `${executionTime}ms`
      });

      return {
        success: true,
        donation: donationResponse,
        message: 'Doação criada com sucesso'
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error('Erro ao criar doação', {
        useCase: 'CreateDonationUseCase',
        error: error.message,
        stack: error.stack,
        donationData: createDonationDTO.toLogObject(),
        executionTime: `${executionTime}ms`
      });

      // Re-throw com informação mais amigável se necessário
      if (error.message.includes('não encontrado') || 
          error.message.includes('não está ativo') ||
          error.message.includes('não é possível') ||
          error.message.includes('Erro ao processar pagamento')) {
        throw error;
      }

      throw new Error('Erro interno ao criar doação');
    }
  }

  /**
   * Busca doações com filtros
   * @param {Object} filters - Filtros de busca
   * @param {Object} pagination - Dados de paginação
   * @returns {Promise<Object>} Lista de doações
   */
  async findDonations(filters = {}, pagination = { page: 1, limit: 20 }) {
    const startTime = Date.now();
    
    try {
      this.logger.info('Buscando doações', {
        useCase: 'CreateDonationUseCase',
        filters,
        pagination
      });

      const result = await this.donationRepository.findWithFilters(filters, pagination);

      const executionTime = Date.now() - startTime;
      
      this.logger.info('Busca de doações concluída', {
        useCase: 'CreateDonationUseCase',
        totalFound: result.total,
        executionTime: `${executionTime}ms`
      });

      return {
        success: true,
        data: result,
        message: 'Doações encontradas'
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error('Erro ao buscar doações', {
        useCase: 'CreateDonationUseCase',
        error: error.message,
        filters,
        pagination,
        executionTime: `${executionTime}ms`
      });

      throw new Error('Erro interno ao buscar doações');
    }
  }

  /**
   * Valida se as dependências estão disponíveis
   * @returns {boolean} True se válido
   */
  isValid() {
    return this.donationRepository && 
           this.userRepository && 
           this.paymentAdapter &&
           typeof this.donationRepository.create === 'function' &&
           typeof this.userRepository.findById === 'function' &&
           typeof this.paymentAdapter.createPaymentPreference === 'function';
  }

  /**
   * Retorna informações sobre o Use Case
   * @returns {Object} Metadados do Use Case
   */
  getMetadata() {
    return {
      name: 'CreateDonationUseCase',
      description: 'Cria uma nova doação no sistema',
      version: '1.0.0',
      dependencies: ['donationRepository', 'userRepository', 'paymentAdapter', 'logger'],
      inputs: ['CreateDonationDTO'],
      outputs: ['DonationResponse']
    };
  }
}

module.exports = CreateDonationUseCase;
