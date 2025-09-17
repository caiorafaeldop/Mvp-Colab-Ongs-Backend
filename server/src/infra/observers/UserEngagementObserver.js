const IObserver = require('../../domain/observers/IObserver');

/**
 * Observer para eventos de engajamento do usuário no marketplace
 * Monitora comportamentos de compra e uso da plataforma
 */
class UserEngagementObserver extends IObserver {
  constructor(notificationRepository, userRepository) {
    super();
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.name = 'UserEngagementObserver';
  }

  /**
   * Processa eventos de engajamento
   * @param {Object} event - Dados do evento
   * @param {Object} context - Contexto adicional
   */
  async update(event, context = {}) {
    try {
      switch (event.type) {
        case 'user.first_purchase':
          await this.handleFirstPurchase(event.data, context);
          break;
        case 'user.frequent_buyer':
          await this.handleFrequentBuyer(event.data, context);
          break;
        case 'organization.first_sale':
          await this.handleFirstSale(event.data, context);
          break;
        case 'user.login':
          await this.handleUserLogin(event.data, context);
          break;
        case 'user.product_view':
          await this.handleProductView(event.data, context);
          break;
        case 'user.search_performed':
          await this.handleSearchPerformed(event.data, context);
          break;
        default:
          console.log(`[UserEngagementObserver] Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error(`[UserEngagementObserver] Erro ao processar evento ${event.type}:`, error.message);
    }
  }

  /**
   * Trata primeira compra do usuário
   * @param {Object} data - Dados da primeira compra
   * @param {Object} context - Contexto
   */
  async handleFirstPurchase(data, context) {
    const { user, product, totalPrice } = data;

    console.log(`[UserEngagementObserver] Primeira compra: ${user.name} comprou ${product.name}`);

    if (this.notificationRepository) {
      // Parabeniza pela primeira compra
      await this.notificationRepository.create({
        userId: user.id,
        type: 'first_purchase_celebration',
        title: 'Primeira Compra! 🎉',
        message: `Parabéns pela sua primeira compra no marketplace! Você está apoiando uma causa importante.`,
        data: {
          productName: product.name,
          organizationName: product.organizationName,
          totalPrice: totalPrice,
          impact: 'Sua compra ajuda ONGs a continuarem seu trabalho social'
        },
        priority: 'high'
      });

      // Sugere explorar mais produtos
      setTimeout(async () => {
        await this.notificationRepository.create({
          userId: user.id,
          type: 'explore_suggestion',
          title: 'Explore Mais Produtos',
          message: 'Que tal conhecer outros produtos de ONGs? Há muitas causas esperando seu apoio!',
          data: {
            suggestion: 'Visite a seção de categorias para descobrir mais produtos'
          },
          priority: 'low'
        });
      }, 24 * 60 * 60 * 1000); // 24 horas depois
    }
  }

  /**
   * Trata comprador frequente
   * @param {Object} data - Dados do comprador
   * @param {Object} context - Contexto
   */
  async handleFrequentBuyer(data, context) {
    const { user, purchaseCount, totalSpent } = data;

    console.log(`[UserEngagementObserver] Comprador frequente: ${user.name} (${purchaseCount} compras)`);

    if (this.notificationRepository) {
      await this.notificationRepository.create({
        userId: user.id,
        type: 'frequent_buyer_recognition',
        title: 'Apoiador Especial! 🌟',
        message: `Você já fez ${purchaseCount} compras e apoiou várias ONGs! Obrigado por fazer a diferença.`,
        data: {
          purchaseCount: purchaseCount,
          totalSpent: totalSpent,
          impact: `Suas compras já geraram R$ ${totalSpent} para causas sociais`,
          badge: 'Apoiador Frequente'
        },
        priority: 'medium'
      });
    }
  }

  /**
   * Trata primeira venda da ONG
   * @param {Object} data - Dados da primeira venda
   * @param {Object} context - Contexto
   */
  async handleFirstSale(data, context) {
    const { organization, product, buyer, totalPrice } = data;

    console.log(`[UserEngagementObserver] Primeira venda: ${organization.name} vendeu ${product.name}`);

    if (this.notificationRepository) {
      await this.notificationRepository.create({
        userId: organization.id,
        type: 'first_sale_celebration',
        title: 'Primeira Venda! 🎊',
        message: `Parabéns! Você fez sua primeira venda no marketplace. Este é o início de uma jornada de impacto!`,
        data: {
          productName: product.name,
          buyerName: buyer.name,
          totalPrice: totalPrice,
          tips: [
            'Mantenha contato rápido com o comprador',
            'Adicione mais produtos para aumentar vendas',
            'Compartilhe seu perfil nas redes sociais'
          ]
        },
        priority: 'high'
      });
    }
  }

  /**
   * Trata login do usuário
   * @param {Object} data - Dados do login
   * @param {Object} context - Contexto
   */
  async handleUserLogin(data, context) {
    const { user, isFirstLogin, daysSinceLastLogin } = data;

    // Primeira vez na plataforma
    if (isFirstLogin) {
      console.log(`[UserEngagementObserver] Novo usuário: ${user.name}`);

      if (this.notificationRepository) {
        const welcomeMessage = user.userType === 'organization' 
          ? 'Bem-vinda ao marketplace! Cadastre seus produtos e comece a vender para apoiar sua causa.'
          : 'Bem-vindo ao marketplace! Explore produtos de ONGs e apoie causas importantes.';

        await this.notificationRepository.create({
          userId: user.id,
          type: 'welcome_new_user',
          title: 'Bem-vindo! 👋',
          message: welcomeMessage,
          data: {
            userType: user.userType,
            nextSteps: user.userType === 'organization' 
              ? ['Complete seu perfil', 'Adicione seu primeiro produto', 'Configure informações de contato']
              : ['Explore categorias', 'Encontre produtos interessantes', 'Faça sua primeira compra']
          },
          priority: 'high'
        });
      }
    }

    // Usuário voltando após tempo inativo
    if (daysSinceLastLogin && daysSinceLastLogin >= 7) {
      console.log(`[UserEngagementObserver] Usuário retornando: ${user.name} (${daysSinceLastLogin} dias)`);

      if (this.notificationRepository) {
        await this.notificationRepository.create({
          userId: user.id,
          type: 'welcome_back',
          title: 'Que bom ter você de volta! 🎉',
          message: `Novos produtos foram adicionados enquanto você estava fora. Confira as novidades!`,
          data: {
            daysSinceLastLogin: daysSinceLastLogin,
            suggestion: 'Veja os produtos mais recentes na página inicial'
          },
          priority: 'medium'
        });
      }
    }
  }

  /**
   * Trata visualização de produto
   * @param {Object} data - Dados da visualização
   * @param {Object} context - Contexto
   */
  async handleProductView(data, context) {
    const { user, product, viewCount } = data;

    // Se usuário visualizou muitos produtos mas não comprou
    if (viewCount && viewCount >= 10) {
      console.log(`[UserEngagementObserver] Usuário navegando muito: ${user.name} (${viewCount} visualizações)`);

      if (this.notificationRepository) {
        await this.notificationRepository.create({
          userId: user.id,
          type: 'browsing_encouragement',
          title: 'Encontrou algo interessante? 🛍️',
          message: 'Você tem explorado bastante! Que tal apoiar uma ONG fazendo sua primeira compra?',
          data: {
            viewCount: viewCount,
            encouragement: 'Cada compra faz diferença para uma causa social'
          },
          priority: 'low'
        });
      }
    }
  }

  /**
   * Trata busca realizada
   * @param {Object} data - Dados da busca
   * @param {Object} context - Contexto
   */
  async handleSearchPerformed(data, context) {
    const { user, searchQuery, resultsCount } = data;

    // Se não encontrou resultados
    if (resultsCount === 0) {
      console.log(`[UserEngagementObserver] Busca sem resultados: "${searchQuery}"`);

      if (this.notificationRepository) {
        await this.notificationRepository.create({
          userId: user.id,
          type: 'search_no_results',
          title: 'Nenhum produto encontrado',
          message: `Não encontramos produtos para "${searchQuery}". Que tal explorar outras categorias?`,
          data: {
            searchQuery: searchQuery,
            suggestions: [
              'Tente termos mais gerais',
              'Explore por categoria',
              'Veja todos os produtos disponíveis'
            ]
          },
          priority: 'low'
        });
      }
    }

    // Log para métricas
    console.log(`[UserEngagementObserver] Métricas - Busca: "${searchQuery}" (${resultsCount} resultados)`);
  }

  /**
   * Retorna o nome do observer
   * @returns {string} Nome do observer
   */
  getName() {
    return this.name;
  }

  /**
   * Retorna os tipos de evento que este observer escuta
   * @returns {Array<string>} Lista de tipos de evento
   */
  getEventTypes() {
    return [
      'user.first_purchase',
      'user.frequent_buyer',
      'organization.first_sale',
      'user.login',
      'user.product_view',
      'user.search_performed'
    ];
  }
}

module.exports = UserEngagementObserver;
