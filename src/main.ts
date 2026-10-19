import { catalogoElementos } from './catalogo-elementos'

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

// Fotografias das investigações
let fotosElementos: Record<string, string> = JSON.parse(
  localStorage.getItem('exp_fotos_elementos') || '{}'
)

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

let mascoteTempId = mascotes[0].id

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
  | 'meu-percurso'

let telaAtual: TelaApp = 'inicio'
let localidadeAtual: string | null = null

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

            const idsMarcadoresGPS = [
        'marcador_inicio',
        'marcador_saci_perere',
        'marcador_paisagemA',
        'marcador_paisagemB',
        'marcador_caipora',
        'marcador_paisagemC',
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
  gpsDiagnostico.innerHTML = `
    📍 <strong>GPS — teste de campo</strong><br>
    Ponto mais próximo: <strong>${pontoMaisProximo}</strong><br>
    Distância: <strong>${Math.round(menorDistancia)} m</strong><br>
    Precisão: <strong>± ${Math.round(precisao)} m</strong>
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

// MAPA GERAL DO ITS
async function carregarMapaITS() {
  console.log('CARREGAR MAPA ITS EXECUTADO')

  const container = document.querySelector<HTMLDivElement>('#mapa-its-container')

  if (!container) return

  try {
    const resposta = await fetch('/explore-its/mapa-explore-its-mestre.svg')

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar o mapa geral do ITS.')
    }

    const svgTexto = await resposta.text()

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
let fotografiaPendente: string | null = null

function abrirCameraElemento(id: string) {

  elementoFotografiaAtual = id

  const input = document.querySelector<HTMLInputElement>(
    '#input-foto-elemento'
  )

  input?.click()
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

        <img
          src="${pictogramas[elemento.categoria]}"
          alt=""
          class="elemento-expedicao-icone"
        >

        <div class="elemento-expedicao-texto">

          <small>${categorias[elemento.categoria]}</small>

          <strong>${dados?.nome ?? 'Elemento não identificado'}</strong>

          <span>
            ${elemento.encontrado ? '✓ Encontrado' : 'A procurar'}
          </span>

        </div>

        <button
          type="button"
          class="btn-registrar-elemento"
          data-elemento-id="${elemento.id}"
          aria-label="Registrar ${dados?.nome ?? 'descoberta'}"
          ${elemento.encontrado ? 'disabled' : ''}
        >
          <span>
            ${elemento.encontrado
              ? '✓'
              : elemento.categoria === 'ARV' ? '▦' : '📷'}
          </span>

          <small>
            ${elemento.encontrado ? 'Feito' : 'Registrar'}
          </small>
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

// ÁRVORES — ABRIR PAINEL DE DUAS ATIVIDADES
if (elemento.categoria === 'ARV') {

  elementoFotografiaAtual = elemento.id

  const painel = document.querySelector<HTMLElement>(
    '#painel-registro-arvore'
  )

  if (!painel) {
    alert('Painel de registro da árvore ainda não disponível.')
    return
  }

painel.hidden = false
painel.style.display = 'block'
  return
}

// DEMAIS ELEMENTOS — REGISTRO FOTOGRÁFICO
abrirCameraElemento(elemento.id)

    })

  })

}

// ==========================================
// CONTROLES DO PAINEL DE REGISTRO DA ÁRVORE
// ==========================================

document.addEventListener('click', (evento) => {

  const alvo = evento.target

  if (!(alvo instanceof Element)) return

  // FECHAR
  if (alvo.closest('#btn-fechar-registro-arvore')) {

    const painel = document.querySelector<HTMLElement>(
      '#painel-registro-arvore'
    )

    if (painel) {
      painel.hidden = true
      painel.style.display = 'none'
    }

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

obterLocalizacaoAtual(svg)


} // fecha if (svg)

} catch (erro) {
  console.error('Erro ao carregar o mapa:', erro)

  container.innerHTML =
    '<p class="mapa-erro">Não foi possível carregar o mapa.</p>'
  }
}

function render() {


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
          COMEÇAR A EXPLORAR <span class="inicio-seta">→</span>
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
              Continuar a expedição →
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
            <label>Nome do Estudante / Grupo</label>
            <input
              type="text"
              id="inp-nome"
              required
              placeholder="Ex: Grupo Alpha ou Maria Silva"
            />
          </div>

          <div class="form-group">
            <label>Turma / Escola</label>
            <input
              type="text"
              id="inp-turma"
              required
              placeholder="Ex: 6º Ano B"
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
            Começar a investigação →
          </button>

        </form>

      </section>

      <section class="identificacao-mensagem">
        <span>👀</span>
        <p>
          <strong>Observe.</strong>
          <strong>Investigue.</strong>
          <strong>Descubra.</strong>
        </p>
      </section>

    </div>
  `
} else if (telaAtual === 'registro-partida') {

  html += `
    <div class="tela-identificacao">

      <section class="card-container identificacao-card">

        <div class="identificacao-titulo">
          <h3>📸 Registro de Partida</h3>
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

    </div>
  `

  } else if (telaAtual === 'trilha') {

    html += `

      <div class="home-exploracao">

        <section class="mapa-exploracao">
<div class="mapa-cabecalho">
  <h3>Mapa da expedição</h3>
  <p>Siga o percurso e encontre os pontos de investigação.</p>
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
            Encontre estes quatro elementos durante a caminhada.
            Procure no mapa os símbolos correspondentes.
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
  aria-label="Registrar ${dados?.nome ?? 'descoberta'}"
  ${elemento.encontrado ? 'disabled' : ''}
>
  <span>
    ${elemento.encontrado
      ? '✓'
      : elemento.categoria === 'ARV' ? '▦' : '📷'}
  </span>
  <small>
    ${elemento.encontrado ? 'Feito' : 'Registrar'}
  </small>
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

          <!-- PRÉ-VISUALIZAÇÃO DA FOTOGRAFIA -->
<div id="painel-confirmacao-foto" hidden>

  <h3>📷 Confira sua fotografia</h3>

  <img
    id="imagem-confirmacao-foto"
    alt="Fotografia da investigação"
    style="width:100%; max-height:350px; object-fit:contain;"
  >

  <button type="button" id="btn-repetir-foto">
    ↻ Tirar outra foto
  </button>

  <button type="button" id="btn-confirmar-foto">
    ✓ Usar esta foto
  </button>

</div>

          <!-- PAINEL COMPACTO DE REGISTRO DA ÁRVORE -->
<div id="painel-registro-arvore" hidden>

  <div class="registro-arvore-conteudo">

    <strong>🌳 Registro da árvore</strong>

    <p>Complete as duas atividades:</p>

    <button type="button" id="btn-qr-arvore">
      ▦ 1. Ler QR Code
    </button>

    <button type="button" id="btn-foto-arvore">
      📷 2. Fotografar o grupo
    </button>

    <button type="button" id="btn-fechar-registro-arvore">
      Fechar
    </button>

  </div>

</div>

        </section>

        <section class="orientacao-exploracao">
          <div class="orientacao-icone">🧭</div>

          <div>
            <strong>Sua expedição</strong>

            <p>
              Durante o percurso, você encontrará estações de investigação
              e pontos para observar como a paisagem muda ao longo da trilha.
            </p>
          </div>
        </section>


        <section class="frase-final-exploracao">
          <span>🌱</span>
          <p>
            <strong>Observe com atenção.</strong><br>
            Cada detalhe pode ser uma descoberta.
          </p>
        </section>

       </div>
    `

} else if (telaAtual === 'meu-percurso') {

  const trilhaRegistrada =
  crachaSalvo !== null ||
  inicioExpedicao !== null ||
  fotoPartida !== null ||
  elementosSorteados.length > 0

  html += `
    <main class="tela-meu-percurso">

      <header class="percurso-cabecalho">
        <span>🌿 MINHAS EXPERIÊNCIAS</span>
        <h1>Meu percurso</h1>
        <p>
          Reviva suas experiências e consulte os registros
          das atividades realizadas no ITS.
        </p>
      </header>

      <section class="percurso-localidades">
        <h2>Localidades da minha visita</h2>

        ${trilhaRegistrada ? `
          <article class="percurso-localidade">
            <div class="percurso-localidade-icone">🌳</div>
            <div class="percurso-localidade-texto">
              <h3>Trilha da Semente Peregrina</h3>
              <p>Minha expedição e descobertas</p>
            </div>
          </article>

          <section class="percurso-atividades">
            <h2>Registros da trilha</h2>

            <button
              type="button"
              class="btn-primary"
              id="btn-caderno"
            >
              📖 Abrir Caderno de Campo
            </button>



<button
  type="button"
  class="btn-primary"
  id="btn-conquistas"
  style="margin-top: 12px;"
>
  🏅 Ver Conquistas
</button>


            <p>
              Consulte seu Caderno de Campo
              e acompanhe as conquistas da expedição.
            </p>
          </section>
        ` : `
          <div class="percurso-vazio">
            <p>
              Você ainda não iniciou uma experiência
              registrada no ITS.
            </p>
            <p>
              Explore as localidades e participe
              das atividades para construir seu percurso.
            </p>
          </div>
        `}

      </section>

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
  telaAtual === 'trilha' ||
  telaAtual === 'meu-percurso'
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
  <span>Meu percurso</span>
</button>


    </nav>
  `
}

app.innerHTML = html

  if (telaAtual === 'mapa-its') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
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
document.querySelector('#btn-nova-expedicao')?.addEventListener('click', () => {
  
  const confirmar = confirm(
    'Deseja iniciar uma nova expedição? Os registros da expedição anterior serão apagados.'
  )

  if (!confirmar) return

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

  document.querySelectorAll('.mascote-card').forEach(el => {
    el.addEventListener('click', () => {
      mascoteTempId = el.getAttribute('data-id') || mascotes[0].id
      render()
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

// INVESTIGAÇÕES — RECEBER E SALVAR FOTOGRAFIA

document.querySelector<HTMLInputElement>('#input-foto-elemento')
  ?.addEventListener('change', async (evento) => {

    const input = evento.currentTarget as HTMLInputElement
    const arquivo = input.files?.[0]
    const id = elementoFotografiaAtual

    if (!arquivo || !id) return

    const urlTemporaria = URL.createObjectURL(arquivo)

    try {
      const imagem = new Image()
      imagem.src = urlTemporaria
      await imagem.decode()

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

      contexto.drawImage(
        imagem, 0, 0, canvas.width, canvas.height
      )

const fotografiaReduzida = canvas.toDataURL('image/jpeg', 0.65)

fotografiaPendente = fotografiaReduzida

// Mostra a fotografia para conferência
const painelConfirmacao = document.querySelector<HTMLElement>(
  '#painel-confirmacao-foto'
)

const imagemConfirmacao = document.querySelector<HTMLImageElement>(
  '#imagem-confirmacao-foto'
)

if (painelConfirmacao && imagemConfirmacao) {

  const cartao = document.querySelector<HTMLElement>(
    `[data-cartao-elemento="${id}"]`
  )

console.log('Elemento fotografado:', id)
console.log('Cartão encontrado:', cartao)

if (cartao) {
  cartao.appendChild(painelConfirmacao)

  const botaoRegistrar = cartao.querySelector<HTMLElement>(
    '.btn-registrar-elemento'
  )

  if (botaoRegistrar) {
    botaoRegistrar.style.display = 'none'
  }
}

  imagemConfirmacao.src = fotografiaPendente
  painelConfirmacao.hidden = false
  painelConfirmacao.style.display = 'block'
}

// A fotografia será salva somente após a confirmação do estudante.

// Mantém o elemento identificado até a confirmação
input.value = ''

// Não reconstruir a tela enquanto a fotografia é conferida

    } catch (erro) {
      console.error('Erro ao salvar fotografia da investigação:', erro)
      alert('Não foi possível salvar a fotografia da investigação.')
    } finally {
      URL.revokeObjectURL(urlTemporaria)
    }
  })

// INVESTIGAÇÕES — REPETIR FOTOGRAFIA

document.querySelector('#btn-repetir-foto')
  ?.addEventListener('click', () => {

    const id = elementoFotografiaAtual

    if (!id) return

    fotografiaPendente = null

    abrirCameraElemento(id)
  })

// INVESTIGAÇÕES — CONFIRMAR FOTOGRAFIA

document.querySelector('#btn-confirmar-foto')
  ?.addEventListener('click', () => {

    const id = elementoFotografiaAtual
    const foto = fotografiaPendente

    if (!id || !foto) {
      alert('Nenhuma fotografia disponível para confirmação.')
      return
    }

    try {
      const fotosAtualizadas = {
        ...fotosElementos,
        [id]: foto
      }

      localStorage.setItem(
        'exp_fotos_elementos',
        JSON.stringify(fotosAtualizadas)
      )

      fotosElementos = fotosAtualizadas

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

      fotografiaPendente = null
      elementoFotografiaAtual = null

      verCaderno = false
      render()

    } catch (erro) {
      console.error('Erro ao confirmar fotografia:', erro)
      alert('Não foi possível salvar a fotografia.')
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

        // Salva a fotografia da expedição
        localStorage.setItem(
          'exp_foto_partida',
          fotografiaReduzida
        )

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
  ?.addEventListener('click', () => {

    if (!fotoPartida) {
      alert('Registre a fotografia do grupo antes de continuar.')
      return
    }

    navegarPara('trilha')
  })

document.querySelector('#form-cadastro')?.addEventListener('submit', (e) => {
  e.preventDefault()

  const nome = (document.querySelector('#inp-nome') as HTMLInputElement).value
  const turma = (document.querySelector('#inp-turma') as HTMLInputElement).value
  const m = mascotes.find(x => x.id === mascoteTempId) || mascotes[0]

  crachaSalvo = { nome, turma, mascote: m }
  localStorage.setItem('exp_cracha', JSON.stringify(crachaSalvo))

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

document.querySelector('#btn-caderno')?.addEventListener('click', () => {
  // Registra o mapa da trilha como tela de origem
  history.replaceState(
    {
      tela: 'trilha',
      caderno: false,
      localidade: localidadeAtual
    },
    '',
    window.location.href
  )

  // Abre o Caderno e registra sua entrada no histórico
  telaAtual = 'trilha'
  verCaderno = true

  history.pushState(
    obterEstadoNavegacao(),
    '',
    window.location.href
  )

  window.scrollTo(0, 0)
  render()
})
  
document.querySelector('#btn-voltar-estacoes')?.addEventListener('click', () => {
  verCaderno = false
  render()
})

}

render()