import type { Estacao } from '../@types'

export const estacoes: Estacao[] = [
  {
    id: 'fazenda-barauna',
    nome: '1. Fazenda Baraúna (Início da Trilha)',
    descricao: 'Ponto de recepção e partida da expedição.',
    icone: '🏡',
    missoes: [
      {
        id: 'm-bar-foto',
        titulo: 'Registro de Partida',
        descricao: 'Tire uma foto do grupo ou da entrada da fazenda.',
        tipo: 'foto'
      },
      {
        id: 'm-bar-temp',
        titulo: '1ª Medição de Temperatura',
        descricao: 'Meça a temperatura ambiental inicial e confirme o horário de partida.',
        tipo: 'temperatura',
        requerHorario: true
      }
    ]
  },

  {
    id: 'saci-perere',
    nome: '2. Estação Saci-Pererê',
    descricao: 'Investigue os sons e ruídos da mata.',
    icone: '🌪️',
    missoes: [
      {
        id: 'm-saci-1',
        titulo: 'Sons da Mata',
        descricao: 'Grave um áudio dos sons da natureza ao seu redor.',
        tipo: 'audio'
      }
    ]
  },

  {
    id: 'recanto-jatoba',
    nome: '3. Recanto do Jatobá',
    descricao: 'Observação da flora e 2º ponto de microclima.',
    icone: '🌰',
    missoes: [
      {
        id: 'm-jat-temp',
        titulo: '2ª Medição de Temperatura',
        descricao: 'Meça a temperatura sob a copa das árvores.',
        tipo: 'temperatura'
      },
      {
        id: 'm-jat-obs',
        titulo: 'Observação da Vegetação',
        descricao: 'Descreva as sementes e características das árvores encontradas.',
        tipo: 'texto'
      }
    ]
  },

  {
    id: 'recanto-pioneiras',
    nome: '4. Recanto das Pioneiras',
    descricao:
      'Investigação sobre plantas pioneiras e os organismos que ajudam a regenerar a mata.',
    icone: '🌱',
    missoes: [
      {
        id: 'm-pio-quiz-organismos',
        titulo: '🧠 Quem Ajuda a Floresta a Voltar?',
        descricao:
          'Marque a opção que lista TODOS os organismos capazes de auxiliar as plantas pioneiras na regeneração da área.',
        tipo: 'quiz',
        opcoesQuiz: [
          {
            id: 'opt-a',
            texto:
              'Apenas insetos grandes que comem as folhas das árvores adultas.',
            correta: false,
            explicacao:
              'Incorreto. A regeneração precisa de dispersores de sementes, polinizadores e decompositores.'
          },
          {
            id: 'opt-b',
            texto:
              'Formigas dispersoras de sementes, aves frugívoras, abelhas polinizadoras, minhocas e fungos decompositores.',
            correta: true,
            explicacao:
              'Correto! Todos esses organismos atuam juntos transportando sementes, polinizando e enriquecendo o solo.'
          },
          {
            id: 'opt-c',
            texto:
              'Apenas grandes mamíferos que caminham pela vegetação.',
            correta: false,
            explicacao:
              'Incorreto. Pequenos insetos, fungos e aves têm papel fundamental no solo e nas sementes.'
          }
        ]
      },

      {
        id: 'm-pio-busca-foto',
        titulo: '🔎 Desafio do Detetive: Foto no Campo',
        descricao:
          'Agora que você aprendeu quem são os ajudantes da floresta, procure no local e fotografe 1 ou 2 organismos (ou sinais deles) atuando no solo ou na vegetação.',
        instrucoesHtml: `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:8px; font-size:0.88rem; margin-bottom:12px; color:#166534;">
            <p style="margin-bottom:6px;"><strong>O que procurar no solo ou nas plantas:</strong></p>
            <ul style="padding-left:18px; margin:4px 0;">
              <li>🐜 Formigas carregando folhas ou sementes</li>
              <li>🐝 Insetos visitando flores</li>
              <li>🍄 Fungos/cogumelos em troncos ou matéria orgânica</li>
              <li>🪱 Pequenos invertebrados no solo</li>
            </ul>
          </div>
        `,
        tipo: 'foto'
      }
    ]
  },

  {
    id: 'caipora',
    nome: '5. Estação Caipora',
    descricao: 'Rastros e vestígios da fauna local.',
    icone: '🐾',
    missoes: [
      {
        id: 'm-cai-1',
        titulo: 'Pegadas e Registros',
        descricao: 'Fotografe marcas ou rastros no solo.',
        tipo: 'foto'
      }
    ]
  },

  {
    id: 'recanto-nego-dagua',
    nome: "6. Recanto do Nego d'Água",
    descricao:
      "Área próxima ao curso d'água para investigação de interações ecológicas.",
    icone: '💧',
    missoes: [
      {
        id: 'm-neg-temp',
        titulo: '3ª Medição de Temperatura',
        descricao: 'Meça a temperatura próximo ao córrego.',
        tipo: 'temperatura'
      },
      {
        id: 'm-neg-investigacao',
        titulo: '🌊 Quem vive às margens do córrego?',
        descricao:
          'Permanecendo na ponte (sem entrar na água), encontre 2 evidências ecológicas, fotografe 1 delas e elabore sua hipótese.',
        tipo: 'investigacao-corrego'
      }
    ]
  }
]