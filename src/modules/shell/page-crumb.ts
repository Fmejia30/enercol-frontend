export function pageCrumb(pathname: string) {
  if (pathname.startsWith('/app/requests/') && pathname.includes('/reports/')) {
    return { section: 'Análisis', title: 'Informe técnico' }
  }
  if (pathname.startsWith('/app/requests/')) {
    return { section: 'Operación', title: 'Solicitud' }
  }
  if (pathname.startsWith('/app/requests')) {
    return { section: 'Operación', title: 'Solicitudes postventa' }
  }
  if (pathname.startsWith('/app/analyses')) {
    return { section: 'Análisis', title: 'Análisis técnicos' }
  }
  if (pathname.startsWith('/app/reports')) {
    return { section: 'Análisis', title: 'Informes técnicos' }
  }
  if (pathname.startsWith('/app/profile')) {
    return { section: 'Cuenta', title: 'Mi perfil' }
  }
  if (/^\/app\/users\/.+/.test(pathname)) {
    return { section: 'Administración', title: 'Usuario' }
  }
  if (pathname.startsWith('/app/users')) {
    return { section: 'Administración', title: 'Usuarios' }
  }
  return { section: 'Principal', title: 'Inicio' }
}
