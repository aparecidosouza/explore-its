import './style.css'

interface Mascote {
  id: string
  nome: string
  emoji: string
}

interface Estacao {
  id: string
  nome: string
  descricao: string
  icone: string
  requerHorario?: boolean
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

const estacoesMedicao: Estacao[] = [
  {
    id: 'fazenda-barauna',
    nome: '1. Fazenda Baraúna (Início da Trilha)',
    descricao: 'Afera a temperatura inicial e registre o horário de início da expedição.',
    icone: '🏡',
    requerHorario: true
  },
  {
    id: 'recanto-jatoba',
    nome: '2. Recanto do Jatobá',
    descricao: 'Afera a temperatura no microclima sob a copa das árvores.',
    icone: '🌰'
  },
  {
    id: 'recanto-nego-dagua',
    nome: '3. Recanto do Nego d\'Água',
    descricao: 'Afera a temperatura próximo à zona ciliar / curso d\'água.',
    icone: '💧'
  }
]

// Estado Local
let crachaSalvo: Cracha | null = JSON.parse(localStorage.getItem('exp_cracha') || 'null')
let medicoesSalvas: MedicaoTemp[] = JSON.parse(localStorage.getItem('exp_medicoes') || '[]')

let mascoteTempId = mascotes[0].id
let estacaoSelecionada: Estacao | null = null
let verTabelaFinal = false
let modalSucesso = false

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
            <button id="btn-ver-tabela" class="btn-secondary">📊 Tabela de Temperaturas</button>
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
            <input type="text" id="inp-nome" required placeholder="Ex: Lucas Silva" />
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
  } else if (verTabelaFinal) {
    html += `
      <div class="card-container">
        <button id="btn-voltar" class="btn-back">⬅ Voltar às Estações</button>
        <h2>📊 Tabela Comparativa de Temperatura</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">
          Registro das temperaturas e horários coletados ao longo da trilha:
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
            ${estacoesMedicao.map(est => {
              const med = medicoesSalvas.find(m => m.estacaoId === est.id)
              return `
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding:10px 8px;"><strong>${est.nome}</strong></td>
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
  } else if (estacaoSelecionada) {
    const medExistente = medicoesSalvas.find(m => m.estacaoId === estacaoSelecionada!.id)
    const horaPadrao = medExistente ? medExistente.horarioMedicao : obterHoraAtual()

    html += `
      <div class="card-container">
        <button id="btn-voltar" class="btn-back">⬅ Voltar</button>
        <h2>${estacaoSelecionada.icone} ${estacaoSelecionada.nome}</h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:15px;">${estacaoSelecionada.descricao}</p>

        <form id="form-medicao">
          <div class="form-group">
            <label>Temperatura lida no Termômetro Digital (°C):</label>
            <input type="number" step="0.1" id="inp-temp" required placeholder="Ex: 26.5" value="${medExistente ? medExistente.valorTemp : ''}" style="font-size:1.2rem; padding:10px;" />
          </div>

          <div class="form-group">
            <label>${estacaoSelecionada.requerHorario ? 'Horário de Início da Trilha:' : 'Horário da Medição:'}</label>
            <input type="time" id="inp-hora" required value="${horaPadrao}" style="font-size:1.1rem; padding:8px;" />
          </div>

          <button type="submit" class="btn-primary" style="margin-top:10px;">Salvar Registro</button>
        </form>
      </div>
    `
  } else {
    html += `
      <div>
        <h3 style="margin-bottom:10px;">Pontos de Medição de Temperatura</h3>
        ${estacoesMedicao.map(est => {
          const med = medicoesSalvas.find(m => m.estacaoId === est.id)
          return `
            <div class="recanto-card">
              <h3>${est.icone} ${est.nome}${med ? '✅' : ''}</h3>
              <p style="font-size:0.85rem; color:var(--text-muted); margin:4px 0 10px 0;">${est.descricao}</p>${med ? `<p style="font-size:0.85rem; margin-bottom:10px;">Registrado: <strong>${med.valorTemp} °C</strong> às ${med.horarioMedicao}</p>` : ''}
              <button class="btn-primary btn-abrir-estacao" data-id="${est.id}">
                ${med ? 'Editar Medição' : 'Registrar Medição'}
              </button>
            </div>
          `
        }).join('')}
      </div>
    `
  }

  if (modalSucesso) {
    html += `
      <div class="modal-overlay">
        <div class="modal-card">
          <h3>✅ Registrado!</h3>
          <p style="margin:10px 0;">Dados salvos com sucesso na tabela de campo.</p>
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
    estacaoSelecionada = null
    verTabelaFinal = false
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
    if (confirm('Deseja apagar as medições e reiniciar?')) {
      localStorage.clear()
      crachaSalvo = null
      medicoesSalvas = []
      estacaoSelecionada = null
      verTabelaFinal = false
      render()
    }
  })

  document.querySelector('#btn-ver-tabela')?.addEventListener('click', () => {
    verTabelaFinal = true
    render()
  })

  document.querySelector('#btn-voltar')?.addEventListener('click', () => {
    estacaoSelecionada = null
    verTabelaFinal = false
    render()
  })

  document.querySelectorAll('.btn-abrir-estacao').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      estacaoSelecionada = estacoesMedicao.find(e => e.id === id) || null
      render()
    })
  })

  document.querySelector('#form-medicao')?.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!estacaoSelecionada) return

    const tempVal = parseFloat((document.querySelector('#inp-temp') as HTMLInputElement).value)
    const horaVal = (document.querySelector('#inp-hora') as HTMLInputElement).value

    if (isNaN(tempVal)) return alert('Por favor, digite um número válido para a temperatura.')

    medicoesSalvas = medicoesSalvas.filter(m => m.estacaoId !== estacaoSelecionada!.id)
    medicoesSalvas.push({
      estacaoId: estacaoSelecionada.id,
      estacaoNome: estacaoSelecionada.nome,
      valorTemp: tempVal,
      horarioMedicao: horaVal
    })

    localStorage.setItem('exp_medicoes', JSON.stringify(medicoesSalvas))
    modalSucesso = true
    render()
  })

  document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => {
    modalSucesso = false
    estacaoSelecionada = null
    render()
  })
}

render()