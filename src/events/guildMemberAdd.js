const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config');

module.exports = {
  name: Events.GuildMemberAdd,

  async execute(member) {
    // ── Log de entrada ──────────────────────────────────────────────────────
    const logChId = config.channels.logsEntrada;
    if (logChId) {
      const logCh = member.guild.channels.cache.get(logChId);
      if (logCh) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle('👋 Novo Membro')
          .setDescription(`<@${member.id}> entrou no servidor.`)
          .addFields(
            { name: 'Usuário', value: `${member.user.tag}`, inline: true },
            { name: 'ID', value: member.id, inline: true },
            { name: 'Conta criada em', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        await logCh.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // ── Dar cargo de turista ────────────────────────────────────────────────
    if (config.roles.turist) {
      await member.roles.add(config.roles.turist).catch(() => {});
    }

    // ── DM de boas-vindas redirecionando para o canal da WL ─────────────────────────────────	
	const wlChannelId = config.channels.wlPanel;
if (wlChannelId) {
  await member.send({
    content: `👋 Olá, **${member.user.username}**! Bem-vindo(a) ao **Rocket Valley**!\n\nPara ter acesso ao servidor, acesse o canal <#${wlChannelId}> e clique em **Iniciar Allowlist**.`
  }).catch(() => {});
}

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

    await member.send({ embeds: [dmEmbed], components: [row] }).catch(() => {
      console.log(`[GuildMemberAdd] Não foi possível enviar DM para ${member.user.tag}`);
    });
  }
};
