import { Recanto } from '../@types'

export const recantos: Recanto[] = [
  {
    id: 'barauna',
    titulo: 'Fazenda Baraúna (Entrada)',
    icone: '🏡',
    eixoAmbiental: 'Clima & Linha de Base',
    descricao: 'Área aberta exposta ao sol na entrada da expedição. Medição da temperatura inicial.',
    missoes: [
      {
        id: 'barauna-temp',
        titulo: 'Termometria Inicial da Expedição',
        orientacaoCientifica: 'Segurem o termômetro no ar à sombra do corpo por 20 segundos na área externa da Fazenda Baraúna antes de entrar na trilha e registrem a temperatura.',
        recursoRequerido: 'temperatura',
        sucesso: 'Temperatura inicial da Fazenda Baraúna registrada com sucesso!'
      }
    ]
  },
  {
    id: 'saci',
    titulo: 'Recanto do Saci-Pererê',
    icone: '🌀',
    eixoAmbiental: 'Acolhimento & Contrato Ecológico',
    descricao: 'Ponto de recepção e alinhamento do Contrato do Investigador Ecológico.',
    missoes: [
      {
        id: 'saci-01',
        titulo: 'Pacto de Investigação Ecológica',
        orientacaoCientifica: 'Assinem o compromisso de respeito à fauna, flora e normas da trilha para emitir o crachá da equipe.',
        sucesso: 'Contrato assinado! Acesso liberado à Trilha da Semente Peregrina.'
      }
    ]
  },
  {
    id: 'jatoba',
    titulo: 'Recanto do Jatobá',
    icone: '🌳',
    eixoAmbiental: 'Flora & Sombra Arbórea',
    descricao: 'Análise botânica do imponente Jatobá e medição do impacto da sombra das árvores.',
    missoes: [
      {
        id: 'jatoba-temp',
        titulo: 'Medição na Sombra da Copa',
        orientacaoCientifica: 'Segurem o termômetro suspenso no ar sob a sombra da copa do Jatobá por 20 segundos e registrem a temperatura.',
        recursoRequerido: 'temperatura',
        sucesso: 'Temperatura sob a copa do Jatobá registrada!'
      },
      {
        id: 'jatoba-01',
        titulo: 'Adaptações da Casca e Folhas',
        orientacaoCientifica: 'Examinem o tronco do Jatobá e encontrem uma folha ou casca caída para registro fotográfico.',
        recursoRequerido: 'camera',
        permiteFoto: true,
        sucesso: 'Evidência botânica registrada com sucesso!'
      }
    ]
  },
  {
    id: 'pioneiras',
    titulo: 'Recanto das Pioneiras',
    icone: '🐝',
    eixoAmbiental: 'Fauna & Polinizadores',
    descricao: 'Observação da fauna, insetos polinizadores e aves em áreas de regeneração.',
    missoes: [
      {
        id: 'pioneiras-01',
        titulo: 'Detetive de Polinizadores',
        orientacaoCientifica: 'Procurem abelhas, borboletas ou insetos nas flores ao redor e registrem uma imagem.',
        recursoRequerido: 'camera',
        permiteFoto: true,
        sucesso: 'Polinizador catalogado!'
      }
    ]
  },
  {
    id: 'caipora',
    titulo: 'Recanto do Caipora',
    icone: '👂',
    eixoAmbiental: 'Paisagem Sonora',
    descricao: 'Escuta atenta da mata e registro dos sons da biodiversidade.',
    missoes: [
      {
        id: 'caipora-01',
        titulo: 'Gravação da Bioacústica',
        orientacaoCientifica: 'Façam 30 segundos de silêncio e gravem o som ambiente da floresta (pássaros, vento e insetos).',
        recursoRequerido: 'audio',
        permiteAudio: true,
        sucesso: 'Áudio dos sons da mata salvo no relatório!'
      }
    ]
  },
  {
    id: 'nego-dagua',
    titulo: 'Recanto do Nego D\'Água',
    icone: '💧',
    eixoAmbiental: 'Recursos Hídricos & Veredas',
    descricao: 'Investigação do curso d\'água, umidade da vereda e microclima ciliar.',
    missoes: [
      {
        id: 'nego-temp',
        titulo: 'Microclima Úmido sobre a Vereda',
        orientacaoCientifica: 'Na ponte sobre o córrego, meçam a temperatura do ar sobre a água corrente (à sombra). Comparem com a Fazenda Baraúna e o Jatobá.',
        recursoRequerido: 'temperatura',
        sucesso: 'Temperatura da vereda do Nego D\'Água registrada!'
      },
      {
        id: 'nego-01',
        titulo: 'Mapeamento do Vetor de Fluxo',
        orientacaoCientifica: 'Tirem uma foto do córrego e desenhem a linha vermelha indicando o sentido de fluxo da água.',
        recursoRequerido: 'desenho',
        permiteFoto: true,
        permiteDesenho: true,
        sucesso: 'Fluxo hídrico mapeado no relatório!'
      },
      {
        id: 'nego-quiz-clima',
        titulo: 'Desafio Científico: Regulação Térmica',
        orientacaoCientifica: 'Analisem as medições de temperatura coletadas ao longo da expedição e respondam:',
        pergunta: 'O que explica a redução de temperatura observada no Recanto do Nego D\'Água em relação à entrada na Fazenda Baraúna?',
        opcoes: [
          'A sombra da mata ciliar e a evapotranspiração do córrego absorvem calor e umedecem o ar.',
          'A velocidade do vento é sempre mais forte dentro da mata densa.',
          'A Fazenda Baraúna fica mais perto do sol do que a vereda.'
        ],
        correta: 0,
        sucesso: 'Excelente dedução científica! A vegetação e a água funcionam como um regulador térmico natural.',
        dica: 'Lembrem-se da presença da água e das árvores densas na vereda.'
      }
    ]
  }
]