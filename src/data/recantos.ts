import { Recanto } from '../@types'

export const recantos: Recanto[] = [
  {
    id: 'saci-perere',
    titulo: 'Recanto do Saci-Pererê',
    eixoAmbiental: 'Clima e Contrato do Investigador',
    icone: '🌪️',
    descricao: 'Pactuação de regras ambientais, cadastro da equipe e medição microclimática inicial.',
    missoes: [
      {
        id: 'saci-01',
        titulo: 'Emissão do Crachá Digital de Investigador',
        orientacaoCientifica: 'Firmem o Contrato do Investigador Ecológico, registrem o nome da equipe e liberem o passe de acesso à trilha.',
        recursoRequerido: 'texto'
      },
      {
        id: 'saci-02',
        titulo: 'Medição do Microclima Inicial',
        orientacaoCientifica: 'Utilizem os sensores ou façam a medição de temperatura e sensação térmica sob a copa das árvores.',
        recursoRequerido: 'quiz',
        pergunta: 'Como se comporta a temperatura sob a sombra das árvores em relação ao solo exposto?',
        opcoes: [
          'A sombra reduz a evapotranspiração e aumenta o calor.',
          'A copa das árvores retém a umidade e diminui a temperatura do ar.',
          'Não há variação de temperatura entre áreas de sol e sombra.'
        ],
        correta: 1,
        sucesso: 'Excelente observação microclimática! +10 Descobertas.',
        dica: 'Pensem sobre a retenção de umidade pelas folhas das árvores.'
      }
    ]
  },
  {
    id: 'jatoba',
    titulo: 'Recanto do Jatobá',
    eixoAmbiental: 'Flora e Adaptações Botânicas',
    icone: '🌳',
    descricao: 'Investigação da casca, folhas e frutos do imponente Jatobá e da flora do Cerrado.',
    missoes: [
      {
        id: 'jatoba-01',
        titulo: 'Bioblitz de Decompositores',
        orientacaoCientifica: 'Procurem líquens, fungos ou troncos em decomposição e registrem uma evidência fotográfica.',
        recursoRequerido: 'camera',
        permiteFoto: true
      }
    ]
  },
  {
    id: 'pioneiras',
    titulo: 'Recanto das Pioneiras',
    eixoAmbiental: 'Fauna e Insetos Polinizadores',
    icone: '🐝',
    descricao: 'Observação de insetos, aves e plantas pioneiras na recuperação da vegetação.',
    missoes: [
      {
        id: 'pioneiras-01',
        titulo: 'Mapeamento de Insetos Polinizadores',
        orientacaoCientifica: 'Identifiquem insetos visitando flores e gravem um áudio descrevendo o comportamento deles.',
        recursoRequerido: 'audio',
        permiteAudio: true
      }
    ]
  },
  {
    id: 'caipora',
    titulo: 'Recanto do Caipora',
    eixoAmbiental: 'Bioacústica e Percepção Térmica',
    icone: '🐾',
    descricao: 'Escuta guiada dos sons da mata e análise da paisagem sonora do Cerrado.',
    missoes: [
      {
        id: 'caipora-01',
        titulo: 'Gravador da Paisagem Sonora',
        orientacaoCientifica: 'Façam 30 segundos de silêncio e gravem o som ambiente da floresta (vento, pássaros, insetos).',
        recursoRequerido: 'audio',
        permiteAudio: true
      }
    ]
  },
  {
    id: 'nego-dagua',
    titulo: 'Recanto do Nego D\'Água',
    eixoAmbiental: 'Recursos Hídricos e Veredas',
    icone: '💧',
    descricao: 'Mapeamento do curso d\'água, veredas e rastreamento de fauna nas margens.',
    missoes: [
      {
        id: 'nego-01',
        titulo: 'Mapeamento Hidrológico e Fluxo d\'Água',
        orientacaoCientifica: 'Tirem uma foto do córrego e desenhem a linha vectorial do fluxo da água.',
        recursoRequerido: 'desenho',
        permiteFoto: true,
        permiteDesenho: true
      }
    ]
  }
]