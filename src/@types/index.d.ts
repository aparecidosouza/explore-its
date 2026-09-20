export interface Mascote {
  id: string
  nome: string
  emoji: string
}

export interface OpcaoQuiz {
  id: string
  texto: string
  correta: boolean
  explicacao: string
}

export interface Missao {
  id: string
  titulo: string
  descricao: string
  instrucoesHtml?: string
  tipo:
    | 'foto'
    | 'temperatura'
    | 'audio'
    | 'texto'
    | 'quiz'
    | 'investigacao-corrego'
  opcoesQuiz?: OpcaoQuiz[]
  requerHorario?: boolean
}

export interface Estacao {
  id: string
  nome: string
  descricao: string
  icone: string
  missoes: Missao[]
}

export interface RespostaAtividade {
  estacaoId: string
  missaoId: string
  titulo: string
  conteudo: string
  midiaUrl?: string
  dataHora: string
}

export interface MedicaoTemp {
  estacaoId: string
  estacaoNome: string
  valorTemp: number
  horarioMedicao: string
}

export interface Cracha {
  nome: string
  turma: string
  mascote: Mascote
}

/*
 * Estruturas que serão utilizadas na próxima etapa
 * da refatoração do aplicativo.
 */

export interface MissaoCientifica {
  id: string
  titulo: string
  orientacaoCientifica: string
  recursoRequerido?:
    | 'camera'
    | 'audio'
    | 'desenho'
    | 'temperatura'
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