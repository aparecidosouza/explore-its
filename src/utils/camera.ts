/**
 * Utilitário para captura e otimização de fotos de campo no PWA
 */

export interface ResultadoFoto {
  base64: string
  timestamp: string
}

/**
 * Abre a câmara do telemóvel e retorna a foto comprimida em Base64
 */
export function capturarFotoCampo(): Promise<ResultadoFoto> {
  return new Promise((resolve, reject) => {
    // Cria um input de ficheiro temporário configurado para a câmara traseira
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment' // Força o uso da câmara traseira no telemóvel

    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement
      const ficheiro = target.files?.[0]

      if (!ficheiro) {
        reject(new Error('Nenhuma foto foi tirada.'))
        return
      }

      try {
        const fotoComprimida = await redimensionarEComprimir(ficheiro)
        resolve({
          base64: fotoComprimida,
          timestamp: new Date().toISOString()
        })
      } catch (erro) {
        reject(erro)
      }
    }

    // Dispara o clique para abrir a câmara do dispositivo
    input.click()
  })
}

/**
 * Comprime a imagem para não sobrecarregar o localStorage do telemóvel
 */
function redimensionarEComprimir(ficheiro: File, larguraMaxima = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.readAsDataURL(ficheiro)

    leitor.onload = (evento) => {
      const img = new Image()
      img.src = evento.target?.result as string

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let largura = img.width
        let altura = img.height

        if (largura > larguraMaxima) {
          altura = Math.round((altura * larguraMaxima) / largura)
          largura = larguraMaxima
        }

        canvas.width = largura
        canvas.height = altura

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Não foi possível obter o contexto do Canvas.'))
          return
        }

        ctx.drawImage(img, 0, 0, largura, altura)
        // Converte para JPEG com 70% de qualidade para economizar memória
        const base64 = canvas.toDataURL('image/jpeg', 0.7)
        resolve(base64)
      }

      img.onerror = (erro) => reject(erro)
    }

    leitor.onerror = (erro) => reject(erro)
  })
}