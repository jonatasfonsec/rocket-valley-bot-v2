/**
 * wlHandler.js
 * Gerencia todo o fluxo da Allowlist:
 *  - wl_start   → cria canal temporário e começa as perguntas
 *  - wl_code    → input de codiguin para aprovação imediata
 *  - wl_approve → staff aprova a WL
 *  - wl_reject  → staff reprova a WL
 */

const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

const config = require('../config/config');
const sessions = require('../utils/wlSessions');
const { perguntas, regras_aprovacao } = require('../data/whitelist').whitelist_rocket_valley;

// ─── Gerenciador de codiguin ──────────────────────────────────────────────────
const codigoCodes = new Set(); // populado por /gerar-codiguin

function adicionarCodigo(code) { codigoCodes.add(code.toUpperCase()); }
function usarCodigo(code) {
  const c = code.toUpperCase();
  if (codigoCodes.has(c)) { codigoCodes.delete(c); return true; }
  return false;
}
module.exports.adicionarCodigo = adicionarCodigo;
// ─────────────────────────────────────────────────────────────────────────────

module.exports.handle = async (interaction) => {
  const { customId, guild, user } = interaction;

  // ── INICIAR WL ────────────────────────────────────────────────────────────
  if (customId === 'wl_start') {
    await interaction.deferReply({ ephemeral: true });

    // Evitar WL duplicada
    if (sessions.has(user.id)) {
      const sess = sessions.get(user.id);
      const existingCh = guild.channels.cache.get(sess.channelId);
      return interaction.editReply({
        content: existingCh
          ? `❌ Você já possui uma WL em andamento: ${existingCh}`
          : '❌ Você já possui uma WL em andamento.'
      });
    }

    // Canal duplicado por nome (segurança extra)
    const existing = guild.channels.cache.find(c => c.name === `allowlist-${user.id}`);
    if (existing) {
      return interaction.editReply({ content: `❌ Já existe canal de WL: ${existing}` });
    }

    // Categoria de WL
    const categoryId = config.categories.allowlist;

    const channel = await guild.channels.create({
      name: `allowlist-${user.id}`,
      type: ChannelType.GuildText,
      ...(categoryId ? { parent: categoryId } : {}),
      topic: `wl_owner:${user.id} | step:0 | last:${Date.now()}`,
      permissionOverwrites: [
        // ninguém vê por padrão
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        // usuário pode ver e escrever
        {
          id: user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        // staff vê
        ...config.roles.wlStaff.filter(Boolean).map(roleId => ({
          id: roleId,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory]
        }))
      ]
    }).catch(err => {
      console.error('[WL] Erro ao criar canal:', err);
      return null;
    });

    if (!channel) {
      return interaction.editReply({ content: '❌ Erro ao criar canal de WL. Contate um staff.' });
    }

    sessions.start(user.id, channel.id);

    await interaction.editReply({ content: `📜 WL iniciada em ${channel}! Vá até lá para responder.` });

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('📋 Allowlist — Rocket Valley')
      .setDescription(
        `Olá, <@${user.id}>! Bem-vindo ao processo de Allowlist.\n\n` +
        `Você tem **10 minutos por pergunta** para responder.\n` +
        `Caso o tempo expire, o processo será cancelado e o canal deletado.\n\n` +
        `Perguntas 1-14: múltipla escolha (A, B, C ou D)\n` +
        `Pergunta 15: história do seu personagem (dissertativa)`
      )
      .setFooter({ text: config.footerText });

    await channel.send({ embeds: [embed] });

    // Começa na pergunta 0
    await enviarPergunta(channel, user.id, 0);
    return;
  }

  // ── CODIGUIN ──────────────────────────────────────────────────────────────
  if (customId === 'wl_code') {
    const modal = new ModalBuilder()
      .setCustomId('wl_code_submit')
      .setTitle('Inserir Codiguin');

    const input = new TextInputBuilder()
      .setCustomId('codigo')
      .setLabel('Digite o código de aprovação')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(20);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // ── CODIGUIN SUBMIT ───────────────────────────────────────────────────────
  if (customId === 'wl_code_submit') {
    await interaction.deferReply({ ephemeral: true });
    const codigo = interaction.fields.getTextInputValue('codigo');

    if (!usarCodigo(codigo)) {
      return interaction.editReply({ content: '❌ Código inválido ou já utilizado.' });
    }

    // Dar cargo passport
    try {
      const member = await guild.members.fetch(user.id);
      if (config.roles.turist)   await member.roles.remove(config.roles.turist).catch(() => {});
      if (config.roles.passport) await member.roles.add(config.roles.passport);
    } catch (e) {
      console.error('[WL Codiguin] Erro ao dar cargo:', e);
    }

    // Log
    await logWlAprovada(interaction.client, guild, user, 'codiguin');

    return interaction.editReply({ content: '✅ Código válido! Você foi aprovado(a) automaticamente. Bem-vindo(a)!' });
  }

  // ── STAFF: APROVAR ────────────────────────────────────────────────────────
  if (customId.startsWith('wl_approve_')) {
    const targetId = customId.replace('wl_approve_', '');
    return staffDecision(interaction, guild, targetId, true);
  }

  // ── STAFF: REPROVAR ───────────────────────────────────────────────────────
  if (customId.startsWith('wl_reject_')) {
    const targetId = customId.replace('wl_reject_', '');
    return staffDecision(interaction, guild, targetId, false);
  }
};

// ─── Envia pergunta e cria collector ─────────────────────────────────────────
async function enviarPergunta(channel, userId, index) {
  const pergunta = perguntas[index];

  if (!pergunta) {
    // Todas as perguntas foram respondidas
    await finalizarWl(channel, userId);
    return;
  }

  const session = sessions.get(userId);
  if (!session) return;

  // Cancelar collector e timer anteriores
  if (session.collector && !session.collector.ended) {
    session.collector.stop('next');
  }
  if (session.timeout) {
    clearTimeout(session.timeout);
    session.timeout = null;
  }

  // Montar texto da pergunta
  let texto = `**Pergunta ${pergunta.id} de ${perguntas.length}** — *${pergunta.categoria}*\n\n${pergunta.pergunta}`;

  if (pergunta.alternativas) {
    for (const [key, val] of Object.entries(pergunta.alternativas)) {
      texto += `\n\n**${key})** ${val}`;
    }
    texto += '\n\n> Responda com a letra: **A**, **B**, **C** ou **D**';
  } else {
    texto += '\n\n> Escreva a história do seu personagem abaixo. Seja detalhado(a).';
  }

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setDescription(texto)
    .setFooter({ text: `Pergunta ${index + 1}/${perguntas.length} • Tempo: 10 minutos` });

  await channel.send({ embeds: [embed] });

  // Atualizar topic com step atual
  //await channel.setTopic(`wl_owner:${userId} | step:${index} | last:${Date.now()}`).catch(() => {});

  // Criar collector
  const filter = m => m.author.id === userId && !m.author.bot;

  const collector = channel.createMessageCollector({
    filter,
    time: config.wlTimeout,
    //max: 1
  });

  session.collector = collector;

  // Timer de 10 min (redundante com collector, mas garante)
  //session.timeout = setTimeout(async () => {
  //  if (collector && !collector.ended) collector.stop('timeout');
  //}, config.wlTimeout);

  collector.on('collect', async (msg) => {
    // Limpa o timeout quando coleta resposta
    if (session.timeout) { clearTimeout(session.timeout); session.timeout = null; }

    const resposta = msg.content.trim();

    // Validar múltipla escolha
    if (pergunta.alternativas) {
      const letra = resposta.toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(letra)) {
        await channel.send('❌ Resposta inválida. Responda apenas com **A**, **B**, **C** ou **D**.');
        // Recria o collector para a mesma pergunta
        session.collector = null;
        return;
      }
      session.answers.push({ perguntaId: pergunta.id, resposta: letra, correta: pergunta.resposta_correta });
    } else {
      // Dissertativa (história do personagem)
      if (resposta.length < 50) {
        await channel.send('❌ Resposta muito curta. Por favor, elabore mais sobre a história do seu personagem.');
        session.collector = null;
        return;
      }
      session.answers.push({ perguntaId: pergunta.id, resposta, tipo: 'dissertativa' });
    }

    session.step = index + 1;
	collector.stop('next');
    // Vai para próxima pergunta
    session.collector = null;
    await enviarPergunta(channel, userId, index + 1);
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'timeout') {
      await channel.send('⏰ **Tempo esgotado!** A WL foi cancelada. Você pode reiniciar o processo.');
      sessions.end(userId);
      setTimeout(() => channel.delete().catch(() => {}), 5000);
    }
    // 'next' e 'ended' são casos normais, já tratados acima
  });
}

// ─── Finaliza WL e envia para staff ──────────────────────────────────────────
async function finalizarWl(channel, userId) {
  const session = sessions.get(userId);
  if (!session) return;

  const guild = channel.guild;
  const user = await guild.client.users.fetch(userId).catch(() => null);

  // Contar acertos nas múltipla escolha
  const mcAnswers = session.answers.filter(a => a.correta !== undefined);
  const acertos = mcAnswers.filter(a => a.resposta === a.correta).length;
  const totalMc = perguntas.filter(p => p.alternativas).length;

  const historia = session.answers.find(a => a.tipo === 'dissertativa');

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle('✅ WL Finalizada!')
    .setDescription(
      `Suas respostas foram enviadas para análise da staff.\n` +
      `Acertos nas questões de múltipla escolha: **${acertos}/${totalMc}**\n\n` +
      `Aguarde a aprovação. Você será notificado(a) por DM.`
    )
    .setFooter({ text: config.footerText });

  await channel.send({ embeds: [embed] });

  // Remover permissão de escrita do usuário
  await channel.permissionOverwrites.edit(userId, {
    SendMessages: false
  }).catch(() => {});

  // Enviar para canal de leitura de WL
  const wlReviewChannelId = config.channels.carregarWl;
  if (wlReviewChannelId) {
    const reviewChannel = guild.channels.cache.get(wlReviewChannelId);
    if (reviewChannel) {
      await enviarResumoParaStaff(reviewChannel, user, session, acertos, totalMc, historia, channel.id);
    }
  }

  // Encerra sessão (mas mantém canal para staff decidir)
  sessions.end(userId);
}

// ─── Envia resumo para canal da staff ────────────────────────────────────────
async function enviarResumoParaStaff(reviewChannel, user, session, acertos, totalMc, historia, wlChannelId) {
  const mcAnswers = session.answers.filter(a => a.correta !== undefined);

  let respostasTexto = mcAnswers.map((a, i) => {
    const ok = a.resposta === a.correta ? '✅' : '❌';
    return `${ok} P${a.perguntaId}: **${a.resposta}** (correta: **${a.correta}**)`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setTitle(`📋 WL de ${user?.tag ?? 'Usuário desconhecido'}`)
    .addFields(
      { name: '👤 Usuário', value: `<@${user?.id ?? 'desconhecido'}> (${user?.id ?? 'N/A'})`, inline: true },
      { name: '📊 Acertos', value: `${acertos}/${totalMc}`, inline: true },
      { name: '📝 Respostas MC', value: respostasTexto || 'Nenhuma', inline: false },
      { name: '📖 História do Personagem', value: historia?.resposta ? historia.resposta.slice(0, 1000) : 'Não respondida', inline: false }
    )
    .setFooter({ text: `WL Channel ID: ${wlChannelId}` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`wl_approve_${user?.id}`)
      .setLabel('✅ Aprovar')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`wl_reject_${user?.id}`)
      .setLabel('❌ Reprovar')
      .setStyle(ButtonStyle.Danger)
  );

  await reviewChannel.send({ embeds: [embed], components: [row] });
}

// ─── Decisão da staff (aprovar / reprovar) ────────────────────────────────────
async function staffDecision(interaction, guild, targetId, approved) {
  await interaction.deferReply({ ephemeral: true });

  // Verificar se o usuário que clicou é staff
  const staffMember = await guild.members.fetch(interaction.user.id).catch(() => null);
  const isStaff =
    process.env.DEV_MODE === 'true' ||
    (staffMember && (
      staffMember.permissions.has(PermissionsBitField.Flags.ManageGuild) ||
      config.roles.wlStaff.some(r => staffMember.roles.cache.has(r)) ||
      (config.roles.staff && staffMember.roles.cache.has(config.roles.staff))
    ));

  if (!isStaff) {
    return interaction.editReply({ content: '❌ Você não tem permissão para realizar esta ação.' });
  }

  const targetUser = await guild.client.users.fetch(targetId).catch(() => null);
  const targetMember = await guild.members.fetch(targetId).catch(() => null);

  if (approved) {
    // Dar cargo passport, remover turist
    if (targetMember) {
      if (config.roles.turist)   await targetMember.roles.remove(config.roles.turist).catch(() => {});
      if (config.roles.passport) await targetMember.roles.add(config.roles.passport).catch(() => {});
    }

    // Notificar usuário por DM
    if (targetUser) {
      await targetUser.send({
        content: `✅ **Parabéns!** Sua Allowlist no **Rocket Valley** foi **aprovada**! Você agora tem acesso ao servidor. 🎉`
      }).catch(() => {});
    }

    // Log
    await logWlAprovada(interaction.client, guild, targetUser, `staff: ${interaction.user.tag}`);

    await interaction.editReply({ content: `✅ WL de <@${targetId}> aprovada com sucesso!` });

  } else {
    // Notificar usuário por DM
    if (targetUser) {
      await targetUser.send({
        content: `❌ Sua Allowlist no **Rocket Valley** foi **reprovada**.\nVocê pode tentar novamente acessando o canal de WL e clicando em **Iniciar Allowlist**.`
      }).catch(() => {});
    }

    await interaction.editReply({ content: `❌ WL de <@${targetId}> reprovada.` });
  }

  // Desabilitar botões na mensagem original
  try {
    const msg = interaction.message;
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`wl_approve_${targetId}`)
        .setLabel(approved ? '✅ Aprovado' : '✅ Aprovar')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`wl_reject_${targetId}`)
        .setLabel(approved ? '❌ Reprovar' : '❌ Reprovado')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

    const statusEmbed = EmbedBuilder.from(msg.embeds[0])
      .setColor(approved ? 0x00ff00 : 0xff0000)
      .addFields({ name: approved ? '✅ Aprovado por' : '❌ Reprovado por', value: `<@${interaction.user.id}>` });

    await msg.edit({ embeds: [statusEmbed], components: [disabledRow] });
  } catch (e) {
    console.error('[WL Decision] Erro ao editar mensagem:', e);
  }

  // Deletar canal de WL do usuário após decisão
  const wlChannel = guild.channels.cache.find(c => c.name === `allowlist-${targetId}`);
  if (wlChannel) {
    setTimeout(() => wlChannel.delete().catch(() => {}), 5000);
  }
}

// ─── Log de WL aprovada ───────────────────────────────────────────────────────
async function logWlAprovada(client, guild, user, motivo) {
  const logChId = config.channels.logsComandos;
  if (!logChId) return;
  const logCh = guild.channels.cache.get(logChId);
  if (!logCh) return;

  const embed = new EmbedBuilder()
    .setColor(0x00ff00)
    .setTitle('🟢 WL Aprovada')
    .addFields(
      { name: 'Usuário', value: user ? `<@${user.id}> (${user.tag})` : 'Desconhecido', inline: true },
      { name: 'Motivo/Via', value: motivo, inline: true }
    )
    .setTimestamp();

  await logCh.send({ embeds: [embed] }).catch(() => {});
}
