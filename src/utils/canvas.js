/**
 * Utilitário de desenho sobre imagens (Vetorização de Fluxo Hídrico)
 */
export class EditorCanvas {
    canvas;
    ctx;
    desenhando = false;
    imagemFundo = null;
    constructor(canvasElement) {
        this.canvas = canvasElement;
        const contexto = this.canvas.getContext('2d');
        if (!contexto)
            throw new Error('Não foi possível obter contexto 2D');
        this.ctx = contexto;
        this.configurarEventos();
    }
    /**
     * Carrega uma foto em Base64 para o fundo do Canvas e ajusta a resolução interna
     */
    carregarImagem(base64) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64;
            img.onload = () => {
                this.imagemFundo = img;
                // Define o tamanho real em pixels do canvas com base no container visível
                const larguraContainer = this.canvas.parentElement?.clientWidth || window.innerWidth - 40;
                const proporcao = img.height / img.width;
                this.canvas.width = larguraContainer;
                this.canvas.height = larguraContainer * proporcao;
                this.desenharFundo();
                resolve();
            };
            img.onerror = (e) => reject(e);
        });
    }
    desenharFundo() {
        if (this.imagemFundo) {
            this.ctx.drawImage(this.imagemFundo, 0, 0, this.canvas.width, this.canvas.height);
        }
    }
    configurarEventos() {
        // Eventos de Toque (Celular / Touchscreen)
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                this.iniciarDesenho(e.touches[0]);
            }
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                this.desenhar(e.touches[0]);
            }
        }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.pararDesenho();
        }, { passive: false });
        // Eventos de Mouse (Computador)
        this.canvas.addEventListener('mousedown', (e) => this.iniciarDesenho(e));
        this.canvas.addEventListener('mousemove', (e) => this.desenhar(e));
        this.canvas.addEventListener('mouseup', () => this.pararDesenho());
        this.canvas.addEventListener('mouseleave', () => this.pararDesenho());
    }
    obterPosicao(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    iniciarDesenho(e) {
        this.desenhando = true;
        const pos = this.obterPosicao(e);
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        // Estilo do traço
        this.ctx.strokeStyle = '#00f5d4'; // Verde Ciano Neon
        this.ctx.lineWidth = 5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }
    desenhar(e) {
        if (!this.desenhando)
            return;
        const pos = this.obterPosicao(e);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
    }
    pararDesenho() {
        this.desenhando = false;
    }
    limpar() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.desenharFundo();
    }
    exportarResultado() {
        return this.canvas.toDataURL('image/jpeg', 0.6);
    }
}
