const { Events } = require('discord.js');
const wlHandler = require('../handlers/wlHandler');
const ticketHandler = require('../handlers/ticketHandler');

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    try {

      // ── Slash Commands ──────────────────────────────────────────────────
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return await command.execute(interaction);
      }

      // ── Botões ──────────────────────────────────────────────────────────
      if (interaction.isButton()) {
        if (interaction.customId.startsWith('wl_')) {
          return await wlHandler.handle(interaction);
        }
        if (interaction.customId.startsWith('ticket_')) {
          return await ticketHandler.handle(interaction);
        }
      }

      // ── Select Menus ────────────────────────────────────────────────────
      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket_category') {
          return await ticketHandler.handle(interaction);
        }
      }

      // ── Modals ──────────────────────────────────────────────────────────
      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('wl_')) {
          return await wlHandler.handle(interaction);
        }
      }

    } catch (error) {
      console.error('[InteractionCreate] Erro:', error);

      const msg = { content: '❌ Ocorreu um erro ao processar sua ação.', ephemeral: true };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  }
};
