/**
 * Utilitários para integração com WhatsApp
 */
class WhatsAppUtils {
  /**
   * Gera um link do WhatsApp com mensagem pré-formatada
   * @param {string} phone - Número do telefone (apenas números)
   * @param {string} productName - Nome do produto
   * @param {string} organizationName - Nome da organização
   * @param {number} price - Preço do produto
   * @returns {string} Link do WhatsApp
   */
  static generateProductLink(phone, productName, organizationName, price) {
    // Remove caracteres não numéricos do telefone
    const cleanPhone = phone.replace(/\D/g, '');

    // Formata o preço
    const formattedPrice = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);

    // Cria a mensagem personalizada
    const message =
      `Olá, tenho interesse no item ${productName} no valor de ${formattedPrice} ` +
      `anunciado no site da Rede Feminina de Combate ao Câncer. Ainda está disponível?`;

    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message);

    // Retorna o link do WhatsApp
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  /**
   * Gera um link do WhatsApp para contato geral com a organização
   * @param {string} phone - Número do telefone
   * @param {string} organizationName - Nome da organização
   * @returns {string} Link do WhatsApp
   */
  static generateContactLink(phone, organizationName) {
    const cleanPhone = phone.replace(/\D/g, '');

    const message =
      `Olá! Gostaria de entrar em contato com a ${organizationName}.\n\n` + `Poderia me ajudar?`;

    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  /**
   * Valida se um número de telefone é válido
   * @param {string} phone - Número do telefone
   * @returns {boolean} True se válido
   */
  static isValidPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    // Verifica se tem entre 10 e 15 dígitos (formato brasileiro)
    return cleanPhone.length >= 10 && cleanPhone.length <= 15;
  }

  /**
   * Formata um número de telefone para exibição
   * @param {string} phone - Número do telefone
   * @returns {string} Telefone formatado
   */
  static formatPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length === 11) {
      // Formato: (11) 99999-9999
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`;
    } else if (cleanPhone.length === 10) {
      // Formato: (11) 9999-9999
      return `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
    }

    return phone; // Retorna original se não conseguir formatar
  }
}

module.exports = WhatsAppUtils;
