module.exports = {
  whitelist_rocket_valley: {
    nivel: 'padrao',
    instrucoes: 'Responda com atenção. Perguntas de múltipla escolha possuem apenas uma alternativa correta. A última pergunta deve ser respondida de forma dissertativa.',
    perguntas: [
      { id: 1, categoria: 'lore', pergunta: 'O que marcou o início da guerra em 1887?', alternativas: { A: 'Conflito político entre cidades', B: 'Navios negros sem identificação', C: 'Ataque interno em Saint Denis', D: 'Revolta de fazendeiros' }, resposta_correta: 'B' },
      { id: 2, categoria: 'lore', pergunta: 'O que aconteceu em Scarlet Ridge?', alternativas: { A: 'Acordo de paz', B: 'Batalha brutal contra Guarma', C: 'Retirada da resistência', D: 'Traição interna' }, resposta_correta: 'B' },
      { id: 3, categoria: 'lore', pergunta: 'Quem é Elias "Snake" Carver?', alternativas: { A: 'General de Guarma', B: 'Líder da resistência', C: 'Contrabandista que joga dos dois lados', D: 'Xerife de Valentine' }, resposta_correta: 'C' },
      { id: 4, categoria: 'lore', pergunta: 'Como Valentine caiu?', alternativas: { A: 'Abandonada', B: 'Ataque rápido', C: 'Cerco seguido de invasão', D: 'Traição' }, resposta_correta: 'C' },
      { id: 5, categoria: 'lore', pergunta: 'Quem é Clara Whitaker?', alternativas: { A: 'Médica capturada', B: 'Espiã de Guarma', C: 'Líder da resistência', D: 'Comerciante' }, resposta_correta: 'C' },
      { id: 6, categoria: 'lore', pergunta: 'O que é Rocket Valley?', alternativas: { A: 'Cidade comercial', B: 'Quartel general de Guarma', C: 'Território neutro', D: 'Último reduto da resistência' }, resposta_correta: 'D' },
      { id: 7, categoria: 'lore', pergunta: 'O que Snake fez com os suprimentos?', alternativas: { A: 'Doou à resistência', B: 'Vendeu para Guarma', C: 'Escondeu em Armadillo', D: 'Destruiu' }, resposta_correta: 'C' },
      { id: 8, categoria: 'lore', pergunta: 'Qual foi o papel de Arthur Vale em Armadillo?', alternativas: { A: 'Político', B: 'Organizou defesa', C: 'Comerciante', D: 'Espião' }, resposta_correta: 'B' },
      { id: 9, categoria: 'lore', pergunta: 'Qual o conflito entre Arthur e Clara?', alternativas: { A: 'Poder', B: 'Lutar vs sobreviver', C: 'Dinheiro', D: 'Traição' }, resposta_correta: 'B' },
      { id: 10, categoria: 'lore', pergunta: 'O que representa Rocket Valley?', alternativas: { A: 'Cidade antiga', B: 'Base militar', C: 'Novo começo da guerra', D: 'Território de Guarma' }, resposta_correta: 'C' },
      { id: 11, categoria: 'regras_rp', pergunta: 'O que é Powergaming?', alternativas: { A: 'Ignorar chat', B: 'Forçar ações irreais', C: 'Usar meta', D: 'Evitar combate' }, resposta_correta: 'B' },
      { id: 12, categoria: 'regras_rp', pergunta: 'O que é Metagaming?', alternativas: { A: 'Quebrar regras', B: 'Usar info externa no RP', C: 'Jogar sozinho', D: 'Criar personagem' }, resposta_correta: 'B' },
      { id: 13, categoria: 'regras_rp', pergunta: 'Você foi capturado. O que fazer?', alternativas: { A: 'Sair do jogo', B: 'Ignorar', C: 'Seguir RP', D: 'Atacar' }, resposta_correta: 'C' },
      { id: 14, categoria: 'regras_rp', pergunta: 'O que é Fear RP?', alternativas: { A: 'Medo de perder itens', B: 'Fugir sempre', C: 'Valorizar a vida', D: 'Evitar players' }, resposta_correta: 'C' },
      { id: 15, categoria: 'personagem', tipo: 'dissertativa', pergunta: 'Conte a história do seu personagem: origem, o que viveu na guerra e seu objetivo em Rocket Valley.' }
    ],
    regras_aprovacao: {
      minimo_acertos: 12,
      historia_obrigatoria: true,
      criterio: 'Respostas coerentes + interpretação adequada'
    }
  }
};
