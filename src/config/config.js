require('dotenv').config();

module.exports = {
  guildId: process.env.GUILD_ID,

  // Categorias
  categories: {
    entrada: process.env.CAT_ENTRADA_ID,
    allowlist: process.env.CAT_ALLOWLIST_ID,
    lerAllowlists: process.env.CAT_LER_WL_ID,
    social: process.env.CAT_SOCIAL_ID,
    suporte: process.env.CAT_SUPORTE_ID,
    logs: process.env.CAT_LOGS_ID
  },

  // Canais fixos
  channels: {
    logsEntrada: process.env.CH_LOGS_ENTRADA_ID,
    logsSaida: process.env.CH_LOGS_SAIDA_ID,
    wlPanel: process.env.CH_WL_PANEL_ID,        // canal com botão iniciar WL
    carregarWl: process.env.CH_CARREGAR_WL_ID,   // staff vê as WLs
    quizRocket: process.env.CH_QUIZ_ID,
    abrirTicket: process.env.CH_TICKET_ID,
    finalizouTicket: process.env.CH_TICKET_LOG_ID,
    codiguin: process.env.CH_CODIGUIN_ID,
    gerarCodiguin: process.env.CH_GERAR_CODIGUIN_ID,
    logsCodiguins: process.env.CH_LOGS_CODIGUINS_ID,
    logsComandos: process.env.CH_LOGS_COMANDOS_ID,
    logsLiberacoes: process.env.CH_LOGS_LIBERACOES_ID,
    logsBackupSql: process.env.CH_LOGS_BACKUP_ID,
    logsPunicoes: process.env.CH_LOGS_PUNICOES_ID
  },

  // Cargos
  roles: {
    // Cargo de quem entrou (sem WL ainda)
    turist: process.env.ROLE_TURIST_ID,
    // Cargo após aprovação na WL
    passport: process.env.ROLE_PASSPORT_ID,
    // Staff e gerência
    staff: process.env.ROLE_STAFF_ID,
    // Cargos que podem aprovar/reprovar WL
    wlStaff: (process.env.ROLE_WL_STAFF_IDS || '').split(',').filter(Boolean)
  },

  embedColor: 0x9b111e,
  footerText: '™ Rocket Roleplay © All rights reserved',

  // Tempo limite por pergunta (ms)
  wlTimeout: 10 * 60 * 1000,
};
