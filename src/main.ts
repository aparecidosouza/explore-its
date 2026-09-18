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
  requerHorario?: boolean
}

interface Estacao {
  id: string
  nome: string
  descricao: string
  icone: string
  missoes: Missao[]
}

interface RespostaAtividade {
  estacaoId: string
  missaoId: string
  titulo: string
  conteudo: string
  midiaUrl?: string
  dataHora: string
}

interface MedicaoTemp {
  estacaoId: string
  estacaoNome: string
  valorTemp: number
  horarioMedicao: string
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
    nome: '1. Fazenda Baraúna (Início da Trilha)',
    descricao: 'Ponto de recepção e partida da expedição.',
    icone: '🏡',
    missoes: [
      { id: 'm-bar-foto', titulo: 'Registro de Partida', descricao: 'Tire uma foto do grupo ou da entrada da fazenda.', tipo: 'foto' },
      { id: 'm-bar-temp', titulo: '1ª Medição de Temperatura', descricao: 'Meça a temperatura ambiental inicial e confirme o horário de partida.', tipo: 'temperatura', requerHorario: true }
    ]
  },
  {
    id: 'saci-perere',
    nome: '2. Estação Saci-Pererê',
    descricao: 'Investigue os sons e ruídos da mata.',
    icone: '🌪️',
    missoes: [
      { id: 'm-saci-1', titulo: 'Sons da Mata', descricao: 'Grave um áudio dos sons da natureza ao seu redor.', tipo: 'audio' }
    ]
  },
  {
    id: 'recanto-jatoba',
    nome: '3. Recanto do Jatobá',
    descricao: 'Observação da flora e 2º ponto de microclima.',
    icone: '🌰',
    missoes: [
      { id: 'm-jat-temp', titulo: '2ª Medição de Temperatura', descricao: 'Meça a temperatura sob a copa das árvores.', tipo: 'temperatura' },
      { id: 'm-jat-obs', titulo: 'Observação da Vegetação', descricao: 'Descreva as sementes e características das árvores encontradas.', tipo: 'texto' }
    ]
  },
  {
    id: 'caipora',
    nome: '4. Estação Caipora',
    descricao: 'Rastros e vestígios da fauna local.',
    icone: '🐾',
    missoes: [
      { id: 'm-cai-1', titulo: 'Pegadas e Registros', descricao: 'Fotografe marcas ou rastros no solo.', tipo: 'foto' }
    ]
  },
  {
    id: 'recanto-nego-dagua',
    nome: '5. Recanto do Nego d\'Água',
    descricao: 'Área próxima ao curso d\'água.',
    icone: '💧',
    missoes: [
      { id: 'm-neg-temp', titulo: '3ª Medição de Temperatura', descricao: 'Meça a temperatura próximo ao córrego.', tipo: 'temperatura' }
    ]
  }
]

// Estado Local
let crachaSalvo: Cracha | null = JSON.parse(localStorage.getItem('exp_cracha') || 'null')
let respostasGerais: RespostaAtividade[] = JSON.parse(localStorage.getItem('exp_respostas') || '[]')
let medicoesTemperatura: MedicaoTemp[] = JSON.parse(localStorage.getItem('exp_medicoes') || '[]')

let mascoteTempId = mascotes[0].id
let estacaoAtual: Estacao | null = null
let missaoAtual: Missao | null = null
let fotoTemp: string | null = null
let audioTemp: string | null = null
let verTabelaTemp = false
let verCaderno = false
let modalMensagem: string | null = null

const app = document.querySelector<HTMLDivElement>('#app')!

function obterHoraAtual(): string {
  const agora = new Date()
  return agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function render() {
  let html = `
    <header class="app-header">
      <div class="header-content">
        <span class="logo" id="nav-home">🍃 Explore ITS</span>
        ${crachaSalvo ? `
          <div class="user-badge">
            <small><strong>${crachaSalvo.mascote.emoji}${crachaSalvo.nome}</strong></small>
            <button id="btn-tabela-temp" class="btn-secondary">📊 Temperaturas</button>
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
        <h2>🎒 Identificação de Campo</h2>
        <form id="form-cadastro" style="margin-top:12px;">
          <div class="form-group">
            <label>Nome do Estudante:</label>
            <input type="text" id="inp-nome" required placeholder="Ex: Maria Silva" />
          </div>
          <div class="form-group">
            <label>Turma / Escola:</label>
            <input type="text" id="inp-turma" required placeholder="Ex: 6º Ano B" />
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
  } else if (verTabelaTemp) {
    html += `
      <div class="card-container">
        <button id="btn-voltar-estacoes" class="btn-back">⬅ Voltar às Estações</button>
        <h2>📊 Tabela de Temperaturas da Trilha</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">
          Medições de temperatura (°C) e horários coletados nos 3 recantos:
        </p>

        <table style="width:100%; border-collapse: collapse; text-align:left; font-size:0.9rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border); background:#f1f5f9;">
              <th style="padding:8px;">Ponto de Coleta</th>
              <th style="padding:8px;">Temp (°C)</th>
              <th style="padding:8px;">Horário</th>
            </tr>
          </thead>
          <tbody>
            ${[
              { id: 'fazenda-barauna', nome: '1. Fazenda Baraúna' },
              { id: 'recanto-jatoba', nome: '3. Recanto do Jatobá' },
              { id: 'recanto-nego-dagua', nome: '5. Recanto do Nego d\'Água' }
            ].map(ponto => {
              const med = medicoesTemperatura.find(m => m.estacaoId === ponto.id)
              return `
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding:10px 8px;"><strong>${ponto.nome}</strong></td>
                  <td style="padding:10px 8px; color:var(--primary-dark); font-weight:bold;">
                    ${med ? `${med.valorTemp} °C` : '<span style="color:#d97706;">Pendente</span>'}
                  </td>
                  <td style="padding:10px 8px; color:var(--text-muted);">
                    ${med ? med.horarioMedicao : '-'}
                  </td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>
    `
  } else if (verCaderno) {
    html += `
      <div class="card-container">
        <button id="btn-voltar-estacoes" class="btn-back">⬅ Voltar às Estações</button>
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
  } else if (missaoAtual && estacaoAtual) {
    const medExistente = medicoesTemperatura.find(m => m.estacaoId === estacaoAtual!.id)
    const horaPadrao = medExistente ? medExistente.horarioMedicao : obterHoraAtual()

    html += `
      <div class="card-container">
        <button id="btn-voltar-estacao" class="btn-back">⬅ Voltar para ${estacaoAtual.nome}</button>
        <h3>${missaoAtual.titulo}</h3>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:12px;">${missaoAtual.descricao}</p>

        <form id="form-missao">
          ${missaoAtual.tipo === 'temperatura' ? `
            <div class="form-group">
              <label>Temperatura lida no Termômetro Digital (°C):</label>
              <input type="number" step="0.1" id="inp-temp" required placeholder="Ex: 26.5" value="${medExistente ? medExistente.valorTemp : ''}" style="font-size:1.2rem; padding:10px;" />
            </div>
            <div class="form-group">
              <label>${missaoAtual.requerHorario ? 'Horário de Início da Trilha:' : 'Horário da Medição:'}</label>
              <input type="time" id="inp-hora" required value="${horaPadrao}" style="font-size:1.1rem; padding:8px;" />
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
            <button type="button" id="btn-audio" class="btn-secondary">🎙️ Gravador de Áudio</button>
            <div class="preview-box">
              ${audioTemp ? '<p>✅ Áudio registrado!</p>' : '<small>Gravação pendente</small>'}
            </div>
          ` : ''}

          <button type="submit" class="btn-primary" style="margin-top:14px;">Salvar Atividade</button>
        </form>
      </div>
    `
  } else if (estacaoAtual) {
    html += `
      <div class="card-container">
        <button id="btn-voltar-home" class="btn-back">⬅ Voltar às Estações</button>
        <h2>${estacaoAtual.icone} ${estacaoAtual.nome}</h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:15px;">${estacaoAtual.descricao}</p>

        <h3>Atividades desta Estação:</h3>
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
          ${estacaoAtual.missoes.map(m => {
            const feita = respostasGerais.some(r => r.missaoId === m.id)
            return `
              <div class="missao-card">
                <h4>${m.titulo}${feita ? '✅' : ''}</h4>
                <p style="font-size:0.85rem; color:var(--text-muted); margin:4px 0 10px 0;">${m.descricao}</p>
                <button class="btn-primary btn-abrir-missao" data-id="${m.id}">
                  ${feita ? 'Editar Registro' : 'Fazer Atividade'}
                </button>
              </div>
            `
          }).join('')}
        </div>
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
            <small style="color:var(--primary); font-weight:600; display:block; margin-bottom:8px;">
              📋 ${e.missoes.length} atividade(s)
            </small>
            <button class="btn-primary btn-abrir-estacao" data-id="${e.id}">Entrar na Estação</button>
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
    verTabelaTemp = false
    verCaderno = false
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
    if (confirm('Deseja apagar os dados locais e reiniciar?')) {
      localStorage.clear()
      crachaSalvo = null
      respostasGerais = []
      medicoesTemperatura = []
      estacaoAtual = null
      missaoAtual = null
      verTabelaTemp = false
      verCaderno = false
      render()
    }
  })

  document.querySelector('#btn-tabela-temp')?.addEventListener('click', () => { verTabelaTemp = true; verCaderno = false; render() })
  document.querySelector('#btn-caderno')?.addEventListener('click', () => { verCaderno = true; verTabelaTemp = false; render() })
  document.querySelector('#btn-voltar-estacoes')?.addEventListener('click', () => { verTabelaTemp = false; verCaderno = false; render() })

  document.querySelectorAll('.btn-abrir-estacao').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      estacaoAtual = estacoes.find(e => e.id === id) || null
      render()
    })
  })

  document.querySelector('#btn-voltar-home')?.addEventListener('click', () => { estacaoAtual = null; render() })

  document.querySelectorAll('.btn-abrir-missao').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      fotoTemp = null
      audioTemp = null
      missaoAtual = estacaoAtual?.missoes.find(m => m.id === id) || null
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
    alert('Áudio gravado com sucesso!')
    render()
  })

  document.querySelector('#form-missao')?.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!missaoAtual || !estacaoAtual) return

    let conteudo = ''
    let midiaUrl = undefined

    if (missaoAtual.tipo === 'temperatura') {
      const tempVal = parseFloat((document.querySelector('#inp-temp') as HTMLInputElement).value)
      const horaVal = (document.querySelector('#inp-hora') as HTMLInputElement).value

      if (isNaN(tempVal)) return alert('Por favor, digite um valor de temperatura válido!')

      medicoesTemperatura = medicoesTemperatura.filter(m => m.estacaoId !== estacaoAtual!.id)
      medicoesTemperatura.push({
        estacaoId: estacaoAtual.id,
        estacaoNome: estacaoAtual.nome,
        valorTemp: tempVal,
        horarioMedicao: horaVal
      })
      localStorage.setItem('exp_medicoes', JSON.stringify(medicoesTemperatura))

      conteudo = `Temperatura: ${tempVal} °C às ${horaVal}`
    } else if (missaoAtual.tipo === 'foto') {
      if (!fotoTemp) return alert('Por favor, tire uma foto!')
      conteudo = 'Foto registrada no local'
      midiaUrl = fotoTemp
    } else if (missaoAtual.tipo === 'texto') {
      conteudo = (document.querySelector('#inp-texto') as HTMLTextAreaElement).value
    } else if (missaoAtual.tipo === 'audio') {
      if (!audioTemp) return alert('Por favor, grave o áudio!')
      conteudo = 'Áudio gravado no local'
    }

    const novaResp: RespostaAtividade = {
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

    modalMensagem = `Atividade salva com sucesso!`
    render()
  })

  document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => {
    modalMensagem = null
    missaoAtual = null
    render()
  })
}

render()