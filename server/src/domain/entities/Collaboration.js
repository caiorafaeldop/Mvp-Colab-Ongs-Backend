/**
 * Entidade de Colaboração seguindo Domain-Driven Design
 * Representa uma colaboração entre organizações
 */
class Collaboration {
  constructor(
    id,
    requesterOrgId,
    requesterOrgName,
    targetOrgId,
    targetOrgName,
    title,
    description,
    status = 'pending',
    createdAt = new Date(),
    updatedAt = new Date()
  ) {
    this.id = id;
    this.requesterOrgId = requesterOrgId;
    this.requesterOrgName = requesterOrgName;
    this.targetOrgId = targetOrgId;
    this.targetOrgName = targetOrgName;
    this.title = title;
    this.description = description;
    this.status = status; // pending, accepted, rejected, completed
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Factory method para criar nova colaboração
   * @param {string} requesterOrgId - ID da organização solicitante
   * @param {string} requesterOrgName - Nome da organização solicitante
   * @param {string} targetOrgId - ID da organização alvo
   * @param {string} targetOrgName - Nome da organização alvo
   * @param {string} title - Título da colaboração
   * @param {string} description - Descrição da colaboração
   * @returns {Collaboration} Nova instância de colaboração
   */
  static create(
    requesterOrgId,
    requesterOrgName,
    targetOrgId,
    targetOrgName,
    title,
    description
  ) {
    // Validações básicas
    if (!requesterOrgId || !targetOrgId) {
      throw new Error('Requester and target organization IDs are required');
    }
    
    if (!requesterOrgName || !targetOrgName) {
      throw new Error('Requester and target organization names are required');
    }
    
    if (!title || title.trim().length === 0) {
      throw new Error('Collaboration title is required');
    }
    
    if (!description || description.trim().length === 0) {
      throw new Error('Collaboration description is required');
    }

    return new Collaboration(
      null, // ID será gerado pelo banco
      requesterOrgId,
      requesterOrgName.trim(),
      targetOrgId,
      targetOrgName.trim(),
      title.trim(),
      description.trim(),
      'pending'
    );
  }

  /**
   * Aceita a colaboração
   */
  accept() {
    if (this.status !== 'pending') {
      throw new Error('Only pending collaborations can be accepted');
    }
    this.status = 'accepted';
    this.updatedAt = new Date();
  }

  /**
   * Rejeita a colaboração
   */
  reject() {
    if (this.status !== 'pending') {
      throw new Error('Only pending collaborations can be rejected');
    }
    this.status = 'rejected';
    this.updatedAt = new Date();
  }

  /**
   * Completa a colaboração
   */
  complete() {
    if (this.status !== 'accepted') {
      throw new Error('Only accepted collaborations can be completed');
    }
    this.status = 'completed';
    this.updatedAt = new Date();
  }

  /**
   * Verifica se a colaboração está pendente
   * @returns {boolean}
   */
  isPending() {
    return this.status === 'pending';
  }

  /**
   * Verifica se a colaboração foi aceita
   * @returns {boolean}
   */
  isAccepted() {
    return this.status === 'accepted';
  }

  /**
   * Verifica se a colaboração foi rejeitada
   * @returns {boolean}
   */
  isRejected() {
    return this.status === 'rejected';
  }

  /**
   * Verifica se a colaboração foi completada
   * @returns {boolean}
   */
  isCompleted() {
    return this.status === 'completed';
  }

  /**
   * Atualiza os dados da colaboração
   * @param {Object} updateData - Dados para atualização
   */
  update(updateData) {
    const allowedFields = ['title', 'description'];
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        this[key] = updateData[key];
      }
    });
    
    this.updatedAt = new Date();
  }

  /**
   * Converte a entidade para objeto simples
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      requesterOrgId: this.requesterOrgId,
      requesterOrgName: this.requesterOrgName,
      targetOrgId: this.targetOrgId,
      targetOrgName: this.targetOrgName,
      title: this.title,
      description: this.description,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Collaboration;
