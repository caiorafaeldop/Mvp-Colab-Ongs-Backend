const { logger } = require('../../infra/logger');

/**
 * Middleware de validação usando DTOs e Zod
 * Centraliza validação de dados de entrada
 */

/**
 * Cria middleware de validação para um DTO específico
 * @param {Class} DTOClass - Classe do DTO para validação
 * @param {string} source - Fonte dos dados ('body', 'query', 'params')
 * @returns {Function} Middleware do Express
 */
const validateDTO = (DTOClass, source = 'body') => {
  return (req, res, next) => {
    const requestLogger = req.logger || logger;

    try {
      // Obter dados da fonte especificada
      const data = req[source];

      requestLogger.debug('Iniciando validação de dados', {
        middleware: 'validateDTO',
        dtoClass: DTOClass.name,
        source,
        dataKeys: Object.keys(data || {}),
      });

      // Validar dados usando o DTO
      const validatedData = new DTOClass(data);

      // Adicionar dados validados ao request
      req.validatedData = validatedData;
      req.dto = validatedData; // Alias para compatibilidade

      requestLogger.debug('Validação concluída com sucesso', {
        middleware: 'validateDTO',
        dtoClass: DTOClass.name,
      });

      next();
    } catch (error) {
      requestLogger.warn('Erro de validação', {
        middleware: 'validateDTO',
        dtoClass: DTOClass.name,
        source,
        error: error.message,
        data: req[source],
      });

      // Tratar erros do Zod
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          error: 'VALIDATION_ERROR',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            received: err.received,
          })),
        });
      }

      // Outros erros de validação
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        error: 'VALIDATION_ERROR',
        details: error.message,
      });
    }
  };
};

/**
 * Middleware para validação de body com Zod
 * @param {Object} schema - Schema Zod para validação
 * @returns {Function} Middleware do Express
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const requestLogger = req.logger || logger;
    try {
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      requestLogger.debug('Body validado', { middleware: 'validateBody' });
      next();
    } catch (error) {
      requestLogger.warn('Erro na validação de body', {
        middleware: 'validateBody',
        error: error.message,
      });
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Body inválido',
          error: 'BODY_VALIDATION_ERROR',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }
      return res.status(400).json({ success: false, message: 'Erro na validação do body' });
    }
  };
};

/**
 * Middleware de validação segura (não interrompe o fluxo)
 * @param {Class} DTOClass - Classe do DTO para validação
 * @param {string} source - Fonte dos dados
 * @returns {Function} Middleware do Express
 */
const safeValidateDTO = (DTOClass, source = 'body') => {
  return (req, res, next) => {
    const requestLogger = req.logger || logger;

    try {
      const data = req[source];
      const validatedData = new DTOClass(data);

      req.validatedData = validatedData;
      req.dto = validatedData;
      req.validationResult = { success: true, data: validatedData };

      requestLogger.debug('Validação segura concluída', {
        middleware: 'safeValidateDTO',
        dtoClass: DTOClass.name,
        success: true,
      });
    } catch (error) {
      req.validationResult = {
        success: false,
        error: error.name === 'ZodError' ? error.errors : error.message,
      };

      requestLogger.debug('Validação segura falhou', {
        middleware: 'safeValidateDTO',
        dtoClass: DTOClass.name,
        success: false,
        error: error.message,
      });
    }

    next();
  };
};

/**
 * Middleware para validação de parâmetros de rota
 * @param {Object} schema - Schema Zod para validação
 * @returns {Function} Middleware do Express
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    const requestLogger = req.logger || logger;

    try {
      const validatedParams = schema.parse(req.params);
      req.validatedParams = validatedParams;

      requestLogger.debug('Parâmetros validados', {
        middleware: 'validateParams',
        params: validatedParams,
      });

      next();
    } catch (error) {
      requestLogger.warn('Erro na validação de parâmetros', {
        middleware: 'validateParams',
        error: error.message,
        params: req.params,
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Parâmetros inválidos',
          error: 'PARAMS_VALIDATION_ERROR',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Erro na validação de parâmetros',
        error: 'PARAMS_VALIDATION_ERROR',
      });
    }
  };
};

/**
 * Middleware para validação de query parameters
 * @param {Object} schema - Schema Zod para validação
 * @returns {Function} Middleware do Express
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const requestLogger = req.logger || logger;

    try {
      const validatedQuery = schema.parse(req.query);
      req.validatedQuery = validatedQuery;

      requestLogger.debug('Query parameters validados', {
        middleware: 'validateQuery',
        query: validatedQuery,
      });

      next();
    } catch (error) {
      requestLogger.warn('Erro na validação de query', {
        middleware: 'validateQuery',
        error: error.message,
        query: req.query,
      });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: 'Query parameters inválidos',
          error: 'QUERY_VALIDATION_ERROR',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Erro na validação de query',
        error: 'QUERY_VALIDATION_ERROR',
      });
    }
  };
};

/**
 * Middleware combinado para validar múltiplas fontes
 * @param {Object} validators - Objeto com validadores para cada fonte
 * @returns {Function} Middleware do Express
 */
const validateMultiple = (validators) => {
  return (req, res, next) => {
    const requestLogger = req.logger || logger;
    const errors = [];

    try {
      // Validar body se especificado
      if (validators.body) {
        try {
          req.validatedData = new validators.body(req.body);
        } catch (error) {
          errors.push({ source: 'body', error });
        }
      }

      // Validar params se especificado
      if (validators.params) {
        try {
          req.validatedParams = validators.params.parse(req.params);
        } catch (error) {
          errors.push({ source: 'params', error });
        }
      }

      // Validar query se especificado
      if (validators.query) {
        try {
          req.validatedQuery = validators.query.parse(req.query);
        } catch (error) {
          errors.push({ source: 'query', error });
        }
      }

      // Se houver erros, retornar todos
      if (errors.length > 0) {
        requestLogger.warn('Múltiplos erros de validação', {
          middleware: 'validateMultiple',
          errorsCount: errors.length,
          sources: errors.map((e) => e.source),
        });

        const validationErrors = errors.map(({ source, error }) => ({
          source,
          errors: error.name === 'ZodError' ? error.errors : [{ message: error.message }],
        }));

        return res.status(400).json({
          success: false,
          message: 'Múltiplos erros de validação',
          error: 'MULTIPLE_VALIDATION_ERRORS',
          details: validationErrors,
        });
      }

      requestLogger.debug('Validação múltipla concluída', {
        middleware: 'validateMultiple',
        validatedSources: Object.keys(validators),
      });

      next();
    } catch (error) {
      requestLogger.error('Erro inesperado na validação múltipla', {
        middleware: 'validateMultiple',
        error: error.message,
        stack: error.stack,
      });

      return res.status(500).json({
        success: false,
        message: 'Erro interno de validação',
        error: 'INTERNAL_VALIDATION_ERROR',
      });
    }
  };
};

module.exports = {
  validateDTO,
  safeValidateDTO,
  validateParams,
  validateQuery,
  validateBody,
  validateMultiple,
};
