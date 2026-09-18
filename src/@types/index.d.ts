export type AspectoAmbiental = 'clima' | 'flora' | 'fauna' | 'microfauna' | 'agua' | 'microflora'
export type TipoRecurso = 'quiz' | 'camera' | 'cronometro' | 'audio' | 'desenho' | 'medicao_clima'

export interface MissaoCientifica {
  id: string
  aspecto: AspectoAmbiental
  titulo: string
  orientacaoCientifica: string
  pergunta?: string
  opcoes?: string[]
  correta?: number
  sucesso?: string
  dica?: string
  recursoRequerido: TipoRecurso
  permiteFoto?: boolean
  permiteAudio?: boolean
  permiteDesenho?: boolean
}

export interface Recanto {
  id: string
  icone: string
  titulo: string
  eixoAmbiental: string
  descricao: string
  missoes: MissaoCientifica[]
}

export interface EstadoAplicacao {
  recantoAtual: Recanto | null
  missaoAtual: MissaoCientifica | null
  descobertas: number
  missoesConcluidas: Set<string>
  dadosColetados: Record<string, any>
}