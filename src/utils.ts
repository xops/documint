export function formatDID(did: string): string {
  return did.length <= 20 ? did : `${did.slice(0, 10)}...${did.slice(-6, -1)}`
}
