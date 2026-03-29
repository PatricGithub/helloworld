import type { ApiChannels } from '@shared/api'

export async function invoke<K extends keyof ApiChannels>(
  channel: K,
  ...args: Parameters<ApiChannels[K]>
): Promise<ReturnType<ApiChannels[K]>> {
  return window.api.invoke(channel, ...args) as Promise<ReturnType<ApiChannels[K]>>
}
