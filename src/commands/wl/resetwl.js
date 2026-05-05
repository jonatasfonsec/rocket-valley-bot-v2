const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const sessions = require('../../utils/wlSessions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetwl')
    .setDescription('Reseta a sessão de WL de um usuário (staff)')
    .addUserOption(opt =>
      opt.setName('usuario')
        .setDescription('Usuário a resetar')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');

    sessions.end(target.id);

    const wlChannel = interaction.guild.channels.cache.find(
      c => c.name === `allowlist-${target.id}`
    );

    if (wlChannel) await wlChannel.delete().catch(() => {});

    await interaction.reply({
      content: `✅ Sessão de WL de <@${target.id}> resetada com sucesso.`,
      ephemeral: true
    });
  }
};