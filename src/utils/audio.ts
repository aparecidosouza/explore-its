/**
 * Utilitário para gravação e manipulação de áudio de campo no PWA (Bioacústica)
 */

export interface ResultadoAudio {
  base64: string
  duracaoSegundos: number
  timestamp: string
}

let mediaRecorder: MediaRecorder | null = null
let chunksAudio: Blob[] = []
let tempoInicio = 0

/**
 * Solicita acesso ao microfone e inicia a gravação de áudio
 */
export async function iniciarGravacaoAudio(): Promise<void> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('O seu navegador não suporta a gravação de áudio.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  chunksAudio = []
  tempoInicio = Date.now()

  // Define um formato compatível de áudio para navegadores móveis
  const mimeType = MediaRecorder.isTypeSupported('audio/webm')
    ? 'audio/webm'
    : 'audio/mp4'

  mediaRecorder = new MediaRecorder(stream, { mimeType })

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunksAudio.push(e.data)
    }
  }

  mediaRecorder.start()
}

/**
 * Para a gravação atual e converte o áudio gravado em Base64
 */
export function pararGravacaoAudio(): Promise<ResultadoAudio> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('Nenhuma gravação estava em andamento.'))
      return
    }

    mediaRecorder.onstop = () => {
      const duracao = Math.round((Date.now() - tempoInicio) / 1000)
      const blobAudio = new Blob(chunksAudio, { type: mediaRecorder?.mimeType || 'audio/webm' })
      
      // Encerra a utilização do microfone para libertar o hardware
      mediaRecorder?.stream.getTracks().forEach(track => track.stop())

      const leitor = new FileReader()
      leitor.readAsDataURL(blobAudio)
      leitor.onloadend = () => {
        resolve({
          base64: leitor.result as string,
          duracaoSegundos: duracao,
          timestamp: new Date().toISOString()
        })
      }
      leitor.onerror = (erro) => reject(erro)
    }

    mediaRecorder.stop()
  })
}