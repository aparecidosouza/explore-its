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
  instrucoesHtml?: string
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
    id: 'recanto-pioneiras',
    nome: '4. Recanto das Pioneiras',
    descricao: 'Investigação sobre a regeneração do solo, plantas pioneiras e organismos regeneradores.',
    icone: '🌱',
    missoes: [
      {
        id: 'm-pio-busca-insetos',
        titulo: '🔎 Quem ajuda a floresta a voltar?',
        descricao: 'Procure no ambiente organismos que ajudam a regenerar a mata e registre as interações ecológicas.',
        instrucoesHtml: `
          <div style="background:#f0fdf4; border:1px solid #bbf7d0; padding:12px; border-radius:8px; font-size:0.88rem; margin-bottom:12px; color:#166534;">
            <p style="margin-bottom:8px;"><strong>As plantas pioneiras não trabalham sozinhas!</strong> Procure ao seu redor:</p>
            <ul style="padding-left:18px; margin:6px 0; line-height:1.4;">
              <li>🐜 Insetos carregando sementes</li>
              <li>🐦 Aves comendo frutos ou transportando sementes</li>
              <li>🐝 Insetos visitando flores (polinizadores)</li>
              <li>🪱 Organismos transformando matéria orgânica</li>
              <li>🍄 Fungos atuando sobre folhas e restos de plantas</li>
            </ul>
            <p style="margin-top:8px;"><strong>🎯 Desafio:</strong> Fotografe o registro e descreva abaixo o que estava acontecendo e como esse organismo ajuda a planta a ocupar um novo lugar!</p>
          </div>
        `,
        tipo: 'foto'
      },
      {
        id: 'm-pio-relato',
        titulo: '📝 Análise das Interações Ecológicas',
        descricao: 'Descreva detalhadamente o que o grupo observou nas interações ecológicas do Recanto das Pioneiras.',
        tipo: 'texto'
      }
    ]
  },
  {
    id: 'caipora',
    nome: '5. Estação Caipora',
    descricao: 'Rastros e vestígios da fauna local.',
    icone: '🐾',
    missoes: [
      { id: 'm-cai-1', titulo: 'Pegadas e Registros', descricao: 'Fotografe marcas ou rastros no solo.', tipo: 'foto' }
    ]
  },
  {
    id: 'recanto-nego-dagua',
    nome: '6. Recanto do Nego d\'Água',
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
let verConquistas = false
let modalMensagem: string | null = null

const app = document.querySelector<HTMLDivElement>('#app')!

function obterHoraAtual(): string {
  const agora = new Date()
  return agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function calcularTotalMissoes(): number {
  return estacoes.reduce((acc, est) => acc + est.missoes.length, 0)
}

function obterCategoriaCientifica(): { titulo: string, descricao: string, icone: string } {
  const total = calcularTotalMissoes()
  const concluidas = respostasGerais.length

  if (concluidas >= total) {
    return {
      titulo: 'Cientista Investigador do Cerrado 🌟',
      descricao: 'Incrível! O grupo concluiu 100% das investigações com precisão científica e coleta rigorosa de dados.',
      icone: '🏆'
    }
  } else if (concluidas >= Math.ceil(total * 0.6)) {
    return {
      titulo: 'Explorador Científico da Trilha 🍃',
      descricao: 'Ótimo trabalho! O grupo completou grande parte das medições e registros no campo.',
      icone: '🥉'
    }
  } else if (concluidas > 0) {
    return {
      titulo: 'Detetive da Natureza em Ação 🔍',
      descricao: 'A jornada começou! Continue realizando as medições e fotos para alcançar o topo.',
      icone: '🌱'
    }
  } else {
    return {
      titulo: 'Aprendiz de Expedição 🎒',
      descricao: 'Inicie as missões nas estações para desbloquear sua categoria científica!',
      icone: '📍'
    }
  }
}

function render() {
  const categoria = obterCategoriaCientifica()

  let html = `
    <header class="app-header">
      <div class="header-content">
        <span class="logo" id="nav-home">🍃 Explore ITS</span>
        ${crachaSalvo ? `
          <div class="user-badge">
            <small><strong>${crachaSalvo.mascote.emoji}${crachaSalvo.nome}</strong></small>
            <button id="btn-conquistas" class="btn-secondary">🎖️ Conquistas</button>
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
            <label>Nome do Estudante / Grupo:</label>
            <input type="text" id="inp-nome" required placeholder="Ex: Grupo Alpha ou Maria Silva" />
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
  } else if (verConquistas) {
    const total = calcularTotalMissoes()
    const concluidas = respostasGerais.length
    const progressoPct = Math.round((concluidas / total) * 100)

    html += `
      <div class="card-container">
        <button id="btn-voltar-estacoes" class="btn-back">⬅ Voltar às Estações</button>
        <h2>🎖️ Nível do Grupo & Conquistas</h2>

        <div style="background:#f0fdf4; border:2px solid var(--primary); padding:16px; border-radius:12px; margin:15px 0; text-align:center;">
          <div style="font-size:3rem; margin-bottom:6px;">${categoria.icone}</div>
          <h3 style="color:var(--primary-dark); font-size:1.2rem;">${categoria.titulo}</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-top:6px;">${categoria.descricao}</p>
        </div>

        <h4>Progresso da Trilha (${concluidas}/${total} atividades)</h4>
        <div style="background:#e2e8f0; border-radius:10px; height:16px; width:100%; margin:8px 0 15px 0; overflow:hidden;">
          <div style="background:var(--primary); height:100%; width:${progressoPct}%; transition:width 0.3s;"></div>
        </div>

        <h4>Medalhas Desbloqueadas:</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
          <div class="missao-card" style="opacity: ${medicoesTemperatura.length > 0 ? '1' : '0.4'}; text-align:center;">
            <div style="font-size:2rem;">🌡️</div>
            <strong>Termômetro de Ouro</strong>
            <p style="font-size:0.75rem; color:var(--text-muted);">${medicoesTemperatura.length > 0 ? 'Medições registradas!' : 'Ainda não aferido'}</p>
          </div>
          <div class="missao-card" style="opacity: ${respostasGerais.some(r => r.midiaUrl) ? '1' : '0.4'}; text-align:center;">
            <div style="font-size:2rem;">📷</div>
            <strong>Fotógrafo Científico</strong>
            <p style="font-size:0.75rem; color:var(--text-muted);">${respostasGerais.some(r => r.midiaUrl) ? 'Foto capturada!' : 'Tire uma foto'}</p>
          </div>
          <div class="missao-card" style="opacity: ${respostasGerais.some(r => r.titulo.includes('Sons')) ? '1' : '0.4'}; text-align:center;">
            <div style="font-size:2rem;">🎙️</div>
            <strong>Investigador Sonoro</strong>
            <p style="font-size:0.75rem; color:var(--text-muted);">${respostasGerais.some(r => r.titulo.includes('Sons')) ? 'Áudio gravado!' : 'Grave os sons'}</p>
          </div>
          <div class="missao-card" style="opacity: ${concluidas >= total ? '1' : '0.4'}; text-align:center;">
            <div style="font-size:2rem;">🏆</div>
            <strong>Trilha 100%</strong>
            <p style="font-size:0.75rem; color:var(--text-muted);">${concluidas >= total ? 'Todas concluídas!' : 'Pendente'}</p>
          </div>
        </div>
      </div>
    `
  } else if (verTabelaTemp) {
    html += `
      <div class="card-container">
        <button id="btn-voltar-estacoes" class="btn-back">⬅ Voltar às Estações</button>
        <h2>📊 Tabela de Temperaturas da Trilha</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">
          Medições de temperatura (°C) e horários coletados nos recantos:
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
              { id: 'recanto-nego-dagua', nome: '6. Recanto do Nego d\'Água' }
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
        <p><small>Estudante/Grupo: ${crachaSalvo.nome} | Turma: ${crachaSalvo.turma}</small></p>
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

        ${missaoAtual.instrucoesHtml ? missaoAtual.instrucoesHtml : ''}

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
            <div class="form-group">
              <label>Explicação da Interação Ecológica (O que o grupo encontrou?):</label>
              <textarea id="inp-texto-foto" rows="3" placeholder="Ex: Encontramos formigas carregando sementes perto do tronco da árvore..."></textarea>
            </div>
            <input type="file" id="input-foto" accept="image/*" capture="environment" style="display:none" />
            <button type="button" id="btn-foto" class="btn-secondary">📷 Capturar Foto do Organismo / Interação</button>
            <div class="preview-box">
              ${fotoTemp ? `<img src="${fotoTemp}" class="img-preview"/>` : '<small>Nenhuma foto tirada</small>'}
            </div>
          ` : ''}

          ${missaoAtual.tipo === 'texto' ? `
            <div class="form-group">
              <textarea id="inp-texto" rows="4" required placeholder="Digite os detalhes das observações ecológicas do grupo..."></textarea>
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
    const totalMissoesEstacao = estacaoAtual.missoes.length
    const concluidasEstacao = estacaoAtual.missoes.filter(m => respostasGerais.some(r => r.missaoId === m.id)).length
    const estacaoConclvida = concluidasEstacao === totalMissoesEstacao

    const idxAtual = estacoes.findIndex(e => e.id === estacaoAtual!.id)
    const proximaEstacao = idxAtual < estacoes.length - 1 ? estacoes[idxAtual + 1] : null

    html += `
      <div class="card-container">
        <button id="btn-voltar-home" class="btn-back">⬅ Voltar às Estações</button>
        <h2>${estacaoAtual.icone} ${estacaoAtual.nome}</h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:15px;">${estacaoAtual.descricao}</p>

        ${estacaoConclvida ? `
          <div style="background:#f0fdf4; border:2px solid var(--primary); padding:14px; border-radius:10px; margin-bottom:15px; text-align:center;">
            <h4 style="color:var(--primary-dark);">🎉 Recanto Concluído com Sucesso!</h4>
            <p style="font-size:0.85rem; color:var(--text-muted); margin:4px 0 10px 0;">Todas as atividades deste ponto foram entregues.</p>
            ${proximaEstacao ? `
              <button class="btn-primary btn-proximo-recanto" data-id="${proximaEstacao.id}">
                Ir para o Próximo Recanto (${proximaEstacao.nome}) ➔
              </button>
            ` : `
              <button id="btn-ver-conquistas-final" class="btn-primary">
                🏆 Ver Resultado Final da Expedição
              </button>
            `}
          </div>
        ` : ''}

        <h3>Atividades deste Recanto:</h3>
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
        <div style="background:white; padding:12px 16px; border-radius:12px; border:1px solid var(--border); margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
          <div>
            <small style="color:var(--text-muted);">Status do Grupo:</small>
            <div style="font-weight:bold; color:var(--primary-dark); font-size:0.95rem;">${categoria.titulo}</div>
          </div>
          <div style="font-size:1.8rem;">${categoria.icone}</div>
        </div>

        <h3 style="margin-bottom:10px;">Estações da Trilha</h3>
        ${estacoes.map(e => {
          const totalM = e.missoes.length
          const concM = e.missoes.filter(m => respostasGerais.some(r => r.missaoId === m.id)).length
          const concluida = concM === totalM && totalM > 0

          return `
            <div class="recanto-card" style="${concluida ? 'border-left:5px solid var(--primary);' : ''}">
              <h3>${e.icone} ${e.nome}${concluida ? '✅' : ''}</h3>
              <p style="font-size:0.85rem; color:var(--text-muted); margin:4px 0 8px 0;">${e.descricao}</p>
              <small style="color:var(--primary); font-weight:600; display:block; margin-bottom:10px;">
                📋 ${concM}/${totalM} atividade(s) concluída(s)
              </small>
              <button class="btn-primary btn-abrir-estacao" data-id="${e.id}">
                ${concluida ? 'Revisar Recanto' : 'Entrar no Recanto'}
              </button>
            </div>
          `
        }).join('')}
      </div>
    `
  }

  if (modalMensagem) {
    html += `
      <div class="modal-overlay">
        <div class="modal-card">
          <h3>✅ Atividade Salva!</h3>
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
    verConquistas = false
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
      verConquistas = false
      render()
    }
  })

  document.querySelector('#btn-conquistas')?.addEventListener('click', () => { verConquistas = true; verTabelaTemp = false; verCaderno = false; render() })
  document.querySelector('#btn-ver-conquistas-final')?.addEventListener('click', () => { verConquistas = true; verTabelaTemp = false; verCaderno = false; estacaoAtual = null; render() })
  document.querySelector('#btn-tabela-temp')?.addEventListener('click', () => { verTabelaTemp = true; verCaderno = false; verConquistas = false; render() })
  document.querySelector('#btn-caderno')?.addEventListener('click', () => { verCaderno = true; verTabelaTemp = false; verCaderno = false; render() })
  document.querySelector('#btn-voltar-estacoes')?.addEventListener('click', () => { verTabelaTemp = false; verCaderno = false; verConquistas = false; render() })

  document.querySelectorAll('.btn-abrir-estacao').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      estacaoAtual = estacoes.find(e => e.id === id) || null
      render()
    })
  })

  document.querySelectorAll('.btn-proximo-recanto').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      estacaoAtual = estacoes.find(e => e.id === id) || null
      missaoAtual = null
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
      const descr = (document.querySelector('#inp-texto-foto') as HTMLTextAreaElement)?.value || 'Foto registrada'
      conteudo = `Registro: ${descr}`
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

    const totalMissoes = estacaoAtual.missoes.length
    const concluidas = estacaoAtual.missoes.filter(m => respostasGerais.some(r => r.missaoId === m.id)).length

    if (concluidas === totalMissoes) {
      modalMensagem = `🎉 Parabéns! Você concluiu todas as atividades do ${estacaoAtual.nome}. Retornando à trilha de recantos!`
    } else {
      modalMensagem = `Atividade salva com sucesso!`
    }

    render()
  })

  document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => {
    modalMensagem = null

    if (estacaoAtual) {
      const totalMissoes = estacaoAtual.missoes.length
      const concluidas = estacaoAtual.missoes.filter(m => respostasGerais.some(r => r.missaoId === m.id)).length
      if (concluidas === totalMissoes) {
        estacaoAtual = null
      }
    }

    missaoAtual = null
    render()
  })
}

render()