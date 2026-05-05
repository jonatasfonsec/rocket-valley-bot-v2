/**
 * ticketHandler.js
 * Gerencia tickets de suporte com categorias via select menu.
 */

const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');

const config = require('../config/config');

const TICKET_CATEGORIES = [
  { label: 'Bugs', value: 'bugs', emoji: '🐛', description: 'Reporte um bug no servidor' },
  { label: 'Suporte', value: 'suporte', emoji: '🎧', description: 'Precisa de ajuda?' },
  { label: 'Parcerias', value: 'parcerias', emoji: '🤝', description: 'Proposta de parceria' },
  { label: 'Denúncias', value: 'denuncia', emoji: '🚨', description: 'Denunciar um jogador' },
  { label: 'Corregedoria Policial', value: 'corregedoria', emoji: '⚖️', description: 'Assuntos da polícia' }
];

module.exports.handle = async (interaction) => {
  const { customId, guild, user } = interaction;

  // ── Painel de tickets (select menu) ──────────────────────────────────────
  if (customId === 'ticket_open') {
    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_category')
      .setPlaceholder('Selecione a categoria do ticket...')
      .addOptions(
        TICKET_CATEGORIES.map(cat =>
          new StringSelectMenuOptionBuilder()
            .setLabel(cat.label)
            .setValue(cat.value)
            .setEmoji(cat.emoji)
            .setDescription(cat.description)
        )
      );

    return interaction.reply({
      content: '📋 Selecione a categoria do ticket abaixo:',
      components: [new ActionRowBuilder().addComponents(select)],
      ephemeral: true
    });
  }

  // ── Categoria selecionada → criar canal de ticket ─────────────────────────
  if (customId === 'ticket_category') {
    await interaction.deferReply({ ephemeral: true });

    const selectedValue = interaction.values[0];
    const cat = TICKET_CATEGORIES.find(c => c.value === selectedValue);
    if (!cat) return interaction.editReply({ content: '❌ Categoria inválida.' });

    // Verificar ticket existente
    const existing = guild.channels.cache.find(
      c => c.name === `ticket-${user.id}-${selectedValue}`
    );

    if (existing) {
      return interaction.editReply({
        content: `❌ Você já tem um ticket aberto nessa categoria: ${existing}`
      });
    }

    const categoryId = config.categories.suporte;

    const channel = await guild.channels.create({
      name: `ticket-${user.id}-${selectedValue}`,
      type: ChannelType.GuildText,
      ...(categoryId ? { parent: categoryId } : {}),
      topic: `ticket | user:${user.id} | cat:${selectedValue} | opened:${Date.now()}`,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        {
          id: user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        ...config.roles.wlStaff.map(roleId => ({
          id: roleId,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
        }))
      ]
    }).catch(err => {
      console.error('[Ticket] Erro ao criar canal:', err);
      return null;
    });

    if (!channel) {
      return interaction.editReply({ content: '❌ Erro ao criar ticket. Contate um staff.' });
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(`${cat.emoji} Ticket — ${cat.label}`)
      .setDescription(
        `Olá <@${user.id}>, seu ticket de **${cat.label}** foi criado!\n\n` +
        `Descreva seu problema ou solicitação abaixo e aguarde um staff.`
      )
      .setFooter({ text: config.footerText })
      .setTimestamp();

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_close_${user.id}_${selectedValue}`)
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ content: `<@${user.id}>`, embeds: [embed], components: [closeRow] });

    // Pingar cargo de staff se configurado
    if (config.roles.staff) {
      await channel.send({ content: `<@&${config.roles.staff}>` }).then(m => m.delete().catch(() => {}));
    }

    return interaction.editReply({ content: `✅ Ticket criado: ${channel}` });
  }

  // ── Fechar ticket ─────────────────────────────────────────────────────────
  if (customId.startsWith('ticket_close_')) {
    await interaction.deferReply({ ephemeral: true });

    const member = await guild.members.fetch(user.id).catch(() => null);
    const isStaff =
      process.env.DEV_MODE === 'true' ||
      (member && (
        member.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
        config.roles.wlStaff.some(r => member.roles.cache.has(r)) ||
        (config.roles.staff && member.roles.cache.has(config.roles.staff))
      ));

    // Dono do ticket também pode fechar
    const parts = customId.split('_');
    const ticketOwnerId = parts[2];
    const isOwner = user.id === ticketOwnerId;

    if (!isStaff && !isOwner) {
      return interaction.editReply({ content: '❌ Sem permissão para fechar este ticket.' });
    }

    // Logar fechamento
    const logChId = config.channels.finalizouTicket;
    if (logChId) {
      const logCh = guild.channels.cache.get(logChId);
      if (logCh) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('🔒 Ticket Fechado')
          .addFields(
            { name: 'Canal', value: interaction.channel.name, inline: true },
            { name: 'Fechado por', value: `<@${user.id}>`, inline: true }
          )
          .setTimestamp();

        await logCh.send({ embeds: [embed] }).catch(() => {});
      }
    }

    await interaction.editReply({ content: '🔒 Fechando ticket em 5 segundos...' });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
};
