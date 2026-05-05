const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config/config');

module.exports = {
  name: Events.GuildMemberRemove,

  async execute(member) {
    const logChId = config.channels.logsSaida;
    if (!logChId) return;

    const logCh = member.guild.channels.cache.get(logChId);
    if (!logCh) return;

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🚪 Membro saiu')
      .setDescription(`<@${member.id}> saiu do servidor.`)
      .addFields(
        { name: 'Usuário', value: `${member.user.tag}`, inline: true },
        { name: 'ID', value: member.id, inline: true },
        { name: 'Estava no servidor há', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Desconhecido', inline: true }
      )
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await logCh.send({ embeds: [embed] }).catch(() => {});
  }
};
