export function appName() {
  const name = import.meta.env.VITE_APP_NAME?.trim()
  return name || 'EnerCol'
}
