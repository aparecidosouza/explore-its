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