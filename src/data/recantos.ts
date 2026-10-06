import type { Estacao } from '../@types'

export const estacoes: Estacao[] = [
    {
   id: 'inicio-trilha',
   nome: 'Início da Trilha',
    descricao: 'Ponto de partida da expedição pela Trilha da Semente Peregrina.',
    icone: '🥾',
    missoes: [
      {
        id: 'm-bar-foto',
        titulo: 'Registro de Partida',
        descricao: 'Registre uma foto do grupo no início da trilha.',
        tipo: 'foto'
      },
      {
        id: 'm-bar-temp',
        titulo: '1ª Medição de Temperatura',
        descricao: 'Meça a temperatura ambiental no início da trilha e registre o horário de partida.',
        tipo: 'temperatura',
        requerHorario: true
     }
   ]
  },

  {
    id: 'recanto-saci-perere',
    nome: 'Recanto do Saci-Pererê',
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
    id: 'caipora',
    nome: 'Recanto da Caipora',
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
  }
]