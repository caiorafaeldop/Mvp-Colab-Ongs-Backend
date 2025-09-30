/**
 * TEMPLATE METHOD PATTERN - Índice central de templates
 * Exporta todos os templates e registra na factory
 */

const { BaseTemplate, TemplateFactory } = require('./BaseTemplate');

// Import all templates
const { 
  UploadProcessTemplate, 
  ImageUploadTemplate, 
  DocumentUploadTemplate 
} = require('./UploadProcessTemplate');

const { 
  AuthenticationTemplate, 
  LoginTemplate, 
  RegisterTemplate 
} = require('./AuthenticationTemplate');

const { 
  DonationProcessTemplate, 
  SingleDonationTemplate, 
  RecurringDonationTemplate 
} = require('./DonationProcessTemplate');

const { 
  ReportTemplate, 
  DonationReportTemplate, 
  UserReportTemplate 
} = require('./ReportTemplate');

// Register all templates in the factory
TemplateFactory.register('upload', UploadProcessTemplate);
TemplateFactory.register('image-upload', ImageUploadTemplate);
TemplateFactory.register('document-upload', DocumentUploadTemplate);

TemplateFactory.register('authentication', AuthenticationTemplate);
TemplateFactory.register('login', LoginTemplate);
TemplateFactory.register('register', RegisterTemplate);

TemplateFactory.register('donation', DonationProcessTemplate);
TemplateFactory.register('single-donation', SingleDonationTemplate);
TemplateFactory.register('recurring-donation', RecurringDonationTemplate);

TemplateFactory.register('report', ReportTemplate);
TemplateFactory.register('donation-report', DonationReportTemplate);
TemplateFactory.register('user-report', UserReportTemplate);

/**
 * Helper function to create template instances with common dependencies
 */
function createTemplateWithDependencies(templateName, dependencies = {}) {
  const template = TemplateFactory.create(templateName, dependencies);
  
  // Set common dependencies
  if (dependencies.logger) {
    template.setLogger(dependencies.logger);
  }
  
  return template;
}

/**
 * Template usage examples and best practices
 */
const TemplateExamples = {
  // Upload example
  async uploadFile(file, options = {}) {
    const template = createTemplateWithDependencies('image-upload', {
      storageAdapter: options.storageAdapter,
      folder: options.folder || 'uploads',
      maxSize: options.maxSize
    });
    
    return await template.execute({ file }, options);
  },
  
  // Authentication example
  async authenticateUser(credentials, authType = 'login', options = {}) {
    const templateName = authType === 'register' ? 'register' : 'login';
    const template = createTemplateWithDependencies(templateName, {
      userRepository: options.userRepository,
      authService: options.authService,
      eventManager: options.eventManager
    });
    
    return await template.execute(credentials, options);
  },
  
  // Donation example
  async processDonation(donationData, donationType = 'single', options = {}) {
    const templateName = donationType === 'recurring' ? 'recurring-donation' : 'single-donation';
    const template = createTemplateWithDependencies(templateName, {
      donationRepository: options.donationRepository,
      userRepository: options.userRepository,
      paymentAdapter: options.paymentAdapter,
      eventManager: options.eventManager
    });
    
    return await template.execute(donationData, options);
  },
  
  // Report example
  async generateReport(reportParams, reportType = 'donations', options = {}) {
    const templateName = `${reportType}-report`;
    const template = createTemplateWithDependencies(templateName, {
      donationRepository: options.donationRepository,
      userRepository: options.userRepository,
      format: options.format || 'json'
    });
    
    return await template.execute(reportParams, options);
  }
};

module.exports = {
  // Base classes
  BaseTemplate,
  TemplateFactory,
  
  // Upload templates
  UploadProcessTemplate,
  ImageUploadTemplate,
  DocumentUploadTemplate,
  
  // Authentication templates
  AuthenticationTemplate,
  LoginTemplate,
  RegisterTemplate,
  
  // Donation templates
  DonationProcessTemplate,
  SingleDonationTemplate,
  RecurringDonationTemplate,
  
  // Report templates
  ReportTemplate,
  DonationReportTemplate,
  UserReportTemplate,
  
  // Utilities
  createTemplateWithDependencies,
  TemplateExamples
};
