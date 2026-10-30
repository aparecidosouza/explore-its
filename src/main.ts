import { catalogoElementos } from './catalogo-elementos'

import { Html5Qrcode } from 'html5-qrcode'

import { dadosCaderno } from './dados-caderno'

import { jsPDF } from 'jspdf'

import './style.css'

import type {
  Mascote,
  Cracha
} from './@types'

const mascotes: Mascote[] = [
  { id: 'guara', nome: 'Guará', emoji: '🦊' },
  { id: 'bandeira', nome: 'Bandeira', emoji: '🐜' },
  { id: 'arara', nome: 'Azulzinha', emoji: '🦜' },
  { id: 'tatu', nome: 'Bolinha', emoji: '🦔' }
]


// =====================================================
// EXPLORE ITS — BANCO DE DADOS LOCAL (IndexedDB)
// =====================================================

const NOME_BANCO_EXPLORE = 'explore_its_local'
const VERSAO_BANCO_EXPLORE = 1

function abrirBancoExplore(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {

    const requisicao = indexedDB.open(
      NOME_BANCO_EXPLORE,
      VERSAO_BANCO_EXPLORE
    )

    requisicao.onupgradeneeded = () => {
      const banco = requisicao.result

      if (!banco.objectStoreNames.contains('registros')) {
        banco.createObjectStore('registros')
      }

      if (!banco.objectStoreNames.contains('fotografias')) {
        banco.createObjectStore('fotografias')
      }
    }

    requisicao.onsuccess = () => {
      resolve(requisicao.result)
    }

    requisicao.onerror = () => {
      reject(
        requisicao.error ??
        new Error('Não foi possível abrir o banco local.')
      )
    }

    requisicao.onblocked = () => {
      reject(
        new Error('A atualização do banco local está bloqueada.')
      )
    }
  })
}

// =====================================================
// EXPLORE ITS — TESTE DE INICIALIZAÇÃO DO BANCO LOCAL
// =====================================================

void abrirBancoExplore()
  .then(banco => {
    console.log(
      'EXPLORE ITS — Banco local iniciado:',
      banco.name,
      '| Versão:',
      banco.version
    )

    banco.close()
  })
  .catch(erro => {
    console.error(
      'EXPLORE ITS — Falha ao iniciar o banco local:',
      erro
    )
  })

// =====================================================
// EXPLORE ITS — GRAVAÇÃO NO BANCO LOCAL
// =====================================================

async function salvarNoBancoExplore(
  area: 'registros' | 'fotografias',
  chave: string,
  valor: unknown
): Promise<void> {

  const banco = await abrirBancoExplore()

  return new Promise<void>((resolve, reject) => {

    let concluido = false

    const transacao = banco.transaction(area, 'readwrite')

    const armazenamento = transacao.objectStore(area)

    armazenamento.put(valor, chave)

    transacao.oncomplete = () => {
      concluido = true
      banco.close()
      resolve()
    }

    transacao.onerror = () => {
      if (!concluido) {
        banco.close()
        reject(
          transacao.error ??
          new Error('Falha ao salvar os dados.')
        )
      }
    }

    transacao.onabort = () => {
      if (!concluido) {
        banco.close()
        reject(
          transacao.error ??
          new Error('Gravação cancelada.')
        )
      }
    }

  })
}

// =====================================================
// EXPLORE ITS — LEITURA DO BANCO LOCAL
// =====================================================

async function lerDoBancoExplore<T>(
  area: 'registros' | 'fotografias',
  chave: string
): Promise<T | undefined> {

  const banco = await abrirBancoExplore()

  return new Promise<T | undefined>((resolve, reject) => {

    const transacao = banco.transaction(area, 'readonly')
    const armazenamento = transacao.objectStore(area)
    const requisicao = armazenamento.get(chave)

    let resultado: T | undefined

    requisicao.onsuccess = () => {
      resultado = requisicao.result as T | undefined
    }

    transacao.oncomplete = () => {
      banco.close()
      resolve(resultado)
    }

    transacao.onerror = () => {
      banco.close()
      reject(
        transacao.error ??
        new Error('Falha ao recuperar os dados.')
      )
    }

    transacao.onabort = () => {
      banco.close()
      reject(
        transacao.error ??
        new Error('Leitura cancelada.')
      )
    }

  })
}


// =====================================================
// EXPLORE ITS — LIMPAR FOTOS DAS DESCOBERTAS LIVRES
// =====================================================


async function limparFotosDescobertasLivres(): Promise<void> {
  const banco = await abrirBancoExplore()

  return new Promise<void>((resolve, reject) => {
    const transacao = banco.transaction(
      'fotografias',
      'readwrite'
    )

    const armazenamento = transacao.objectStore('fotografias')

    // Exclui os dados das seis descobertas livres
    for (
      let indice = 1;
      indice <= LIMITE_DESCOBERTAS_LIVRES;
      indice++
    ) {
      // Fotografia
      armazenamento.delete(
        `exp_descoberta_livre_${indice}`
      )

      // Nome da descoberta
      armazenamento.delete(
        `exp_nome_livre_${indice}`
      )

      // Descrição da descoberta
      armazenamento.delete(
        `exp_observacao_livre_${indice}`
      )
    }

    transacao.oncomplete = () => {
      banco.close()
      resolve()
    }

    transacao.onerror = () => {
      banco.close()
      reject(
        transacao.error ??
        new Error('Falha ao excluir as descobertas.')
      )
    }

    transacao.onabort = () => {
      banco.close()
      reject(
        transacao.error ??
        new Error('Exclusão das descobertas cancelada.')
      )
    }
  })
}


// =====================================================
// ESTADO DA EXPEDIÇÃO
// Dados que permanecem salvos durante a investigação
// =====================================================

let crachaSalvo: Cracha | null = JSON.parse(
  localStorage.getItem('exp_cracha') || 'null'
)

// ==========================================
// REGISTRO DE PARTIDA DA EXPEDIÇÃO
// ==========================================

// Fotografia oficial do grupo no início da trilha.
// Uma nova fotografia substituirá a anterior.
let fotoPartida: string | null =
  localStorage.getItem('exp_foto_partida')

// Recupera a fotografia do IndexedDB ao iniciar o aplicativo.
// Mantém a fotografia antiga do localStorage como alternativa.
void lerDoBancoExplore<string>(
  'fotografias',
  'exp_foto_partida'
)
  .then(fotografia => {
    if (fotografia) {
      fotoPartida = fotografia

      // Atualiza a interface somente se o estudante
      // estiver na tela do Registro de Partida.
      if (telaAtual === 'registro-partida') {
        render()
      }
    }
  })
  .catch(erro => {
    console.error(
      'EXPLORE ITS — Erro ao recuperar fotografia:',
      erro
    )
  })

let inicioExpedicao: string | null =
  localStorage.getItem('exp_inicio_expedicao')

let idExpedicao: string | null =
  localStorage.getItem('exp_id_expedicao')


// =====================================================
// EXPLORE ITS — ELEMENTOS SORTEADOS DA EXPEDIÇÃO
// Uma árvore, um processo ecológico,
// uma formação natural e um elemento folclórico
// =====================================================

type CategoriaInvestigacao = 'ARV' | 'ECO' | 'FOR' | 'FOL'

type ElementoSorteado = {
  id: string
  categoria: CategoriaInvestigacao
  encontrado: boolean
}

let elementosSorteados: ElementoSorteado[] = JSON.parse(
  localStorage.getItem('exp_elementos_sorteados') || '[]'
)

// =====================================================
// EXPLORE ITS — FOTOGRAFIAS DAS INVESTIGAÇÕES
// =====================================================

// As fotografias das investigações são recuperadas do IndexedDB.
let fotosElementos: Record<string, string> = {}

// Identifica alterações feitas durante a sessão.
let versaoFotosElementos = 0

// Recupera as fotografias armazenadas no IndexedDB.
async function recuperarFotosElementos(): Promise<void> {

  const versaoInicial = versaoFotosElementos

  try {

    const fotografiasSalvas =
      await lerDoBancoExplore<Record<string, string>>(
        'fotografias',
        'exp_fotos_elementos'
      )

    // Não substitui fotografias alteradas durante a leitura.
    if (versaoFotosElementos !== versaoInicial) {
      return
    }

    // Fotografias antigas armazenadas no localStorage.
    // Recupera exclusivamente as fotografias do IndexedDB.
// Não reutiliza fotografias antigas do localStorage.
const fotografiasCompletas = fotografiasSalvas || {}

    // Evita substituir fotografias registradas
    // enquanto a migração estava em andamento.
    if (versaoFotosElementos !== versaoInicial) {
      return
    }

    fotosElementos = fotografiasCompletas

    console.log(
      'EXPLORE ITS — Fotografias recuperadas e migração verificada.'
    )

    // Atualiza a interface quando necessário.
if (
  verCaderno ||
  telaAtual === 'trilha' ||
  telaAtual === 'meu-percurso' ||
  telaAtual === 'galeria'
) {
  render()
}

  } catch (erro) {

    console.error(
      'EXPLORE ITS — Erro ao recuperar fotografias:',
      erro
    )

  }
}

// =====================================================
// EXPLORE ITS — SORTEIO DOS ELEMENTOS DE INVESTIGAÇÃO
// =====================================================

function sortearElementosInvestigacao(
  svg: SVGSVGElement
): ElementoSorteado[] {

  const categorias: CategoriaInvestigacao[] = [
    'ARV',
    'ECO',
    'FOR',
    'FOL'
  ]

  return categorias.map(categoria => {

const candidatos = [...svg.querySelectorAll('[id]')]
  .map(elemento => elemento.id)
  .filter(id =>
    new RegExp(`^${categoria}_\\d+$`).test(id)
  )
  .filter(id =>
    catalogoElementos.some(
      item => item.id === id && item.sorteavel
    )
  )

    if (candidatos.length === 0) {
      throw new Error(
        `Nenhum localizador encontrado para ${categoria}`
      )
    }

    const indice = Math.floor(
      Math.random() * candidatos.length
    )

    return {
      id: candidatos[indice],
      categoria,
      encontrado: false
    }
  })
}

// =====================================================
// EXPLORE ITS — POSIÇÃO DOS ELEMENTOS NO MAPA
// =====================================================

function obterPosicaoElemento(
  svg: SVGSVGElement,
  id: string
): { x: number; y: number } | null {

  const elemento = svg.querySelector<SVGGraphicsElement>(
    `[id="${id}"]`
  )

  if (!elemento) {
    console.warn(`Localizador ${id} não encontrado.`)
    return null
  }

const caixa = elemento.getBBox()

const matrizElemento = elemento.getScreenCTM()
const matrizSVG = svg.getScreenCTM()

if (!matrizElemento || !matrizSVG) return null

const matriz = matrizSVG.inverse().multiply(matrizElemento)

  const centro = svg.createSVGPoint()

  centro.x = caixa.x + caixa.width / 2
  centro.y = caixa.y + caixa.height / 2

  const posicao = centro.matrixTransform(matriz)

  return {
    x: posicao.x,
    y: posicao.y
  }
}

// =====================================================
// DESCOBERTAS PELO CAMINHO
// =====================================================

type DescobertaExpedicao = {
  id: string
  tipo:
    | 'pequenos-habitantes'
    | 'quem-passou'
    | 'vidas-conectadas'
    | 'curiosidade'
  foto: string
  pergunta?: string
  dataHora: string
}

let descobertasExpedicao: DescobertaExpedicao[] = JSON.parse(
  localStorage.getItem('exp_descobertas') || '[]'
)


// =====================================================
// ESTADO TEMPORÁRIO DA INTERFACE
// Não representa dados científicos permanentes
// =====================================================

let mascoteTempId: string | null = null

let verCaderno = false

// =====================================================
// ÁUDIO — ESTADO TEMPORÁRIO DE GRAVAÇÃO
// =====================================================

let audioChunks: Blob[] = []
let streamAudio: MediaStream | null = null
let gravandoAudio = false

// Navegação entre as telas principais do aplicativo
type TelaApp =
  | 'inicio'
  | 'explorar'
  | 'mapa-its'
  | 'localidade'
  | 'cadastro'
  | 'registro-partida'
  | 'trilha'
  | 'registro-descoberta'
  | 'meu-percurso'
  | 'galeria'

let telaAtual: TelaApp = 'inicio'
let localidadeAtual: string | null = null

// Recupera as fotografias das investigações
// armazenadas no IndexedDB.
// Guarda a promessa para aguardar a recuperação
// antes de confirmar novas fotografias.
const recuperacaoFotosElementos = recuperarFotosElementos()

// =====================================================
// EXPLORE ITS — RECUPERAÇÃO DA FOTOGRAFIA DE PARTIDA
// =====================================================

// A fotografia antiga permanece disponível pelo localStorage.
// Se existir uma fotografia mais recente no IndexedDB,
// ela terá prioridade.

void lerDoBancoExplore<string>(
  'fotografias',
  'exp_foto_partida'
)
  .then(fotografia => {

    if (fotografia) {

      fotoPartida = fotografia

      // Atualiza a tela caso o estudante
      // esteja visualizando o Registro de Partida.
      if (telaAtual === 'registro-partida') {
        render()
      }

    }

  })
  .catch(erro => {

    console.error(
      'EXPLORE ITS — Erro ao recuperar fotografia:',
      erro
    )

  })

// =====================================================
// EXPLORE ITS — HISTÓRICO DE NAVEGAÇÃO
// Compatível com Android, iOS e navegadores
// =====================================================

type EstadoNavegacao = {
  tela: TelaApp
  caderno: boolean
  localidade: string | null
}

function obterEstadoNavegacao(): EstadoNavegacao {
  return {
    tela: telaAtual,
    caderno: verCaderno,
    localidade: localidadeAtual
  }
}


const app = document.querySelector<HTMLDivElement>('#app')!

// =====================================================
// TEMPO DA EXPEDIÇÃO
// Registro e apresentação de horários
// =====================================================

function obterHoraAtual(): string {
  const agora = new Date()
  return agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function obterDataHoraISO(): string {
  return new Date().toISOString()
}

function formatarHorarioRegistro(dataHora: string): string {
  // Registros novos em formato ISO
  if (dataHora.includes('T')) {
    const data = new Date(dataHora)

    if (!isNaN(data.getTime())) {
      return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Compatibilidade com os registros antigos
  const horarioAntigo = dataHora.match(/\d{2}:\d{2}/)

  return horarioAntigo?.[0] || dataHora
}

// =====================================================
// GPS DA EXPEDIÇÃO
// Leitura da posição atual do dispositivo
// =====================================================

let gpsWatchId: number | null = null

function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const raioTerra = 6371000

  const paraRadianos = (graus: number) =>
    graus * Math.PI / 180

  const deltaLat = paraRadianos(lat2 - lat1)
  const deltaLon = paraRadianos(lon2 - lon1)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(paraRadianos(lat1)) *
    Math.cos(paraRadianos(lat2)) *
    Math.sin(deltaLon / 2) *
    Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  )

  return raioTerra * c
}

// =====================================================
// EXPLORE ITS — POSIÇÃO GPS ENTRE REFERÊNCIAS
// =====================================================

function calcularTrechoGPS(
  latitude: number,
  longitude: number,
  svg: SVGSVGElement
) {
  const referencias = [
    ...svg.querySelectorAll<SVGGraphicsElement>(
      '[id^="referencia_"]'
    )
  ]

  const pontos = referencias
    .map(elemento => ({
      id: elemento.id,
      lat: Number(elemento.getAttribute('data-lat')),
      lon: Number(elemento.getAttribute('data-lon'))
    }))
    .filter(ponto =>
      Number.isFinite(ponto.lat) &&
      Number.isFinite(ponto.lon) &&
      ponto.lat !== 0 &&
      ponto.lon !== 0
    )

  if (pontos.length < 2) return null

  const rad = Math.PI / 180
  const metrosLatitude = 111320
  const metrosLongitude =
    111320 * Math.cos(latitude * rad)

  let melhorTrecho = null as null | {
    inicio: string
    fim: string
    proporcao: number
    distancia: number
  }

  for (let i = 0; i < pontos.length - 1; i++) {
    const a = pontos[i]
    const b = pontos[i + 1]

    const ax = (a.lon - longitude) * metrosLongitude
    const ay = (a.lat - latitude) * metrosLatitude

    const bx = (b.lon - longitude) * metrosLongitude
    const by = (b.lat - latitude) * metrosLatitude

    const dx = bx - ax
    const dy = by - ay

    const comprimentoQuadrado = dx * dx + dy * dy

    if (comprimentoQuadrado === 0) continue

    const proporcao = Math.max(
      0,
      Math.min(
        1,
        -(ax * dx + ay * dy) / comprimentoQuadrado
      )
    )

    const px = ax + proporcao * dx
    const py = ay + proporcao * dy

    const distancia = Math.hypot(px, py)

    if (!melhorTrecho || distancia < melhorTrecho.distancia) {
      melhorTrecho = {
        inicio: a.id,
        fim: b.id,
        proporcao,
        distancia
      }
    }
  }

  return melhorTrecho
}

function obterLocalizacaoAtual(svg: SVGSVGElement) {
  if (!navigator.geolocation) {
    console.warn('GPS: geolocalização não disponível neste dispositivo.')
    return
  }

  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId)
    gpsWatchId = null
  }

  gpsWatchId = navigator.geolocation.watchPosition(
    posicao => {
      const latitude = posicao.coords.latitude
      const longitude = posicao.coords.longitude
      const precisao = posicao.coords.accuracy

      console.log('GPS DO DISPOSITIVO')
      console.log('Latitude:', latitude)
      console.log('Longitude:', longitude)
      console.log('Precisão:', `± ${Math.round(precisao)} m`)

      // =====================================================
      // EXPLORE ITS — PREPARAÇÃO DO MARCADOR GPS
      // =====================================================

      const camadaGPS = svg.querySelector<SVGGElement>(
        '#camada-gps'
      )

      const marcadorGPS = svg.querySelector<SVGCircleElement>(
        '#marcador-gps-visitante'
      )

      if (camadaGPS && marcadorGPS) {
        marcadorGPS.setAttribute('data-lat', String(latitude))
        marcadorGPS.setAttribute('data-lon', String(longitude))
        marcadorGPS.setAttribute('data-precisao', String(precisao))

        console.log(
          'GPS: coordenadas recebidas pelo marcador azul.'
        )
      }

// =====================================================
// EXPLORE ITS — REFERÊNCIA GPS MAIS PRÓXIMA
// =====================================================

const referencias = svg.querySelectorAll<SVGGraphicsElement>(
  '[id^="referencia_"]'
)

let referenciaMaisProxima = ''
let distanciaReferencia = Infinity

referencias.forEach(referencia => {
  const lat = Number(referencia.getAttribute('data-lat'))
  const lon = Number(referencia.getAttribute('data-lon'))

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return

  const distancia = calcularDistanciaMetros(
    latitude,
    longitude,
    lat,
    lon
  )

  if (distancia < distanciaReferencia) {
    distanciaReferencia = distancia
    referenciaMaisProxima = referencia.id
  }
})

console.log(
  'GPS — Referência mais próxima:',
  referenciaMaisProxima,
  '| Distância:',
  Math.round(distanciaReferencia),
  'm'
)

// =====================================================
// EXPLORE ITS — IDENTIFICAÇÃO DO TRECHO GPS
// =====================================================

const trechoGPS = calcularTrechoGPS(
  latitude,
  longitude,
  svg
)

// =====================================================
// EXPLORE ITS — POSIÇÃO DAS REFERÊNCIAS NO CAMINHO
// =====================================================

if (trechoGPS) {
  const referenciaInicio = svg.querySelector<SVGGraphicsElement>(
    `#${trechoGPS.inicio}`
  )

  const referenciaFim = svg.querySelector<SVGGraphicsElement>(
    `#${trechoGPS.fim}`
  )

  console.log(
    'GPS — Referências do trecho encontradas:',
    Boolean(referenciaInicio),
    Boolean(referenciaFim)
  )

  if (referenciaInicio && referenciaFim) {
    const textoInicio = referenciaInicio.getAttribute(
      'data-posicao-trilha'
    )

    const textoFim = referenciaFim.getAttribute(
      'data-posicao-trilha'
    )

    if (textoInicio !== null && textoFim !== null) {
      const posicaoInicio = Number(textoInicio)
      const posicaoFim = Number(textoFim)

      if (
        Number.isFinite(posicaoInicio) &&
        Number.isFinite(posicaoFim)
      ) {
        const posicaoEstimada =
          posicaoInicio +
          trechoGPS.proporcao * (posicaoFim - posicaoInicio)

        console.log(
          'GPS — Posição estimada no caminho:',
          posicaoEstimada.toFixed(2),
          'unidades SVG'
        )

        // Verifica se o caminho da trilha está disponível
const caminhoGPS = svg.querySelector<SVGPathElement>(
  '#trilha_semente_peregrina'
)

if (caminhoGPS) {
  const comprimento = caminhoGPS.getTotalLength()

  const posicaoSegura = Math.max(
    0,
    Math.min(posicaoEstimada, comprimento)
  )

const ponto = caminhoGPS.getPointAtLength(posicaoSegura)

const matrizCaminho = caminhoGPS.getScreenCTM()
const matrizMapa = svg.getScreenCTM()

if (matrizCaminho && matrizMapa) {
  const matrizRelativa = matrizMapa.inverse().multiply(matrizCaminho)

  const pontoNoMapa = ponto.matrixTransform(matrizRelativa)

const marcadorVisitante = svg.querySelector<SVGCircleElement>(
  '#marcador-gps-visitante'
)

console.log(
  'GPS — Marcador azul encontrado:',
  Boolean(marcadorVisitante)
)

if (marcadorVisitante) {
  marcadorVisitante.setAttribute(
    'cx',
    String(pontoNoMapa.x)
  )

  marcadorVisitante.setAttribute(
    'cy',
    String(pontoNoMapa.y)
  )

  console.log(
    'GPS — Coordenadas aplicadas ao marcador azul:',
    pontoNoMapa.x.toFixed(2),
    pontoNoMapa.y.toFixed(2)
  )
const camadaGPS = svg.querySelector<SVGGElement>(
  '#camada-gps'
)

const gpsConfiavel =
  trechoGPS.distancia <= 40 &&
  precisao <= 30

if (camadaGPS) {
  camadaGPS.setAttribute(
    'visibility',
    gpsConfiavel ? 'visible' : 'hidden'
  )
}

console.log(
  'GPS — Marcador azul visível:',
  gpsConfiavel
)
}

    console.log(
      'GPS — Coordenadas do visitante no mapa:',
      'X:', pontoNoMapa.x.toFixed(2),
      'Y:', pontoNoMapa.y.toFixed(2)
    )
  }
} else {
  console.warn(
    'GPS — Caminho não encontrado para posicionar visitante.'
  )
}
      }
    }
  }
}

// =====================================================
// EXPLORE ITS — VERIFICAÇÃO DA ÁREA DA TRILHA
// =====================================================

const distanciaLimiteGPS = 100 // metros

const visitanteNaAreaDaTrilha =
  distanciaReferencia <= distanciaLimiteGPS

if (visitanteNaAreaDaTrilha) {
  console.log(
    'GPS — Dispositivo próximo da área da trilha.'
  )
} else {
  console.log(
    'GPS — Dispositivo fora da área da trilha.',
    'Marcador azul permanecerá oculto.'
  )
}

      const idsMarcadoresGPS = [
        'marcador_inicio',
        'marcador_fim'
      ]

      console.log('DISTÂNCIAS ATÉ OS PONTOS DA TRILHA')

      let pontoMaisProximo = ''
      let menorDistancia = Infinity

      idsMarcadoresGPS.forEach(id => {
        const marcador = svg.querySelector<SVGElement>(`#${id}`)

        if (!marcador) return

        const latTexto = marcador.getAttribute('data-lat')
        const lonTexto = marcador.getAttribute('data-lon')

        if (!latTexto || !lonTexto) return

        const latPonto = Number(latTexto)
        const lonPonto = Number(lonTexto)

        const distancia = calcularDistanciaMetros(
        latitude,
        longitude,
        latPonto,
        lonPonto
)

console.log(
  `${id}: ${Math.round(distancia)} m`
)

if (distancia < menorDistancia) {
  menorDistancia = distancia
  pontoMaisProximo = id
}

      })

      console.log('PONTO MAIS PRÓXIMO DO DISPOSITIVO')
      console.log('Marcador:', pontoMaisProximo)
      console.log('Distância:', `${Math.round(menorDistancia)} m`)

const gpsDiagnostico = document.querySelector<HTMLDivElement>('#gps-diagnostico')

if (gpsDiagnostico) {
  const distanciaTrilha = trechoGPS?.distancia
  const dentroDaArea = distanciaTrilha !== undefined &&
    distanciaTrilha <= 40
  const precisaoAdequada = precisao <= 30
  const pontoAzulLiberado = dentroDaArea && precisaoAdequada

  const situacao = !trechoGPS
    ? 'Referências da trilha indisponíveis'
    : !dentroDaArea
      ? 'Fora do limite de 40 m'
      : !precisaoAdequada
        ? 'GPS com precisão insuficiente'
        : 'Localização adequada — ponto azul liberado'

  gpsDiagnostico.innerHTML = `
    <strong>📍 GPS — Diagnóstico de campo</strong>
    <p><strong>Situação:</strong> ${situacao}</p>
    <p><strong>Latitude:</strong> ${latitude.toFixed(6)}</p>
    <p><strong>Longitude:</strong> ${longitude.toFixed(6)}</p>
    <p><strong>Precisão estimada:</strong> ± ${Math.round(precisao)} m</p>
    <p><strong>Distância estimada até a trilha:</strong>
      ${distanciaTrilha === undefined ? 'Indisponível' : `${Math.round(distanciaTrilha)} m`}
    </p>
    <p><strong>Trecho de referência:</strong>
      ${trechoGPS ? `${trechoGPS.inicio} → ${trechoGPS.fim}` : 'Indisponível'}
    </p>
    <p><strong>Ponto azul:</strong>
      ${pontoAzulLiberado ? 'Liberado pelos critérios de GPS' : 'Não liberado'}
    </p>
  `
}

    },

    erro => {
      console.warn(
        'GPS: não foi possível obter a localização.',
        erro.message
      )
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
}

// =====================================================
// EXPLORE ITS — CARREGAMENTO OTIMIZADO DO MAPA GERAL
// =====================================================

let promessaMapaITS: Promise<string> | null = null

function prepararMapaITS(): Promise<string> {

  if (!promessaMapaITS) {

    promessaMapaITS = fetch(
      '/explore-its/mapa-explore-its-mestre.svg'
    ).then(async resposta => {

      if (!resposta.ok) {
        throw new Error('Não foi possível carregar o mapa geral do ITS.')
      }

      return resposta.text()

    }).catch(erro => {

      promessaMapaITS = null
      throw erro

    })
  }

  return promessaMapaITS
}

// MAPA GERAL DO ITS
async function carregarMapaITS() {
  console.log('CARREGAR MAPA ITS EXECUTADO')

  const container = document.querySelector<HTMLDivElement>('#mapa-its-container')

  if (!container) return

  try {

    const svgTexto = await prepararMapaITS()

    container.innerHTML = svgTexto

    const svg = container.querySelector('svg')

if (svg) {
  svg.classList.add('mapa-svg')
  svg.setAttribute('role', 'img')
  svg.setAttribute(
  'aria-label',
  'Mapa interativo dos espaços do Instituto do Trópico Subúmido'
)

// ESTAÇÕES DE INVESTIGAÇÃO DO MAPA

const localidadesMapa = [
  {
    id: 'marcador_viveiro',
    nome: 'Viveiro',
    descricao: 'Um espaço dedicado ao cultivo e ao desenvolvimento de mudas de plantas, contribuindo para a conservação da vegetação do Cerrado.'
  },
{
  id: 'marcador_arte_cultura',
  nome: 'Arte e Cultura',
  descricao: 'Um espaço dedicado às manifestações artísticas e culturais, valorizando a criatividade, a expressão e a diversidade cultural.'
},
{
  id: 'marcador_museu',
  nome: 'Museu',
  descricao: 'Um espaço de preservação e divulgação de acervos que contribuem para o conhecimento da história, da cultura e do patrimônio regional.'
},
{
  id: 'marcador_espaco_dalila',
  nome: 'Espaço Dalila',
  descricao: 'Conheça o Espaço Dalila, um dos ambientes que integram o Instituto do Trópico Subúmido e suas atividades educativas e culturais.'
},
{
  id: 'marcador_vila_cenografica',
  nome: 'Vila Cenográfica',
  descricao: 'Um espaço que reproduz ambientes e construções tradicionais, proporcionando aos visitantes uma experiência de aproximação com a história e os modos de vida de diferentes comunidades.'
},
{
  id: 'marcador_fazenda_barauna',
  nome: 'Fazenda Baraúna',
  descricao: 'Um espaço que integra o percurso de visitação do ITS e serve como ponto de referência para as atividades educativas e de exploração da Trilha da Semente Peregrina.'
},
  { id: 'marcador_trilha_semente_peregrina', nome: 'Trilha da Semente Peregrina' },
{
  id: 'marcador_trilha_sensorial',
  nome: 'Trilha Sensorial',
  descricao: 'Um percurso educativo que convida os visitantes a explorar o ambiente por meio dos sentidos, estimulando a percepção de sons, aromas, texturas e outros elementos da natureza.'
},
{
  id: 'marcador_aldeia_timbira',
  nome: 'Aldeia Timbira',
  descricao: 'Um espaço de valorização e divulgação dos conhecimentos, das tradições e das expressões culturais dos povos indígenas Timbira, contribuindo para o reconhecimento da diversidade cultural brasileira.'
},
{
  id: 'marcador_quilombo',
  nome: 'Quilombo',
  descricao: 'Um espaço educativo dedicado à valorização da história, da cultura e das formas de organização das comunidades quilombolas, destacando sua contribuição para a formação da sociedade brasileira.'
},
{
  id: 'marcador_nascente',
  nome: 'Nascente do Córrego São Nicolau',
  descricao: 'Um ambiente natural que permite observar a importância das nascentes para a formação dos cursos d’água, a conservação dos recursos hídricos e o equilíbrio dos ecossistemas do Cerrado.'
}
]

localidadesMapa.forEach(({ id, nome, descricao }) => {
  const marcador = svg.querySelector<SVGElement>(`#${id}`)

  if (!marcador) {
    console.warn(`Marcador não encontrado: ${id}`)
    return
  }

  marcador.style.cursor = 'pointer'
  marcador.setAttribute('aria-label', nome)

  const titulo = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'title'
  )

  titulo.textContent = nome
  marcador.appendChild(titulo)

  if (id !== 'marcador_trilha_semente_peregrina') {
    marcador.addEventListener('click', () => {
      const cartao = document.querySelector<HTMLElement>(
        '#cartao-localidade-its'
      )

      if (!cartao) return

      const textoDescricao =
        descricao ?? 'Conheça este espaço do Instituto do Trópico Subúmido.'

      cartao.innerHTML = `
        <h3>${nome}</h3>
        <p>${textoDescricao}</p>
        <button type="button" disabled>
          Conhecer este espaço →
        </button>
      `

      cartao.hidden = false
      cartao.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    })
  }
})


const marcadorTrilha = svg.querySelector<SVGElement>(
  '#marcador_trilha_semente_peregrina'
)

if (marcadorTrilha) {
  marcadorTrilha.style.cursor = 'pointer'

  marcadorTrilha.addEventListener('click', () => {
    localidadeAtual = 'trilha-semente-peregrina'
    navegarPara('localidade')
  })
} else {
  console.warn(
    'Marcador da Trilha da Semente Peregrina não encontrado no SVG.'
  )
}

// Fecha o bloco if (svg)
}

// Tratamento de erros do carregamento do mapa
} catch (erro) {
  console.error('Erro ao carregar o mapa geral do ITS:', erro)

  container.innerHTML =
    '<p class="mapa-erro">Não foi possível carregar o mapa do ITS.</p>'
}

// Fecha a função carregarMapaITS
}


// =====================================================
// EXPLORE ITS — CÂMERA DOS ELEMENTOS SORTEADOS
// =====================================================

let elementoFotografiaAtual: string | null = null

// Fotografia aguardando confirmação do estudante

// Fotografia de descoberta livre aguardando confirmação
let fotografiaDescobertaPendente: string | null = null

// Identifica a descoberta escolhida para substituição
// 0 = Descoberta 1
// 1 = Descoberta 2
// null = nenhuma substituição selecionada
let indiceDescobertaParaSubstituir: number | null = null


// =====================================================
// DESCOBERTAS LIVRES — FOTOGRAFIAS E OBSERVAÇÕES
// =====================================================

// Capacidade máxima de descobertas por expedição
const LIMITE_DESCOBERTAS_LIVRES = 6

// Fotografias das seis descobertas
let fotosDescobertasLivres: (string | null)[] =
  Array(LIMITE_DESCOBERTAS_LIVRES).fill(null)

// Observações opcionais associadas às fotografias
let observacoesDescobertasLivres: string[] =
  Array(LIMITE_DESCOBERTAS_LIVRES).fill('')

let nomesDescobertasLivres: string[] =
  Array(LIMITE_DESCOBERTAS_LIVRES).fill('')

// Recupera fotografias e observações do IndexedDB

async function recuperarDescobertasLivres(): Promise<void> {
  try {
    const indices = Array.from(
      { length: LIMITE_DESCOBERTAS_LIVRES },
      (_, indice) => indice + 1
    )

    // Recupera as seis fotografias
    const fotografias = await Promise.all(
      indices.map(indice =>
        lerDoBancoExplore<string>(
          'fotografias',
          `exp_descoberta_livre_${indice}`
        )
      )
    )

    // Recupera os nomes das descobertas
    const nomes = await Promise.all(
      indices.map(indice =>
        lerDoBancoExplore<string>(
          'fotografias',
          `exp_nome_livre_${indice}`
        )
      )
    )

    // Recupera as descrições das descobertas
    const observacoes = await Promise.all(
      indices.map(indice =>
        lerDoBancoExplore<string>(
          'fotografias',
          `exp_observacao_livre_${indice}`
        )
      )
    )

    fotosDescobertasLivres = fotografias.map(
      foto => foto ?? null
    )

    nomesDescobertasLivres = nomes.map(
      nome => nome ?? ''
    )

    observacoesDescobertasLivres = observacoes.map(
      observacao => observacao ?? ''
    )

    console.log(
      'EXPLORE ITS — Descobertas livres recuperadas:',
      fotosDescobertasLivres.filter(Boolean).length
    )

  } catch (erro) {
    console.error(
      'Erro ao recuperar descobertas livres:',
      erro
    )
  }
}

const recuperacaoDescobertasLivres = recuperarDescobertasLivres()

// Atualiza a tela da trilha após recuperar as fotografias
void recuperacaoDescobertasLivres.then(() => {
  if (telaAtual === 'trilha') {
    render()
  }
})

function abrirCameraElemento(id: string) {

  const input = document.querySelector<HTMLInputElement>(
    '#input-foto-elemento'
  )

  if (!input) {
    alert('Não foi possível acessar a câmera.')
    return
  }

  // Identifica qual cartão receberá a fotografia.
  elementoFotografiaAtual = id

  // Limpa a seleção anterior para permitir
  // substituir uma foto, inclusive pelo mesmo arquivo.
  input.value = ''

  // Abre a câmera ou o seletor de fotografias.
  input.click()
}

// =====================================================

function atualizarListaElementos() {

  const lista = document.querySelector<HTMLElement>(
    '.elementos-expedicao'
  )

  if (!lista) return

  const categorias: Record<CategoriaInvestigacao, string> = {
    ARV: 'Árvore ou planta',
    ECO: 'Processo ecológico',
    FOR: 'Formação natural',
    FOL: 'Cultura e folclore'
  }

  const pictogramas: Record<CategoriaInvestigacao, string> = {
    ARV: '/explore-its/imagem/pictogramas/arvores.svg',
    ECO: '/explore-its/imagem/pictogramas/processos-ecologicos.svg',
    FOR: '/explore-its/imagem/pictogramas/formacoes-naturais.svg',
    FOL: '/explore-its/imagem/pictogramas/cultura-folclore.svg'
  }


lista.innerHTML = elementosSorteados.map(elemento => {

  const dados = catalogoElementos.find(
    item => item.id === elemento.id
  )

  return `
    <article
      class="elemento-expedicao"
      data-cartao-elemento="${elemento.id}"
    >

      <div class="elemento-cabecalho">

        <img
          src="${pictogramas[elemento.categoria]}"
          alt=""
          class="elemento-expedicao-icone"
        >

        <div class="elemento-expedicao-texto">
          <small>${categorias[elemento.categoria]}</small>

          <strong>
            ${dados?.nome ?? 'Elemento não identificado'}
          </strong>
        </div>

      </div>

<button
  type="button"
  class="btn-registrar-elemento elemento-area-foto"
  data-elemento-id="${elemento.id}"
  aria-label="${elemento.encontrado ? 'Trocar fotografia de' : 'Registrar'} ${dados?.nome ?? 'descoberta'}"
>

${fotosElementos[elemento.id] ? `
  <img
    src="${fotosElementos[elemento.id]}"
    alt="Fotografia de ${dados?.nome ?? 'elemento investigado'}"
    class="elemento-foto-miniatura"
  >
` : `
  <svg
    class="elemento-camera-svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M14 4H9L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-3-3z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>

  <small>
    Tocar para fotografar
  </small>
`}

      </button>

    </article>
  `
}).join('')


  // Ativa os botões criados depois do sorteio
  lista.querySelectorAll<HTMLButtonElement>(
    '.btn-registrar-elemento'
  ).forEach(botao => {

    botao.addEventListener('click', () => {

      const id = botao.dataset.elementoId

      const elemento = elementosSorteados.find(
        item => item.id === id
      )

      if (!elemento) return

      const dados = catalogoElementos.find(
        item => item.id === elemento.id
      )

// ==========================================
// ÁRVORES — REGISTRO E CURIOSIDADE CIENTÍFICA
// ==========================================

if (elemento.categoria === 'ARV') {

  elementoFotografiaAtual = elemento.id

  const painel = document.querySelector<HTMLElement>(
    '#painel-registro-arvore'
  )

  if (!painel) {
    alert('Painel de registro da árvore ainda não disponível.')
    return
  }

  // Localizar a árvore pelo número da placa
  console.log('ÁRVORE SELECIONADA:', elemento.id, elemento)
  
const arvore = dadosCaderno[elemento.id]

console.log('CONTEÚDO DO CADERNO:', elemento.id, arvore)

  // Identificação da árvore
  const identificacao = painel.querySelector<HTMLElement>(
    '#registro-arvore-identificacao'
  )

  if (identificacao) {

    identificacao.replaceChildren()

    const nome = document.createElement('strong')
    nome.textContent = arvore?.nome ?? 'Árvore da trilha'

    const cientifico = document.createElement('p')
    cientifico.textContent = arvore?.cientifico ?? ''

    identificacao.append(nome, cientifico)
  }

  // Curiosidade científica
  const textoCuriosidade = painel.querySelector<HTMLElement>(
    '#texto-curiosidade-arvore'
  )

  if (textoCuriosidade) {
    textoCuriosidade.textContent =
      arvore?.curiosidade ??
      'Observe as características desta árvore e registre sua descoberta.'
  }

  const textoDesafio = painel.querySelector<HTMLElement>(
  '#texto-desafio-arvore'
)

if (textoDesafio) {
  textoDesafio.textContent = arvore?.desafio ?? ''
}

  // Abrir painel
  painel.hidden = false
  painel.style.display = 'block'

  return
}

// DEMAIS ELEMENTOS — REGISTRO FOTOGRÁFICO

if (fotosElementos[elemento.id]) {
  const desejaSubstituir = window.confirm(
    'Esta descoberta já possui uma fotografia.\n\nDeseja substituir esta foto?'
  )

  if (!desejaSubstituir) return
}

abrirCameraElemento(elemento.id)

    })

  })

}

// ==========================================
// CONTROLES DO PAINEL DE REGISTRO DA ÁRVORE
// ==========================================

// ==========================================
// EXPLORE ITS — LEITOR DE QR CODE DAS ÁRVORES
// ==========================================

let leitorQrArvore: Html5Qrcode | null = null
let leituraQrEmAndamento = false

async function fecharLeitorQrArvore() {

  if (leitorQrArvore) {
    try {
      if (leitorQrArvore.isScanning) {
        await leitorQrArvore.stop()
      }

      leitorQrArvore.clear()

    } catch (erro) {
      console.error('Erro ao encerrar leitor QR:', erro)
    }

    leitorQrArvore = null
  }

  leituraQrEmAndamento = false

  const painel = document.querySelector<HTMLElement>(
    '#painel-leitor-qr'
  )

  if (painel) {
    painel.hidden = true
    painel.style.display = 'none'
  }
}

async function abrirLeitorQrArvore() {

  if (leituraQrEmAndamento) return

  const idArvore = elementoFotografiaAtual

  if (!idArvore) {
    alert('Nenhuma árvore selecionada.')
    return
  }

  const painel = document.querySelector<HTMLElement>(
    '#painel-leitor-qr'
  )

  const mensagem = document.querySelector<HTMLElement>(
    '#mensagem-leitor-qr'
  )

  if (!painel) return

  painel.hidden = false
  painel.style.display = 'block'

  if (mensagem) {
    mensagem.textContent =
      'Aponte a câmera para o QR Code da placa.'
  }

  leituraQrEmAndamento = true

  try {

leitorQrArvore = new Html5Qrcode('leitor-qr-arvore', {
  verbose: false,
  useBarCodeDetectorIfSupported: true
})

await leitorQrArvore.start(
  { facingMode: 'environment' },
  {
    fps: 10,
    qrbox: (largura, altura) => {
      const tamanho = Math.floor(Math.min(largura, altura) * 0.8)
      return { width: tamanho, height: tamanho }
    }
  },

      (textoQr) => {

        if (!leituraQrEmAndamento) return

        let endereco: URL

        try {
          endereco = new URL(textoQr)

          if (!['https:', 'http:'].includes(endereco.protocol)) {
            throw new Error('Protocolo inválido')
          }

        } catch {
          if (mensagem) {
            mensagem.textContent =
              'O código não contém um endereço web válido.'
          }
          return
        }

        leituraQrEmAndamento = false

        const linksSalvos: Record<string, string> =
          JSON.parse(
            localStorage.getItem('exp_links_arvores') || '{}'
          )

        linksSalvos[idArvore] = endereco.href

        localStorage.setItem(
          'exp_links_arvores',
          JSON.stringify(linksSalvos)
        )

        if (mensagem) {
          mensagem.textContent =
            '✓ QR Code registrado com sucesso!'
        }

        void fecharLeitorQrArvore()
      },

      (mensagemErro) => {
        console.debug('Leitor QR:', mensagemErro)
      }
    )

  } catch (erro) {

    console.error('Erro ao iniciar câmera QR:', erro)

    await fecharLeitorQrArvore()

    alert(
      'Não foi possível abrir a câmera. Verifique a permissão de acesso.'
    )
  }
}

document.addEventListener('click', (evento) => {

  const alvo = evento.target

  if (!(alvo instanceof Element)) return

  // FECHAR
  if (alvo.closest('#btn-fechar-registro-arvore')) {

        void fecharLeitorQrArvore()

    const painel = document.querySelector<HTMLElement>(
      '#painel-registro-arvore'
    )

    if (painel) {
      painel.hidden = true
      painel.style.display = 'none'
    }

    return
  }

  // LER QR CODE DA ÁRVORE
  if (alvo.closest('#btn-qr-arvore')) {
    void abrirLeitorQrArvore()
    return
  }

  // LER QR CODE POR FOTOGRAFIA
  if (alvo.closest('#btn-foto-qr-arvore')) {

    const input = document.querySelector<HTMLInputElement>(
      '#input-foto-qr-arvore'
    )

    if (!input) {
      alert('Não foi possível acessar a câmera.')
      return
    }

    input.value = ''
    input.click()
    return
  }

  // CANCELAR LEITURA DO QR CODE
  if (alvo.closest('#btn-cancelar-qr')) {
    void fecharLeitorQrArvore()
    return
  }

  // FOTOGRAFAR
  if (alvo.closest('#btn-foto-arvore')) {

    const inputFoto = document.querySelector<HTMLInputElement>(
      '#input-foto-elemento'
    )

    if (!inputFoto) {
      alert('Câmera não encontrada.')
      return
    }

    inputFoto.click()
    return
  }

})

// ==========================================
// LER QR CODE A PARTIR DE UMA FOTOGRAFIA
// ==========================================

document.addEventListener('change', async (evento) => {
  const alvo = evento.target

  if (!(alvo instanceof HTMLInputElement)) return
  if (alvo.id !== 'input-foto-qr-arvore') return

  const arquivo = alvo.files?.[0]
  if (!arquivo) return

  const idArvore = elementoFotografiaAtual

  if (!idArvore) {
    alert('Nenhuma árvore selecionada.')
    return
  }

  const resultado = document.querySelector<HTMLElement>(
    '#resultado-qr-arvore'
  )

  if (resultado) {
    resultado.hidden = false
    resultado.textContent = 'Analisando fotografia do QR Code...'
  }

  const leitor = new Html5Qrcode('leitor-qr-arvore-foto', {
    verbose: false
  })

  try {
    const textoQr = await leitor.scanFile(arquivo, false)
    const endereco = new URL(textoQr)

    if (!['https:', 'http:'].includes(endereco.protocol)) {
      throw new Error('O QR Code não contém um endereço web válido.')
    }

    const linksSalvos: Record<string, string> = JSON.parse(
      localStorage.getItem('exp_links_arvores') || '{}'
    )

    linksSalvos[idArvore] = endereco.href

    localStorage.setItem(
      'exp_links_arvores',
      JSON.stringify(linksSalvos)
    )

    if (resultado) {
      resultado.textContent =
        '✓ QR Code registrado com sucesso: ' + endereco.href
    }

  } catch (erro) {
    console.error('Erro ao analisar QR Code:', erro)

    if (resultado) {
      resultado.textContent =
        'Não foi possível identificar o QR Code. Tente outra fotografia.'
    }

  } finally {
    try {
      leitor.clear()
    } catch (erro) {
      console.warn('Erro ao limpar leitor QR:', erro)
    }
  }
})

// MAPA DA TRILHA DA SEMENTE PEREGRINA
async function carregarMapaInterativo() {
  
  console.log('FUNÇÃO DO MAPA EXECUTADA')
  
  const container = document.querySelector<HTMLDivElement>('#mapa-container')

  if (!container) return

  try {
    const resposta = await fetch('/explore-its/mapa-trilha-app.svg')

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar o mapa.')
    }

    const svgTexto = await resposta.text()

    container.innerHTML = svgTexto

    console.log(
    'IDS DO MAPA DA TRILHA:',
    [...container.querySelectorAll('[id]')].map(el => el.id)
)

const svg = container.querySelector('svg')

    if (svg) {
  svg.classList.add('mapa-svg')
  svg.setAttribute('role', 'img')
  svg.setAttribute(
    'aria-label',
    'Mapa da Trilha da Semente Peregrina'
  )

// =====================================================
// EXPLORE ITS — SORTEIO E SALVAMENTO DA EXPEDIÇÃO
// =====================================================

if (crachaSalvo && elementosSorteados.length === 0) {

  elementosSorteados = sortearElementosInvestigacao(svg)

  localStorage.setItem(
    'exp_elementos_sorteados',
    JSON.stringify(elementosSorteados)
  )

  console.log(
    'NOVO SORTEIO DA EXPEDIÇÃO:',
    elementosSorteados
  )

} else {

  console.log(
    'ELEMENTOS DA EXPEDIÇÃO:',
    elementosSorteados
  )

}


// Atualiza os quatro cartões após o sorteio
atualizarListaElementos()

// =====================================================
// EXPLORE ITS — TESTE DAS POSIÇÕES DOS 4 ELEMENTOS
// =====================================================

elementosSorteados.forEach(elemento => {
  const posicao = obterPosicaoElemento(svg, elemento.id)

  console.log(
    `POSIÇÃO ${elemento.id}:`,
    posicao
  )
})

// =====================================================
// EXPLORE ITS — MARCADORES DOS ELEMENTOS SORTEADOS
// =====================================================

// Pictogramas correspondentes às quatro categorias
const pictogramasElementos: Record<CategoriaInvestigacao, string> = {
  ARV: '/explore-its/imagem/pictogramas/arvores.svg',
  ECO: '/explore-its/imagem/pictogramas/processos-ecologicos.svg',
  FOR: '/explore-its/imagem/pictogramas/formacoes-naturais.svg',
  FOL: '/explore-its/imagem/pictogramas/cultura-folclore.svg'
}

const namespaceSVG = 'http://www.w3.org/2000/svg'

const camadaSorteados = document.createElementNS(
  namespaceSVG,
  'g'
)

camadaSorteados.setAttribute(
  'id',
  'marcadores-elementos-sorteados'
)

// Tamanho inicial dos pictogramas nas unidades do mapa SVG
const tamanhoPictograma = 15

elementosSorteados.forEach((elemento, indice) => {

  const posicao = obterPosicaoElemento(svg, elemento.id)

  if (!posicao) return

  const grupo = document.createElementNS(namespaceSVG, 'g')

  // Imagem SVG do pictograma
  const pictograma = document.createElementNS(
    namespaceSVG,
    'image'
  )

  pictograma.setAttribute(
    'href',
    pictogramasElementos[elemento.categoria]
  )

  pictograma.setAttribute(
    'x',
    String(posicao.x - tamanhoPictograma / 2)
  )

  pictograma.setAttribute(
    'y',
    String(posicao.y - tamanhoPictograma / 2)
  )

  pictograma.setAttribute(
    'width',
    String(tamanhoPictograma)
  )

  pictograma.setAttribute(
    'height',
    String(tamanhoPictograma)
  )

  pictograma.setAttribute('pointer-events', 'none')

  // Adiciona somente o pictograma, sem número
  grupo.appendChild(pictograma)

  camadaSorteados.appendChild(grupo)
})

svg.appendChild(camadaSorteados)


// =====================================================
// EXPLORE ITS — TESTE DOS 68 LOCALIZADORES
// =====================================================

const categoriasLocalizadores = {
  ARV: 48,
  ECO: 12,
  FOR: 2,
  FOL: 6
}

Object.entries(categoriasLocalizadores).forEach(([categoria, esperado]) => {
  const encontrados = svg
    ? [...svg.querySelectorAll('[id]')].filter(elemento =>
        new RegExp(`^${categoria}_\\d+$`).test(elemento.id)
      )
    : []

  console.log(
    `LOCALIZADORES ${categoria}: ${encontrados.length} de ${esperado}`
  )

  console.log(
    `IDs ${categoria}:`,
    encontrados.map(elemento => elemento.id)
  )
})

  // TESTE DAS COORDENADAS GPS GRAVADAS NO SVG
  const idsMarcadoresGPS = [
    'marcador_inicio',
    'marcador_saci_perere',
    'marcador_paisagemA',
    'marcador_paisagemB',
    'marcador_caipora',
    'marcador_paisagemC',
    'marcador_fim'
  ]

  idsMarcadoresGPS.forEach(id => {
    const marcador = svg.querySelector<SVGElement>(`#${id}`)

    if (!marcador) {
      console.warn(`GPS: marcador ${id} não encontrado.`)
      return
    }

    const latitude = marcador.getAttribute('data-lat')
    const longitude = marcador.getAttribute('data-lon')

    console.log(
      `GPS ${id}:`,
      'latitude =',
      latitude,
      'longitude =',
      longitude
    )
  })

// =====================================================
// EXPLORE ITS — CAMADA VISUAL DO GPS
// =====================================================

const camadaGPS = document.createElementNS(
  'http://www.w3.org/2000/svg',
  'g'
)

camadaGPS.setAttribute('id', 'camada-gps')

// Círculo azul que representará o visitante
const marcadorGPS = document.createElementNS(
  'http://www.w3.org/2000/svg',
  'circle'
)

marcadorGPS.setAttribute('id', 'marcador-gps-visitante')
marcadorGPS.setAttribute('r', '3')
marcadorGPS.setAttribute('fill', '#1976D2')
marcadorGPS.setAttribute('stroke', '#FFFFFF')
marcadorGPS.setAttribute('stroke-width', '1')
marcadorGPS.setAttribute('pointer-events', 'none')

// Inicialmente oculto, até receber uma posição válida
camadaGPS.setAttribute('visibility', 'hidden')

camadaGPS.appendChild(marcadorGPS)
svg.appendChild(camadaGPS)

// =====================================================
// EXPLORE ITS — TESTE DO TRAÇADO VETORIAL DA TRILHA
// =====================================================

const caminhoTrilha = svg.querySelector<SVGPathElement>(
  '#trilha_semente_peregrina'
)

if (caminhoTrilha) {
  const comprimentoTrilha = caminhoTrilha.getTotalLength()

  console.log(
    'GPS — Traçado da trilha reconhecido:',
    comprimentoTrilha.toFixed(2),
    'unidades SVG'
  )
} else {
  console.warn('GPS: traçado da trilha não encontrado.')
}

// =====================================================
// EXPLORE ITS — COORDENADAS DAS REFERÊNCIAS GPS
// =====================================================

const coordenadasReferenciasGPS: Record<
  string,
  { lat: number; lon: number }
> = {
  referencia_recanto_do_saci_perere: { lat: -16.735721, lon: -49.216120 },
  referencia_canela_de_velho: { lat: -16.735691, lon: -49.217029 },
  referencia_serrapilheira: { lat: -16.735363, lon: -49.217300 },
  referencia_ciclo_da_mata: { lat: -16.735138, lon: -49.217738 },
  referencia_recanto_do_jatoba: { lat: -16.734970, lon: -49.218060 },
  referencia_genipapo: { lat: -16.734585, lon: -49.218341 },
  referencia_cipo_de_jabuti: { lat: -16.734031, lon: -49.218315 },
  referencia_recanto_das_pioneiras: { lat: -16.733445, lon: -49.218621 },
  referencia_louro_branco: { lat: -16.733120, lon: -49.218301 },
  referencia_orelha_de_onca: { lat: -16.732803, lon: -49.217735 },
  referencia_taruma: { lat: -16.732907, lon: -49.217117 },
  referencia_cipo_imbe: { lat: -16.732884, lon: -49.216820 },
  referencia_recanto_do_caipora: { lat: -16.733627, lon: -49.216817 },
  referencia_negramina: { lat: -16.733616, lon: -49.215610 },
  referencia_aroeira: { lat: -16.734177, lon: -49.215082 },
  referencia_buriti: { lat: -16.734893, lon: -49.215086 },
  referencia_recanto_do_nego_dagua: { lat: -16.735514, lon: -49.215102 }
}

console.log(
  'GPS — Coordenadas cadastradas:',
  Object.keys(coordenadasReferenciasGPS).length
)

// =====================================================
// EXPLORE ITS — VERIFICAÇÃO DAS REFERÊNCIAS GPS
// =====================================================

const referenciasGPS = svg.querySelectorAll(
  '[id^="referencia_"]'
)

console.log(
  'GPS — Quantidade de referências encontradas:',
  referenciasGPS.length
)

referenciasGPS.forEach(referencia => {

  const coordenadas = coordenadasReferenciasGPS[referencia.id]

  if (!coordenadas) {
    console.warn(
      'GPS — Coordenadas não encontradas:',
      referencia.id
    )
    return
  }

  referencia.setAttribute('data-lat', String(coordenadas.lat))
  referencia.setAttribute('data-lon', String(coordenadas.lon))

const caixa = (referencia as SVGGraphicsElement).getBBox()

const centro = svg.createSVGPoint()
centro.x = caixa.x + caixa.width / 2
centro.y = caixa.y + caixa.height / 2

const matriz = (referencia as SVGGraphicsElement).getCTM()

if (matriz) {
  const posicao = centro.matrixTransform(matriz)

  console.log(
    'GPS — Posição no desenho:',
    referencia.id,
    'X:', posicao.x.toFixed(2),
    'Y:', posicao.y.toFixed(2)
  )

  if (caminhoTrilha) {
    const matrizCaminho = caminhoTrilha.getCTM()

    if (matrizCaminho) {
      const comprimento = caminhoTrilha.getTotalLength()

      let menorDistancia = Infinity
      let distanciaAoLongo = 0

const posicoesConhecidas: Record<string, number> = {
  referencia_recanto_do_saci_perere: 3.18,
  referencia_canela_de_velho: 60.33,
  referencia_serrapilheira: 104.78,
  referencia_ciclo_da_mata: 141.30,
  referencia_recanto_do_jatoba: 173.84,
  referencia_genipapo: 199.24,
  referencia_cipo_de_jabuti: 242.90,
  referencia_recanto_das_pioneiras: 277.83,
  referencia_louro_branco: 318.31,
  referencia_orelha_de_onca: 355.62,
  referencia_taruma: 397.69,
  referencia_cipo_imbe: 424.68,
  referencia_recanto_do_caipora: 521.52,
  referencia_negramina: 625.51,
  referencia_aroeira: 654.88,
  referencia_buriti: 699.33,
  referencia_recanto_do_nego_dagua: 736.64
}

distanciaAoLongo = posicoesConhecidas[referencia.id] ?? 0

const ponto = caminhoTrilha.getPointAtLength(distanciaAoLongo)
const pontoTransformado = ponto.matrixTransform(matrizCaminho)

menorDistancia = Math.hypot(
  posicao.x - pontoTransformado.x,
  posicao.y - pontoTransformado.y
)

      // Guarda a posição da referência ao longo da trilha
      referencia.setAttribute(
        'data-posicao-trilha',
        String(distanciaAoLongo)
      )

      console.log(
        'GPS — Distância da referência ao caminho:',
        referencia.id,
        menorDistancia.toFixed(2),
        'unidades SVG',
        '| posição no percurso:',
        distanciaAoLongo.toFixed(2)
      )
    }
  }
}

  console.log(
    'GPS — Referência geográfica associada:',
    referencia.id,
    coordenadas.lat,
    coordenadas.lon
  )

})

// Inicia o acompanhamento da localização
obterLocalizacaoAtual(svg)


} // fecha if (svg)

} catch (erro) {
  console.error('Erro ao carregar o mapa:', erro)

  container.innerHTML =
    '<p class="mapa-erro">Não foi possível carregar o mapa.</p>'
  }
}

function render() {

  // Prepara o mapa geral enquanto o estudante
  // visualiza a tela inicial do Explore ITS.
  if (telaAtual === 'inicio') {
    void prepararMapaITS().catch(erro => {
      console.warn(
        'Pré-carregamento do mapa ITS não concluído:',
        erro
      )
    })
  }

let html = ''


if (telaAtual === 'inicio') {
  html += `
    <main class="tela-inicio-its inicio-figma">

      <section class="inicio-figma-hero">

        <img
          class="inicio-figma-lago"
          src="/explore-its/imagem/inicio/represe-its 1.png"
          alt="Paisagem do lago do Instituto do Trópico Subúmido"
        >

        
<div class="inicio-figma-marfim"></div>

<img
  class="inicio-figma-curva"
  src="/explore-its/imagem/inicio/curva-marfim.svg"
  alt=""
  aria-hidden="true"
>

<img
  class="inicio-figma-logos"

          src="/explore-its/imagem/inicio/Logo ITS + PUC Goiás g 1.png"
          alt="Logotipos do ITS e da PUC Goiás"
        >

<div class="inicio-figma-titulos">
  <h1>
    <span>Explore o</span>
    <strong>ITS</strong>
  </h1>
  <p>Natureza, ciência e cultura<br>em um só lugar</p>
</div>

<div class="inicio-figma-fotos">

  <div class="inicio-quadro">
    <img id="foto-quadro-1" src="/explore-its/imagem/inicio/galeria/quadro1_01.webp" alt="Fotografia do ITS">
    <img id="foto-proxima-1" class="inicio-foto-proxima" src="/explore-its/imagem/inicio/galeria/quadro1_02.webp" alt="">
  </div>

  <div class="inicio-quadro">
    <img id="foto-quadro-2" src="/explore-its/imagem/inicio/galeria/quadro2_01.webp" alt="Fotografia do ITS">
    <img id="foto-proxima-2" class="inicio-foto-proxima" src="/explore-its/imagem/inicio/galeria/quadro2_02.webp" alt="">
  </div>

  <div class="inicio-quadro">
    <img id="foto-quadro-3" src="/explore-its/imagem/inicio/galeria/quadro3_01.webp" alt="Fotografia do ITS">
    <img id="foto-proxima-3" class="inicio-foto-proxima" src="/explore-its/imagem/inicio/galeria/quadro3_02.webp" alt="">
  </div>

</div>


      </section>

      <section class="inicio-figma-inferior">

        <div class="inicio-figma-temas">

  <button type="button" class="inicio-tema-item" data-tema="natureza">
    <img src="/explore-its/imagem/inicio/natureza.svg" alt="">
    <span>Natureza</span>
  </button>

  <button type="button" class="inicio-tema-item" data-tema="cultura">
    <img src="/explore-its/imagem/inicio/cultura.svg" alt="">
    <span>Cultura</span>
  </button>

  <button type="button" class="inicio-tema-item" data-tema="educacao">
    <img src="/explore-its/imagem/inicio/ciencia.svg" alt="">
    <span>Educação</span>
  </button>

  <button type="button" class="inicio-tema-item" data-tema="extensao">
    <img src="/explore-its/imagem/inicio/historia.svg" alt="">
    <span>Extensão</span>
  </button>

</div>

        <button id="btn-explorar-its" class="inicio-figma-botao">
          COMEÇAR A EXPLORAR</span>
        </button>

        <div class="inicio-figma-rodape">
  <strong>Visite o ITS</strong>
  <div>

    <button type="button" class="inicio-rodape-item" id="btn-como-chegar">
      <img src="/explore-its/imagem/inicio/como_chegar.svg" alt="">
      <span>Como chegar</span>
    </button>

    <button type="button" class="inicio-rodape-item" id="btn-instagram">
      <img src="/explore-its/imagem/inicio/instagram.svg" alt="">
      <span>Instagram</span>
    </button>

    <button type="button" class="inicio-rodape-item" id="btn-contato">
      <img src="/explore-its/imagem/inicio/contato.svg" alt="">
      <span>Contato</span>
    </button>

  </div>
</div>

      </section>

    </main>
  `
} else if (telaAtual === 'explorar') {

  html += `
    <main class="tela-explorar">

      <section class="explorar-introducao">

        <h1>Explore os espaços do ITS</h1>

        <p>
          Descubra os diferentes ambientes do Instituto
          do Trópico Subúmido e escolha o que deseja conhecer.
        </p>
      </section>

<section class="explorar-localidades">


<div class="explorar-grade">

  <button type="button" class="explorar-cartao" data-localidade="aldeia-timbira">
    <div class="explorar-foto explorar-foto-placeholder"><span>🛖</span></div>
    <div class="explorar-cartao-conteudo">
      <h3>Aldeia Timbira</h3>
      <p>Conheça saberes e tradições indígenas.</p>
      
    </div>
  </button>

  <button type="button" class="explorar-cartao" data-localidade="arte-cultura">
    <div class="explorar-foto explorar-foto-placeholder"><span>🎨</span></div>
    <div class="explorar-cartao-conteudo">
      <h3>Arte e Cultura</h3>
      <p>Descubra histórias por meio da arte.</p>
      
    </div>
  </button>

  <button type="button" class="explorar-cartao" data-localidade="espaco-dalila">
    <div class="explorar-foto explorar-foto-placeholder"><span>🏡</span></div>
    <div class="explorar-cartao-conteudo">
      <h3>Espaço Dalila</h3>
      <p>Explore um espaço de memórias.</p>
      
    </div>
  </button>

  <button type="button" class="explorar-cartao" data-localidade="fazenda-barauna">
    <div class="explorar-foto explorar-foto-placeholder"><span>🌾</span></div>
    <div class="explorar-cartao-conteudo">
      <h3>Fazenda Baraúna</h3>
      <p>Conheça histórias da vida rural.</p>
      
    </div>
  </button>

  <button type="button" class="explorar-cartao" data-localidade="museu">
    <img
      class="explorar-foto"
      src="/explore-its/imagem/localidades/museu-its.webp"
      alt="Museu do ITS"
    >
    <div class="explorar-cartao-conteudo">
      <h3>Museu</h3>
      <p>Descubra histórias do Cerrado.</p>
      
    </div>
  </button>

  <button type="button" class="explorar-cartao" data-localidade="nascente">
    <div class="explorar-foto explorar-foto-placeholder"><span>💧</span></div>
    <div class="explorar-cartao-conteudo">
      <h3>Nascente</h3>
      <p>Investigue de onde vem a água.</p>
      
    </div>
  </button>

  <button type="button" class="explorar-cartao" data-localidade="quilombo">
    <div class="explorar-foto explorar-foto-placeholder"><span>🥁</span></div>
    <div class="explorar-cartao-conteudo">
      <h3>Quilombo</h3>
      <p>Conheça histórias de resistência.</p>
      
    </div>
  </button>

  <button type="button" class="explorar-cartao" data-localidade="trilha-semente-peregrina">
    <img
      class="explorar-foto"
      src="/explore-its/imagem/localidades/inicio_trilha.webp"
      alt="Trilha da Semente Peregrina"
    >
    <div class="explorar-cartao-conteudo">
      <h3>Trilha da Semente Peregrina</h3>
      <p>Investigue os segredos da mata.</p>
      
    </div>
  </button>

  <button type="button" class="explorar-cartao" data-localidade="trilha-sensorial">
    <div class="explorar-foto explorar-foto-placeholder"><span>🍃</span></div>
    <div class="explorar-cartao-conteudo">
      <h3>Trilha Sensorial</h3>
      <p>Explore a natureza com os sentidos.</p>
      
    </div>
  </button>

  <button type="button" class="explorar-cartao" data-localidade="vila-cenografica">
    <div class="explorar-foto explorar-foto-placeholder"><span>🎭</span></div>
    <div class="explorar-cartao-conteudo">
      <h3>Vila Cenográfica</h3>
      <p>Descubra cenários de outros tempos.</p>
      
    </div>
  </button>

  <button type="button" class="explorar-cartao" data-localidade="viveiro">
    <div class="explorar-foto explorar-foto-placeholder"><span>🌱</span></div>
    <div class="explorar-cartao-conteudo">
      <h3>Viveiro</h3>
      <p>Descubra como nasce uma floresta.</p>
      
    </div>
  </button>

</div>

</section>

    </main>
  `

} else if (telaAtual === 'mapa-its') {
  html += `
    <main class="tela-mapa-its">

<section class="mapa-its-introducao">

  <img
    class="mapa-its-foto-museu"
    src="/explore-its/imagem/localidades/museu-its.webp"
    alt="Museu do Instituto do Trópico Subúmido"
  >

  <div class="inicio-its-selo">
    🌿 EXPLORE O ITS
  </div>

<h2 class="mapa-its-titulo">
  <span>Explore o</span>
  <strong>ITS</strong>
</h2>

        <p>
  Toque em alguma localidade do mapa para conhecer esse espaço e descobrir o que existe por lá.
</p>
      </section>

      <section class="mapa-its-area">

        <div
          class="mapa-container"
          id="mapa-its-container"
          aria-label="Mapa interativo do Instituto do Trópico Subúmido"
        >
          <div class="mapa-carregando">
            Carregando mapa do ITS...
          </div>
        </div>

      </section>

      <!-- CARTÃO INFORMATIVO DAS LOCALIDADES -->
      <section
        id="cartao-localidade-its"
        class="cartao-localidade-its"
        hidden
      ></section>

    </main>
  `

} else if (telaAtual === 'localidade') {

  html += `
    <main class="tela-localidade">

      <section class="localidade-hero">
        <img
          src="/explore-its/imagem/localidades/inicio_trilha.webp"
          alt="Entrada da Trilha da Semente Peregrina"
          class="localidade-hero-imagem"
        >

        <div class="localidade-hero-conteudo">
          <h1>Trilha da<br>Semente Peregrina</h1>
        </div>
      </section>

      <section class="localidade-conteudo">

        <section class="localidade-apresentacao">

          <p class="localidade-percurso-texto">
            Uma caminhada por um pedaço do Cerrado
            preservado em meio à cidade, entre árvores,
            caminhos e histórias do nosso folclore. A
            cada recanto, novas descobertas sobre a
            natureza e a cultura desse lugar.
          </p>

          <div class="localidade-dados">

            <div class="localidade-dado">
              <span aria-hidden="true">🥾</span>
              <strong>1,4 km</strong>
              <small>de percurso</small>
            </div>

            <div class="localidade-dado">
              <span aria-hidden="true">📍</span>
              <strong>6 recantos</strong>
              <small>para descobrir</small>
            </div>

          </div>

        </section>

        <section class="localidade-missao">

          <h2 class="localidade-missao-titulo">
            <span aria-hidden="true">🧭</span>
            SUA MISSÃO
          </h2>

          <h3>Explore, investigue e descubra!</h3>

          <p>
            Observe os detalhes, faça perguntas,
            registre suas descobertas no Caderno
            de Campo e use suas observações para
            buscar explicações.
          </p>

          ${inicioExpedicao ? `
            <button
              id="btn-continuar-expedicao"
              class="btn-primary localidade-iniciar"
            >
              Continuar a expedição
            </button>

            <button
              id="btn-nova-expedicao"
              class="localidade-nova-expedicao"
            >
              ↻ Iniciar uma nova expedição
            </button>
          ` : `
            <button
              id="btn-iniciar-expedicao"
              class="btn-primary localidade-iniciar"
            >
              Começar expedição →
            </button>
          `}

        </section>

      </section>

    </main>
  `


} else if (telaAtual === 'cadastro') {

  html += `
    <div class="tela-identificacao">

      <section class="card-container identificacao-card">


<div class="identificacao-titulo">
  <h3>Prepare sua expedição</h3>
</div>

        <form id="form-cadastro">


<div class="form-group">
  <label>Nome do grupo</label>
  <input
    type="text"
    id="inp-grupo"
    required
    placeholder="Ex.: Exploradores do Cerrado"
  />
</div>

<div class="form-group">
  <label>Integrantes</label>
  <textarea
    id="inp-integrantes"
    required
    rows="3"
    placeholder="Digite os nomes dos participantes"
  ></textarea>
</div>

<div class="form-group">
  <label>Série / Turma</label>
  <input
    type="text"
    id="inp-turma"
    required
    placeholder="Ex.: 6º ano B"
  />
</div>

<div class="form-group">
  <label>Escola</label>
  <input
    type="text"
    id="inp-escola"
    required
    placeholder="Nome da escola"
  />
</div>

          <div class="form-group">
            <label>Escolha seu companheiro de expedição</label>

            <div class="mascotes-grid">
              ${mascotes.map(m => `
                <div
                  class="mascote-card ${m.id === mascoteTempId ? 'selecionado' : ''}"
                  data-id="${m.id}"
                >
                  <span class="mascote-emoji">${m.emoji}</span>
                  <strong>${m.nome}</strong>
                  <small>companheiro</small>
                </div>
              `).join('')}
            </div>
          </div>

          <button
            type="submit"
            class="btn-primary btn-iniciar-expedicao"
          >
            Começar a investigação
          </button>

        </form>

      </section>


    </div>
  `
} else if (telaAtual === 'registro-partida') {

  html += `
    <div class="tela-identificacao">

      <section class="card-container identificacao-card">

        <div class="identificacao-titulo">
          <h3>Registro de Partida</h3>
        </div>

        <p>
          A expedição está começando!
          Reúna seu grupo no portal de entrada da
          Trilha da Semente Peregrina.
        </p>

        <p>
          Registre uma fotografia para marcar
          o início dessa experiência.
        </p>

<!-- CÂMERA EXCLUSIVA DO REGISTRO DE PARTIDA -->
<input
  type="file"
  id="input-foto-partida"
  accept="image/*"
  capture="environment"
  style="display:none;"
>

        <div class="registro-partida-foto">
          ${fotoPartida
            ? `<img src="${fotoPartida}" alt="Fotografia do grupo">`
            : `<p>📷 Nenhuma fotografia registrada</p>`
          }
        </div>

        <button
          type="button"
          id="btn-foto-partida"
          class="btn-primary"
        >
          📷 ${fotoPartida ? 'Refazer fotografia' : 'Tirar fotografia'}
        </button>

        <button
          type="button"
          id="btn-continuar-partida"
          class="btn-primary"
          ${!fotoPartida ? 'disabled' : ''}
        >
          Continuar expedição →
        </button>

      </section>

    </div>
  `

} else if (telaAtual === 'trilha' && verCaderno) {


let tempoExpedicao = ''

if (inicioExpedicao) {
  const inicio = new Date(inicioExpedicao).getTime()
  const agora = Date.now()

  const minutosTotais = Math.max(
    0,
    Math.floor((agora - inicio) / 60000)
  )

  const horas = Math.floor(minutosTotais / 60)
  const minutos = minutosTotais % 60

  tempoExpedicao =
    horas > 0
      ? `${horas} h ${minutos} min`
      : `${minutos} min`
}

html += `
    <div class="card-container">
      <button id="btn-voltar-estacoes" class="btn-back">
      ⬅ Voltar ao mapa
      </button>

      <h2>📜 Caderno de Campo</h2>

      <p>
        <small>
          Estudante/Grupo: ${crachaSalvo?.nome ?? 'Não informado'} |
          Turma: ${crachaSalvo?.turma ?? 'Não informada'}
        </small>
      </p>

<hr style="margin:10px 0; border:0; border-top:1px solid var(--border);" />

${inicioExpedicao ? `
  <div class="caderno-expedicao-info">
    <span>EXPEDIÇÃO</span>

    <strong>
      📅 ${new Date(inicioExpedicao).toLocaleDateString('pt-BR')}
      &nbsp;•&nbsp;
      🕒 Início ${new Date(inicioExpedicao).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })}
      ${tempoExpedicao
        ? `&nbsp;•&nbsp; ⏱ ${tempoExpedicao}`
        : ''}
    </strong>
  </div>
` : ''}

<section class="caderno-registro-partida">

  <h3>📷 Registro de Partida</h3>

  <p>
    Nossa equipe no início da expedição pela
    Trilha da Semente Peregrina.
  </p>

  ${fotoPartida ? `
    <img
      src="${fotoPartida}"
      alt="Fotografia do grupo no início da expedição"
      style="
        display: block;
        width: 100%;
        max-width: 600px;
        height: auto;
        margin: 12px auto;
        border-radius: 12px;
      "
    >
  ` : `
    <p>Nenhuma fotografia de partida registrada.</p>
  `}

</section>

<section class="caderno-investigacoes">

  <h3>🔎 Nossas investigações</h3>

  <p>
    Estes são os quatro elementos selecionados
    para nossa expedição.
  </p>

  ${elementosSorteados.map(elemento => {

    const dados = catalogoElementos.find(
      item => item.id === elemento.id
    )

    // Recuperar o endereço do QR Code da árvore
    const linksArvores: Record<string, string> = JSON.parse(
      localStorage.getItem('exp_links_arvores') || '{}'
    )

    const linkQrArvore = linksArvores[elemento.id]

    const linkQrValido = (() => {
      if (!linkQrArvore) return ''

      try {
        const url = new URL(linkQrArvore)

        return ['https:', 'http:'].includes(url.protocol)
          ? url.href
          : ''
      } catch {
        return ''
      }
    })()

    const categorias: Record<CategoriaInvestigacao, string> = {
      ARV: 'Árvore ou planta',
      ECO: 'Processo ecológico',
      FOR: 'Formação natural',
      FOL: 'Cultura e folclore'
    }

    return `
      <article class="caderno-investigacao">

        <strong>
          ${categorias[elemento.categoria]}
        </strong>

        <p>
          ${dados?.nome ?? 'Elemento não identificado'}
        </p>

        <!-- Informações pedagógicas reservadas ao PDF -->

        <small>
          ${elemento.encontrado
            ? '✓ Investigação registrada'
            : '○ A investigar'}
        </small>

        ${fotosElementos[elemento.id] ? `
          <img
            src="${fotosElementos[elemento.id]}"
            alt="Fotografia de ${dados?.nome ?? 'elemento investigado'}"
            style="
              display: block;
              width: 100%;
              height: auto;
              max-height: 350px;
              object-fit: contain;
              border-radius: 10px;
              margin-top: 12px;
            "
          >
        ` : ''}

      </article>
    `

  }).join('')}

</section>

<section class="caderno-exportacao">
  <button type="button" id="btn-gerar-pdf-caderno">
    📄 Gerar meu Caderno em PDF
  </button>

  <p>
    O PDF será preparado sem nomes completos,
    dados de localização ou fotografias dos estudantes.
  </p>
</section>

    </div>
  `

  } else if (telaAtual === 'trilha') {

    html += `

      <div class="home-exploracao">

        <section class="mapa-exploracao">
<div class="mapa-cabecalho">
  <h3>Mapa da expedição</h3>
</div>

          <div
            class="mapa-container"
            id="mapa-container"
            aria-label="Mapa interativo da Trilha da Semente Peregrina"
          >
            <div class="mapa-carregando">Carregando mapa...</div>
          </div>

          <div id="gps-diagnostico">
            📍 GPS — aguardando localização...
          </div>
        </section>


        <!-- EXPLORE ITS — ELEMENTOS SORTEADOS -->
        <section class="lista-elementos-expedicao">

          <h3>Sua missão de descoberta</h3>

<p>
  Durante a caminhada, encontre os quatro elementos
  indicados no mapa e fotografe outras descobertas
  que chamarem sua atenção.
</p>

          <div class="elementos-expedicao">

            ${elementosSorteados.map(elemento => {

              const dados = catalogoElementos.find(
                item => item.id === elemento.id
              )

              const categorias = {
                ARV: 'Árvore ou planta',
                ECO: 'Processo ecológico',
                FOR: 'Formação natural',
                FOL: 'Cultura e folclore'
              }

              const pictogramas = {
                ARV: '/explore-its/imagem/pictogramas/arvores.svg',
                ECO: '/explore-its/imagem/pictogramas/processos-ecologicos.svg',
                FOR: '/explore-its/imagem/pictogramas/formacoes-naturais.svg',
                FOL: '/explore-its/imagem/pictogramas/cultura-folclore.svg'
              }

              return `
                <article
  class="elemento-expedicao"
  data-cartao-elemento="${elemento.id}"
>

                  <img
                    src="${pictogramas[elemento.categoria]}"
                    alt=""
                    class="elemento-expedicao-icone"
                  >

                  <div class="elemento-expedicao-texto">
                    <small>${categorias[elemento.categoria]}</small>

                    <strong>
                      ${dados?.nome ?? 'Elemento não identificado'}
                    </strong>

<span>
  ${elemento.encontrado
    ? '✓ Encontrado'
    : 'A procurar'}
</span>

</div>

<button
  type="button"
  class="btn-registrar-elemento"
  data-elemento-id="${elemento.id}"
  aria-label="${fotosElementos[elemento.id] ? 'Trocar fotografia de' : 'Fotografar'} ${dados?.nome ?? 'descoberta'}"
>
  ${fotosElementos[elemento.id] ? `
    <img
      src="${fotosElementos[elemento.id]}"
      alt="Fotografia de ${dados?.nome ?? 'elemento investigado'}"
      class="elemento-foto-miniatura"
    >
  ` : `
    <svg
      class="elemento-camera-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M14 4H9L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-3-3z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>

    <small>Tocar para fotografar</small>
  `}
</button>

</article>
              `
            }).join('')}

          </div>

          <!-- CÂMERA PARA REGISTRO DOS ELEMENTOS SORTEADOS -->
          <input
            type="file"
            id="input-foto-elemento"
            accept="image/*"
            capture="environment"
            style="display:none;"
          >

          <!-- PAINEL DE REGISTRO DA ÁRVORE -->
<div id="painel-registro-arvore" hidden>

  <div class="registro-arvore-conteudo">

    <strong>🌳 Registro da árvore</strong>

    <div id="registro-arvore-identificacao"></div>

<div class="registro-arvore-curiosidade">
  <strong>💡 Você sabia?</strong>
  <p id="texto-curiosidade-arvore">
    Uma curiosidade sobre esta árvore aparecerá aqui.
  </p>

  <strong>🔎 Continue investigando!</strong>
  <p id="texto-desafio-arvore"></p>
</div>

    <p>
      Registre sua descoberta para consultar depois
      no Caderno do Investigador.
    </p>

<!-- LEITURA ALTERNATIVA DO QR CODE -->
<button type="button" id="btn-foto-qr-arvore">
📷 1. Ler e guardar QR Code
</button>

<input
  type="file"
  id="input-foto-qr-arvore"
  accept="image/*"
  capture="environment"
  hidden
/>

<p id="resultado-qr-arvore" hidden></p>

<!-- ÁREA AUXILIAR PARA ANALISAR A FOTO DO QR CODE -->
<div id="leitor-qr-arvore-foto" hidden></div>

    <!-- LEITOR DE QR CODE DA ÁRVORE -->
<div id="painel-leitor-qr" hidden>

  <div id="leitor-qr-arvore"></div>

  <p id="mensagem-leitor-qr">
    Aponte a câmera para o QR Code da placa.
  </p>

  <button type="button" id="btn-cancelar-qr">
    Cancelar leitura
  </button>

</div>

    <button type="button" id="btn-foto-arvore">
      📷 2. Fotografar a árvore
    </button>

    <button type="button" id="btn-fechar-registro-arvore">
      Fechar
    </button>

    </div>

</div>
        </section>

        <!-- EXPLORE ITS — MINHAS DESCOBERTAS -->
        <section class="descobertas-livres">

          <h3>Minhas descobertas</h3>

          <input
            type="file"
            id="input-descoberta-livre"
            accept="image/*"
            capture="environment"
            hidden
          >

<p id="contador-descobertas">
${fotosDescobertasLivres.filter(Boolean).length}/${LIMITE_DESCOBERTAS_LIVRES - fotosDescobertasLivres.filter(Boolean).length}
</p>


<!-- GALERIA PROGRESSIVA — FOTOS DA CAMINHADA -->
<div class="miniaturas-descobertas galeria-caminhada">

  ${fotosDescobertasLivres
    .map((foto, indice) => ({ foto, indice }))
    .filter(item => Boolean(item.foto))
    .map(({ foto, indice }) => `
      <div
        class="miniatura-descoberta foto-pilha"
        data-indice="${indice}"
        role="button"
        tabindex="0"
        aria-label="Ampliar descoberta ${indice + 1}"
      >
        <img
          src="${foto}"
          alt="Fotografia da descoberta ${indice + 1}"
        >
      </div>
    `).join('')}

${fotosDescobertasLivres.filter(Boolean).length < LIMITE_DESCOBERTAS_LIVRES ? `
    <button
      type="button"
      class="foto-pilha foto-adicionar"
      aria-label="Registrar nova descoberta"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M14 4H9L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-3-3z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>

      <small>Adicionar</small>
    </button>
  ` : ''}

</div>



<!-- VISUALIZAÇÃO DE DESCOBERTA JÁ REGISTRADA -->
<div id="painel-visualizacao-descoberta" hidden>

  <h3 id="titulo-visualizacao-descoberta">
    Minha descoberta
  </h3>

  <img
    id="imagem-visualizacao-descoberta"
    alt="Fotografia ampliada da descoberta"
  >

  <div class="campo-observacao-descoberta">
    <p>
      <strong id="nome-visualizacao-descoberta"></strong>
    </p>

    <p id="texto-visualizacao-descoberta"></p>
  </div>

  <button type="button" id="btn-fechar-visualizacao-descoberta">
    Fechar
  </button>

</div>


<!-- REGISTRO DE UMA NOVA DESCOBERTA -->
<div
  id="painel-confirmacao-descoberta"
  hidden
  style="
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: #FAF8F2;
    overflow-y: auto;
    box-sizing: border-box;
    padding: 30px 16px;
  "
>
  <div
    style="
      width: 100%;
      max-width: 420px;
      margin: 0 auto;
      padding: 24px;
      box-sizing: border-box;
      background: #FFFFFF;
      border-radius: 18px;
      box-shadow: 0 3px 18px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      gap: 14px;
    "
  >
    <h3 style="
      margin: 0;
      text-align: center;
      color: #2E5D3A;
      font-size: 21px;
    ">
      Registrar nova descoberta
    </h3>

    <img
      id="imagem-confirmacao-descoberta"
      alt="Fotografia da nova descoberta"
      style="
        display: block;
        width: 110px;
        height: 110px;
        object-fit: cover;
        border-radius: 12px;
        margin: 0 auto;
      "
    >

    <div
      class="campo-observacao-descoberta"
      style="
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 9px;
        width: 100%;
      "
    >
      <label
        for="nome-descoberta"
        style="display: block; text-align: left;"
      >
        <strong>Nome da descoberta (opcional)</strong>
      </label>

      <input
        type="text"
        id="nome-descoberta"
        maxlength="70"
        placeholder="Ex.: Jabuti-tinga, árvore, pegadas..."
        style="
          display: block;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid #C8D2C6;
          border-radius: 9px;
          font-size: 16px;
        "
      >

      <label
        for="observacao-descoberta"
        style="
          display: block;
          text-align: left;
          margin-top: 8px;
        "
      >
        <strong>O que você observou? (opcional)</strong>
      </label>

      <textarea
        id="observacao-descoberta"
        rows="3"
        maxlength="250"
        placeholder="Descreva algo que chamou sua atenção."
        style="
          display: block;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          padding: 12px;
          border: 1px solid #C8D2C6;
          border-radius: 9px;
          font-size: 16px;
          resize: vertical;
        "
      ></textarea>
    </div>

    <p style="
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
      text-align: center;
      color: #555;
    ">
      Os campos são opcionais. Depois de salvar,
      a descoberta não poderá ser alterada.
    </p>

    <button
      type="button"
      id="btn-confirmar-descoberta"
      style="
        width: 100%;
        padding: 14px;
        background: #2E5D3A;
        color: white;
        border: 0;
        border-radius: 10px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
      "
    >
      ✓ Salvar descoberta
    </button>

    <button
      type="button"
      id="btn-repetir-descoberta"
      style="
        width: 100%;
        padding: 12px;
        background: white;
        color: #2E5D3A;
        border: 1px solid #2E5D3A;
        border-radius: 10px;
        font-size: 15px;
        cursor: pointer;
      "
    >
      Cancelar
    </button>
  </div>
</div>


        </section>

       </div>
    `

} else if (telaAtual === 'meu-percurso') {

  // Fotografias disponíveis para a montagem do caderno.
  // Prioriza a fotografia de partida e depois as investigações.
  const fotosMontagem = [
    fotoPartida,
    ...Object.values(fotosElementos)
  ]
    .filter((foto): foto is string =>
      typeof foto === 'string' && foto.length > 0
    )
    .slice(0, 3)

      // CONQUISTAS — INVESTIGAÇÕES REALIZADAS
  const totalInvestigacoes = elementosSorteados.filter(
    elemento => elemento.encontrado
  ).length

  // CONQUISTAS — PROGRESSO DA EXPEDIÇÃO
const progressoExpedicao = elementosSorteados.length > 0
  ? Math.round(
      (totalInvestigacoes / elementosSorteados.length) * 100
    )
  : 0
    
// CONQUISTAS — FOTOGRAFIAS REGISTRADAS
const totalFotosInvestigacoes = Object.values(fotosElementos)
  .filter(foto => typeof foto === 'string' && foto.length > 0)
  .length

const totalFotosLivres = fotosDescobertasLivres.length

const totalFotografias =
  totalFotosInvestigacoes +
  totalFotosLivres +
  (fotoPartida ? 1 : 0)

  const trilhaRegistrada =
    crachaSalvo !== null ||
    inicioExpedicao !== null ||
    fotoPartida !== null ||
    elementosSorteados.length > 0

  html += `
    <main class="tela-meu-percurso registros-pagina">

      <header class="registros-cabecalho">
        <h1>Registros</h1>
        <p>
          Reviva a expedição da sua equipe e veja
          tudo o que foi descoberto no ITS.
        </p>
      </header>

      ${trilhaRegistrada ? `

        <section class="registros-cartao registros-caderno">

          <div class="registros-cartao-titulo">
            <div class="registros-icone">📄</div>

            <div>
              <h2>Caderno do Investigador</h2>
              <p>
                Reveja os registros, fotografias e descobertas
                da equipe na Trilha da Semente Peregrina.
              </p>
            </div>
          </div>

<button
  type="button"
  class="registros-montagem registros-galeria-botao"
  id="btn-galeria"
  aria-label="Abrir galeria de fotografias da expedição"
>

  ${fotosMontagem.map((foto, indice) => `
    <div class="registros-foto registros-foto-${indice + 1}">
      <img
        src="${foto}"
        alt="Fotografia ${indice + 1} da expedição"
        loading="lazy"
      >
    </div>
  `).join('')}

  <div class="registros-caderno-ilustracao">
    <span>📓</span>
    <strong>Caderno do Investigador</strong>
  </div>

</button>

          <button
            type="button"
            class="btn-primary registros-btn-pdf"
            id="btn-caderno"
          >
            📄 Abrir Caderno de Campo em PDF
            <span aria-hidden="true">›</span>
          </button>

        </section>

        <section class="registros-cartao registros-conquistas">

          <div class="registros-cartao-titulo">
            <div class="registros-icone">▥</div>

            <div>
              <h2>Conquistas da equipe</h2>
              <p>
                Veja o que a equipe já realizou
                nesta expedição.
              </p>
            </div>
          </div>

          <div class="registros-indicadores">

            <div class="registros-indicador">
  <strong>${totalInvestigacoes}</strong>
  <span>Investigações realizadas</span>
</div>

            <div class="registros-indicador">
              <strong>${totalFotografias}</strong>
<span>Fotografias registradas</span>
            </div>

            <div class="registros-indicador">
<strong>${totalFotosLivres}</strong>
<span>Descobertas livres</span>
            </div>

<div class="registros-indicador">
  <strong>${progressoExpedicao}%</strong>
  <span>Progresso da expedição</span>
</div>

          </div>

        </section>

      ` : `

        <div class="percurso-vazio">
          <p>
            Você ainda não iniciou uma experiência
            registrada no ITS.
          </p>
          <p>
            Explore as localidades e participe das
            atividades para construir seus registros.
          </p>
        </div>

      `}

    </main>
  `

} else if (telaAtual === 'galeria') {

  const fotografiasGaleria: {
    foto: string
    titulo: string
  }[] = []

  // Fotografia de partida
  if (fotoPartida) {
    fotografiasGaleria.push({
      foto: fotoPartida,
      titulo: 'Início da expedição'
    })
  }

  // Fotografias dos elementos investigados
  Object.entries(fotosElementos).forEach(([id, foto]) => {
    if (!foto) return

    const elemento = catalogoElementos.find(
      item => item.id === id
    )

    fotografiasGaleria.push({
      foto,
      titulo: elemento?.nome || 'Elemento investigado'
    })
  })

  // Fotografias das descobertas livres
  fotosDescobertasLivres.forEach((foto, indice) => {
    if (!foto) return

    fotografiasGaleria.push({
      foto,
      titulo: `Descoberta livre ${indice + 1}`
    })
  })

  html += `
    <main class="tela-galeria">

      <header class="galeria-cabecalho">
        <button
          type="button"
          id="btn-voltar-galeria"
          class="galeria-voltar"
        >
          ← Voltar
        </button>

        <h1>Galeria de Descobertas</h1>
        <p>
          Fotografias registradas pela equipe
          durante a expedição.
        </p>
      </header>

      ${fotografiasGaleria.length > 0 ? `

        <div class="galeria-grade">

          ${fotografiasGaleria.map((item, indice) => `
            <figure class="galeria-item">
              <img
                src="${item.foto}"
                alt="Fotografia ${indice + 1} da expedição"
                loading="lazy"
              >
              <figcaption>${item.titulo}</figcaption>
            </figure>
          `).join('')}

        </div>

      ` : `

        <div class="galeria-vazia">
          <p>
            A equipe ainda não registrou fotografias.
          </p>
        </div>

      `}

    </main>
  `
}

// NAVEGAÇÃO GERAL DO EXPLORE ITS
// Preparação para a futura barra inferior

if (
  telaAtual === 'mapa-its' ||
  telaAtual === 'localidade' ||
  telaAtual === 'explorar' ||
  telaAtual === 'cadastro' ||
  telaAtual === 'registro-partida' ||
  telaAtual === 'trilha' ||
  telaAtual === 'meu-percurso' ||
  telaAtual === 'galeria'
) {

  html += `
    <nav class="navegacao-inferior" aria-label="Navegação principal">

      
<button
  type="button"
class="nav-item"
  id="nav-inicio"
>
  <span class="nav-icone">⌂</span>
  <span>Início</span>
</button>

<button
  type="button"
  class="nav-item ${telaAtual === 'explorar' ? 'ativo' : ''}"
  id="nav-explorar"
>
  <span class="nav-icone">◈</span>
  <span>Explorar</span>
</button>

<button
  type="button"
  class="nav-item ${['mapa-its', 'localidade', 'cadastro', 'trilha'].includes(telaAtual) ? 'ativo' : ''}"
  id="nav-mapa"
>
  <span class="nav-icone">▧</span>
  <span>Mapa</span>
</button>

<button
  type="button"
  class="nav-item ${telaAtual === 'meu-percurso' ? 'ativo' : ''}"
  id="nav-percurso"
>
  <span class="nav-icone">♧</span>
  <span>Registros</span>
</button>


    </nav>
  `
}

app.innerHTML = html

// Toda tela renderizada começa no topo da página
window.scrollTo({
  top: 0,
  left: 0,
  behavior: 'instant'
})

if (telaAtual === 'mapa-its') {
  carregarMapaITS()
} else if (telaAtual === 'trilha') {
  carregarMapaInterativo()
}

bindEvents()
}



let temporizadorFotosInicio: ReturnType<typeof setInterval> | null = null

function iniciarGaleriaInicio() {

  // Encerra o temporizador anterior
  if (temporizadorFotosInicio !== null) {
    clearInterval(temporizadorFotosInicio)
    temporizadorFotosInicio = null
  }

  const quadros = [1, 2, 3].map(numero => ({
    numero,
    atual: document.querySelector<HTMLImageElement>(
      `#foto-quadro-${numero}`
    ),
    proxima: document.querySelector<HTMLImageElement>(
      `#foto-proxima-${numero}`
    ),
    indice: 1
  }))

  if (quadros.some(quadro => !quadro.atual || !quadro.proxima)) {
    return
  }

  // Evita movimento quando o usuário prefere animações reduzidas
  const reduzirMovimento = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches

  const duracao = reduzirMovimento ? 0 : 900
  const intervalo = 6000

  function trocarFotografia(
    quadro: typeof quadros[number]
  ) {

    const atual = quadro.atual!
    const proxima = quadro.proxima!

    if (
      telaAtual !== 'inicio' ||
      !atual.isConnected ||
      !proxima.isConnected
    ) {
      return
    }

    const proximoIndice = (quadro.indice % 4) + 1
    const numeroFoto = String(proximoIndice).padStart(2, '0')

    const caminho =
      `/explore-its/imagem/inicio/galeria/quadro${quadro.numero}_${numeroFoto}.webp`

    // Carrega a próxima fotografia antes da transição
    const imagem = new Image()

    imagem.onload = () => {

      if (
        telaAtual !== 'inicio' ||
        !atual.isConnected ||
        !proxima.isConnected
      ) {
        return
      }

      proxima.style.transition = 'none'
      proxima.style.opacity = '0'
      proxima.src = caminho

      // Garante que a animação comece com a nova imagem invisível
      void proxima.offsetWidth

      proxima.style.transition =
        `opacity ${duracao}ms ease-in-out`

      proxima.style.opacity = '1'

      // Depois da dissolvência, atualiza a fotografia de base
      setTimeout(() => {

        if (
          telaAtual !== 'inicio' ||
          !atual.isConnected ||
          !proxima.isConnected
        ) {
          return
        }

        atual.src = caminho
        proxima.style.transition = 'none'
        proxima.style.opacity = '0'

        quadro.indice = proximoIndice

      }, duracao + 50)
    }

    imagem.src = caminho
  }

  // Cada quadro troca em um momento diferente
  function executarCiclo() {

    quadros.forEach((quadro, posicao) => {

      setTimeout(() => {
        trocarFotografia(quadro)
      }, posicao * 1500)

    })
  }

  temporizadorFotosInicio = setInterval(() => {

    if (telaAtual !== 'inicio') {

      if (temporizadorFotosInicio !== null) {
        clearInterval(temporizadorFotosInicio)
        temporizadorFotosInicio = null
      }

      return
    }

    executarCiclo()

  }, intervalo)
}

// =====================================================
// EXPLORE ITS — NAVEGAÇÃO COM HISTÓRICO
// =====================================================

function navegarPara(tela: TelaApp) {
  // Atualiza a entrada atual com a tela de origem
  history.replaceState(
    obterEstadoNavegacao(),
    '',
    window.location.href
  )

  // Registra a tela de destino como uma nova entrada
  telaAtual = tela
  verCaderno = false

  history.pushState(
    obterEstadoNavegacao(),
    '',
    window.location.href
  )

  window.scrollTo(0, 0)
  render()
}

// Registra o estado inicial somente quando necessário
if (!history.state || !history.state.tela) {
  history.replaceState(
    obterEstadoNavegacao(),
    '',
    window.location.href
  )
}

// Recupera a tela anterior ao usar Voltar
window.addEventListener('popstate', (evento) => {
  const estado = evento.state as EstadoNavegacao | null

  if (!estado) return

  telaAtual = estado.tela
  verCaderno = estado.caderno
  localidadeAtual = estado.localidade

  window.scrollTo(0, 0)
  render()
})

function bindEvents() {
  if (telaAtual === 'inicio') {
    iniciarGaleriaInicio()
  }

  // REGISTROS — ABRIR GALERIA DE FOTOGRAFIAS
  document.getElementById('btn-galeria')
    ?.addEventListener('click', () => {
      navegarPara('galeria')
    })


// =====================================================
// DESCOBERTAS LIVRES — VISUALIZAÇÃO E NAVEGAÇÃO
// =====================================================

// Identifica a descoberta atualmente aberta
let indiceDescobertaVisualizada: number | null = null

// Exibe a fotografia e sua observação

function visualizarDescoberta(indice: number): void {
  if (
    !Number.isInteger(indice) ||
    indice < 0 ||
    indice >= LIMITE_DESCOBERTAS_LIVRES
  ) return

  const fotografia = fotosDescobertasLivres[indice]
  if (!fotografia) return

  const painel = document.querySelector<HTMLElement>(
    '#painel-visualizacao-descoberta'
  )

  const imagem = document.querySelector<HTMLImageElement>(
    '#imagem-visualizacao-descoberta'
  )

  const titulo = document.querySelector<HTMLElement>(
    '#titulo-visualizacao-descoberta'
  )

  const nome = document.querySelector<HTMLElement>(
    '#nome-visualizacao-descoberta'
  )

  const descricao = document.querySelector<HTMLElement>(
    '#texto-visualizacao-descoberta'
  )

  if (!painel || !imagem || !titulo) return

  indiceDescobertaVisualizada = indice

  imagem.src = fotografia
  titulo.textContent = `Descoberta ${indice + 1}`

  if (nome) {
    nome.textContent = nomesDescobertasLivres[indice] ?? ''
  }

  if (descricao) {
    descricao.textContent =
      observacoesDescobertasLivres[indice] ?? ''
  }

  painel.hidden = false
  painel.style.display = 'block'
}


// Abre a fotografia ao tocar na miniatura
document.querySelectorAll<HTMLElement>(
  '.miniatura-descoberta'
).forEach(cartao => {

  const abrirFotografia = () => {
    const indice = Number(cartao.dataset.indice)

    visualizarDescoberta(indice)

    document.querySelector<HTMLElement>(
      '#painel-visualizacao-descoberta'
    )?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    })
  }

  cartao.addEventListener('click', evento => {
    if ((evento.target as HTMLElement).closest('button')) return
    abrirFotografia()
  })

  cartao.addEventListener('keydown', evento => {
    if (evento.target !== cartao) return

    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault()
      abrirFotografia()
    }
  })
})

// Navegação horizontal entre as descobertas registradas
const imagemDescoberta =
  document.querySelector<HTMLImageElement>(
    '#imagem-visualizacao-descoberta'
  )

let inicioToqueX = 0
let inicioToqueY = 0

imagemDescoberta?.addEventListener(
  'touchstart',
  evento => {
    inicioToqueX = evento.changedTouches[0].screenX
    inicioToqueY = evento.changedTouches[0].screenY
  },
  { passive: true }
)

imagemDescoberta?.addEventListener(
  'touchend',
  evento => {

    const diferencaX =
      evento.changedTouches[0].screenX - inicioToqueX

    const diferencaY =
      evento.changedTouches[0].screenY - inicioToqueY

    if (
      Math.abs(diferencaX) < 60 ||
      Math.abs(diferencaX) < Math.abs(diferencaY)
    ) return

    if (indiceDescobertaVisualizada === null) return

    const direcao = diferencaX < 0 ? 1 : -1

    // Procura a próxima descoberta que possui fotografia
    let proximoIndice =
      indiceDescobertaVisualizada + direcao

    while (
      proximoIndice >= 0 &&
      proximoIndice < LIMITE_DESCOBERTAS_LIVRES
    ) {
      if (fotosDescobertasLivres[proximoIndice]) {
        visualizarDescoberta(proximoIndice)
        return
      }

      proximoIndice += direcao
    }
  },
  { passive: true }
)


// DESCOBERTAS LIVRES — FECHAR FOTOGRAFIA AMPLIADA
document.querySelector('#btn-fechar-visualizacao-descoberta')
  ?.addEventListener('click', () => {
    const painel = document.querySelector<HTMLElement>(
      '#painel-visualizacao-descoberta'
    )

    if (painel) {
      painel.hidden = true
      painel.style.display = 'none'
    }
  })


// DESCOBERTAS LIVRES — FECHAR FOTOGRAFIA AMPLIADA
document.querySelector('#btn-fechar-visualizacao-descoberta')
  ?.addEventListener('click', () => {
    const painel = document.querySelector<HTMLElement>(
      '#painel-visualizacao-descoberta'
    )

    if (painel) {
      painel.hidden = true
      painel.style.display = 'none'
    }
  })


// ===============================================
// DESCOBERTAS LIVRES — REGISTRO DEFINITIVO
// ===============================================

// Abre a câmera somente quando existe vaga disponível.
const abrirCameraDescoberta = async () => {
  await recuperacaoDescobertasLivres

  if (
    fotosDescobertasLivres.filter(Boolean).length >=
    LIMITE_DESCOBERTAS_LIVRES
  ) {
    alert('Você já registrou as seis descobertas disponíveis.')
    return
  }

  const input = document.querySelector<HTMLInputElement>(
    '#input-descoberta-livre'
  )

  if (!input) return

  input.value = ''
  input.click()
}

// Botões de captura existentes
document.querySelector('#btn-descoberta-livre')
  ?.addEventListener('click', abrirCameraDescoberta)

document.querySelector('.foto-adicionar')
  ?.addEventListener('click', abrirCameraDescoberta)

// Processa a fotografia e abre a tela de registro.
// A fotografia ainda NÃO é salva.
document.querySelector<HTMLInputElement>('#input-descoberta-livre')
  ?.addEventListener('change', async evento => {
    const input = evento.currentTarget as HTMLInputElement
    const arquivo = input.files?.[0]

    if (!arquivo) return

    const urlTemporaria = URL.createObjectURL(arquivo)

    try {
      const imagem = new Image()
      imagem.src = urlTemporaria
      await imagem.decode()

      const escala = Math.min(
        1,
        1200 / Math.max(imagem.width, imagem.height)
      )

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(imagem.width * escala))
      canvas.height = Math.max(1, Math.round(imagem.height * escala))

      const contexto = canvas.getContext('2d')

      if (!contexto) {
        throw new Error('Não foi possível processar a fotografia.')
      }

      contexto.drawImage(
        imagem,
        0,
        0,
        canvas.width,
        canvas.height
      )

      fotografiaDescobertaPendente =
        canvas.toDataURL('image/jpeg', 0.8)

      const painelVisualizacao =
        document.querySelector<HTMLElement>(
          '#painel-visualizacao-descoberta'
        )

      if (painelVisualizacao) {
        painelVisualizacao.hidden = true
        painelVisualizacao.style.display = 'none'
      }

      const imagemConfirmacao =
        document.querySelector<HTMLImageElement>(
          '#imagem-confirmacao-descoberta'
        )

      const painelConfirmacao =
        document.querySelector<HTMLElement>(
          '#painel-confirmacao-descoberta'
        )

      const campoNome =
        document.querySelector<HTMLInputElement>(
          '#nome-descoberta'
        )

      const campoObservacao =
        document.querySelector<HTMLTextAreaElement>(
          '#observacao-descoberta'
        )

      if (!imagemConfirmacao || !painelConfirmacao) {
        throw new Error('Painel de registro não encontrado.')
      }

      imagemConfirmacao.src = fotografiaDescobertaPendente

      if (campoNome) campoNome.value = ''
      if (campoObservacao) campoObservacao.value = ''

      painelConfirmacao.hidden = false
      painelConfirmacao.style.display = 'block'

      painelConfirmacao.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })

    } catch (erro) {
      fotografiaDescobertaPendente = null
      console.error('Erro ao preparar descoberta:', erro)
      alert('Não foi possível preparar a fotografia.')
    } finally {
      URL.revokeObjectURL(urlTemporaria)
      input.value = ''
    }
  })

// Cancela a descoberta ainda não salva.
document.querySelector('#btn-repetir-descoberta')
  ?.addEventListener('click', () => {
    fotografiaDescobertaPendente = null

    const painel = document.querySelector<HTMLElement>(
      '#painel-confirmacao-descoberta'
    )

    if (painel) {
      painel.hidden = true
      painel.style.display = 'none'
    }

    const imagem = document.querySelector<HTMLImageElement>(
      '#imagem-confirmacao-descoberta'
    )

    if (imagem) imagem.removeAttribute('src')

    const nome = document.querySelector<HTMLInputElement>(
      '#nome-descoberta'
    )

    const observacao =
      document.querySelector<HTMLTextAreaElement>(
        '#observacao-descoberta'
      )

    if (nome) nome.value = ''
    if (observacao) observacao.value = ''

    navegarPara('trilha')
  })

// Salva definitivamente a descoberta.
document.querySelector('#btn-confirmar-descoberta')
  ?.addEventListener('click', async evento => {
    const botao = evento.currentTarget as HTMLButtonElement
    const fotografia = fotografiaDescobertaPendente

    if (!fotografia) {
      alert('Nenhuma fotografia disponível para registro.')
      return
    }

    const nome =
      document.querySelector<HTMLInputElement>(
        '#nome-descoberta'
      )?.value.trim() ?? ''

    const observacao =
      document.querySelector<HTMLTextAreaElement>(
        '#observacao-descoberta'
      )?.value.trim() ?? ''

    botao.disabled = true

    try {
      await recuperacaoDescobertasLivres

      // Nunca substitui uma fotografia já registrada.
      const indiceLivre = fotosDescobertasLivres.findIndex(
        foto => !foto
      )

      if (indiceLivre === -1) {
        alert('Você já registrou as seis descobertas disponíveis.')
        return
      }

      const numero = indiceLivre + 1

      // Persiste os dados antes de atualizar a galeria.
      await salvarNoBancoExplore(
        'fotografias',
        `exp_descoberta_livre_${numero}`,
        fotografia
      )

      await salvarNoBancoExplore(
        'fotografias',
        `exp_nome_livre_${numero}`,
        nome
      )

      await salvarNoBancoExplore(
        'fotografias',
        `exp_observacao_livre_${numero}`,
        observacao
      )

      fotosDescobertasLivres[indiceLivre] = fotografia
      nomesDescobertasLivres[indiceLivre] = nome
      observacoesDescobertasLivres[indiceLivre] = observacao

fotografiaDescobertaPendente = null

// Retorna ao mapa da trilha após salvar a descoberta.
navegarPara('trilha')

    } catch (erro) {
      console.error('Erro ao salvar descoberta:', erro)
      alert('Não foi possível salvar a descoberta.')
    } finally {
      botao.disabled = false
    }
  })



  // NAVEGAÇÃO INFERIOR — INÍCIO
  document.querySelector('#nav-inicio')?.addEventListener('click', () => {
    navegarPara('inicio')
  })

// NAVEGAÇÃO INFERIOR — MAPA
document.querySelector('#nav-mapa')?.addEventListener('click', () => {
  navegarPara('mapa-its')
})

// NAVEGAÇÃO INFERIOR — EXPLORAR
document.querySelector('#nav-explorar')?.addEventListener('click', () => {
  navegarPara('explorar')
})

// NAVEGAÇÃO INFERIOR — MEU PERCURSO
document.querySelector('#nav-percurso')?.addEventListener('click', () => {
  navegarPara('meu-percurso')
})

// EXPLORAR — ABRIR TRILHA DA SEMENTE PEREGRINA
document.querySelector(
  '[data-localidade="trilha-semente-peregrina"]'
)?.addEventListener('click', () => {
  localidadeAtual = 'trilha-semente-peregrina'
  navegarPara('localidade')
})

  // COMO CHEGAR
  document.querySelector('#btn-como-chegar')?.addEventListener('click', () => {
    const destino = encodeURIComponent('Memorial do Cerrado da PUC Goiás, Goiânia, GO')
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destino}`
    window.open(url, '_blank', 'noopener,noreferrer')
  })

  // INSTAGRAM
  document.querySelector('#btn-instagram')?.addEventListener('click', () => {
    window.open(
      'https://www.instagram.com/memorialdocerrado/',
      '_blank',
      'noopener,noreferrer'
    )
  })

  // CONTATO
  document.querySelector('#btn-contato')?.addEventListener('click', () => {
    const janela = document.createElement('div')
    janela.className = 'inicio-modal-fundo'

    janela.innerHTML = `
      <div class="inicio-modal" role="dialog" aria-modal="true" aria-labelledby="inicio-modal-titulo">
        <button class="inicio-modal-fechar" aria-label="Fechar janela">×</button>

        <h2 id="inicio-modal-titulo">Contato e visitas</h2>

        <p>
          Quer conhecer o Instituto do Trópico Subúmido?
          Entre em contato com a equipe responsável pelo
          Memorial do Cerrado para obter informações sobre
          visitas e atividades educativas.
        </p>

        <p>
          <strong>Atendimento e agendamentos</strong>
        </p>

        <p>
          Em breve, disponibilizaremos aqui os canais
          de contato e as informações para agendamento de visitas.
        </p>
      </div>
    `

    document.body.appendChild(janela)

    const fechar = () => janela.remove()

    janela.querySelector('.inicio-modal-fechar')?.addEventListener('click', fechar)

    janela.addEventListener('click', (evento) => {
      if (evento.target === janela) fechar()
    })
  })

// COMEÇAR A EXPLORAR
document.querySelector('#btn-explorar-its')?.addEventListener('click', () => {
  navegarPara('mapa-its')
})

document.querySelector('[data-tema="natureza"]')?.addEventListener('click', () => {
  const janela = document.createElement('div')
  janela.className = 'inicio-modal-fundo'

  janela.innerHTML = `
    <div class="inicio-modal" role="dialog" aria-modal="true" aria-labelledby="inicio-modal-titulo">
      <button class="inicio-modal-fechar" aria-label="Fechar janela">×</button>

      <h2 id="inicio-modal-titulo">Natureza no ITS</h2>

      <img
        src="/explore-its/imagem/inicio/represe-its 1.png"
        alt="Paisagem natural do ITS"
      >

      <p>
        Descubra a biodiversidade do Cerrado, suas paisagens,
        plantas, animais e ambientes naturais.
      </p>
    </div>
  `

  document.body.appendChild(janela)

  const fechar = () => janela.remove()

  janela.querySelector('.inicio-modal-fechar')?.addEventListener('click', fechar)

  janela.addEventListener('click', (evento) => {
    if (evento.target === janela) fechar()
  })
})

document.querySelector('[data-tema="cultura"]')?.addEventListener('click', () => {
  const janela = document.createElement('div')
  janela.className = 'inicio-modal-fundo'

  janela.innerHTML = `
    <div class="inicio-modal" role="dialog" aria-modal="true" aria-labelledby="inicio-modal-titulo">
      <button class="inicio-modal-fechar" aria-label="Fechar janela">×</button>

      <h2 id="inicio-modal-titulo">Cultura no ITS</h2>

      <img
        src="/explore-its/imagem/inicio/vila_cenografica_1 1.png"
        alt="Vila Cenográfica do ITS"
      >

      <p>
        Conheça espaços que valorizam a história, as tradições
        e a diversidade cultural de Goiás. A Vila Cenográfica,
        o Quilombo e a Aldeia Indígena proporcionam experiências
        de aprendizagem sobre diferentes modos de vida.
      </p>
    </div>
  `

  document.body.appendChild(janela)

  const fechar = () => janela.remove()

  janela.querySelector('.inicio-modal-fechar')?.addEventListener('click', fechar)

  janela.addEventListener('click', (evento) => {
    if (evento.target === janela) fechar()
  })
})

document.querySelector('[data-tema="educacao"]')?.addEventListener('click', () => {
  const janela = document.createElement('div')
  janela.className = 'inicio-modal-fundo'

  janela.innerHTML = `
    <div class="inicio-modal" role="dialog" aria-modal="true" aria-labelledby="inicio-modal-titulo">
      <button class="inicio-modal-fechar" aria-label="Fechar janela">×</button>

      <h2 id="inicio-modal-titulo">Educação no ITS</h2>

      <img
        src="/explore-its/imagem/inicio/caminho_represa 1.png"
        alt="Ambiente utilizado em atividades educativas no ITS"
      >

      <p>
        No ITS, aprender vai além da sala de aula.
        Estudantes exploram ambientes naturais e culturais,
        observam, investigam e descobrem conhecimentos
        por meio de experiências educativas.
      </p>
    </div>
  `

  document.body.appendChild(janela)

  const fechar = () => janela.remove()

  janela.querySelector('.inicio-modal-fechar')?.addEventListener('click', fechar)

  janela.addEventListener('click', (evento) => {
    if (evento.target === janela) fechar()
  })
})

document.querySelector('[data-tema="extensao"]')?.addEventListener('click', () => {
  const janela = document.createElement('div')
  janela.className = 'inicio-modal-fundo'

  janela.innerHTML = `
    <div class="inicio-modal" role="dialog" aria-modal="true" aria-labelledby="inicio-modal-titulo">
      <button class="inicio-modal-fechar" aria-label="Fechar janela">×</button>

      <h2 id="inicio-modal-titulo">Extensão no ITS</h2>

      <img
        src="/explore-its/imagem/inicio/vila_cenografica_1 1.png"
        alt="Espaço do ITS utilizado em atividades de extensão"
      >

      <p>
        O ITS aproxima a universidade da sociedade.
        Por meio de visitas, projetos e atividades educativas,
        promove o encontro entre estudantes, professores
        e comunidades, valorizando a troca de conhecimentos.
      </p>
    </div>
  `

  document.body.appendChild(janela)

  const fechar = () => janela.remove()

  janela.querySelector('.inicio-modal-fechar')?.addEventListener('click', fechar)

  janela.addEventListener('click', (evento) => {
    if (evento.target === janela) fechar()
  })
})

  document.querySelector('#btn-voltar-mapa-its')?.addEventListener('click', () => {
    localidadeAtual = null
    telaAtual = 'mapa-its'
    render()
  })

    // Retornar do mapa geral à página inicial
  document.querySelector('#btn-voltar-inicio-its')?.addEventListener('click', () => {
    localidadeAtual = null
    telaAtual = 'inicio'
    render()
  })

  document.querySelector('#btn-iniciar-expedicao')?.addEventListener('click', () => {
    telaAtual = 'cadastro'
    render()
  })

document.querySelector('#btn-continuar-expedicao')?.addEventListener('click', () => {
  navegarPara('trilha')
})

// INICIAR UMA NOVA EXPEDIÇÃO
document.querySelector('#btn-nova-expedicao')?.addEventListener('click', async () => {
  
  const confirmar = confirm(
    'Deseja iniciar uma nova expedição? Os registros da expedição anterior serão apagados.'
  )


if (!confirmar) return

// Aguarda a recuperação das fotografias anteriores
await recuperacaoDescobertasLivres
await recuperacaoFotosElementos

// Apaga as fotografias das quatro missões no IndexedDB
try {
  await salvarNoBancoExplore(
    'fotografias',
    'exp_fotos_elementos',
    {}
  )
} catch (erro) {
  console.error('Erro ao limpar fotografias das missões:', erro)
  alert('Não foi possível apagar as fotografias das missões.')
  return
}

// Limpa também as fotografias antigas do localStorage
localStorage.removeItem('exp_fotos_elementos')

// Limpa também as fotografias das missões na memória
fotosElementos = {}
versaoFotosElementos++
elementoFotografiaAtual = null

// Exclui as seis fotografias livres e suas observações do IndexedDB
try {
  await limparFotosDescobertasLivres()
} catch (erro) {
  console.error('Erro ao limpar as descobertas:', erro)
  alert('Não foi possível limpar as descobertas. Tente novamente.')
  return
}

// Reinicia as seis posições na memória
fotosDescobertasLivres =
  Array(LIMITE_DESCOBERTAS_LIVRES).fill(null)

observacoesDescobertasLivres =
  Array(LIMITE_DESCOBERTAS_LIVRES).fill('')

fotografiaDescobertaPendente = null
indiceDescobertaParaSubstituir = null

// Apaga somente os registros conhecidos da expedição

localStorage.removeItem('exp_cracha')
localStorage.removeItem('exp_inicio_expedicao')
localStorage.removeItem('exp_id_expedicao')
localStorage.removeItem('exp_respostas')
localStorage.removeItem('exp_medicoes')
localStorage.removeItem('exp_elementos_sorteados')
localStorage.removeItem('exp_foto_partida')

// Reinicia os dados mantidos na memória
crachaSalvo = null
inicioExpedicao = null
idExpedicao = null
elementosSorteados = []
fotoPartida = null

  // Reinicia a navegação e os estados temporários conhecidos

  verCaderno = false
  
  localidadeAtual = null
  telaAtual = 'localidade'

  render()
})

document.querySelector('#nav-home')?.addEventListener('click', () => {
    verCaderno = false
    localidadeAtual = null
    telaAtual = 'inicio'
    render()
  })

document.querySelectorAll<HTMLElement>('.mascote-card').forEach(el => {
  el.addEventListener('click', () => {

    // Guarda o mascote escolhido
    mascoteTempId = el.dataset.id || mascotes[0].id

    // Remove o destaque do mascote anterior
    document.querySelectorAll('.mascote-card').forEach(card => {
      card.classList.remove('selecionado')
    })

    // Destaca somente o mascote escolhido
    el.classList.add('selecionado')

    // Não executar render() aqui!
    // Assim os dados preenchidos permanecem intactos.

  })
})

// REGISTRO DE PARTIDA — ABRIR CÂMERA

document.querySelector('#btn-foto-partida')?.addEventListener('click', () => {
  const inputFoto = document.querySelector<HTMLInputElement>(
    '#input-foto-partida'
  )

  if (!inputFoto) {
    alert('Campo da fotografia não encontrado.')
    return
  }

  inputFoto.click()
})

// INVESTIGAÇÕES — SALVAR FOTOGRAFIA AUTOMATICAMENTE

async function salvarFotografiaElemento(
  id: string,
  foto: string
): Promise<void> {

  // Aguarda a recuperação das fotografias anteriores.
  await recuperacaoFotosElementos

  // Preserva as fotos existentes e acrescenta a nova.
  const fotosAtualizadas = {
    ...fotosElementos,
    [id]: foto
  }

  // Salva no IndexedDB.
  await salvarNoBancoExplore(
    'fotografias',
    'exp_fotos_elementos',
    fotosAtualizadas
  )

  fotosElementos = fotosAtualizadas
  versaoFotosElementos++

  // Marca a investigação como realizada.
  const elemento = elementosSorteados.find(
    item => item.id === id
  )

  if (elemento) {
    elemento.encontrado = true

    localStorage.setItem(
      'exp_elementos_sorteados',
      JSON.stringify(elementosSorteados)
    )
  }

  elementoFotografiaAtual = null

  verCaderno = false
  render()
}

// INVESTIGAÇÕES — RECEBER E SALVAR FOTOGRAFIA

document.querySelector<HTMLInputElement>('#input-foto-elemento')
  ?.addEventListener('change', async (evento) => {

    const input = evento.currentTarget as HTMLInputElement
    const arquivo = input.files?.[0]
    const id = elementoFotografiaAtual

    // Se o estudante cancelar a câmera, não altera nada.
    if (!arquivo || !id) {
      input.value = ''
      return
    }

    const urlTemporaria = URL.createObjectURL(arquivo)

    try {
      // Carrega a fotografia capturada.
      const imagem = new Image()
      imagem.src = urlTemporaria
      await imagem.decode()

      // Reduz a fotografia para até 800 pixels.
      const limite = 800

      const escala = Math.min(
        1,
        limite / Math.max(imagem.width, imagem.height)
      )

      const canvas = document.createElement('canvas')
      canvas.width = Math.round(imagem.width * escala)
      canvas.height = Math.round(imagem.height * escala)

      const contexto = canvas.getContext('2d')

      if (!contexto) {
        throw new Error('Não foi possível processar a fotografia.')
      }

      // Desenha a fotografia reduzida.
      contexto.drawImage(
        imagem,
        0,
        0,
        canvas.width,
        canvas.height
      )

      // Converte para JPEG com qualidade de 65%.
      const fotografiaReduzida = canvas.toDataURL(
        'image/jpeg',
        0.65
      )

      // Libera o campo para futuras fotografias.
      input.value = ''

      // Salva automaticamente no IndexedDB.
      // A fotografia aparece no cartão após o salvamento.
      await salvarFotografiaElemento(
        id,
        fotografiaReduzida
      )

    } catch (erro) {
      console.error(
        'Erro ao salvar fotografia da investigação:',
        erro
      )

      alert(
        'Não foi possível salvar a fotografia da investigação.'
      )

    } finally {
      URL.revokeObjectURL(urlTemporaria)
    }
  })


// REGISTRO DE PARTIDA — RECEBER E SALVAR FOTOGRAFIA

document.querySelector<HTMLInputElement>('#input-foto-partida')
  ?.addEventListener('change', async (evento) => {

    const input = evento.currentTarget as HTMLInputElement
    const arquivo = input.files?.[0]

    if (!arquivo) return

    try {
      // Lê a fotografia selecionada
      const imagemOriginal = new Image()
      const urlTemporaria = URL.createObjectURL(arquivo)

      try {
        imagemOriginal.src = urlTemporaria
        await imagemOriginal.decode()

        // Reduz a imagem mantendo suas proporções
        const limite = 1200

        const escala = Math.min(
          1,
          limite / Math.max(
            imagemOriginal.width,
            imagemOriginal.height
          )
        )

        const largura = Math.round(imagemOriginal.width * escala)
        const altura = Math.round(imagemOriginal.height * escala)

        // Cria uma versão reduzida da fotografia
        const canvas = document.createElement('canvas')

        canvas.width = largura
        canvas.height = altura

        const contexto = canvas.getContext('2d')

        if (!contexto) {
          throw new Error('Não foi possível processar a fotografia.')
        }

        contexto.drawImage(
          imagemOriginal,
          0,
          0,
          largura,
          altura
        )

        // Converte para JPEG com qualidade de 80%
        const fotografiaReduzida = canvas.toDataURL(
          'image/jpeg',
          0.8
        )

       // Salva a fotografia da expedição no IndexedDB
await salvarNoBancoExplore(
  'fotografias',
  'exp_foto_partida',
  fotografiaReduzida
)

// Mantém a fotografia disponível na tela atual
fotoPartida = fotografiaReduzida

        // Permanece no Registro de Partida
        telaAtual = 'registro-partida'

        render()

      } finally {
        URL.revokeObjectURL(urlTemporaria)
      }

    } catch (erro) {
      console.error('Erro no Registro de Partida:', erro)

      alert(
        'Não foi possível registrar a fotografia. Tente novamente.'
      )
    }
  })

// REGISTRO DE PARTIDA — CONTINUAR EXPEDIÇÃO

document.querySelector('#btn-continuar-partida')
?.addEventListener('click', async () => {

    if (!fotoPartida) {
      alert('Registre a fotografia do grupo antes de continuar.')
      return
    }

    navegarPara('trilha')
  })

document.querySelector('#form-cadastro')?.addEventListener('submit', (e) => {
  e.preventDefault()

  // Identificação da expedição
const nome = (
  document.querySelector('#inp-grupo') as HTMLInputElement
).value.trim()

  const grupo = (
    document.querySelector('#inp-grupo') as HTMLInputElement
  ).value.trim()

  const integrantes = (
    document.querySelector('#inp-integrantes') as HTMLTextAreaElement
  ).value.trim()

  const turma = (
    document.querySelector('#inp-turma') as HTMLInputElement
  ).value.trim()

  const escola = (
    document.querySelector('#inp-escola') as HTMLInputElement
  ).value.trim()

// Companheiro escolhido pelo estudante.
// Se não houver escolha, sorteia um mascote.
const m: Mascote =
  mascotes.find(m => m.id === mascoteTempId)
  ?? mascotes[Math.floor(Math.random() * mascotes.length)]

  // Salva os dados para utilização no aplicativo e no PDF
  crachaSalvo = {
    nome,
    grupo,
    integrantes,
    turma,
    escola,
    mascote: m
  }

  localStorage.setItem(
    'exp_cracha',
    JSON.stringify(crachaSalvo)
  )

  // Registra o início real da expedição apenas uma vez
  if (!inicioExpedicao) {
  inicioExpedicao = new Date().toISOString()
  localStorage.setItem('exp_inicio_expedicao', inicioExpedicao)
}

 telaAtual = 'registro-partida'
  render()
})

document.querySelector('#btn-sair')?.addEventListener('click', () => {
  const confirmarSaida = confirm(
    'Deseja sair da expedição? Seus registros serão mantidos e você poderá continuar depois.'
  )

  if (!confirmarSaida) return

  verCaderno = false
  
  localidadeAtual = null
  telaAtual = 'inicio'

  render()
})

// REGISTROS — BAIXAR O PDF DIRETAMENTE
document.querySelector('#btn-caderno')
  ?.addEventListener('click', () => {

    const botaoPDF = document.createElement('button')
    botaoPDF.type = 'button'
    botaoPDF.id = 'btn-gerar-pdf-caderno'
    botaoPDF.hidden = true

    document.body.appendChild(botaoPDF)
    botaoPDF.click()
    botaoPDF.remove()

  })
  
document.querySelector('#btn-voltar-estacoes')?.addEventListener('click', () => {
  verCaderno = false
  render()
})

}

render()


// =====================================================
// EXPLORE ITS — CADERNO DO INVESTIGADOR (PDF A4)
// Duas investigações por página + descobertas livres
// =====================================================
let exportacaoCadernoEmAndamento = false

document.addEventListener('click', async (evento) => {
  const alvo = evento.target
  if (!(alvo instanceof Element) || !alvo.closest('#btn-gerar-pdf-caderno')) return
  if (exportacaoCadernoEmAndamento) return
  exportacaoCadernoEmAndamento = true

  try {
    await Promise.all([recuperacaoFotosElementos, recuperacaoDescobertasLivres])
    // Releitura garante que imagens gravadas após a inicialização estejam disponíveis.
    await recuperarFotosElementos()
    await recuperarDescobertasLivres()

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W = pdf.internal.pageSize.getWidth()
    const H = pdf.internal.pageSize.getHeight()
    const M = 15
    const U = W - 2 * M
    const verde: [number, number, number] = [46, 93, 58]
    const cinza: [number, number, number] = [55, 55, 55]

    const cabecalho = (pagina: number) => {
      pdf.setFillColor(...verde)
      pdf.rect(0, 0, W, 13, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.text('EXPLORE ITS  |  CADERNO DO INVESTIGADOR', M, 8.5)
      pdf.setTextColor(...cinza)
      pdf.setDrawColor(220, 220, 220)
      pdf.line(M, H - 15, W - M, H - 15)
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8)
      pdf.text('Instituto do Trópico Subúmido  |  PUC Goiás', M, H - 10)
      pdf.text(`${pagina} / 4`, W - M, H - 10, { align: 'right' })
    }

    const texto = (conteudo: string, x: number, y: number, largura: number, tamanho = 9, alturaLinha = 4.4) => {
      pdf.setFontSize(tamanho)
      const linhas = pdf.splitTextToSize(conteudo, largura) as string[]
      pdf.text(linhas, x, y)
      return y + linhas.length * alturaLinha
    }

    const imagemProporcional = (fonte: string, x: number, y: number, largura: number, altura: number) => {
      try {
        const props = pdf.getImageProperties(fonte)
        if (!props.width || !props.height) return false
        const escala = Math.min(largura / props.width, altura / props.height)
        const w = props.width * escala
        const h = props.height * escala
        pdf.addImage(fonte, props.fileType, x + (largura - w) / 2, y + (altura - h) / 2, w, h)
        return true
      } catch (erro) {
        console.warn('Fotografia não pôde ser inserida no Caderno:', erro)
        return false
      }
    }

    const categorias: Record<CategoriaInvestigacao, string> = {
      ARV: 'Árvore ou planta',
      ECO: 'Processo ecológico',
      FOR: 'Formação natural',
      FOL: 'Cultura e folclore'
    }

    let linksArvores: Record<string, string> = {}
    try { linksArvores = JSON.parse(localStorage.getItem('exp_links_arvores') || '{}') } catch { /* links opcionais */ }


const desenharInvestigacao = (
  indice: number,
  topo: number,
  altura: number
) => {
  const elemento = elementosSorteados[indice]
  if (!elemento) return

  const dados = catalogoElementos.find(
    item => item.id === elemento.id
  )
  const pedagogico = dadosCaderno[elemento.id]
  const foto = fotosElementos[elemento.id]

  const x = M + 4
  const largura = U - 8
  const limite = topo + altura - 5

  pdf.setDrawColor(205, 218, 198)
  pdf.setFillColor(250, 248, 242)
  pdf.roundedRect(M, topo, U, altura, 2, 2, 'FD')

  // Identificar a orientação original da fotografia
  let retrato = false

  if (foto) {
    try {
      const propriedades = pdf.getImageProperties(foto)
      retrato = propriedades.height > propriedades.width
    } catch (erro) {
      console.warn('Orientação da fotografia indisponível:', erro)
    }
  }

  // Título da investigação
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...verde)

  let y = topo + 8

  y = texto(
    `${indice + 1}. ${categorias[elemento.categoria]}`,
    x, y, largura, 10, 5
  ) + 1

  // Organizar a imagem e os textos
  const inicioConteudo = y + 2
  const espaco = 4

  const larguraImagem = retrato
    ? largura * 0.48
    : largura * 0.52

  const larguraTexto = largura - larguraImagem - espaco

  const xImagem = x
  const xTexto = x + larguraImagem + espaco

  // Fotografia à esquerda, sem cortes
  if (foto) {
    imagemProporcional(
      foto,
      xImagem,
      inicioConteudo,
      larguraImagem,
      limite - inicioConteudo
    )
  }

  // Informações pedagógicas à direita
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...cinza)

  let yTexto = inicioConteudo + 2

  yTexto = texto(
    dados?.nome ?? 'Elemento não identificado',
    xTexto, yTexto, larguraTexto, 9.5, 4.6
  ) + 2

  if (pedagogico?.cientifico) {
    pdf.setFont('helvetica', 'italic')
    yTexto = texto(
      pedagogico.cientifico,
      xTexto, yTexto, larguraTexto, 8, 4
    ) + 2
  }

  pdf.setFont('helvetica', 'normal')

  if (pedagogico) {
    pdf.setTextColor(...verde)

    yTexto = texto(
      'Você sabia?',
      xTexto, yTexto, larguraTexto, 8.5, 4.2
    ) + 1

    pdf.setTextColor(...cinza)

    yTexto = texto(
      pedagogico.curiosidade,
      xTexto, yTexto, larguraTexto, 8, 4
    ) + 4

    pdf.setTextColor(...verde)

    yTexto = texto(
      'Continue investigando!',
      xTexto, yTexto, larguraTexto, 8.5, 4.2
    ) + 1

    pdf.setTextColor(...cinza)

    yTexto = texto(
      pedagogico.desafio,
      xTexto, yTexto, larguraTexto, 8, 4
    ) + 3
  }

  // Link complementar para árvores
  if (
    elemento.categoria === 'ARV' &&
    linksArvores[elemento.id]
  ) {
    try {
      const url = new URL(linksArvores[elemento.id])

      if (
        ['https:', 'http:'].includes(url.protocol) &&
        yTexto + 5 < limite
      ) {
        pdf.setTextColor(30, 95, 160)
        pdf.setFontSize(8)

        pdf.textWithLink(
          'Conheça mais sobre esta árvore',
          xTexto,
          yTexto,
          { url: url.href }
        )
      }
    } catch {
      // Link inválido: ignorar
    }
  }
}


// ==========================================
// PÁGINA 1 — CAPA DO CADERNO DO INVESTIGADOR
// ==========================================

// A primeira página do jsPDF será a capa.
// A diagramação será acrescentada aqui.

// Carrega uma imagem do projeto para inserir no PDF
const carregarImagemCapa = async (caminho: string): Promise<string> => {
  const resposta = await fetch(caminho)

  if (!resposta.ok) {
    throw new Error(`Não foi possível carregar a imagem: ${caminho}`)
  }

  const arquivo = await resposta.blob()

  return await new Promise<string>((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => resolve(leitor.result as string)
    leitor.onerror = () => reject(new Error('Falha na leitura da imagem'))
    leitor.readAsDataURL(arquivo)
  })
}

// ==========================================
// CAPA — ARTE DEFINITIVA DO INKSCAPE
// ==========================================

const caminhoCapa = `${import.meta.env.BASE_URL}capa-caderno-app.svg`

const respostaCapa = await fetch(caminhoCapa)

if (!respostaCapa.ok) {
  throw new Error('Não foi possível carregar a capa do Caderno do Investigador')
}

const svgCapa = await respostaCapa.text()

const blobCapa = new Blob([svgCapa], {
  type: 'image/svg+xml;charset=utf-8'
})

const urlCapa = URL.createObjectURL(blobCapa)

try {
  const imagemCapa = new Image()

  await new Promise<void>((resolve, reject) => {
    imagemCapa.onload = () => resolve()
    imagemCapa.onerror = () => reject(new Error('Falha ao carregar a imagem da capa'))
    imagemCapa.src = urlCapa
  })

  const canvasCapa = document.createElement('canvas')
  canvasCapa.width = 1240
  canvasCapa.height = 1754

  const contextoCapa = canvasCapa.getContext('2d')

  if (!contextoCapa) {
    throw new Error('Não foi possível preparar a capa do PDF')
  }

  contextoCapa.fillStyle = '#FFFFFF'
  contextoCapa.fillRect(0, 0, canvasCapa.width, canvasCapa.height)

  contextoCapa.drawImage(
    imagemCapa,
    0,
    0,
    canvasCapa.width,
    canvasCapa.height
  )

  const capaJpeg = canvasCapa.toDataURL('image/jpeg', 0.85)

  pdf.addImage(capaJpeg, 'JPEG', 0, 0, 210, 297)

// ==========================================
// CAPA — FOTOGRAFIA DE PARTIDA
// ==========================================

// Recupera a fotografia mais recente do IndexedDB
const fotografiaPartidaPDF =
  await lerDoBancoExplore<string>(
    'fotografias',
    'exp_foto_partida'
  ) || fotoPartida

if (fotografiaPartidaPDF) {

  // Área da fotografia abaixo do título REGISTRO DE PARTIDA.
  // Aceita fotos horizontais, verticais e quadradas.
  // Mantém a imagem inteira, centralizada e sem deformação.

  imagemProporcional(
    fotografiaPartidaPDF,
    143, 112, 50, 30
  )

}

// ==========================================
// CAPA — IDENTIFICAÇÃO DA EXPEDIÇÃO
// ==========================================

// Dados registrados no início da expedição
const grupoCapa = crachaSalvo?.grupo?.trim() || ''
const integrantesCapa = crachaSalvo?.integrantes?.trim() || ''
const turmaCapa = crachaSalvo?.turma?.trim() || ''
const escolaCapa = crachaSalvo?.escola?.trim() || ''

const dataInicioCapa = inicioExpedicao
  ? new Date(inicioExpedicao)
  : null

const dataInicioValida = dataInicioCapa &&
  !Number.isNaN(dataInicioCapa.getTime())

const dataCapa = dataInicioValida
  ? dataInicioCapa!.toLocaleDateString('pt-BR')
  : ''

const horarioCapa = dataInicioValida
  ? dataInicioCapa!.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  : ''

// ==========================================
// CAPA — POSICIONAMENTO PELOS MARCADORES SVG
// ==========================================

const documentoSVG = new DOMParser().parseFromString(
  svgCapa,
  'image/svg+xml'
)

// Recupera a posição de um marcador circular do Inkscape.
// O SVG utiliza coordenadas A4: 210 x 297 mm.
function posicaoMarcador(id: string): { x: number; y: number } {
  const elemento = documentoSVG.getElementById(id)

  if (!elemento) {
    throw new Error(`Marcador não encontrado no SVG: ${id}`)
  }

  const x = Number(elemento.getAttribute('cx'))
  const y = Number(elemento.getAttribute('cy'))

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`Coordenadas inválidas no marcador: ${id}`)
  }

  return { x, y }
}

// Escreve o texto ao lado do marcador,
// sem encobrir o pequeno círculo de referência.
function escreverNoMarcador(
  id: string,
  conteudo: string,
  tamanho = 9,
  maxLinhas = 1
) {
  if (!conteudo) return

  const posicao = posicaoMarcador(id)
  const x = posicao.x + 3
  const y = posicao.y + 1
  const largura = Math.max(10, 202 - x)

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(tamanho)
  pdf.setTextColor(46, 93, 58)

  const linhas = pdf.splitTextToSize(conteudo, largura)

  pdf.text(
    linhas.slice(0, maxLinhas),
    x,
    y
  )
}

// Grupo
escreverNoMarcador(
  'marcador-grupo',
  grupoCapa,
  10
)

// Integrantes
escreverNoMarcador(
  'marcador-integrantes',
  integrantesCapa,
  9,
  3
)

// Série / Turma
escreverNoMarcador(
  'marcador-serie-turma',
  turmaCapa,
  9
)

// Escola — identificador atual do SVG
escreverNoMarcador(
  'companheiro-expedicao-6-7-3-3',
  escolaCapa,
  9
)

// Data
escreverNoMarcador(
  'marcador-data-expedicao',
  dataCapa,
  9
)

// Horário
escreverNoMarcador(
  'marcador-horario-inicio',
  horarioCapa,
  9
)

} finally {
  URL.revokeObjectURL(urlCapa)
}

// ==========================================
// PÁGINA 2 — INVESTIGAÇÕES 1 E 2
// ==========================================

pdf.addPage()
cabecalho(2)
    pdf.setTextColor(...verde)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(15)
    pdf.text('Trilha da Semente Peregrina', M, 23)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const data = inicioExpedicao ? new Date(inicioExpedicao) : null
    const dataValida = data && !Number.isNaN(data.getTime())
    const identificacao = dataValida
      ? `Expedição: ${data!.toLocaleDateString('pt-BR')}  |  Início: ${data!.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      : 'Registro de investigação do Cerrado'
    pdf.setTextColor(...cinza)
    pdf.text(identificacao, M, 29)
    desenharInvestigacao(0, 34, 117)
    desenharInvestigacao(1, 155, 117)

// PÁGINA 3 — INVESTIGAÇÕES 3–4
    pdf.addPage()
    cabecalho(3)
    desenharInvestigacao(2, 20, 124)
    desenharInvestigacao(3, 148, 124)


// ==========================================
// PÁGINA 4 — SEIS DESCOBERTAS LIVRES
// ==========================================

pdf.addPage()
cabecalho(4)

pdf.setFont('helvetica', 'bold')
pdf.setTextColor(...verde)
pdf.setFontSize(16)
pdf.text('Minhas descobertas', M, 25)

pdf.setFont('helvetica', 'normal')
pdf.setTextColor(...cinza)
texto(
  'Registros fotográficos realizados durante a exploração da trilha.',
  M, 33, U, 9
)

// Mantém a estrutura original: duas colunas e três linhas
const colunas = 2
const intervalo = 7
const larguraFoto = (U - intervalo) / colunas
const alturaFoto = 61

fotosDescobertasLivres
  .slice(0, LIMITE_DESCOBERTAS_LIVRES)
  .forEach((foto, i) => {

    const coluna = i % colunas
    const linha = Math.floor(i / colunas)

    const x = M + coluna * (larguraFoto + intervalo)
    const y = 41 + linha * 69

    // Cartão com dimensões originais
    pdf.setDrawColor(208, 218, 201)
    pdf.setFillColor(250, 248, 242)
    pdf.roundedRect(
      x, y, larguraFoto, alturaFoto, 2, 2, 'FD'
    )



      // Nome e observação registrados pelo estudante
      const nome =
        nomesDescobertasLivres[i]?.trim() ?? ''

      const observacao =
        observacoesDescobertasLivres[i]?.trim() ?? ''

      // Área fotográfica fixa para todas as descobertas.
      // A imagem mantém sua proporção original.
      const alturaImagem = 40

      if (foto) {
        imagemProporcional(
          foto,
          x + 2,
          y + 2,
          larguraFoto - 4,
          alturaImagem
        )
      }


      // Nome opcional: sempre na mesma posição
      if (nome) {
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(7.5)

        const linhasNome = pdf.splitTextToSize(
          nome,
          larguraFoto - 6
        ) as string[]

        pdf.text(
          linhasNome[0] ?? '',
          x + 3,
          y + 51
        )
      }

      // Descrição opcional: até duas linhas
      if (observacao) {
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(7)

        const linhas = pdf.splitTextToSize(
          observacao,
          larguraFoto - 6
        ) as string[]

        const linhasVisiveis = linhas.slice(0, 2)

        if (linhas.length > 2) {
          const ultima = linhasVisiveis[1] ?? ''

          linhasVisiveis[1] =
            ultima.slice(
              0,
              Math.max(0, ultima.length - 3)
            ) + '...'
        }

        pdf.text(
          linhasVisiveis,
          x + 3,
          y + (nome ? 55 : 51),
          { lineHeightFactor: 1.15 }
        )
      }
    })

// Seção final — mantém a posição original
pdf.setFont('helvetica', 'bold')
pdf.setTextColor(...verde)
pdf.setFontSize(10)
pdf.text('Para continuar investigando', M, 257)

pdf.setFont('helvetica', 'normal')
pdf.setTextColor(...cinza)

texto(
  'Qual descoberta mais despertou sua curiosidade? O que você gostaria de investigar sobre ela?',
  M, 263, U, 9, 4.5
)

// Salva o Caderno do Investigador
pdf.save('caderno-do-investigador.pdf')

} catch (erro) {
  console.error(
    'Falha ao gerar o Caderno do Investigador:',
    erro
  )

  window.alert(
    'Não foi possível gerar o PDF. Verifique o console para detalhes.'
  )

} finally {
  exportacaoCadernoEmAndamento = false
}

})
