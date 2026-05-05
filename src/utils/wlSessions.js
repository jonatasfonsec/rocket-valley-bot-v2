/**
 * Gerenciador de sessões da Allowlist.
 * Armazena o estado de cada usuário durante o processo de WL.
 */

const sessions = new Map();

module.exports = {
  /**
   * Inicia uma sessão de WL para o usuário.
   * @param {string} userId
   * @param {string} channelId
   */
  start(userId, channelId) {
    sessions.set(userId, {
      channelId,
      step: 0,
      answers: [],
      timeout: null,
      collector: null
    });
  },

  /**
   * Retorna a sessão de um usuário ou undefined.
   * @param {string} userId
   */
  get(userId) {
    return sessions.get(userId);
  },

  /**
   * Encerra a sessão, limpando timers e collectors.
   * @param {string} userId
   */
  end(userId) {
    const session = sessions.get(userId);
    if (!session) return;

    // limpa timer ativo
    if (session.timeout) {
      clearTimeout(session.timeout);
      session.timeout = null;
    }

    // para collector ativo
    if (session.collector && !session.collector.ended) {
      session.collector.stop('ended');
    }

    sessions.delete(userId);
  },

  /**
   * Verifica se existe sessão ativa para o usuário.
   * @param {string} userId
   */
  has(userId) {
    return sessions.has(userId);
  }
};
