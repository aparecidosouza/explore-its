export type TipoRecurso = 'quiz' | 'camera' | 'audio' | 'desenho' | 'texto'

export interface MissaoCientifica {
  id: string
  titulo: string
  orientacaoCientifica: string
  recursoRequerido: TipoRecurso
  permiteFoto?: boolean
  permiteAudio?: boolean
  permiteDesenho?: boolean
  pergunta?: string
  opcoes?: string[]
  correta?: number
  sucesso?: string
  dica?: string
}

export interface Recanto {
  id: string
  titulo: string
  eixoAmbiental: string
  icone: string
  descricao: string
  missoes: MissaoCientifica[]
}

export interface CrachaInvestigador {
  nomeEquipe: string
  membros: string[]
  avatar: string
  dataInicio: string
}

export interface DadoColetadoMissao {
  foto?: string
  fotoComDesenho?: string
  audio?: string
  duracao?: number
  dataHora?: string
  respostaQuiz?: number
}

export interface EstadoAplicacao {
  cracha: CrachaInvestigador | null
  recantoAtual: Recanto | null
  missaoAtual: MissaoCientifica | null
  descobertas: number
  missoesConcluidas: Set<string>
  dadosColetados: Record<string, DadoColetadoMissao>
}