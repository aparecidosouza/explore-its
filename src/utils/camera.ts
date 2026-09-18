/**
 * Utilitário para captura e otimização de fotos de campo no PWA
 */

export interface ResultadoFoto {
  base64: string
  timestamp: string
}

export function capturarFotoCampo(): Promise<ResultadoFoto> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'

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

    input.onerror = (erro) => reject(erro)
    input.click()
  })
}

function redimensionarEComprimir(ficheiro: File, larguraMaxima = 400): Promise<string> {
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
        // Reduz para 50% de qualidade para ser extremamente leve
        const base64 = canvas.toDataURL('image/jpeg', 0.5)
        resolve(base64)
      }

      img.onerror = (erro) => reject(erro)
    }

    leitor.onerror = (erro) => reject(erro)
  })
}