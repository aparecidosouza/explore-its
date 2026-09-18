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
   * Carrega uma foto em Base64 para o fundo do Canvas
   */
  public carregarImagem(base64: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = base64
      img.onload = () => {
        this.imagemFundo = img
        this.canvas.width = img.width
        this.canvas.height = img.height
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
    // Eventos de Toque (Telemóvel)
    this.canvas.addEventListener('touchstart', (e) => this.iniciarDesenho(e.touches[0]))
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault() // Impede o scroll da página enquanto desenha
      this.desenhar(e.touches[0])
    })
    this.canvas.addEventListener('touchend', () => this.pararDesenho())

    // Eventos de Rato (Computador)
    this.canvas.addEventListener('mousedown', (e) => this.iniciarDesenho(e))
    this.canvas.addEventListener('mousemove', (e) => this.desenhar(e))
    this.canvas.addEventListener('mouseup', () => this.pararDesenho())
  }

  private obterPosicao(e: Touch | MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const escalaX = this.canvas.width / rect.width
    const escalaY = this.canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * escalaX,
      y: (e.clientY - rect.top) * escalaY
    }
  }

  private iniciarDesenho(e: Touch | MouseEvent) {
    this.desenhando = true
    const pos = this.obterPosicao(e)
    this.ctx.beginPath()
    this.ctx.moveTo(pos.x, pos.y)
    // Configuração do traço do vetor (cor azul ciano destacada)
    this.ctx.strokeStyle = '#00f5d4'
    this.ctx.lineWidth = 6
    this.ctx.lineCap = 'round'
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

  /**
   * Limpa os desenhos e restaura a foto original
   */
  public limpar() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.desenharFundo()
  }

  /**
   * Exporta a imagem final (Foto + Desenho) em formato Base64
   */
  public exportarResultado(): string {
    return this.canvas.toDataURL('image/jpeg', 0.6)
  }
}