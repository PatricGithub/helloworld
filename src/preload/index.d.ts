import type { ApiChannels } from '@shared/api'

declare global {
  interface Window {
    api: {
      invoke: <K extends keyof ApiChannels>(
        channel: K,
        ...args: Parameters<ApiChannels[K]>
      ) => Promise<ReturnType<ApiChannels[K]>>
    }
  }
}
