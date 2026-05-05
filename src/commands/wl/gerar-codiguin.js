const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { adicionarCodigo } = require('../../handlers/wlHandler');
const config = require('../../config/config');

function gerarCodigo() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gerar-codiguin')
    .setDescription('Gera códigos de aprovação automática de WL (staff)')
    .addIntegerOption(opt =>
      opt.setName('quantidade')
        .setDescription('Quantidade de códigos (máx: 10)')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const qtd = interaction.options.getInteger('quantidade') ?? 1;
    const codes = [];

    for (let i = 0; i < qtd; i++) {
      const code = gerarCodigo();
      adicionarCodigo(code);
      codes.push(code);
    }

    // Log no canal de codiguins
    const logChId = config.channels.logsCodiguins;
    if (logChId) {
      const logCh = interaction.guild.channels.cache.get(logChId);
      if (logCh) {
        const embed = new EmbedBuilder()
          .setColor(config.embedColor)
          .setTitle('🎟️ Codiguins Gerados')
          .setDescription(codes.map((c, i) => `\`${i + 1}.\` \`${c}\``).join('\n'))
          .addFields({ name: 'Gerado por', value: `<@${interaction.user.id}>`, inline: true })
          .setTimestamp();

        await logCh.send({ embeds: [embed] }).catch(() => {});
      }
    }

    await interaction.editReply({
      content: `✅ **${qtd} código(s) gerado(s):**\n\n` +
        codes.map(c => `\`${c}\``).join('\n') +
        '\n\n⚠️ Esses códigos são de uso único. Guarde-os com segurança.'
    });
  }
};
