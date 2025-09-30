/**
 * OrganizationCompositeController - Controller para hierarquias de organizações
 *
 * Gerencia endpoints HTTP para operações com o padrão Composite.
 * Fornece APIs para criar, consultar e gerenciar estruturas hierárquicas
 * de organizações (matrizes, filiais, sub-filiais).
 */

const { logger } = require('../../infra/logger');

class OrganizationCompositeController {
  constructor(organizationCompositeService) {
    this.organizationCompositeService = organizationCompositeService;
  }

  /**
   * POST /organizations - Cria nova organização
   */
  async createOrganization(req, res) {
    try {
      const orgData = req.body;

      // Adicionar userId se autenticado
      if (req.user?.id) {
        orgData.createdBy = req.user.id;
      }

      const result = await this.organizationCompositeService.createOrganization(orgData);

      logger.info(`[COMPOSITE CONTROLLER] Organização criada: ${result.data.name}`);

      res.status(201).json({
        success: true,
        message: 'Organização criada com sucesso',
        data: result.data,
        type: result.type,
      });
    } catch (error) {
      logger.error('[COMPOSITE CONTROLLER] Erro ao criar organização:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar organização',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * GET /organizations/:id/tree - Busca árvore completa da organização
   */
  async getOrganizationTree(req, res) {
    try {
      const { id } = req.params;

      const result = await this.organizationCompositeService.getOrganizationTree(id);

      res.status(200).json({
        success: true,
        message: 'Árvore de organizações recuperada com sucesso',
        data: result.data,
      });
    } catch (error) {
      logger.error('[COMPOSITE CONTROLLER] Erro ao buscar árvore:', error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao buscar árvore de organizações',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * GET /organizations/:id/metrics - Calcula métricas agregadas
   */
  async getOrganizationMetrics(req, res) {
    try {
      const { id } = req.params;

      const result = await this.organizationCompositeService.getOrganizationMetrics(id);

      res.status(200).json({
        success: true,
        message: 'Métricas calculadas com sucesso',
        data: result.data,
      });
    } catch (error) {
      logger.error('[COMPOSITE CONTROLLER] Erro ao calcular métricas:', error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao calcular métricas',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * POST /organizations/:parentId/children - Adiciona filial
   */
  async addChildOrganization(req, res) {
    try {
      const { parentId } = req.params;
      const { childId } = req.body;

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: 'childId é obrigatório no body da requisição',
        });
      }

      const result = await this.organizationCompositeService.addChildOrganization(
        parentId,
        childId
      );

      logger.info(`[COMPOSITE CONTROLLER] Filial adicionada: ${childId} → ${parentId}`);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      logger.error('[COMPOSITE CONTROLLER] Erro ao adicionar filial:', error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao adicionar filial',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * DELETE /organizations/:parentId/children/:childId - Remove filial
   */
  async removeChildOrganization(req, res) {
    try {
      const { parentId, childId } = req.params;

      const result = await this.organizationCompositeService.removeChildOrganization(
        parentId,
        childId
      );

      logger.info(`[COMPOSITE CONTROLLER] Filial removida: ${childId} de ${parentId}`);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } catch (error) {
      logger.error('[COMPOSITE CONTROLLER] Erro ao remover filial:', error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 400;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao remover filial',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * GET /organizations/matrices - Lista todas as organizações matrizes
   */
  async getAllMatrixOrganizations(req, res) {
    try {
      const result = await this.organizationCompositeService.getAllMatrixOrganizations();

      res.status(200).json({
        success: true,
        message: `${result.total} organizações matrizes encontradas`,
        data: result.data,
        total: result.total,
      });
    } catch (error) {
      logger.error('[COMPOSITE CONTROLLER] Erro ao buscar matrizes:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar organizações matrizes',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * GET /organizations/:treeRootId/search/:targetId - Busca organização na árvore
   */
  async findOrganizationInTree(req, res) {
    try {
      const { treeRootId, targetId } = req.params;

      const result = await this.organizationCompositeService.findOrganizationInTree(
        treeRootId,
        targetId
      );

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.status(200).json({
        success: true,
        message: 'Organização encontrada na árvore',
        data: result.data,
      });
    } catch (error) {
      logger.error('[COMPOSITE CONTROLLER] Erro ao buscar na árvore:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao buscar organização na árvore',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * GET /organizations/:id/display - Exibe estrutura em árvore (texto)
   */
  async displayOrganizationTree(req, res) {
    try {
      const { id } = req.params;

      const result = await this.organizationCompositeService.getOrganizationTree(id);

      res.status(200).json({
        success: true,
        message: 'Estrutura da árvore',
        data: {
          display: result.data.display,
          totalOrganizations: result.data.totalOrganizations,
        },
      });
    } catch (error) {
      logger.error('[COMPOSITE CONTROLLER] Erro ao exibir árvore:', error);

      const statusCode = error.message.includes('não encontrada') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao exibir estrutura da árvore',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }

  /**
   * GET /organizations/health - Health check do sistema composite
   */
  async healthCheck(req, res) {
    try {
      const matrices = await this.organizationCompositeService.getAllMatrixOrganizations();

      res.status(200).json({
        success: true,
        message: 'Sistema Composite funcionando',
        data: {
          totalMatrices: matrices.total,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    } catch (error) {
      logger.error('[COMPOSITE CONTROLLER] Health check falhou:', error);

      res.status(503).json({
        success: false,
        message: 'Sistema Composite indisponível',
        error: error.message,
      });
    }
  }
}

module.exports = OrganizationCompositeController;
