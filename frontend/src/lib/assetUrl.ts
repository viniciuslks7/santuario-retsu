/** Resolve recursos públicos também quando o site vive num subdiretório. */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}${path.replace(/^\/+/, '')}`
}
