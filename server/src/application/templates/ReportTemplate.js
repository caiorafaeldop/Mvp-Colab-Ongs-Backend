const { BaseTemplate } = require('./BaseTemplate');
const { logger } = require('../../infra/logger');

/**
 * TEMPLATE METHOD - Template para geração de relatórios
 * Define o fluxo padrão: validar → coletar dados → processar → formatar → finalizar
 */

class ReportTemplate extends BaseTemplate {
  constructor(options = {}) {
    super('Report');
    this.dataRepository = options.dataRepository;
    this.format = options.format || 'json';
    this.timezone = options.timezone || 'America/Sao_Paulo';
  }
  
  /**
   * Valida os parâmetros do relatório
   */
  async validate() {
    this.setCurrentStep('validation');
    const { startDate, endDate, organizationId } = this.context.input;
    
    // Validar datas
    if (startDate && !this.isValidDate(startDate)) {
      throw new Error('Data inicial inválida');
    }
    
    if (endDate && !this.isValidDate(endDate)) {
      throw new Error('Data final inválida');
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new Error('Data inicial deve ser anterior à data final');
    }
    
    // Validar período máximo
    if (startDate && endDate) {
      const diffDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
      if (diffDays > 365) {
        throw new Error('Período máximo para relatório é de 365 dias');
      }
    }
    
    // Validações específicas do tipo de relatório
    await this.validateReportSpecifics();
    
    this.requestLogger.debug('Parâmetros do relatório validados', {
      template: this.name,
      reportType: this.getReportType(),
      startDate,
      endDate,
      organizationId
    });
  }
  
  /**
   * Prepara os parâmetros para coleta de dados
   */
  async prepare() {
    this.setCurrentStep('preparation');
    const { startDate, endDate, organizationId, filters = {} } = this.context.input;
    
    // Definir período padrão se não informado
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setMonth(defaultStartDate.getMonth() - 1); // Último mês
    
    const reportParams = {
      startDate: startDate ? new Date(startDate) : defaultStartDate,
      endDate: endDate ? new Date(endDate) : defaultEndDate,
      organizationId,
      filters: this.sanitizeFilters(filters),
      timezone: this.timezone,
      format: this.format,
      generatedAt: new Date(),
      generatedBy: this.context.options.userId || 'system'
    };
    
    // Preparar parâmetros específicos do relatório
    await this.prepareReportSpecifics(reportParams);
    
    this.setContextData('reportParams', reportParams);
    
    this.requestLogger.debug('Parâmetros preparados para coleta', {
      template: this.name,
      reportType: this.getReportType(),
      startDate: reportParams.startDate,
      endDate: reportParams.endDate
    });
  }
  
  /**
   * Executa a geração do relatório
   */
  async process() {
    this.setCurrentStep('main_process');
    const reportParams = this.getContextData('reportParams');
    
    // Coletar dados
    const rawData = await this.collectData(reportParams);
    this.setContextData('rawData', rawData);
    
    // Processar dados
    const processedData = await this.processData(rawData, reportParams);
    this.setContextData('processedData', processedData);
    
    // Formatar relatório
    const formattedReport = await this.formatReport(processedData, reportParams);
    
    const result = {
      report: formattedReport,
      metadata: {
        type: this.getReportType(),
        generatedAt: reportParams.generatedAt,
        generatedBy: reportParams.generatedBy,
        period: {
          startDate: reportParams.startDate,
          endDate: reportParams.endDate
        },
        recordCount: this.getRecordCount(rawData),
        format: reportParams.format
      }
    };
    
    this.requestLogger.info('Relatório gerado com sucesso', {
      template: this.name,
      reportType: this.getReportType(),
      recordCount: result.metadata.recordCount,
      format: reportParams.format
    });
    
    return result;
  }
  
  /**
   * Finaliza a geração do relatório
   */
  async finalize() {
    this.setCurrentStep('finalization');
    const result = this.context.result;
    
    // Salvar relatório se necessário
    await this.saveReport(result);
    
    // Registrar evento de geração
    await this.logReportGeneration(result);
    
    // Adicionar metadados
    this.addMetadata('reportSuccess', true);
    this.addMetadata('reportType', result.metadata.type);
    this.addMetadata('recordCount', result.metadata.recordCount);
    
    this.requestLogger.debug('Geração de relatório finalizada', {
      template: this.name,
      reportType: result.metadata.type
    });
  }
  
  // ==========================================
  // MÉTODOS ABSTRATOS (devem ser implementados pelas subclasses)
  // ==========================================
  
  /**
   * Retorna o tipo de relatório
   * @abstract
   * @returns {string} Tipo de relatório
   */
  getReportType() {
    throw new Error(`Method getReportType() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Valida parâmetros específicos do relatório
   * @abstract
   */
  async validateReportSpecifics() {
    throw new Error(`Method validateReportSpecifics() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Prepara parâmetros específicos do relatório
   * @abstract
   */
  async prepareReportSpecifics(reportParams) {
    throw new Error(`Method prepareReportSpecifics() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Coleta os dados para o relatório
   * @abstract
   */
  async collectData(reportParams) {
    throw new Error(`Method collectData() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Processa os dados coletados
   * @abstract
   */
  async processData(rawData, reportParams) {
    throw new Error(`Method processData() must be implemented by ${this.constructor.name}`);
  }
  
  /**
   * Formata o relatório final
   * @abstract
   */
  async formatReport(processedData, reportParams) {
    throw new Error(`Method formatReport() must be implemented by ${this.constructor.name}`);
  }
  
  // ==========================================
  // MÉTODOS UTILITÁRIOS
  // ==========================================
  
  /**
   * Valida se uma data é válida
   */
  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }
  
  /**
   * Sanitiza filtros de entrada
   */
  sanitizeFilters(filters) {
    const sanitized = {};
    
    // Lista de filtros permitidos
    const allowedFilters = ['status', 'type', 'category', 'minAmount', 'maxAmount'];
    
    for (const [key, value] of Object.entries(filters)) {
      if (allowedFilters.includes(key) && value !== undefined && value !== null) {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  /**
   * Obtém contagem de registros
   */
  getRecordCount(rawData) {
    if (Array.isArray(rawData)) {
      return rawData.length;
    }
    if (rawData && typeof rawData === 'object' && rawData.count !== undefined) {
      return rawData.count;
    }
    return 0;
  }
  
  /**
   * Salva o relatório
   */
  async saveReport(result) {
    // Implementação padrão vazia
    // Subclasses podem implementar salvamento em arquivo ou banco
  }
  
  /**
   * Registra evento de geração de relatório
   */
  async logReportGeneration(result) {
    this.requestLogger.info('Relatório gerado', {
      template: this.name,
      reportType: result.metadata.type,
      generatedBy: result.metadata.generatedBy,
      recordCount: result.metadata.recordCount
    });
  }
  
  /**
   * Hook executado em caso de erro
   */
  async onError(error) {
    const reportParams = this.getContextData('reportParams');
    
    this.requestLogger.error('Erro durante geração de relatório', {
      template: this.name,
      reportType: this.getReportType(),
      error: error.message,
      step: this.getCurrentStep(),
      reportParams
    });
  }
}

/**
 * Template para relatório de doações
 */
class DonationReportTemplate extends ReportTemplate {
  constructor(options = {}) {
    super(options);
    this.donationRepository = options.donationRepository;
  }
  
  getReportType() {
    return 'donations';
  }
  
  async validateReportSpecifics() {
    // Validações específicas para relatório de doações
    const { organizationId } = this.context.input;
    
    if (!organizationId) {
      throw new Error('ID da organização é obrigatório para relatório de doações');
    }
  }
  
  async prepareReportSpecifics(reportParams) {
    // Preparação específica para relatório de doações
    reportParams.includeRecurring = this.context.input.includeRecurring !== false;
    reportParams.groupBy = this.context.input.groupBy || 'day';
  }
  
  async collectData(reportParams) {
    if (!this.donationRepository) {
      throw new Error('Donation repository não configurado');
    }
    
    const query = {
      organizationId: reportParams.organizationId,
      createdAt: {
        $gte: reportParams.startDate,
        $lte: reportParams.endDate
      }
    };
    
    // Aplicar filtros
    if (reportParams.filters.status) {
      query.status = reportParams.filters.status;
    }
    
    if (reportParams.filters.type) {
      query.type = reportParams.filters.type;
    }
    
    if (reportParams.filters.minAmount || reportParams.filters.maxAmount) {
      query.amount = {};
      if (reportParams.filters.minAmount) {
        query.amount.$gte = reportParams.filters.minAmount;
      }
      if (reportParams.filters.maxAmount) {
        query.amount.$lte = reportParams.filters.maxAmount;
      }
    }
    
    return await this.donationRepository.find(query);
  }
  
  async processData(rawData, reportParams) {
    const donations = rawData;
    
    // Calcular estatísticas
    const stats = {
      totalDonations: donations.length,
      totalAmount: donations.reduce((sum, d) => sum + d.amount, 0),
      averageAmount: 0,
      singleDonations: donations.filter(d => d.type === 'single').length,
      recurringDonations: donations.filter(d => d.type === 'recurring').length,
      approvedDonations: donations.filter(d => d.status === 'approved').length,
      pendingDonations: donations.filter(d => d.status === 'pending').length,
      rejectedDonations: donations.filter(d => d.status === 'rejected').length
    };
    
    stats.averageAmount = stats.totalDonations > 0 ? stats.totalAmount / stats.totalDonations : 0;
    
    // Agrupar por período
    const groupedData = this.groupByPeriod(donations, reportParams.groupBy);
    
    return {
      statistics: stats,
      groupedData,
      donations: donations.map(d => ({
        id: d.id || d._id,
        amount: d.amount,
        type: d.type,
        status: d.status,
        donorName: d.donorName,
        donorEmail: d.donorEmail,
        createdAt: d.createdAt,
        message: d.message
      }))
    };
  }
  
  async formatReport(processedData, reportParams) {
    const { statistics, groupedData, donations } = processedData;
    
    return {
      summary: {
        period: {
          startDate: reportParams.startDate,
          endDate: reportParams.endDate
        },
        organizationId: reportParams.organizationId,
        statistics
      },
      timeline: groupedData,
      donations: reportParams.format === 'detailed' ? donations : undefined
    };
  }
  
  /**
   * Agrupa doações por período
   */
  groupByPeriod(donations, groupBy) {
    const groups = {};
    
    donations.forEach(donation => {
      let key;
      const date = new Date(donation.createdAt);
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const week = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${week}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!groups[key]) {
        groups[key] = {
          period: key,
          count: 0,
          totalAmount: 0,
          donations: []
        };
      }
      
      groups[key].count++;
      groups[key].totalAmount += donation.amount;
      groups[key].donations.push(donation.id || donation._id);
    });
    
    return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
  }
  
  /**
   * Obtém número da semana
   */
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }
}

/**
 * Template para relatório de usuários
 */
class UserReportTemplate extends ReportTemplate {
  constructor(options = {}) {
    super(options);
    this.userRepository = options.userRepository;
  }
  
  getReportType() {
    return 'users';
  }
  
  async validateReportSpecifics() {
    // Validações específicas para relatório de usuários
  }
  
  async prepareReportSpecifics(reportParams) {
    reportParams.includeInactive = this.context.input.includeInactive || false;
  }
  
  async collectData(reportParams) {
    if (!this.userRepository) {
      throw new Error('User repository não configurado');
    }
    
    const query = {
      createdAt: {
        $gte: reportParams.startDate,
        $lte: reportParams.endDate
      }
    };
    
    if (!reportParams.includeInactive) {
      query.status = 'active';
    }
    
    return await this.userRepository.find(query);
  }
  
  async processData(rawData, reportParams) {
    const users = rawData;
    
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'active').length,
      inactiveUsers: users.filter(u => u.status === 'inactive').length,
      organizationUsers: users.filter(u => u.userType === 'organization').length,
      individualUsers: users.filter(u => u.userType === 'individual').length
    };
    
    return {
      statistics: stats,
      users: users.map(u => ({
        id: u.id || u._id,
        name: u.name,
        email: u.email,
        userType: u.userType,
        status: u.status,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt
      }))
    };
  }
  
  async formatReport(processedData, reportParams) {
    return {
      summary: {
        period: {
          startDate: reportParams.startDate,
          endDate: reportParams.endDate
        },
        statistics: processedData.statistics
      },
      users: processedData.users
    };
  }
}

module.exports = {
  ReportTemplate,
  DonationReportTemplate,
  UserReportTemplate
};
