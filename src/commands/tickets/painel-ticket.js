const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require('discord.js');
const config = require('../../config/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel-ticket')
    .setDescription('Envia o painel de suporte/tickets no canal atual')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('🎫 SUPORTE — ROCKET VALLEY')
      .setDescription(
        '**Categorias disponíveis:**\n\n' +
        '🐛 **Bugs** — Reporte bugs do servidor\n' +
        '🎧 **Suporte** — Precisa de ajuda?\n' +
        '🤝 **Parcerias** — Proposta de parceria\n' +
        '🚨 **Denúncias** — Denuncie um jogador\n' +
        '⚖️ **Corregedoria Policial** — Assuntos da polícia\n\n' +
        'Clique no botão abaixo para abrir um ticket.'
      )
      .setFooter({ text: config.footerText });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_open')
        .setLabel('Abrir Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫')
    );

    await interaction.reply({ content: '✅ Painel enviado!', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
