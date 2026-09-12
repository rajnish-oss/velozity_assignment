import { io, type Socket } from 'socket.io-client'

type Listener = (payload: any) => void

let socket: Socket | null = null

const socketUrl = import.meta.env.VITE_API_BASE_URL
export function connect() {
  const token = localStorage.getItem('accessToken')
  if (!token) return () => undefined

  if (!socket) {
    socket = io(socketUrl, {
      auth: { token, since: localStorage.getItem('lastActivityAt') },
      transports: ['websocket', 'polling'],
    })
  } else {
    socket.auth = { token, since: localStorage.getItem('lastActivityAt') }
    if (!socket.connected) socket.connect()
  }

  return () => {
    socket?.disconnect()
    socket = null
  }
}

export function on(event: string, listener: Listener) {
  if (event === 'connection:status') {
    const connected = () => listener('open')
    const disconnected = () => listener('closed')
    const failed = () => listener('closed')
    socket?.on('connect', connected)
    socket?.on('disconnect', disconnected)
    socket?.on('connect_error', failed)
    return () => {
      socket?.off('connect', connected)
      socket?.off('disconnect', disconnected)
      socket?.off('connect_error', failed)
    }
  }

  socket?.on(event, listener)
  return () => socket?.off(event, listener)
}
