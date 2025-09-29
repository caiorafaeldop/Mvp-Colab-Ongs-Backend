/**
 * Índice de todos os DTOs da aplicação
 * Facilita importação e organização
 */

// DTOs de Usuário
const CreateUserDTO = require('./CreateUserDTO');
const LoginDTO = require('./LoginDTO');

// DTOs de Doação
const CreateDonationDTO = require('./CreateDonationDTO');

// Middleware para validação automática de DTOs
const validateDTO = (DTOClass) => {
  return (req, res, next) => {
    try {
      // Tenta criar instância do DTO com os dados do request
      const dto = new DTOClass(req.body);
      
      // Adiciona DTO validado ao request para uso nos controllers
      req.validatedData = dto;
      
      next();
    } catch (error) {
      // Se for erro de validação do Zod
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        });
      }
      
      // Outros erros
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
};

// Helper para validação segura (sem exceções)
const safeValidateDTO = (DTOClass, data) => {
  try {
    const dto = new DTOClass(data);
    return { success: true, data: dto };
  } catch (error) {
    return { 
      success: false, 
      error: error.name === 'ZodError' ? error.errors : error.message 
    };
  }
};

module.exports = {
  // DTOs
  CreateUserDTO,
  LoginDTO,
  CreateDonationDTO,
  
  // Helpers
  validateDTO,
  safeValidateDTO
};
