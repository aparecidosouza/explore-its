/**
 * Utilitário de desenho sobre imagens (Vetorização de Fluxo Hídrico)
 */

export class EditorCanvas {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private desenhando = false
  private imagemFundo: HTMLImageElement | null = null

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvas = canvasElement
    const contexto = this.canvas.getContext('2d')
    if (!contexto) throw new Error('Não foi possível obter contexto 2D')
    this.ctx = contexto
    this.configurarEventos()
  }

  /**
   * Carrega uma foto em Base64 para o fundo do Canvas e ajusta a resolução interna
   */
  public carregarImagem(base64: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = base64
      img.onload = () => {
        this.imagemFundo = img

        // Define o tamanho real em pixels do canvas com base no container visível
        const larguraContainer = this.canvas.parentElement?.clientWidth || window.innerWidth - 40
        const proporcao = img.height / img.width

        this.canvas.width = larguraContainer
        this.canvas.height = larguraContainer * proporcao

        this.desenharFundo()
        resolve()
      }
      img.onerror = (e) => reject(e)
    })
  }

  private desenharFundo() {
    if (this.imagemFundo) {
      this.ctx.drawImage(this.imagemFundo, 0, 0, this.canvas.width, this.canvas.height)
    }
  }

  private configurarEventos() {
    // Eventos de Toque (Celular / Touchscreen)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        this.iniciarDesenho(e.touches[0])
      }
    }, { passive: false })

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        this.desenhar(e.touches[0])
      }
    }, { passive: false })

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      this.pararDesenho()
    }, { passive: false })

    // Eventos de Mouse (Computador)
    this.canvas.addEventListener('mousedown', (e) => this.iniciarDesenho(e))
    this.canvas.addEventListener('mousemove', (e) => this.desenhar(e))
    this.canvas.addEventListener('mouseup', () => this.pararDesenho())
    this.canvas.addEventListener('mouseleave', () => this.pararDesenho())
  }

  private obterPosicao(e: Touch | MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  private iniciarDesenho(e: Touch | MouseEvent) {
    this.desenhando = true
    const pos = this.obterPosicao(e)
    this.ctx.beginPath()
    this.ctx.moveTo(pos.x, pos.y)
    
    // Estilo do traço
    this.ctx.strokeStyle = '#00f5d4' // Verde Ciano Neon
    this.ctx.lineWidth = 5
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
  }

  private desenhar(e: Touch | MouseEvent) {
    if (!this.desenhando) return
    const pos = this.obterPosicao(e)
    this.ctx.lineTo(pos.x, pos.y)
    this.ctx.stroke()
  }

  private pararDesenho() {
    this.desenhando = false
  }

  public limpar() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.desenharFundo()
  }

  public exportarResultado(): string {
    return this.canvas.toDataURL('image/jpeg', 0.6)
  }
}