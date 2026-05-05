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
    .setName('painelwl')
    .setDescription('Envia o painel da Allowlist no canal atual')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('📋 ALLOWLIST — ROCKET VALLEY')
      .setDescription(
        '• Para realizar a allowlist clique no botão abaixo.\n\n' +
        '• Caso tenha um codiguin de pré-aprovação, use o botão **Inserir Codiguin**.\n\n' +
        '• Suas respostas serão analisadas pela equipe.'
      )
      .setFooter({ text: config.footerText });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('wl_start')
        .setLabel('Iniciar Allowlist')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('📛'),
      new ButtonBuilder()
        .setCustomId('wl_code')
        .setLabel('Inserir Codiguin')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎟️')
    );

    await interaction.reply({ content: '✅ Painel enviado!', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
