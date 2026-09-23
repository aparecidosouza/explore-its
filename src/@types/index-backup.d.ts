export interface MissaoCientifica {
  id: string
  titulo: string
  orientacaoCientifica: string
  recursoRequerido?: 'camera' | 'audio' | 'desenho' | 'temperatura'
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
  icone: string
  eixoAmbiental: string
  descricao: string
  missoes: MissaoCientifica[]
}

export interface CrachaDigital {
  nomeEquipe: string
  membros: string[]
  avatar: string
  dataInicio: string
}

export interface RegistroEvidencia {
  foto?: string
  fotoComDesenho?: string
  audio?: string
  duracao?: number
  temperatura?: number
  dataHora: string
}

export interface EstadoAplicacao {
  cracha: CrachaDigital | null
  recantoAtual: Recanto | null
  missaoAtual: MissaoCientifica | null
  descobertas: number
  missoesConcluidas: Set<string>
  dadosColetados: Record<string, RegistroEvidencia>
}