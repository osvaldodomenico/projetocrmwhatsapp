const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? 'http://localhost:8080'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? ''

async function evolutionFetch(path: string, options: RequestInit = {}) {
  const url = `${EVOLUTION_API_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      apikey: EVOLUTION_API_KEY,
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Evolution API error ${res.status}: ${text}`)
  }

  return res.json()
}

export const whatsappService = {
  async createInstance(instanceName: string) {
    return evolutionFetch('/instance/create', {
      method: 'POST',
      body: JSON.stringify({ instanceName, qrcode: true }),
    })
  },

  async connectInstance(instanceName: string) {
    return evolutionFetch(`/instance/connect/${instanceName}`)
  },

  async getInstanceStatus(instanceName: string) {
    return evolutionFetch(`/instance/connectionState/${instanceName}`)
  },

  async sendTextMessage(instanceName: string, phone: string, message: string) {
    return evolutionFetch(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    })
  },

  async deleteInstance(instanceName: string) {
    return evolutionFetch(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    })
  },
}
