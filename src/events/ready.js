const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config');
const sessions = require('../utils/wlSessions');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`✅ Bot online como ${client.user.tag}`);

    // ── Painel WL automático no canal configurado ───────────────────────────
    const wlChannelId = config.channels.wlPanel;
    if (wlChannelId) {
      const channel = await client.channels.fetch(wlChannelId).catch(() => null);

      if (channel) {
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMsg = messages.find(m => m.author.id === client.user.id && m.components.length > 0);

        if (!botMsg) {
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

          await channel.send({ embeds: [embed], components: [row] })
            .then(m => m.pin().catch(() => {}))
            .catch(console.error);

          console.log('✅ Painel WL enviado.');
        } else {
          console.log('ℹ️ Painel WL já existe no canal.');
        }
      }
    }

    // ── Painel Tickets automático ───────────────────────────────────────────
    const ticketChannelId = config.channels.abrirTicket;
    if (ticketChannelId) {
      const channel = await client.channels.fetch(ticketChannelId).catch(() => null);

      if (channel) {
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMsg = messages.find(m => m.author.id === client.user.id && m.components.length > 0);

        if (!botMsg) {
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

          await channel.send({ embeds: [embed], components: [row] }).catch(console.error);
          console.log('✅ Painel de tickets enviado.');
        } else {
          console.log('ℹ️ Painel de tickets já existe.');
        }
      }
    }

    // ── Limpeza de canais de WL abandonados (roda a cada 1 min) ────────────
    setInterval(async () => {
      for (const guild of client.guilds.cache.values()) {
        const wlChannels = guild.channels.cache.filter(c => c.name.startsWith('allowlist-'));

        for (const channel of wlChannels.values()) {
          const topic = channel.topic || '';
          const match = topic.match(/last:(\d+)/);
          if (!match) continue;

          const lastActivity = Number(match[1]);
          const elapsed = Date.now() - lastActivity;

          // Deleta se inativo por mais de 15 minutos
          if (elapsed > 15 * 60 * 1000) {
            console.log(`🧹 Deletando canal WL abandonado: ${channel.name}`);
            // Extrai userId do nome do canal
            const userId = channel.name.replace('allowlist-', '');
            sessions.end(userId);
            await channel.delete('WL abandonada').catch(() => {});
          }
        }
      }
    }, 60 * 1000);
  }
};
