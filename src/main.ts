import './style.css'

interface Mascote {
  id: string
  nome: string
  emoji: string
}

interface Missao {
  id: string
  titulo: string
  descricao: string
  tipo: 'foto' | 'temperatura' | 'audio' | 'texto'
}

interface Estacao {
  id: string
  nome: string
  descricao: string
  icone: string
  missoes: Missao[]
}

interface RespostaTemperatura {
  estacaoId: string
  estacaoNome: string
  valorTemperatura: number
  dataHora: string
}

interface RespostaGeral {
  estacaoId: string
  missaoId: string
  titulo: string
  conteudo: string
  midiaUrl?: string
  dataHora: string
}

interface Cracha {
  nome: string
  turma: string
  mascote: Mascote
}

const mascotes: Mascote[] = [
  { id: 'guara', nome: 'Guará', emoji: '🦊' },
  { id: 'bandeira', nome: 'Bandeira', emoji: '🐜' },
  { id: 'arara', nome: 'Azulzinha', emoji: '🦜' },
  { id: 'tatu', nome: 'Bolinha', emoji: '🦔' }
]

const estacoes: Estacao[] = [
  {
    id: 'fazenda-barauna',
    nome: 'Fazenda Baraúna (Início da Trilha)',
    descricao: 'Ponto de recepção e partida. Registre a 1ª medição de temperatura do dia.',
    icone: '🏡',
    missoes: [
      { id: 'm-bar-temp', titulo: '1ª Medição de Temperatura', descricao: 'Use o termômetro digital no local e digite a temperatura encontrada em °C.', tipo: 'temperatura' },
      { id: 'm-bar-foto', titulo: 'Registro de Partida', descricao: 'Tire uma foto da equipe ou do portal de início na Fazenda Baraúna.', tipo: 'foto' }
    ]
  },
  {
    id: 'saci-perere',
    nome: 'Estação Saci-Pererê',
    descricao: 'Investigue os sons e ruídos da mata.',
    icone: '🌪️',
    missoes: [
      { id: 'm-saci-1', titulo: 'Sons da Mata', descricao: 'Grave um áudio dos sons ao seu redor.', tipo: 'audio' }
    ]
  },
  {
    id: 'recanto-jatoba',
    nome: 'Recanto do Jatobá',
    descricao: 'Observação da flora e 2ª medição de microclima.',
    icone: '🌰',
    missoes: [
      { id: 'm-jat-temp', titulo: '2ª Medição de Temperatura', descricao: 'Use o termômetro digital sob a sombra das árvores e digite a temperatura em °C.', tipo: 'temperatura' },
      { id: 'm-jat-obs', titulo: 'Observação da Vegetação', descricao: 'Descreva as características das sementes e árvores encontradas.', tipo: 'texto' }
    ]
  },
  {
    id: 'caipora',
    nome: 'Estação Caipora',
    descricao: 'Rastros e vestígios da fauna local.',
    icone: '🐾',
    missoes: [
      { id: 'm-cai-1', titulo: 'Pegadas e Registros', descricao: 'Fotografe marcas ou rastros no solo.', tipo: 'foto' }
    ]
  },
  {
    id: 'recanto-nego-dagua',
    nome: 'Recanto do Nego d\'Água',
    descricao: 'Área próxima ao corpo d\'água e 3ª medição de microclima.',
    icone: '💧',
    missoes: [
      { id: 'm-neg-temp', titulo: '3ª Medição de Temperatura', descricao: 'Use o termômetro digital próximo ao córrego e digite a temperatura em °C.', tipo: 'temperatura' }
    ]
  }
]

// Estado do App
let crachaSalvo: Cracha | null = JSON.parse(localStorage.getItem('exp_cracha') || 'null')
let respostasGerais: RespostaGeral[] = JSON.parse(localStorage.getItem('exp_respostas') || '[]')
let medicoesTemperatura: RespostaTemperatura[] = JSON.parse(localStorage.getItem('exp_medicoes_temp') || '[]')

let mascoteTempId = mascotes[0].id
let estacaoAtual: Estacao | null = null
let missaoAtual: Missao | null = null
let fotoTemp: string | null = null
let audioTemp: string | null = null
let verCaderno = false
let verComparativoTemp = false
let modalMensagem: string | null = null

const app = document.querySelector<HTMLDivElement>('#app')!

function render() {
  let html = `
    <header class="app-header">
      <div class="header-content">
        <span class="logo" id="nav-home">🍃 Explore ITS</span>
        ${crachaSalvo ? `
          <div class="user-badge">
            <small><strong>${crachaSalvo.mascote.emoji}${crachaSalvo.nome}</strong></small>
            <button id="btn-comparar-temp" class="btn-secondary">📊 Temperaturas</button>
            <button id="btn-caderno" class="btn-secondary">📜 Caderno</button>
            <button id="btn-sair" class="btn-danger">Sair</button>
          </div>
        ` : ''}
      </div>
    </header>
  `

  if (!crachaSalvo) {
    html += `
      <div class="card-container">
        <h2>🎒 Criar Crachá de Campo</h2>
        <form id="form-cadastro" style="margin-top:12px;">
          <div class="form-group">
            <label>Nome do Aluno:</label>
            <input type="text" id="inp-nome" required placeholder="Ex: Maria Silva" />
          </div>
          <div class="form-group">
            <label>Turma / Código:</label>
            <input type="text" id="inp-turma" required placeholder="Ex: 6º Ano A" />
          </div>
          <div class="form-group">
            <label>Mascote de Expedição:</label>
            <div class="mascotes-grid">
              ${mascotes.map(m => `
                <div class="mascote-card ${m.id === mascoteTempId ? 'selecionado' : ''}" data-id="${m.id}">
                  <span class="mascote-emoji">${m.emoji}</span>
                  <strong>${m.nome}</strong>
                </div>
              `).join('')}
            </div>
          </div>
          <button type="submit" class="btn-primary" style="margin-top:10px;">Iniciar Expedição</button>
        </form>
      </div>
    `
  } else if (verComparativoTemp) {
    html += `
      <div class="card-container">
        <button id="btn-fechar-comparativo" class="btn-back">⬅ Voltar às Estações</button>
        <h2>📊 Comparativo de Temperatura</h2>
        <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:15px;">
          Comparativo dos 3 pontos de medição ao longo da trilha:
        </p>

        <div style="display:flex; flex-direction:column; gap:10px;">
          ${[
            { id: 'fazenda-barauna', nome: '1. Fazenda Baraúna (Início)' },
            { id: 'recanto-jatoba', nome: '2. Recanto do Jatobá' },
            { id: 'recanto-nego-dagua', nome: '3. Recanto do Nego d\'Água' }
          ].map(ponto => {
            const med = medicoesTemperatura.find(m => m.estacaoId === ponto.id)
            return `
              <div class="resposta-card" style="border-left: 4px solid var(--primary);">
                <strong>${ponto.nome}</strong>${med ? `
                  <p style="font-size:1.2rem; font-weight:bold; color:var(--primary-dark); margin-top:4px;">
                    🌡️ ${med.valorTemperatura} °C
                  </p>
                  <small style="color:var(--text-muted);">${med.dataHora}</small>
                ` : `
                  <p style="font-size:0.9rem; color:#d97706; margin-top:4px;">⏳ Medição ainda não realizada</p>
                `}
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
  } else if (verCaderno) {
    html += `
      <div class="card-container">
        <button id="btn-fechar-caderno" class="btn-back">⬅ Voltar às Estações</button>
        <h2>📜 Caderno de Campo</h2>
        <p><small>Estudante: ${crachaSalvo.nome} | Turma: ${crachaSalvo.turma}</small></p>
        <hr style="margin:10px 0; border:0; border-top:1px solid var(--border);" />

        ${respostasGerais.length === 0 ? '<p>Nenhum registro gravado ainda.</p>' : ''}
        ${respostasGerais.map(r => `
          <div class="resposta-card">
            <h4>${r.titulo}</h4>
            <p style="font-size:0.9rem; margin-top:4px;">${r.conteudo}</p>${r.midiaUrl ? `<div class="preview-box"><img src="${r.midiaUrl}" class="img-preview"/></div>` : ''}
            <small style="color:var(--text-muted); font-size:0.75rem;">${r.dataHora}</small>
          </div>
        `).join('')}
      </div>
    `
  } else if (missaoAtual) {
    html += `
      <div class="card-container">
        <button id="btn-voltar-estacao" class="btn-back">⬅ Voltar</button>
        <h3>${missaoAtual.titulo}</h3>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:12px;">${missaoAtual.descricao}</p>

        <form id="form-missao">
          ${missaoAtual.tipo === 'temperatura' ? `
            <div class="form-group">
              <label>Digite a temperatura aferida no termômetro digital (°C):</label>
              <input type="number" step="0.1" id="inp-temp-valor" required placeholder="Ex: 27.5" style="font-size:1.2rem; padding:10px;" />
            </div>
          ` : ''}

          ${missaoAtual.tipo === 'foto' ? `
            <input type="file" id="input-foto" accept="image/*" capture="environment" style="display:none" />
            <button type="button" id="btn-foto" class="btn-secondary">📷 Capturar Foto</button>
            <div class="preview-box">
              ${fotoTemp ? `<img src="${fotoTemp}" class="img-preview"/>` : '<small>Nenhuma foto tirada</small>'}
            </div>
          ` : ''}

          ${missaoAtual.tipo === 'texto' ? `
            <div class="form-group">
              <textarea id="inp-texto" rows="3" required placeholder="Digite sua resposta ou observação..."></textarea>
            </div>
          ` : ''}

          ${missaoAtual.tipo === 'audio' ? `
            <button type="button" id="btn-audio" class="btn-secondary">🎙️ Registrar Gravador de Áudio</button>
            <div class="preview-box">
              ${audioTemp ? '<p>✅ Áudio registrado!</p>' : '<small>Gravação pendente</small>'}
            </div>
          ` : ''}

          <button type="submit" class="btn-primary" style="margin-top:14px;">Salvar no Caderno</button>
        </form>
      </div>
    `
  } else if (estacaoAtual) {
    html += `
      <div class="card-container">
        <button id="btn-voltar-home" class="btn-back">⬅ Voltar para Estações</button>
        <h2>${estacaoAtual.icone} ${estacaoAtual.nome}</h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:12px;">${estacaoAtual.descricao}</p>

        ${estacaoAtual.missoes.map(m => {
          const feita = respostasGerais.some(r => r.missaoId === m.id) || medicoesTemperatura.some(med => estacaoAtual?.id === med.estacaoId && m.tipo === 'temperatura')
          return `
            <div class="missao-card">
              <h4>${m.titulo}${feita ? '✅' : ''}</h4>
              <p style="font-size:0.85rem; color:var(--text-muted); margin:4px 0 10px 0;">${m.descricao}</p>
              <button class="btn-primary btn-abrir-missao" data-id="${m.id}">
                ${feita ? 'Editar Registro' : 'Fazer Registro'}
              </button>
            </div>
          `
        }).join('')}
      </div>
    `
  } else {
    html += `
      <div>
        <h3 style="margin-bottom:10px;">Estações da Trilha</h3>
        ${estacoes.map(e => `
          <div class="recanto-card">
            <h3>${e.icone}${e.nome}</h3>
            <p style="font-size:0.85rem; color:var(--text-muted); margin:4px 0 10px 0;">${e.descricao}</p>
            <button class="btn-primary btn-abrir-estacao" data-id="${e.id}">Acessar Estação</button>
          </div>
        `).join('')}
      </div>
    `
  }

  if (modalMensagem) {
    html += `
      <div class="modal-overlay">
        <div class="modal-card">
          <h3>✅ Registro Salvo!</h3>
          <p style="margin:10px 0;">${modalMensagem}</p>
          <button id="btn-fechar-modal" class="btn-primary">OK</button>
        </div>
      </div>
    `
  }

  app.innerHTML = html
  bindEvents()
}

function bindEvents() {
  document.querySelector('#nav-home')?.addEventListener('click', () => {
    estacaoAtual = null
    missaoAtual = null
    verCaderno = false
    verComparativoTemp = false
    render()
  })

  document.querySelectorAll('.mascote-card').forEach(el => {
    el.addEventListener('click', () => {
      mascoteTempId = el.getAttribute('data-id') || mascotes[0].id
      render()
    })
  })

  document.querySelector('#form-cadastro')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const nome = (document.querySelector('#inp-nome') as HTMLInputElement).value
    const turma = (document.querySelector('#inp-turma') as HTMLInputElement).value
    const m = mascotes.find(x => x.id === mascoteTempId) || mascotes[0]

    crachaSalvo = { nome, turma, mascote: m }
    localStorage.setItem('exp_cracha', JSON.stringify(crachaSalvo))
    render()
  })

  document.querySelector('#btn-sair')?.addEventListener('click', () => {
    if (confirm('Deseja reiniciar a sessão e apagar os dados locais?')) {
      localStorage.clear()
      crachaSalvo = null
      respostasGerais = []
      medicoesTemperatura = []
      estacaoAtual = null
      missaoAtual = null
      verCaderno = false
      verComparativoTemp = false
      render()
    }
  })

  document.querySelector('#btn-caderno')?.addEventListener('click', () => { verCaderno = true; verComparativoTemp = false; render() })
  document.querySelector('#btn-fechar-caderno')?.addEventListener('click', () => { verCaderno = false; render() })

  document.querySelector('#btn-comparar-temp')?.addEventListener('click', () => { verComparativoTemp = true; verCaderno = false; render() })
  document.querySelector('#btn-fechar-comparativo')?.addEventListener('click', () => { verComparativoTemp = false; render() })

  document.querySelectorAll('.btn-abrir-estacao').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      estacaoAtual = estacoes.find(x => x.id === id) || null
      render()
    })
  })

  document.querySelector('#btn-voltar-home')?.addEventListener('click', () => { estacaoAtual = null; render() })

  document.querySelectorAll('.btn-abrir-missao').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      fotoTemp = null
      audioTemp = null
      missaoAtual = estacaoAtual?.missoes.find(x => x.id === id) || null
      render()
    })
  })

  document.querySelector('#btn-voltar-estacao')?.addEventListener('click', () => { missaoAtual = null; render() })

  const btnFoto = document.querySelector('#btn-foto')
  const inputFoto = document.querySelector('#input-foto') as HTMLInputElement
  if (btnFoto && inputFoto) {
    btnFoto.addEventListener('click', () => inputFoto.click())
    inputFoto.addEventListener('change', () => {
      const file = inputFoto.files?.[0]
      if (file) {
        const r = new FileReader()
        r.onload = (e) => { fotoTemp = e.target?.result as string; render() }
        r.readAsDataURL(file)
      }
    })
  }

  document.querySelector('#btn-audio')?.addEventListener('click', () => {
    audioTemp = "Audio_Registrado"
    alert('Áudio marcado como registrado!')
    render()
  })

  document.querySelector('#form-missao')?.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!missaoAtual || !estacaoAtual) return

    let conteudo = ''
    let midiaUrl = undefined

    if (missaoAtual.tipo === 'temperatura') {
      const valorInp = (document.querySelector('#inp-temp-valor') as HTMLInputElement).value
      const tempNum = parseFloat(valorInp)

      if (isNaN(tempNum)) return alert('Por favor, digite um valor de temperatura válido!')

      medicoesTemperatura = medicoesTemperatura.filter(m => m.estacaoId !== estacaoAtual!.id)
      medicoesTemperatura.push({
        estacaoId: estacaoAtual.id,
        estacaoNome: estacaoAtual.nome,
        valorTemperatura: tempNum,
        dataHora: new Date().toLocaleString('pt-BR')
      })
      localStorage.setItem('exp_medicoes_temp', JSON.stringify(medicoesTemperatura))

      conteudo = `Temperatura registrada: ${tempNum} °C`
    } else if (missaoAtual.tipo === 'foto') {
      if (!fotoTemp) return alert('Por favor, tire uma foto!')
      conteudo = 'Foto de campo anexada'
      midiaUrl = fotoTemp
    } else if (missaoAtual.tipo === 'texto') {
      conteudo = (document.querySelector('#inp-texto') as HTMLTextAreaElement).value
    } else if (missaoAtual.tipo === 'audio') {
      if (!audioTemp) return alert('Por favor, grave o áudio!')
      conteudo = 'Áudio registrado no local'
    }

    const novaResp: RespostaGeral = {
      estacaoId: estacaoAtual.id,
      missaoId: missaoAtual.id,
      titulo: `${estacaoAtual.nome} - ${missaoAtual.titulo}`,
      conteudo,
      midiaUrl,
      dataHora: new Date().toLocaleString('pt-BR')
    }

    respostasGerais = respostasGerais.filter(r => r.missaoId !== missaoAtual!.id)
    respostasGerais.push(novaResp)
    localStorage.setItem('exp_respostas', JSON.stringify(respostasGerais))

    modalMensagem = `Registro gravado com sucesso!`
    render()
  })

  document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => {
    modalMensagem = null
    missaoAtual = null
    render()
  })
}

render()