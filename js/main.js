// TEMPORAL (pruebas): con true se acepta cualquier contraseña (o ninguna). Poner en false para exigir la contraseña real.
const LOGIN_SIN_PASSWORD_TEMPORAL = true;

const TIPOS_OFICIO = {
  oficio: 'oficios',
  memorandum: 'memorandums',
  circular: 'circulares',
  incidencias: 'incidencias',
  'memorandum_comision': 'memorandums_comision'
};

const NOMBRES_OFICIO = {
  oficios: 'Oficio',
  memorandums: 'Memorandum',
  circulares: 'Circular',
  incidencias: 'Incidencias',
  memorandums_comision: 'Memorandum Comisión'
};

// Foliador: nivel derivado del área
const ROLES = {
  ADMINISTRADOR: 1,
  VISOR: 2,
  FOLIADOR: 3
};

const NOMBRES_ROLES = {
  1: 'Administrador',
  2: 'Visor',
  3: 'Foliador'
};

// Datos de prueba

function crearDatosPrueba() {
  const usuariosPrueba = {
    'user-admin': {
      id: 'user-admin',
      nombre: 'Administrador del Sistema',
      numero_empleado: 'ADM-001',
      password: '1234',
      rol: ROLES.ADMINISTRADOR,
      area: 1,
      activo: true
    },
    'user-visor': {
      id: 'user-visor',
      nombre: 'Secretaria de la Dependencia',
      numero_empleado: 'SEC-001',
      password: '1234',
      rol: ROLES.VISOR,
      area: 1,
      activo: true
    },
    'user-titular': {
      id: 'user-titular',
      nombre: 'Foliador de Secretaría',
      numero_empleado: 'LS-001',
      password: '1234',
      rol: ROLES.FOLIADOR,
      area: 1,
      activo: true
    },
    'user-asignador-dir': {
      id: 'user-asignador-dir',
      nombre: 'Foliador de Área · Dirección de Administración',
      numero_empleado: 'LD-001',
      password: '1234',
      rol: ROLES.FOLIADOR,
      area: 3,
      activo: true
    },
    'user-asignador-unidad': {
      id: 'user-asignador-unidad',
      nombre: 'Foliador de Área · Jefatura de Unidad de Informática',
      numero_empleado: 'LD-002',
      password: '1234',
      rol: ROLES.FOLIADOR,
      area: 5,
      activo: true
    },
    'user-asignador-area-cap': {
      id: 'user-asignador-area-cap',
      nombre: 'Foliador de Área · Área de Captura',
      numero_empleado: 'SOL-001',
      password: '1234',
      rol: ROLES.FOLIADOR,
      area: 6,
      activo: true
    },
    'user-asignador-area-sop': {
      id: 'user-asignador-area-sop',
      nombre: 'Foliador de Área · Área de Soporte Técnico',
      numero_empleado: 'SOL-002',
      password: '1234',
      rol: ROLES.FOLIADOR,
      area: 7,
      activo: true
    },
    'user-asignador-area-dev': {
      id: 'user-asignador-area-dev',
      nombre: 'Foliador de Área · Área de Desarrollo de Sistemas',
      numero_empleado: 'SOL-003',
      password: '1234',
      rol: ROLES.FOLIADOR,
      area: 8,
      activo: true
    }
  };

  const oficiosData = {
    'oficios': [],
    'memorandums': [],
    'circulares': [],
    'incidencias': [],
    'memorandums_comision': []
  };

  const areasData = [
    { id: 1, nombre: 'Secretaría de la Dependencia', sigla: 'SPyAP', padre: null, activo: true },
    { id: 2, nombre: 'Subsecretaría de Planeación', sigla: 'SS', padre: 1, activo: true },
    { id: 3, nombre: 'Dirección de Administración', sigla: 'DG', padre: 1, activo: true },
    { id: 4, nombre: 'Jefatura de Recursos Humanos', sigla: 'JD', padre: 3, activo: true },
    { id: 5, nombre: 'Jefatura de Unidad de Informática', sigla: 'JU', padre: 3, activo: true },
    { id: 6, nombre: 'Área de Captura', sigla: 'AC', padre: 5, activo: true },
    { id: 7, nombre: 'Área de Soporte Técnico', sigla: 'ST', padre: 5, activo: true },
    { id: 8, nombre: 'Área de Desarrollo de Sistemas', sigla: 'DS', padre: 5, activo: true }
  ];

  function datosValidos(value, tipo) {
    try {
      const parsed = JSON.parse(localStorage.getItem(value));
      if (tipo === 'array') return Array.isArray(parsed);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch (e) {
      return false;
    }
  }

  // Solo se siembra lo que falta o está corrupto: nunca se sobrescriben datos ya capturados.
  const VERSION_DATOS = 'usuario-contrasena';
  if (!datosValidos('usuarios', 'object')) localStorage.setItem('usuarios', JSON.stringify(usuariosPrueba));
  if (!datosValidos('areas', 'array')) guardarAreas(areasData);
  if (!datosValidos('oficios', 'object')) guardarOficios(oficiosData);
  localStorage.setItem('cd_version_datos', VERSION_DATOS);
}

crearDatosPrueba();

// Autenticación

function login(numeroEmpleado, password) {
  const usuarios = JSON.parse(localStorage.getItem('usuarios')) || {};
  const empleadoNorm = (numeroEmpleado || '').trim().toUpperCase();

  let usuarioEncontrado = null;
  for (const key of Object.keys(usuarios)) {
    const usuario = usuarios[key];
    if (usuario && usuario.numero_empleado === empleadoNorm) {
      usuarioEncontrado = usuario;
      break;
    }
  }

  if (!usuarioEncontrado) {
    return { success: false, mensaje: 'Credenciales inválidas' };
  }

  // Con la bandera apagada, un usuario sin contraseña registrada ya NO puede entrar.
  if (!LOGIN_SIN_PASSWORD_TEMPORAL && (!usuarioEncontrado.password || usuarioEncontrado.password !== password)) {
    return { success: false, mensaje: 'Credenciales inválidas' };
  }

  if (usuarioEncontrado.activo === false) {
    return { success: false, mensaje: 'El usuario está desactivado. Contacte al administrador' };
  }

  const areaUsuario = normalizarAreaId(usuarioEncontrado.area);

  const sessionData = {
    id: usuarioEncontrado.id,
    nombre: usuarioEncontrado.nombre,
    numero_empleado: usuarioEncontrado.numero_empleado,
    rol: usuarioEncontrado.rol,
    area: areaUsuario,
    loggedIn: true
  };

  localStorage.setItem('session', JSON.stringify(sessionData));
  return { success: true, session: sessionData };
}

function logout() {
  localStorage.removeItem('session');
  window.location.href = 'index.html';
}

// La sesión guardada solo identifica al usuario; rol, área y estado se leen SIEMPRE del registro
// de usuarios, así que editar la sesión a mano ya no concede otro rol ni sobrevive a una desactivación.
function getSession() {
  let guardada = null;
  try { guardada = JSON.parse(localStorage.getItem('session')); } catch (e) { guardada = null; }
  if (!guardada || !guardada.id) return null;
  const u = getUsuarios()[guardada.id];
  if (!u || u.activo === false) {
    localStorage.removeItem('session');
    return null;
  }
  return {
    id: u.id,
    nombre: u.nombre,
    numero_empleado: u.numero_empleado,
    rol: u.rol,
    area: normalizarAreaId(u.area),
    loggedIn: true
  };
}

function hasPermission(accion) {
  const session = getSession();
  if (!session) return false;

  const permisos = {
    [ROLES.ADMINISTRADOR]: ['todos'],
    [ROLES.VISOR]: ['consultar_oficios'],
    [ROLES.FOLIADOR]: ['asignar_oficio', 'solicitar_oficio']
  };

  // El área central no solicita folios (no hay nivel superior).
  if (accion === 'solicitar_oficio' && esAreaCentral(session.area)) return false;

  const rolPermisos = permisos[session.rol] || [];
  return rolPermisos.includes('todos') || rolPermisos.includes(accion);
}

// Utilidades de áreas

function getAreas() {
  try {
    const data = JSON.parse(localStorage.getItem('areas'));
    if (Array.isArray(data)) {
      return data.filter(a => a && typeof a === 'object' && a.id !== null && a.id !== undefined);
    }
  } catch (e) { /* dato corrupto: devolver vacío para repararlo abajo */ }
  return [];
}

function getSiglaArea(areaRef) {
  const areas = getAreas();
  const area = areas.find(a => a.sigla === areaRef) ||
               areas.find(a => String(a.id) === String(areaRef));
  return area ? area.sigla : null;
}

function getAreaIdBySigla(sigla) {
  const areas = getAreas();
  const area = areas.find(a => a.sigla === sigla);
  return area ? area.id : null;
}

function getSiglaByAreaId(id) {
  const area = getAreaById(id);
  return area ? area.sigla : null;
}

function getAreaById(id) {
  const areas = getAreas();
  return areas.find(a => a.id === Number(id)) || null;
}

function getAreaNameById(id) {
  const area = getAreaById(id);
  return area ? area.nombre || area.nombre_area : 'N/A';
}

// Área raíz (padre nulo): única que recibe y asigna solicitudes.
function getAreaRaiz() {
  const areas = getAreas();
  return areas.find(a => a && a.activo && a.padre == null) || areas.find(a => a) || null;
}

function esAreaCentral(areaId) {
  if (areaId == null) return false;
  const area = getAreaById(areaId);
  return !!area && area.padre == null;
}

// Nivel jerárquico derivado del árbol (raíz=1); no se almacena.
function nivelDeArea(area) {
  if (!area) return 1;
  let nivel = 1;
  let actual = area;
  let pasos = 0;
  while (actual && actual.padre != null) {
    actual = getAreaById(actual.padre);
    nivel++;
    if (++pasos > 50) break; // protección contra ciclos en los datos
  }
  return nivel;
}

function guardarAreas(areas) {
  localStorage.setItem('areas', JSON.stringify(areas));
}

function guardarUsuarios(usuarios) {
  localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

function getUsuarios() {
  try {
    const data = JSON.parse(localStorage.getItem('usuarios'));
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const limpio = {};
      Object.keys(data).forEach(k => {
        if (data[k] && typeof data[k] === 'object') limpio[k] = data[k];
      });
      return limpio;
    }
  } catch (e) { /* dato corrupto */ }
  return {};
}

function guardarOficios(tablas) {
  localStorage.setItem('oficios', JSON.stringify(tablas));
}

function getOficios() {
  try {
    const data = JSON.parse(localStorage.getItem('oficios'));
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const limpio = {};
      Object.keys(data).forEach(k => {
        limpio[k] = Array.isArray(data[k]) ? data[k] : [];
      });
      return limpio;
    }
  } catch (e) { /* dato corrupto */ }
  return {};
}

function generarNextAreaId() {
  const areas = getAreas();
  return areas.reduce((max, a) => Math.max(max, a.id || 0), 0) + 1;
}

function generarNextUserId() {
  const usuarios = getUsuarios();
  const keys = Object.keys(usuarios);
  return keys.reduce((max, k) => {
    const n = parseInt((k.match(/(\d+)$/) || [0, 0])[1], 10);
    return Math.max(max, n || 0);
  }, 0) + 1;
}

function areaExistsBySigla(sigla, exceptId) {
  return getAreas().some(a => a.sigla === sigla && (exceptId == null || String(a.id) !== String(exceptId)));
}

function empleadoExists(numeroEmpleado, exceptId) {
  return Object.values(getUsuarios()).some(u =>
    u.numero_empleado === numeroEmpleado && (exceptId == null || String(u.id) !== String(exceptId))
  );
}

function escapeHtml(texto) {
  return String(texto == null ? '' : texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Escapa para JS dentro de comillas simples (paso 1 de escapeJs)
function escaparJsCrudo(texto) {
  return String(texto == null ? '' : texto)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// Escapa para atributos onclick: primero JS y luego HTML (el navegador decodifica el atributo antes de ejecutarlo).
function escapeJs(texto) {
  return escapeHtml(escaparJsCrudo(texto));
}

// ---- Utilidades de integridad y permisos ----

// Normaliza un id de área a número cuando viene como texto numérico.
function normalizarAreaId(valor) {
  if (typeof valor === 'string' && valor.trim() !== '') {
    const n = Number(valor.trim());
    if (!Number.isNaN(n) && String(n) === valor.trim()) return n;
  }
  return valor;
}

// Bitácora por folio: quién, cuándo y qué cambió.
function registrarHistorial(f, accion, detalle) {
  const s = getSession();
  if (!Array.isArray(f.historial)) f.historial = [];
  f.historial.push({
    fecha: new Date().toISOString(),
    usuario: s ? s.numero_empleado : 'sistema',
    accion: accion,
    detalle: detalle || ''
  });
}

// El administrador gestiona cualquier folio; un foliador solo los de la serie de su propia área.
function puedeGestionarFolio(f, session) {
  if (!session || !f) return false;
  if (Number(session.rol) === ROLES.ADMINISTRADOR) return true;
  return hasPermission('asignar_oficio') && String(f.id_area) === String(session.area);
}

function areaTieneFolios(areaId) {
  const oficios = getOficios();
  return Object.keys(TIPOS_OFICIO).map(k => TIPOS_OFICIO[k]).some(tabla =>
    (oficios[tabla] || []).some(f =>
      String(f.id_area) === String(areaId) || String(f.id_area_solicitante) === String(areaId)));
}

// ¿areaId cuelga (en cualquier nivel) de ancestroId?
function esDescendienteDe(areaId, ancestroId) {
  let actual = getAreaById(areaId);
  let pasos = 0;
  while (actual && actual.padre != null && pasos++ < 50) {
    if (String(actual.padre) === String(ancestroId)) return true;
    actual = getAreaById(actual.padre);
  }
  return false;
}

// Generación de folios

// Siguiente número de la serie. Cuenta todos los folios con número (incluye Cancelado y Rechazado
// para no reutilizarlos) y reinicia en 001 cada año. Si areaId es null cuenta toda la tabla.
function calcularSiguienteNumero(tabla, areaId, anio) {
  const datosTabla = getOficios()[tabla] || [];
  const anioActual = anio ? Number(anio) : new Date().getFullYear();
  let re = /^[^/]+\/(\d+)\/(\d{4})$/;
  if (areaId != null) {
    const sigla = getSiglaByAreaId(areaId);
    if (!sigla) return calcularSiguienteNumero(tabla, null, anio);
    re = new RegExp('^' + sigla.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/(\\d+)/(\\d{4})$');
  }
  let max = 0;
  datosTabla.forEach(f => {
    if (areaId != null && Number(f.id_area) !== Number(areaId)) return;
    const match = re.exec(String(f.folio || ''));
    if (!match) return;
    if (parseInt(match[2], 10) === anioActual) max = Math.max(max, parseInt(match[1], 10));
  });
  return max + 1;
}

function siguienteNumeroFolio(tabla, anio) {
  return calcularSiguienteNumero(tabla, null, anio);
}

// Numeración independiente por área y tipo.
function siguienteNumeroFolioArea(tabla, areaId, anio) {
  return calcularSiguienteNumero(tabla, areaId, anio);
}

// Año (número) de una fecha 'AAAA-MM-DD'; null si no es válida.
function anioDeFecha(fecha) {
  const m = /^(\d{4})-/.exec(aFechaLocal(fecha));
  return m ? Number(m[1]) : null;
}

// Año al que pertenece un folio: el año de la FECHA DEL DOCUMENTO (con la que sale el documento).
// Solo si el registro no tiene fecha del documento se recurre al año de su serie (SIGLA/NNN/AAAA),
// al campo anio o, en último término, a la fecha de solicitud.
function anioDeFolio(f) {
  if (!f) return null;
  const n = numeroDeFolio(f.folio);
  return anioDeFecha(f.fecha_documento) || (n ? n.anio : null) || (f.anio ? Number(f.anio) : null) || anioDeFecha(f.fecha_solicitud);
}

// Orden de folios: año descendente y, dentro del año, número descendente.
function compararFoliosDesc(a, b) {
  const na = numeroDeFolio(a.f.folio), nb = numeroDeFolio(b.f.folio);
  if (na && nb) {
    if (na.anio !== nb.anio) return nb.anio - na.anio;
    if (na.numero !== nb.numero) return nb.numero - na.numero;
  }
  return String(b.f.folio || '').localeCompare(String(a.f.folio || ''));
}

// Genera folio con la nomenclatura SIGLA/NUMERO/AÑO.
// El año del folio (y su numeración, que reinicia en 001 cada año) sale de la fecha del documento.
function generarFolioAutomatico(tipoOficio, areaSigla, areaId, anioFolio) {
  const anio = anioFolio ? Number(anioFolio) : new Date().getFullYear();
  const tabla = TIPOS_OFICIO[tipoOficio];
  if (!tabla) return null;

  const sigla = getSiglaArea(areaSigla);
  if (!sigla) return null;
  const siguienteNumero = (areaId != null) ? siguienteNumeroFolioArea(tabla, areaId, anio) : siguienteNumeroFolio(tabla, anio);
  return `${sigla}/${String(siguienteNumero).padStart(3, '0')}/${anio}`;
}

// Ruteo de dashboards

function getDashboardByRol(session) {
  if (!session) return 'index.html';
  const rol = Number(session.rol);
  if (rol === ROLES.ADMINISTRADOR) return 'dashboard-admin.html';
  if (rol === ROLES.VISOR) return 'dashboard-visor-general.html';
  if (rol === ROLES.FOLIADOR) {
    // El foliador central asigna solicitudes; los demás asignan sus propios folios y solicitan a la central.
    return esAreaCentral(session.area)
      ? 'dashboard-asignador-superior.html'
      : 'dashboard-asignador-area.html';
  }
  return 'index.html';
}

// Utilidades de UI

const TOAST_CONFIG = {
  success: {
    color: '#10b981',
    icono: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  },
  danger: {
    color: '#f87171',
    icono: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
  },
  warning: {
    color: '#fbbf24',
    icono: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>'
  },
  info: {
    color: '#60a5fa',
    icono: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
  }
};

const TOAST_DURACION = { success: 3200, danger: 4800, warning: 4800, info: 3600 };

function showToast(mensaje, tipo = 'info', opciones = '') {
  const conf = TOAST_CONFIG[tipo] || TOAST_CONFIG.info;
  const toasts = document.getElementById('toast-container') || createToastContainer();
  if (typeof toasts.classList !== 'undefined'
      && typeof toasts.classList.contains === 'function'
      && !toasts.classList.contains('toast-container')
      && typeof toasts.classList.add === 'function') {
    toasts.classList.add('toast-container');
  }
  if (typeof toasts.getAttribute === 'function' && !toasts.getAttribute('aria-live')) {
    toasts.setAttribute('aria-live', 'polite');
    toasts.setAttribute('aria-atomic', 'false');
  }
  asegurarCierreConEscape();
  const config = typeof opciones === 'string' ? { detalle: opciones } : (opciones || {});
  const duracion = config.persistente ? 0 : (config.duracion || TOAST_DURACION[tipo] || TOAST_DURACION.info);
  const detalle = config.detalle || config.detalles || '';
  const expandible = config.expandible || '';
  const accion = config.accion && typeof config.accion.onClick === 'function' ? config.accion : null;

  const toast = document.createElement('div');
  toast.className = `cd-toast cd-toast--${tipo}${duracion ? '' : ' cd-toast--persistente'}`;
  toast.setAttribute('role', tipo === 'danger' || tipo === 'warning' ? 'alert' : 'status');
  toast.style.setProperty('--duracion', duracion + 'ms');
  toast.style.setProperty('--toast-color', conf.color);
  toast.innerHTML = `
    <span class="cd-toast__icon">${conf.icono}</span>
    <div class="cd-toast__cuerpo">
      <p class="cd-toast__titulo">${escapeHtml(mensaje)}</p>
      ${detalle ? `<p class="cd-toast__detalle">${escapeHtml(detalle)}</p>` : ''}
      ${expandible ? `
        <button type="button" class="cd-toast__detalle-toggle" aria-expanded="false">Ver detalles</button>
        <div class="cd-toast__detalle-expandible"><div><p>${escapeHtml(expandible)}</p></div></div>
      ` : ''}
      ${accion ? `<div class="cd-toast__acciones"><button type="button" class="cd-toast__accion">${escapeHtml(accion.etiqueta || 'Ver')}</button></div>` : ''}
    </div>
    <button type="button" class="cd-toast__cerrar" aria-label="Cerrar">&times;</button>
    <span class="cd-toast__barra" aria-hidden="true"></span>
  `;

  toasts.appendChild(toast);

  toast.querySelector('.cd-toast__cerrar').addEventListener('click', () => cerrarToast(toast));
  const toggleDetalle = toast.querySelector('.cd-toast__detalle-toggle');
  if (toggleDetalle) {
    toggleDetalle.addEventListener('click', () => {
      const expandido = toast.classList.toggle('cd-toast--expandido');
      toggleDetalle.setAttribute('aria-expanded', String(expandido));
      toggleDetalle.textContent = expandido ? 'Ocultar detalles' : 'Ver detalles';
    });
  }
  const botonAccion = toast.querySelector('.cd-toast__accion');
  if (botonAccion) {
    botonAccion.addEventListener('click', () => {
      accion.onClick();
      if (accion.cerrar !== false) cerrarToast(toast);
    });
  }

  requestAnimationFrame(() => toast.classList.add('cd-toast--visible'));

  let restante = duracion;
  let inicio = null;
  let temporal = null;

  const valido = () => restante > 0 && !toast.classList.contains('cd-toast--saliendo') && document.body.contains(toast);
  const getBarra = () => toast.querySelector('.cd-toast__barra');

  const detenerCierre = () => {
    if (!valido()) return;
    const barra = getBarra();
    if (!barra) return;
    if (getComputedStyle(barra).animationPlayState === 'running') {
      restante = Math.max(0, restante - (Date.now() - inicio));
      barra.style.animationPlayState = 'paused';
    }
    if (temporal) { clearTimeout(temporal); temporal = null; }
  };

  const reanudarCierre = () => {
    if (!valido()) return;
    if (restante <= 0) { cerrarToast(toast); return; }
    const barra = getBarra();
    if (!barra) return;
    barra.style.animationPlayState = 'running';
    inicio = Date.now();
    temporal = setTimeout(() => cerrarToast(toast), restante);
  };

  ['mouseenter', 'focusin'].forEach(e => toast.addEventListener(e, detenerCierre));
  ['mouseleave', 'focusout'].forEach(e => toast.addEventListener(e, reanudarCierre));

  if (duracion) {
    inicio = Date.now();
    temporal = setTimeout(() => cerrarToast(toast), duracion);
  }
  asegurarCierreConEscape();

  while (toasts.children.length > 3) cerrarToast(toasts.firstElementChild);
}

function cerrarToast(el) {
  if (!el || !el.classList || el.classList.contains('cd-toast--saliendo')) return;
  if (!document.body.contains(el)) return;
  el.classList.add('cd-toast--saliendo');
  el.addEventListener('transitionend', () => el.remove(), { once: true });
  setTimeout(() => el.remove(), 400);
}

let _escListenersRegistrados = false;

function asegurarCierreConEscape() {
  if (!_escListenersRegistrados) {
    _escListenersRegistrados = true;
    document.addEventListener('keydown', cerrarConEscape);
  }
}

function cerrarConEscape(e) {
  if (e.key !== 'Escape') return;
  const toasts = document.getElementById('toast-container');
  if (!toasts || !toasts.children.length) return;
  e.preventDefault();
  cerrarToast(toasts.lastElementChild);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  container.setAttribute('aria-live', 'polite');
  container.setAttribute('aria-atomic', 'false');
  document.body.appendChild(container);
  return container;
}

// Calendario de folios

function aFechaLocal(fecha) {
  if (!fecha) return '';
  const texto = String(fecha).trim();
  const partes = texto.slice(0, 10).split('-').map(Number);
  if (partes.length === 3 && !isNaN(partes[0]) && !isNaN(partes[1]) && !isNaN(partes[2])) {
    return partes[0] + '-' + String(partes[1]).padStart(2, '0') + '-' + String(partes[2]).padStart(2, '0');
  }
  const d = new Date(texto);
  if (isNaN(d.getTime())) return '';
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function fechaHoyLocal() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function presentarFecha(fecha, opciones) {
  const local = aFechaLocal(fecha);
  if (!local) return 'N/A';
  const partes = local.split('-').map(Number);
  return new Date(partes[0], partes[1] - 1, partes[2]).toLocaleDateString('es-MX', opciones || { day: 'numeric', month: 'long', year: 'numeric' });
}

function resolverSolicitante(texto, session) {
  const txt = (texto || '').trim();
  if (txt) {
    const usuarios = getUsuarios();
    for (const k of Object.keys(usuarios)) {
      const u = usuarios[k];
      if (u && String(u.numero_empleado).toUpperCase() === txt.toUpperCase()) {
        return { id: u.id, nombre: u.nombre || txt };
      }
    }
    return { id: session ? session.id : null, nombre: txt };
  }
  return { id: session ? session.id : null, nombre: session ? session.nombre : '' };
}

// Puebla el <datalist> con usuarios registrados.
function poblarDatalistSolicitantes() {
  const datalist = document.getElementById('lista-solicitantes');
  if (!datalist) return;
  datalist.innerHTML = '';
  const usuarios = getUsuarios();
  const opciones = [];
  Object.keys(usuarios).forEach(k => {
    const u = usuarios[k];
    if (!u || u.activo === false || !u.numero_empleado) return;
    const etiqueta = [u.nombre, u.numero_empleado, getAreaNameById(u.area)].filter(Boolean).join(' · ');
    opciones.push({ valor: String(u.numero_empleado), etiqueta: etiqueta });
  });
  opciones.sort(function (a, b) { return a.valor.localeCompare(b.valor); });
  opciones.forEach(function (o) {
    const opt = document.createElement('option');
    opt.value = o.valor;
    opt.textContent = o.etiqueta;
    datalist.appendChild(opt);
  });
}

// Etiqueta del foliador según el área (central vs área).
function etiquetaRol(session) {
  if (!session) return '';
  if (Number(session.rol) === Number(ROLES.FOLIADOR)) {
    return esAreaCentral(session.area) ? 'Foliador de Secretaría' : 'Foliador de Área';
  }
  return NOMBRES_ROLES[session.rol] || 'Desconocido';
}

// Texto rol · área para la barra superior.
function descAreaUsuario(session) {
  if (!session) return '';
  const rol = etiquetaRol(session);
  const area = session.area != null ? getAreaNameById(session.area) : '';
  return area ? rol + ' · ' + area : rol;
}

function nombreRol(idRol) {
  return NOMBRES_ROLES[idRol] || 'Desconocido';
}

function pintarUsuario(session) {
  const iniciales = (session.nombre || '?').split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('avatar-iniciales').textContent = iniciales;
  document.getElementById('nombre-usuario').textContent = session.nombre + ' (' + session.numero_empleado + ')';
  document.getElementById('area-usuario').textContent = descAreaUsuario(session);
  document.getElementById('rol-badge').textContent = etiquetaRol(session);
  document.getElementById('rol-badge').className = 'rol-badge rol-' + session.rol;
}

function badgeEstatus(estatus) {
  if (estatus === 'Pendiente') return '<span class="badge-status badge-pendiente">Pendiente</span>';
  if (estatus === 'Asignado') return '<span class="badge-status badge-asignado">Asignado</span>';
  if (estatus === 'Rechazado') return '<span class="badge-status badge-rechazado">Rechazado</span>';
  if (estatus === 'Cancelado') return '<span class="badge-status badge-cancelado">Cancelado</span>';
  return `<span class="badge bg-secondary text-capitalize">${escapeHtml(estatus || 'N/A')}</span>`;
}

function cerrarSesion() {
  logout();
}

// Guarda de arranque: valida sesión y permiso/rol.
function sesionVigente(opciones) {
  const session = getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  const sinAcceso = opciones.rol != null
    ? Number(session.rol) !== Number(opciones.rol)
    : !hasPermission(opciones.permiso);
  if (sinAcceso) {
    showToast(opciones.mensaje || 'No tiene permiso', 'danger');
    window.location.href = getDashboardByRol(session);
    return null;
  }
  return session;
}

function llenarSelectAreas(selectId, areasLista) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const lista = (Array.isArray(areasLista) && areasLista.length ? areasLista : getAreas()).filter(a => a.activo !== false);
  lista.forEach(area => {
    const option = document.createElement('option');
    option.value = area.sigla;
    option.textContent = area.nombre + ' (' + area.sigla + ')';
    select.appendChild(option);
  });
}

// Selector tipo de documento (chips)

const SVG_ICONO_OFICIO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8"/></svg>';
const SVG_ICONO_MEMORANDUM = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12l2 2 4-4"/></svg>';
const SVG_ICONO_CIRCULAR = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>';
const SVG_ICONO_INCIDENCIAS = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>';
const SVG_ICONO_COMISION = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></svg>';

const TIPOS_DOCUMENTO_CHIP = {
  oficio: { label: 'Oficio', icono: SVG_ICONO_OFICIO },
  memorandum: { label: 'Memorándum', icono: SVG_ICONO_MEMORANDUM },
  circular: { label: 'Circular', icono: SVG_ICONO_CIRCULAR },
  incidencias: { label: 'Incidencias', icono: SVG_ICONO_INCIDENCIAS },
  memorandum_comision: { label: 'Comisión', icono: SVG_ICONO_COMISION }
};


// ---- Campo de origen según el tipo de documento ----
// Solo Oficio y Memorándum capturan "Cargo/Dependencia de Origen"
// (campo cargo_dependencia_origen). Circular, Incidencias y Comisión no lo tienen.
const TIPOS_CON_CARGO_ORIGEN = ['oficio', 'memorandum'];
const ETIQUETA_CARGO_ORIGEN = 'Cargo/Dependencia de Origen';

function tipoUsaCargoOrigen(tipo) {
  return TIPOS_CON_CARGO_ORIGEN.indexOf(tipo) !== -1;
}

function etiquetaOrigen() {
  return ETIQUETA_CARGO_ORIGEN;
}

function tipoDeRegistro(f, tabla) {
  if (f && f.tipo_oficio) return f.tipo_oficio;
  return Object.keys(TIPOS_OFICIO).find(function (k) { return TIPOS_OFICIO[k] === tabla; }) || null;
}

function valorOrigen(f, tabla) {
  if (!f) return '';
  const tipo = tipoDeRegistro(f, tabla);
  if (tipo && !tipoUsaCargoOrigen(tipo)) return '';
  return f.cargo_dependencia_origen || '';
}

// Guarda el cargo/dependencia de origen solo si el tipo lo maneja.
function asignarOrigenARegistro(f, tipo, valor) {
  f.cargo_dependencia_origen = tipoUsaCargoOrigen(tipo) ? (valor || '').trim() : '';
}

// Muestra u oculta el campo de origen del formulario según el tipo elegido.
function actualizarCamposOrigen(contenedor) {
  if (!contenedor) return;
  const form = contenedor.closest('form');
  if (!form) return;
  const usaCargo = tipoUsaCargoOrigen(contenedor.getAttribute('data-seleccion') || 'oficio');
  form.querySelectorAll('[data-campo-origen]').forEach(function (grupo) {
    grupo.hidden = !usaCargo;
    const input = grupo.querySelector('input');
    if (!input) return;
    input.disabled = !usaCargo;
    input.required = usaCargo;
    if (!usaCargo) input.value = '';
  });
}

// Valor capturado en el formulario del contenedor de chips ('' si el tipo no usa el campo).
function leerOrigenFormulario(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  const form = contenedor ? contenedor.closest('form') : null;
  if (!form) return '';
  if (!tipoUsaCargoOrigen(getTipoOficioChipSeleccionado(contenedorId))) return '';
  const input = form.querySelector('[data-campo-origen] input');
  return input ? input.value.trim() : '';
}

// Callbacks por contenedor para refrescar el resumen al cambiar de tipo.
const _cambioTipoChip = {};

function registrarCambioTipoChip(contenedorId, onChange) {
  _cambioTipoChip[contenedorId] = onChange;
}

function notificarCambioTipoChip(contenedor) {
  if (!contenedor || !contenedor.id) return;
  const onChange = _cambioTipoChip[contenedor.id];
  actualizarCamposOrigen(contenedor);
  if (typeof onChange === 'function') onChange(getTipoOficioChipSeleccionado(contenedor.id));
}

function selectTipoChip(contenedor, tipo) {
  if (contenedor.getAttribute('data-modo') === 'fijo') {
    const pill = contenedor.querySelector('.tipo-chip--fijo');
    if (pill) {
      const info = TIPOS_DOCUMENTO_CHIP[tipo] || { label: NOMBRES_OFICIO[TIPOS_OFICIO[tipo]] || tipo, icono: SVG_ICONO_OFICIO };
      pill.innerHTML = `<span class="tipo-chip__icono">${info.icono}</span><span class="tipo-chip__label">${info.label}</span>`;
    }
    contenedor.setAttribute('data-seleccion', tipo);
    notificarCambioTipoChip(contenedor);
    return;
  }
  Array.from(contenedor.children).forEach(btn => {
    const esActivo = btn.getAttribute('data-tipo') === tipo;
    btn.classList.toggle('tipo-chip--activo', esActivo);
    btn.setAttribute('aria-checked', String(esActivo));
  });
  contenedor.setAttribute('data-seleccion', tipo);
  notificarCambioTipoChip(contenedor);
}

function renderTipoOficioChips(contenedorId, onChange, tipoInicial) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor || contenedor.getAttribute('data-chips')) return;
  registrarCambioTipoChip(contenedorId, onChange);
  contenedor.setAttribute('data-chips', '1');
  contenedor.setAttribute('role', 'radiogroup');
  contenedor.setAttribute('aria-label', 'Tipo de documento');

  const tipos = Object.keys(TIPOS_OFICIO);
  const seleccionado = tipos.includes(tipoInicial) ? tipoInicial : 'oficio';
  contenedor.innerHTML = '';

  tipos.forEach(tipo => {
    const info = TIPOS_DOCUMENTO_CHIP[tipo] || { label: NOMBRES_OFICIO[TIPOS_OFICIO[tipo]] || tipo, icono: SVG_ICONO_OFICIO };
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tipo-chip' + (tipo === seleccionado ? ' tipo-chip--activo' : '');
    btn.setAttribute('data-tipo', tipo);
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(tipo === seleccionado));
    btn.innerHTML = `<span class="tipo-chip__icono">${info.icono}</span><span class="tipo-chip__label">${info.label}</span><span class="tipo-chip__check">✓</span>`;
    btn.addEventListener('click', function () {
      selectTipoChip(contenedor, tipo);
    });
    contenedor.appendChild(btn);
  });

  contenedor.setAttribute('data-seleccion', seleccionado);
  actualizarCamposOrigen(contenedor);
}

function renderTipoOficioFijo(contenedorId, tipoInicial, onChange) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor || contenedor.getAttribute('data-chips')) return;
  registrarCambioTipoChip(contenedorId, onChange);
  contenedor.setAttribute('data-chips', '1');
  contenedor.setAttribute('data-modo', 'fijo');
  contenedor.setAttribute('aria-label', 'Tipo de documento elegido');

  const tipos = Object.keys(TIPOS_OFICIO);
  const seleccionado = tipos.includes(tipoInicial) ? tipoInicial : 'oficio';
  const info = TIPOS_DOCUMENTO_CHIP[seleccionado] || { label: NOMBRES_OFICIO[TIPOS_OFICIO[seleccionado]] || seleccionado, icono: SVG_ICONO_OFICIO };

  const pill = document.createElement('span');
  pill.className = 'tipo-chip tipo-chip--activo tipo-chip--fijo';
  pill.innerHTML = `<span class="tipo-chip__icono">${info.icono}</span><span class="tipo-chip__label">${info.label}</span>`;
  contenedor.appendChild(pill);
  contenedor.setAttribute('data-seleccion', seleccionado);
  actualizarCamposOrigen(contenedor);
  if (typeof onChange === 'function') onChange(seleccionado);
}

function getTipoOficioChipSeleccionado(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  const tipo = contenedor ? contenedor.getAttribute('data-seleccion') : null;
  return TIPOS_OFICIO[tipo] ? tipo : 'oficio';
}

function setTipoOficioChip(contenedorId, tipo) {
  const contenedor = document.getElementById(contenedorId);
  if (contenedor && TIPOS_OFICIO[tipo]) selectTipoChip(contenedor, tipo);
}

function asignarOficio(tipo, areaSigla, asunto, fechaDoc, session, idSolicitanteInput, dirigidoA, origen) {
  if (!areaSigla || !session || !hasPermission('asignar_oficio')) return null;
  const areaId = getAreaIdBySigla(areaSigla);
  if (areaId == null) return null;
  // Un foliador solo puede foliar en la serie de su propia área.
  if (Number(session.rol) !== ROLES.ADMINISTRADOR && String(areaId) !== String(session.area)) return null;
  const anioFolio = anioDeFecha(fechaDoc) || new Date().getFullYear();
  const folio = generarFolioAutomatico(tipo, areaSigla, areaId, anioFolio);
  if (!folio) return null;

  const tabla = TIPOS_OFICIO[tipo];
  const tablas = getOficios();
  if (!tablas[tabla]) tablas[tabla] = [];

  const solicitante = resolverSolicitante(document.getElementById(idSolicitanteInput).value, session);
  tablas[tabla].push({
    folio: folio,
    tipo_oficio: tipo,
    id_area: areaId,
    cargo_dependencia_origen: tipoUsaCargoOrigen(tipo) ? (origen || '') : '',
    dirigido_a: dirigidoA || '',
    asunto: asunto,
    fecha_documento: fechaDoc,
    fecha_solicitud: fechaHoyLocal(),
    id_usuario_solicitante: solicitante.id,
    nombre_solicitante: solicitante.nombre,
    id_usuario_liberador: session.id,
    estatus: 'Asignado',
    anio: anioFolio
  });
  registrarHistorial(tablas[tabla][tablas[tabla].length - 1], 'Folio asignado', '');
  guardarOficios(tablas);
  return folio;
}

const TODAS_LAS_TABLAS = Object.keys(TIPOS_OFICIO).map(function (tipo) { return TIPOS_OFICIO[tipo]; });

// Solicitudes y asignación

// Destino de una solicitud: el superior inmediato activo del área (o el ancestro activo más cercano).
// Si el área es la raíz, devuelve la propia raíz (no solicita a nadie).
function getDestinoSolicitud(areaId) {
  let actual = getAreaById(areaId);
  let pasos = 0;
  while (actual && actual.padre != null && pasos++ < 50) {
    const padre = getAreaById(actual.padre);
    if (!padre) break;
    if (padre.activo !== false) return padre.id;
    actual = padre;
  }
  const raiz = getAreaRaiz();
  return raiz ? raiz.id : 1;
}

function solicitarFolio(tipo, asunto, fechaDoc, session, idSolicitanteInput, dirigidoA, origen) {
  if (!session || !hasPermission('solicitar_oficio')) return null;
  const destino = getDestinoSolicitud(session.area);
  const siglaDestino = getSiglaByAreaId(destino);
  const anioFolio = anioDeFecha(fechaDoc) || new Date().getFullYear();
  const folio = generarFolioAutomatico(tipo, siglaDestino, destino, anioFolio);
  if (!folio) return null;

  const tabla = TIPOS_OFICIO[tipo];
  const tablas = getOficios();
  if (!tablas[tabla]) tablas[tabla] = [];

  const solicitante = resolverSolicitante(document.getElementById(idSolicitanteInput).value, session);
  tablas[tabla].push({
    folio: folio,
    tipo_oficio: tipo,
    id_area: destino,
    id_area_solicitante: session.area,
    cargo_dependencia_origen: tipoUsaCargoOrigen(tipo) ? (origen || '') : '',
    dirigido_a: dirigidoA || '',
    asunto: asunto,
    fecha_documento: fechaDoc,
    fecha_solicitud: fechaHoyLocal(),
    id_usuario_solicitante: solicitante.id,
    nombre_solicitante: solicitante.nombre,
    id_usuario_liberador: null,
    estatus: 'Pendiente',
    anio: anioFolio
  });
  registrarHistorial(tablas[tabla][tablas[tabla].length - 1], 'Solicitud enviada', 'a ' + getSiglaByAreaId(destino));
  guardarOficios(tablas);
  return { folio: folio, destino: getAreaNameById(destino), destinoSigla: siglaDestino };
}

// ---- Buscador y filtros de la pestaña Seguimiento ----
// Lee los controles de la barra .seguimiento-filtros asociada a un tbody (sin barra = sin filtro).
function leerFiltrosSeguimiento(tbodyId) {
  const barra = document.querySelector('.seguimiento-filtros[data-tabla="' + tbodyId + '"]');
  if (!barra) return null;
  const valor = nombre => {
    const el = barra.querySelector('[data-filtro="' + nombre + '"]');
    return el ? String(el.value || '') : '';
  };
  return { barra: barra, q: valor('q').trim(), tipo: valor('tipo'), estatus: valor('estatus') };
}

// Coincidencia por número identificador: "2" o "002" -> folios con ese número; admite varios separados por coma/espacio.
function folioCoincideBusqueda(folio, consulta) {
  const tokens = String(consulta || '').toLowerCase().split(/[\s,;]+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const texto = String(folio || '').toLowerCase();
  const partes = texto.split('/');
  const numero = partes.length >= 3 ? partes[partes.length - 2] : '';
  return tokens.some(t => /^\d+$/.test(t) ? (numero ? numero.includes(t) : texto.includes(t)) : texto.includes(t));
}

// Año de los folios mostrados en Seguimiento (por defecto, el año en curso).
let anioSeguimiento = new Date().getFullYear();

function getAnioSeguimiento() { return anioSeguimiento; }

function filtrarPorAnioSeguimiento(filas) {
  return filas.filter(({ f }) => anioDeFolio(f) === anioSeguimiento);
}

// Años ofrecidos: el próximo, el actual y los 9 anteriores, más cualquier año que ya tenga folios.
function aniosDisponiblesSeguimiento() {
  const actual = new Date().getFullYear();
  const set = {};
  for (let a = actual + 1; a >= actual - 9; a--) set[a] = true;
  set[anioSeguimiento] = true;
  const oficios = getOficios();
  TODAS_LAS_TABLAS.forEach(tabla => (oficios[tabla] || []).forEach(f => { const a = anioDeFolio(f); if (a) set[a] = true; }));
  return Object.keys(set).map(Number).sort((a, b) => b - a);
}

function refrescarOpcionesAnioSeguimiento() {
  const select = document.getElementById('select-anio-seguimiento');
  if (!select) return;
  select.innerHTML = aniosDisponiblesSeguimiento()
    .map(a => `<option value="${a}"${a === anioSeguimiento ? ' selected' : ''}>${a}</option>`).join('');
}

function setAnioSeguimiento(anio) {
  const n = Number(anio);
  if (!n || n === anioSeguimiento) { refrescarOpcionesAnioSeguimiento(); return; }
  anioSeguimiento = n;
  refrescarOpcionesAnioSeguimiento();
  if (typeof window.__refrescarTablas === 'function') window.__refrescarTablas();
}

function iniciarFiltroAnioSeguimiento() {
  const select = document.getElementById('select-anio-seguimiento');
  if (!select || select.dataset.listo) return;
  select.dataset.listo = '1';
  refrescarOpcionesAnioSeguimiento();
  select.addEventListener('change', () => setAnioSeguimiento(select.value));
}

function aplicarFiltrosSeguimiento(filas, filtros) {
  if (!filtros) return filas;
  return filas.filter(({ tabla, f }) => {
    if (filtros.tipo && tabla !== filtros.tipo) return false;
    if (filtros.estatus === 'cancelado-rechazado') {
      if (f.estatus !== 'Cancelado' && f.estatus !== 'Rechazado') return false;
    } else if (filtros.estatus && f.estatus !== filtros.estatus) {
      return false;
    }
    return folioCoincideBusqueda(f.folio, filtros.q);
  });
}

function filtrosSeguimientoActivos(filtros) {
  return !!filtros && !!(filtros.q || filtros.tipo || filtros.estatus);
}

function actualizarResultadosSeguimiento(filtros, mostradas, total) {
  if (!filtros) return;
  const etiqueta = filtros.barra.querySelector('.seguimiento-filtros__resultados');
  if (etiqueta) etiqueta.textContent = filtrosSeguimientoActivos(filtros) ? (mostradas + ' de ' + total + ' resultados') : '';
}

function solicitudesPendientesDe(areaId) {
  const oficios = getOficios();
  const filas = [];
  TODAS_LAS_TABLAS.forEach(tabla => {
    (oficios[tabla] || []).forEach(f => {
      if (f.estatus === 'Pendiente' && String(f.id_area) === String(areaId)) {
        filas.push({ tabla: tabla, f: f });
      }
    });
  });
  filas.sort(compararFoliosDesc);
  return filas;
}

// Folios de un área: propios (id_area) o asignados desde sus solicitudes.
function asignadosDe(areaId) {
  const oficios = getOficios();
  const filas = [];
  TODAS_LAS_TABLAS.forEach(tabla => {
    (oficios[tabla] || []).forEach(f => {
      if ((f.estatus === 'Asignado' || f.estatus === 'Cancelado') &&
          (String(f.id_area) === String(areaId) || String(f.id_area_solicitante) === String(areaId))) {
        filas.push({ tabla: tabla, f: f });
      }
    });
  });
  filas.sort(compararFoliosDesc);
  return filas;
}

function renderSolicitudesPendientes(tbodyId, contadorId, areaId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const globales = solicitudesPendientesDe(areaId);
  const todas = filtrarPorAnioSeguimiento(globales);
  const filtros = leerFiltrosSeguimiento(tbodyId);
  const filas = aplicarFiltrosSeguimiento(todas, filtros);
  tbody.innerHTML = '';
  filas.forEach(({ tabla, f }) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(f.folio)}</strong></td>
      <td><span class="badge bg-primario text-capitalize">${escapeHtml(NOMBRES_OFICIO[tabla] || tabla)}</span></td>
      <td>${escapeHtml(getAreaNameById(f.id_area_solicitante))}</td>
      <td>${escapeHtml(f.dirigido_a || '—')}</td>
      <td>${escapeHtml(valorOrigen(f, tabla) || '—')}</td>
      <td class="celda-asunto">${escapeHtml(f.asunto || 'Sin asunto')}</td>
      <td>${escapeHtml(f.nombre_solicitante || f.id_usuario_solicitante || 'N/A')}</td>
      <td>${f.fecha_solicitud ? presentarFecha(f.fecha_solicitud) : 'N/A'}</td>
      <td>${f.fecha_documento ? presentarFecha(f.fecha_documento) : 'N/A'}</td>
      <td class="text-end">
        <button type="button" class="btn btn-asiste-primary btn-sm" onclick="asignarOficioManual('${escapeJs(f.folio)}', '${escapeJs(tabla)}')"><i class="bi bi-check2-circle me-1" aria-hidden="true"></i>Asignar</button>
        <button type="button" class="btn btn-sm btn-danger" onclick="rechazarSolicitudManual('${escapeJs(f.folio)}', '${escapeJs(tabla)}')"><i class="bi bi-x-circle me-1" aria-hidden="true"></i>Rechazar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  if (filas.length === 0) {
    const msg = todas.length > 0 ? 'Sin resultados para la búsqueda o el filtro aplicado' : 'No hay solicitudes pendientes por asignar en ' + anioSeguimiento;
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-secondary">${msg}</td></tr>`;
  }
  actualizarResultadosSeguimiento(filtros, filas.length, todas.length);
  // El total de la tarjeta es el del año elegido; el aviso de la pestaña cuenta las pendientes de todos los años.
  const contador = document.getElementById(contadorId);
  if (contador) contador.textContent = todas.length;
  const globalesEl = document.getElementById('pendientes-globales');
  if (globalesEl) globalesEl.textContent = globales.length;
}

function renderAsignadosDe(tbodyId, totalId, areaId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const todas = filtrarPorAnioSeguimiento(asignadosDe(areaId));
  const filtros = leerFiltrosSeguimiento(tbodyId);
  const filas = aplicarFiltrosSeguimiento(todas, filtros);
  tbody.innerHTML = '';
  filas.forEach(({ tabla, f }) => {
    const esCancelable = puedeCancelarFolio(tabla, f);
    const accion = f.estatus !== 'Asignado'
      ? '<span class="text-secondary">—</span>'
      : !puedeGestionarFolio(f, getSession())
      ? '<span class="text-secondary" title="Folio de la serie de otra área">—</span>'
      : esCancelable
      ? `<button type="button" class="btn btn-sm btn-danger" onclick="cancelarFolioManual('${escapeJs(f.folio)}', '${escapeJs(tabla)}')"><i class="bi bi-x-circle me-1" aria-hidden="true"></i>Cancelar</button>`
      : `<button type="button" class="btn btn-sm btn-asiste-secondary" onclick="abrirReasignarFolio('${escapeJs(f.folio)}', '${escapeJs(tabla)}')"><i class="bi bi-arrow-repeat me-1" aria-hidden="true"></i>Reasignar</button>`;
    const areaDestino = f.id_area_solicitante ? getAreaNameById(f.id_area_solicitante) : getAreaNameById(f.id_area);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(f.folio)}</strong></td>
      <td><span class="badge bg-primario text-capitalize">${escapeHtml(NOMBRES_OFICIO[tabla] || tabla)}</span></td>
      <td>${escapeHtml(areaDestino)}</td>
      <td>${escapeHtml(f.dirigido_a || '—')}</td>
      <td>${escapeHtml(valorOrigen(f, tabla) || '—')}</td>
      <td class="celda-asunto">${escapeHtml(f.asunto || 'Sin asunto')}</td>
      <td>${badgeEstatus(f.estatus)}</td>
      <td>${f.fecha_solicitud ? presentarFecha(f.fecha_solicitud) : 'N/A'}</td>
      <td>${f.fecha_documento ? presentarFecha(f.fecha_documento) : 'N/A'}</td>
      <td class="text-end">${accion}</td>
    `;
    tbody.appendChild(tr);
  });
  if (filas.length === 0) {
    const msg = todas.length > 0 ? 'Sin resultados para la búsqueda o el filtro aplicado' : 'Aún no hay folios asignados de esta área en ' + anioSeguimiento;
    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-secondary">${msg}</td></tr>`;
  }
  actualizarResultadosSeguimiento(filtros, filas.length, todas.length);
  const total = document.getElementById(totalId);
  if (total) total.textContent = todas.length;
}

function puedeCancelarFolio(tabla, f) {
  const oficios = getOficios();
  const mismaSerie = (oficios[tabla] || []).filter(r => String(r.id_area) === String(f.id_area));
  const actual = numeroDeFolio(f.folio);
  if (!actual) return false;
  return mismaSerie.some(r => {
    const n = numeroDeFolio(r.folio);
    return n && (n.anio > actual.anio || (n.anio === actual.anio && n.numero > actual.numero));
  });
}

function numeroDeFolio(folio) {
  const m = /^([^/]+)\/(\d+)\/(\d{4})$/.exec(String(folio || '').trim());
  return m ? { anio: Number(m[3]), numero: Number(m[2]) } : null;
}

// Cancela folio; no aplica al último de la serie (se reasigna).
function cancelarFolioManual(folio, tabla) {
  const tablas = getOficios();
  const registros = tablas[tabla] || [];
  const f = registros.find(r => r.folio === folio);
  if (!f || f.estatus !== 'Asignado') {
    showToast('No se pudo cancelar el folio', 'warning');
    return;
  }
  if (!puedeGestionarFolio(f, getSession())) {
    showToast('No tiene permiso sobre este folio', 'danger');
    return;
  }
  if (!puedeCancelarFolio(tabla, f)) {
    showToast('Este folio es el último de la serie; use Reasignar folio', 'warning');
    return;
  }
  f.estatus = 'Cancelado';
  f.id_usuario_liberador = null;
  registrarHistorial(f, 'Folio cancelado', '');
  guardarOficios(tablas);
  showToast('Folio ' + folio + ' cancelado', 'success');
  if (typeof window.__refrescarTablas === 'function') window.__refrescarTablas();
}

function abrirReasignarFolio(folio, tabla) {
  const tablas = getOficios();
  const f = (tablas[tabla] || []).find(r => r.folio === folio);
  if (!f) return;
  if (!puedeGestionarFolio(f, getSession()) || f.estatus !== 'Asignado') {
    showToast('No tiene permiso para reasignar este folio', 'danger');
    return;
  }

  const existente = document.getElementById('modal-reasignar-folio');
  if (existente) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const instanciaPrevia = bootstrap.Modal.getInstance(existente);
      if (instanciaPrevia) instanciaPrevia.hide();
    }
    existente.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'modal-reasignar-folio';
  modal.className = 'modal fade modal--formulario';
  modal.tabIndex = -1;
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-header modal-header-asiste">
          <h5 class="modal-title">Reasignar folio ${escapeHtml(f.folio)}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body">
          <div class="modal-aviso"><i class="bi bi-arrow-repeat" aria-hidden="true"></i><span>Este folio es el último de la serie y no puede cancelarse. Capture de nuevo los datos para reutilizarlo.</span></div>
          <input type="hidden" id="reasignar-folio" value="${escapeHtml(f.folio)}">
          <input type="hidden" id="reasignar-tabla" value="${escapeHtml(tabla)}">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Dirigido a</label>
              <input type="text" class="form-control" id="reasignar-dirigido" value="${escapeHtml(f.dirigido_a || '')}" placeholder="Nombre de la dependencia o persona">
            </div>
            ${tipoUsaCargoOrigen(tipoDeRegistro(f, tabla)) ? `<div class="col-md-4">
              <label class="form-label">${escapeHtml(etiquetaOrigen())}</label>
              <input type="text" class="form-control" id="reasignar-cargo-origen" value="${escapeHtml(valorOrigen(f, tabla))}" placeholder="Ej: Director de Planeación">
            </div>` : ''}
            <div class="col-md-4">
              <label class="form-label">Fecha del documento</label>
              <input type="date" class="form-control" id="reasignar-fecha" value="${escapeHtml(f.fecha_documento || '')}">
            </div>
            <div class="col-12">
              <label class="form-label">Asunto</label>
              <textarea class="form-control" id="reasignar-asunto" rows="2">${escapeHtml(f.asunto || '')}</textarea>
            </div>
            <div class="col-12">
              <label class="form-label">Solicitante</label>
              <input type="text" class="form-control" id="reasignar-solicitante" value="${escapeHtml(f.nombre_solicitante || '')}" placeholder="Nombre del solicitante">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-asiste-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="button" class="btn btn-asiste-primary" onclick="guardarReasignarFolio()"><i class="bi bi-arrow-repeat me-1" aria-hidden="true"></i>Reasignar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const instancia = (typeof bootstrap !== 'undefined' && bootstrap.Modal) ? new bootstrap.Modal(modal) : null;
  if (instancia) {
    instancia.show();
  } else {
    modal.classList.add('show');
    modal.style.display = 'block';
  }
}

function guardarReasignarFolio() {
  const folio = document.getElementById('reasignar-folio').value;
  const tabla = document.getElementById('reasignar-tabla').value;
  const inputCargo = document.getElementById('reasignar-cargo-origen');
  const cargoOrigen = inputCargo ? inputCargo.value.trim() : '';
  const dirigido = document.getElementById('reasignar-dirigido').value.trim();
  const asunto = document.getElementById('reasignar-asunto').value.trim();
  const fecha = document.getElementById('reasignar-fecha').value;
  const solicitante = document.getElementById('reasignar-solicitante').value.trim();

  const tipoReasignar = tipoDeRegistro((getOficios()[tabla] || []).find(r => r.folio === folio), tabla);
  if (tipoUsaCargoOrigen(tipoReasignar) && !cargoOrigen) { showToast('Ingrese el cargo/dependencia de origen', 'warning'); return; }
  if (!dirigido) { showToast('Ingrese el destinatario (Dirigido a)', 'warning'); return; }
  if (!asunto) { showToast('Ingrese el asunto del documento', 'warning'); return; }

  const tablas = getOficios();
  const f = (tablas[tabla] || []).find(r => r.folio === folio);
  if (!f) { showToast('No se encontró el folio', 'warning'); return; }
  if (!puedeGestionarFolio(f, getSession()) || f.estatus !== 'Asignado') {
    showToast('No tiene permiso para reasignar este folio', 'danger');
    return;
  }

  const anioNuevo = anioDeFecha(fecha);
  if (anioNuevo && anioNuevo !== anioDeFolio(f)) {
    showToast('La fecha debe ser de ' + anioDeFolio(f) + ', el año de este folio', 'warning');
    return;
  }

  asignarOrigenARegistro(f, tipoDeRegistro(f, tabla), cargoOrigen);
  f.dirigido_a = dirigido;
  f.asunto = asunto;
  f.fecha_documento = fecha || f.fecha_documento;
  f.nombre_solicitante = solicitante || f.nombre_solicitante;
  f.estatus = 'Asignado';
  f.id_usuario_liberador = getSession() ? getSession().id : null;
  registrarHistorial(f, 'Folio reasignado', 'datos recapturados');
  guardarOficios(tablas);

  const modalEl = document.getElementById('modal-reasignar-folio');
  if (modalEl) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const inst = bootstrap.Modal.getInstance(modalEl);
      if (inst) inst.hide();
    }
    modalEl.remove();
  }
  showToast('Folio ' + folio + ' reasignado', 'success');
  if (typeof window.__refrescarTablas === 'function') window.__refrescarTablas();
}

function asignarOficioManual(folio, tabla) {
  const tablas = getOficios();
  const registros = tablas[tabla] || [];
  const f = registros.find(r => r.folio === folio);
  const session = getSession();
  if (f && f.estatus === 'Pendiente' && puedeGestionarFolio(f, session)) {
    f.estatus = 'Asignado';
    f.id_usuario_liberador = session ? session.id : null;
    registrarHistorial(f, 'Solicitud asignada', '');
    guardarOficios(tablas);
    showToast('Folio ' + folio + ' asignado', 'success');
    if (typeof window.__refrescarTablas === 'function') window.__refrescarTablas();
  } else {
    showToast('No se pudo asignar el folio', 'warning');
  }
}

// Rechaza solicitud. El folio se conserva (queda como Rechazado y su número no se reutiliza) para auditoría.
function rechazarSolicitudManual(folio, tabla) {
  const tablas = getOficios();
  const registros = tablas[tabla] || [];
  const f = registros.find(r => r.folio === folio);
  if (f && f.estatus === 'Pendiente' && puedeGestionarFolio(f, getSession())) {
    f.estatus = 'Rechazado';
    f.id_usuario_liberador = null;
    registrarHistorial(f, 'Solicitud rechazada', '');
    guardarOficios(tablas);
    showToast('Solicitud ' + folio + ' rechazada', 'warning');
    if (typeof window.__refrescarTablas === 'function') window.__refrescarTablas();
  } else {
    showToast('No se pudo rechazar la solicitud', 'warning');
  }
}

function solicitudesEnviadas(areaId) {
  const oficios = getOficios();
  const filas = [];
  TODAS_LAS_TABLAS.forEach(tabla => {
    (oficios[tabla] || []).forEach(f => {
      if (String(f.id_area_solicitante) === String(areaId)) {
        filas.push({ tabla: tabla, f: f });
      }
    });
  });
  filas.sort(compararFoliosDesc);
  return filas;
}

function renderSolicitudesEnviadas(tbodyId, totalId, areaId) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  const todas = filtrarPorAnioSeguimiento(solicitudesEnviadas(areaId));
  const filtros = leerFiltrosSeguimiento(tbodyId);
  const filas = aplicarFiltrosSeguimiento(todas, filtros);
  tbody.innerHTML = '';
  filas.forEach(({ tabla, f }) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(f.folio || '—')}</strong></td>
      <td><span class="badge bg-primario text-capitalize">${escapeHtml(NOMBRES_OFICIO[tabla] || tabla)}</span></td>
      <td>${escapeHtml(getAreaNameById(f.id_area))}</td>
      <td>${escapeHtml(f.dirigido_a || '—')}</td>
      <td>${escapeHtml(valorOrigen(f, tabla) || '—')}</td>
      <td class="celda-asunto">${escapeHtml(f.asunto || 'Sin asunto')}</td>
      <td>${f.fecha_solicitud ? presentarFecha(f.fecha_solicitud) : 'N/A'}</td>
      <td>${f.fecha_documento ? presentarFecha(f.fecha_documento) : 'N/A'}</td>
      <td>${badgeEstatus(f.estatus)}</td>
    `;
    tbody.appendChild(tr);
  });
  if (filas.length === 0) {
    const msg = todas.length > 0 ? 'Sin resultados para la búsqueda o el filtro aplicado' : 'No ha solicitado folios a su superior en ' + anioSeguimiento;
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-secondary">${msg}</td></tr>`;
  }
  actualizarResultadosSeguimiento(filtros, filas.length, todas.length);
  const total = document.getElementById(totalId);
  if (total) total.textContent = todas.length;
}

const NOMBRES_MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const NOMBRES_DIAS_CALENDARIO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

let calendarioFolios = { anio: new Date().getFullYear(), mes: new Date().getMonth() };
let calendarioPorDia = {};
// Rango de años del calendario.
const ANIO_CAL_MIN = 2000;
const ANIO_CAL_MAX = 2100;

function obtenerFoliosFiltradosCalendario() {
  const session = getSession();
  if (!session) return [];
  // rol puede venir como string o número
  const esAdministrador = Number(session.rol) === Number(ROLES.ADMINISTRADOR);
  const esVisor = Number(session.rol) === Number(ROLES.VISOR);
  const oficios = getOficios();
  const registros = [];
  Object.keys(oficios).forEach(tabla => {
    (oficios[tabla] || []).forEach(f => {
      if (f.estatus === 'Rechazado') return;
      // Admin/Visor: todo; asignadores: su área + propio/asignado
      if (esAdministrador || esVisor) {
        registros.push({ tabla: tabla, f: f });
        return;
      }
      const esPropio = String(f.id_usuario_solicitante) === String(session.id);
      const esAsignador = String(f.id_usuario_liberador || '') === String(session.id);
      const esDeSuArea = String(f.id_area) === String(session.area);
      const esSolicitanteArea = String(f.id_area_solicitante || '') === String(session.area);
      if (esPropio || esAsignador || esDeSuArea || esSolicitanteArea) {
        registros.push({ tabla: tabla, f: f });
      }
    });
  });
  return registros;
}

function contarFoliosPorDia(registros) {
  const porDia = {};
  registros.forEach(({ tabla, f }) => {
    if (!f.fecha_solicitud) return;
    const clave = aFechaLocal(f.fecha_solicitud);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return;
    const partes = clave.split('-').map(Number);
    const d = new Date(partes[0], partes[1] - 1, partes[2]);
    if (isNaN(d.getTime()) || d.getDate() !== partes[2]) return;
    if (!porDia[clave]) porDia[clave] = {};
    porDia[clave][tabla] = (porDia[clave][tabla] || 0) + 1;
  });
  return porDia;
}

function totalDia(conteo) {
  return Object.values(conteo).reduce((a, b) => a + b, 0);
}

function colorCalendario(total, maxDia) {
  const max = Math.max(maxDia, 1);
  const r = Math.max(0, Math.min(1, total / max));
  const sat = 55 + r * 44;
  const lig = 92 - r * 52;
  return 'hsl(330, ' + sat + '%, ' + lig + '%)';
}

function renderCalendarioFolios(contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const anio = calendarioFolios.anio;
  const mes = calendarioFolios.mes;
  const primerDia = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offset = primerDia.getDay();

  calendarioPorDia = contarFoliosPorDia(obtenerFoliosFiltradosCalendario());

  let maxDia = 0;
  Object.values(calendarioPorDia).forEach(c => {
    const t = totalDia(c);
    if (t > maxDia) maxDia = t;
  });

  const hoyCadena = fechaHoyLocal();

  let html = `
    <div class="cal-folios-header">
      <button type="button" class="cal-folios-nav" onclick="cambiarMesCalendario(-1)" aria-label="Mes anterior">&#8249;</button>
      <span class="cal-folios-titulo">${NOMBRES_MESES[mes]} ${anio}</span>
      <button type="button" class="cal-folios-nav" onclick="cambiarMesCalendario(1)" aria-label="Mes siguiente">&#8250;</button>
    </div>
  `;

  html += '<div class="cal-folios-dias-nombres">';
  NOMBRES_DIAS_CALENDARIO.forEach(d => {
    html += `<div class="cal-folios-dia-nombre">${d}</div>`;
  });
  html += '</div>';

  html += '<div class="cal-folios-grid">';
  for (let i = 0; i < offset; i++) html += '<div class="cal-folios-vacio"></div>';

  for (let d = 1; d <= diasEnMes; d++) {
    const clave = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const conteo = calendarioPorDia[clave] || {};
    const total = totalDia(conteo);
    const esHoy = clave === hoyCadena;

    if (total > 0) {
      const ratio = total / Math.max(maxDia, 1);
      const color = colorCalendario(total, maxDia);
      const textoBlanco = ratio > 0.6 ? ' color:#ffffff;' : '';
      html += `
        <div class="cal-folios-dia cal-tiene-datos" style="background:${color};" title="${total} folio(s)" aria-label="${total} folio(s) el día ${d}" role="button" tabindex="0" onclick="mostrarDetalleDia('${clave}')" onkeydown="if(event.key==='Enter'||event.key===' '){mostrarDetalleDia('${clave}');event.preventDefault();}">
          <span class="cal-numero" style="${textoBlanco}">${d}</span>
          <span class="cal-conteo">${total}</span>
        </div>
      `;
    } else {
      html += `
        <div class="cal-folios-dia ${esHoy ? 'cal-hoy' : ''}">
          <span class="cal-numero">${d}</span>
        </div>
      `;
    }
  }
  html += '</div>';

  html += `
    <div class="cal-folios-leyenda">
      <span class="cal-leyenda-texto">Menos</span>
      <span class="cal-leyenda-item" style="background:${colorCalendario(1, Math.max(maxDia, 3))};"></span>
      <span class="cal-leyenda-item" style="background:${colorCalendario(Math.ceil(maxDia * 0.5), Math.max(maxDia, 3))};"></span>
      <span class="cal-leyenda-item" style="background:${colorCalendario(Math.max(maxDia, 3), Math.max(maxDia, 3))};"></span>
      <span class="cal-leyenda-texto">Más</span>
    </div>
  `;

  contenedor.innerHTML = html;
}

function cambiarMesCalendario(delta) {
  let anio = calendarioFolios.anio;
  let mes = calendarioFolios.mes + delta;
  if (mes > 11) {
    mes = 0;
    anio++;
  } else if (mes < 0) {
    mes = 11;
    anio--;
  }
  if (anio < ANIO_CAL_MIN || anio > ANIO_CAL_MAX) return;
  calendarioFolios.anio = anio;
  calendarioFolios.mes = mes;
  const contenedores = document.querySelectorAll('.cal-folios-contenedor');
  contenedores.forEach(c => renderCalendarioFolios(c.id));
}

function mostrarDetalleDia(clave) {
  const partes = clave.split('-').map(Number);
  const fechaValida = new Date(partes[0], partes[1] - 1, partes[2]);
  if (isNaN(fechaValida.getTime()) || fechaValida.getDate() !== partes[2]) return;

  const conteo = calendarioPorDia[clave] || {};
  const total = totalDia(conteo);

  const fechaLegible = new Date(partes[0], partes[1] - 1, partes[2]).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  let filas = '';
  Object.keys(conteo).sort().forEach(tabla => {
    filas += `
      <tr>
        <td>${escapeHtml(NOMBRES_OFICIO[tabla] || tabla)}</td>
        <td class="text-end"><strong>${conteo[tabla]}</strong></td>
      </tr>
    `;
  });

  const existente = document.getElementById('modal-detalle-dia');
  if (existente) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      const instanciaPrevia = bootstrap.Modal.getInstance(existente);
      if (instanciaPrevia) instanciaPrevia.hide();
    }
    existente.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'modal-detalle-dia';
  modal.className = 'modal fade modal--detalle';
  modal.tabIndex = -1;
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header modal-header-asiste">
          <h5 class="modal-title">Folios del ${fechaLegible}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body">
          <div class="table-responsive">
            <table class="table detalle-folio-table">
              <thead><tr><th>Tipo de documento</th><th class="text-end">Cantidad</th></tr></thead>
              <tbody>${filas}</tbody>
            </table>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-3 ps-2 pe-2">
            <strong>Total</strong>
            <span class="badge text-primario fs-6">${total} folio(s)</span>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-asiste-secondary" data-bs-dismiss="modal">Cerrar</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const instancia = (typeof bootstrap !== 'undefined' && bootstrap.Modal) ? new bootstrap.Modal(modal) : null;
  if (instancia) {
    instancia.show();
  } else {
    modal.classList.add('show');
    modal.style.display = 'block';
  }
}

function detalleHistorialHtml(registro) {
  if (!Array.isArray(registro.historial) || !registro.historial.length) return '';
  const filas = registro.historial.map(h => {
    const cuando = new Date(h.fecha);
    const fecha = isNaN(cuando.getTime()) ? '' : cuando.toLocaleString('es-MX');
    const texto = h.accion + (h.detalle ? ' · ' + h.detalle : '');
    return '<tr><td>' + escapeHtml(fecha) + '</td><td>' + escapeHtml(h.usuario || '') + '</td><td>' + escapeHtml(texto) + '</td></tr>';
  }).join('');
  return '<h6 class="mt-3">Historial</h6><div class="table-responsive"><table class="table table-sm detalle-folio-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th></tr></thead><tbody>' + filas + '</tbody></table></div>';
}

function detalleFolioHtml(tabla, registro) {
  const fechaDocumento = registro.fecha_documento ? presentarFecha(registro.fecha_documento) : 'N/A';
  const fechaSolicitud = registro.fecha_solicitud ? presentarFecha(registro.fecha_solicitud) : 'N/A';
  return `
    <div class="table-responsive">
      <table class="table table-sm detalle-folio-table">
        <tbody>
          <tr><th>Folio</th><td><strong>${escapeHtml(registro.folio)}</strong></td></tr>
          <tr><th>Tipo de oficio</th><td>${escapeHtml(NOMBRES_OFICIO[tabla] || tabla)}</td></tr>
          <tr><th>Área</th><td>${escapeHtml(getAreaNameById(registro.id_area))} <span class="badge-status badge-en-atencion">${escapeHtml(getSiglaByAreaId(registro.id_area) || '')}</span></td></tr>
          <tr><th>Solicitante</th><td>${escapeHtml(registro.nombre_solicitante || 'N/A')}</td></tr>
          <tr><th>Dirigido a</th><td>${escapeHtml(registro.dirigido_a || 'N/A')}</td></tr>
          ${tipoUsaCargoOrigen(tipoDeRegistro(registro, tabla)) ? `<tr><th>${escapeHtml(etiquetaOrigen())}</th><td>${escapeHtml(valorOrigen(registro, tabla) || 'N/A')}</td></tr>` : ''}
          <tr><th>Asunto</th><td>${escapeHtml(registro.asunto || 'Sin asunto')}</td></tr>
          <tr><th>Fecha del documento</th><td>${fechaDocumento}</td></tr>
          <tr><th>Fecha de solicitud</th><td>${fechaSolicitud}</td></tr>
          <tr><th>Estatus</th><td>${badgeEstatus(registro.estatus)}</td></tr>
        </tbody>
      </table>
    </div>
    ${detalleHistorialHtml(registro)}
  `;
}

function mostrarDetalleFolioModal(tabla, folio, tituloId, contenidoId, modalId) {
  const oficios = getOficios();
  const registro = (oficios[tabla] || []).find(f => String(f.folio) === String(folio));
  if (!registro) {
    showToast('No se encontró el folio', 'danger');
    return;
  }
  const tituloEl = document.getElementById(tituloId);
  const contenidoEl = document.getElementById(contenidoId);
  const modalEl = document.getElementById(modalId);
  if (!tituloEl || !contenidoEl || !modalEl) return;
  tituloEl.textContent = 'Detalle del folio ' + registro.folio;
  contenidoEl.innerHTML = detalleFolioHtml(tabla, registro);
  const modal = (typeof bootstrap !== 'undefined' && bootstrap.Modal) ? new bootstrap.Modal(modalEl) : null;
  if (modal) modal.show();
}

// Selector de fecha inline.
const _selectoresFecha = {};

function crearSelectorFecha(opciones) {
  const contenedor = document.getElementById(opciones.contenedorId);
  const input = document.getElementById(opciones.inputId);
  if (!contenedor || !input) return;

  const hoy = fechaHoyLocal();
  const inicial = (typeof opciones.fechaInicial === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(opciones.fechaInicial))
    ? opciones.fechaInicial
    : hoy;
  const partes = inicial.split('-');

  _selectoresFecha[opciones.contenedorId] = {
    inputId: opciones.inputId,
    onCambio: typeof opciones.onCambio === 'function' ? opciones.onCambio : null,
    desplegable: !!opciones.desplegable,
    abierto: false,
    anio: Number(partes[0]),
    mes: Number(partes[1]) - 1,
    seleccionada: inicial
  };
  input.value = inicial;
  if (opciones.desplegable) contenedor.classList.add('selector-fecha--desplegable');
  renderSelectorFecha(opciones.contenedorId);
  if (opciones.desplegable) activarCierreSelectoresFecha();
}

// Cierra los selectores desplegables al hacer clic fuera o con Escape (se registra una sola vez).
let _cierreSelectoresFecha = false;
function activarCierreSelectoresFecha() {
  if (_cierreSelectoresFecha) return;
  _cierreSelectoresFecha = true;
  document.addEventListener('mousedown', function (e) {
    Object.keys(_selectoresFecha).forEach(id => {
      const reg = _selectoresFecha[id];
      const cont = document.getElementById(id);
      if (reg.desplegable && reg.abierto && cont && !cont.contains(e.target)) alternarSelectorFecha(id, false);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    Object.keys(_selectoresFecha).forEach(id => {
      const reg = _selectoresFecha[id];
      if (reg.desplegable && reg.abierto) {
        alternarSelectorFecha(id, false);
        const campo = document.querySelector('#' + id + ' .selector-fecha-campo');
        if (campo) campo.focus();
      }
    });
  });
}

function alternarSelectorFecha(contenedorId, abrir) {
  const reg = _selectoresFecha[contenedorId];
  if (!reg) return;
  reg.abierto = typeof abrir === 'boolean' ? abrir : !reg.abierto;
  if (reg.abierto) {
    // Al abrir, el calendario muestra el mes de la fecha elegida.
    const p = reg.seleccionada.split('-');
    reg.anio = Number(p[0]);
    reg.mes = Number(p[1]) - 1;
  }
  renderSelectorFecha(contenedorId);
}

function renderSelectorFecha(contenedorId) {
  const reg = _selectoresFecha[contenedorId];
  const contenedor = document.getElementById(contenedorId);
  if (!reg || !contenedor) return;

  const primerDia = new Date(reg.anio, reg.mes, 1);
  const diasEnMes = new Date(reg.anio, reg.mes + 1, 0).getDate();
  const offset = primerDia.getDay();
  const hoyCadena = fechaHoyLocal();

  const opcionesMes = NOMBRES_MESES.map((m, i) => `<option value="${i}"${i === reg.mes ? ' selected' : ''}>${m}</option>`).join('');
  let opcionesAnio = '';
  for (let a = ANIO_CAL_MIN; a <= ANIO_CAL_MAX; a++) opcionesAnio += `<option value="${a}"${a === reg.anio ? ' selected' : ''}>${a}</option>`;

  let html = '';
  if (reg.desplegable) {
    html += `
    <button type="button" class="selector-fecha-campo form-control" aria-haspopup="dialog" aria-expanded="${reg.abierto}" onclick="alternarSelectorFecha('${contenedorId}')">
      <i class="bi bi-calendar3" aria-hidden="true"></i>
      <span class="selector-fecha-campo__valor">${presentarFecha(reg.seleccionada)}</span>
      <i class="bi bi-chevron-down selector-fecha-campo__flecha" aria-hidden="true"></i>
    </button>
    <div class="selector-fecha-popover" role="dialog" aria-label="Calendario para elegir la fecha"${reg.abierto ? '' : ' hidden'}>`;
  }
  html += `
    <div class="cal-folios-header">
      <button type="button" class="cal-folios-nav" onclick="navegarSelectorFecha('${contenedorId}', -1)" aria-label="Mes anterior">&#8249;</button>
      <span class="selector-fecha-listas">
        <select class="form-select form-select-sm selector-fecha-mes" aria-label="Mes" onchange="cambiarMesAnioSelectorFecha('${contenedorId}', this.value, null)">${opcionesMes}</select>
        <select class="form-select form-select-sm selector-fecha-anio" aria-label="Año" onchange="cambiarMesAnioSelectorFecha('${contenedorId}', null, this.value)">${opcionesAnio}</select>
      </span>
      <button type="button" class="cal-folios-nav" onclick="navegarSelectorFecha('${contenedorId}', 1)" aria-label="Mes siguiente">&#8250;</button>
    </div>
  `;
  html += '<div class="cal-folios-dias-nombres">';
  NOMBRES_DIAS_CALENDARIO.forEach(d => {
    html += `<div class="cal-folios-dia-nombre">${d}</div>`;
  });
  html += '</div>';

  html += '<div class="cal-folios-grid">';
  for (let i = 0; i < offset; i++) html += '<div class="cal-folios-vacio"></div>';
  for (let d = 1; d <= diasEnMes; d++) {
    const clave = `${reg.anio}-${String(reg.mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const esHoy = clave === hoyCadena;
    const esSeleccion = clave === reg.seleccionada;
    const clases = ['cal-folios-dia', 'selector-fecha-dia', esHoy ? 'cal-hoy' : '', esSeleccion ? 'selector-fecha-dia-activo' : ''].filter(Boolean).join(' ');
    const etiqueta = presentarFecha(clave);
    html += `
      <div class="${clases}" role="button" tabindex="0" aria-label="Seleccionar ${etiqueta}" title="${etiqueta}" onclick="elegirDiaSelectorFecha('${contenedorId}', '${clave}')" onkeydown="if(event.key==='Enter'||event.key===' '){elegirDiaSelectorFecha('${contenedorId}', '${clave}');event.preventDefault();}">
        <span class="cal-numero">${d}</span>
      </div>
    `;
  }
  html += '</div>';

  html += `
    <div class="selector-fecha-pie">
      <button type="button" class="btn btn-asiste-secondary btn-sm" onclick="hoySelectorFecha('${contenedorId}')" aria-label="Seleccionar fecha de hoy">Hoy ${presentarFecha(hoyCadena, { day: 'numeric', month: 'short' })}</button>
      <span class="selector-fecha-seleccion">${presentarFecha(reg.seleccionada)}</span>
    </div>
  `;
  if (reg.desplegable) html += '</div>';
  contenedor.innerHTML = html;
}

function navegarSelectorFecha(contenedorId, delta) {
  const reg = _selectoresFecha[contenedorId];
  if (!reg) return;
  let anio = reg.anio;
  let mes = reg.mes + delta;
  if (mes > 11) {
    mes = 0;
    anio++;
  } else if (mes < 0) {
    mes = 11;
    anio--;
  }
  if (anio < ANIO_CAL_MIN || anio > ANIO_CAL_MAX) return;
  reg.anio = anio;
  reg.mes = mes;
  renderSelectorFecha(contenedorId);
}

function cambiarMesAnioSelectorFecha(contenedorId, mes, anio) {
  const reg = _selectoresFecha[contenedorId];
  if (!reg) return;
  if (mes !== null && !isNaN(Number(mes))) reg.mes = Number(mes);
  if (anio !== null && !isNaN(Number(anio))) reg.anio = Number(anio);
  renderSelectorFecha(contenedorId);
}

function elegirDiaSelectorFecha(contenedorId, clave) {
  const reg = _selectoresFecha[contenedorId];
  if (!reg) return;
  reg.seleccionada = clave;
  document.getElementById(reg.inputId).value = clave;
  const seleccion = new Date(reg.anio, reg.mes, 1);
  seleccion.setDate(Number(clave.split('-')[2]));
  reg.anio = seleccion.getFullYear();
  reg.mes = seleccion.getMonth();
  if (reg.desplegable) reg.abierto = false;
  renderSelectorFecha(contenedorId);
  if (reg.onCambio) reg.onCambio(clave);
}

function hoySelectorFecha(contenedorId) {
  elegirDiaSelectorFecha(contenedorId, fechaHoyLocal());
}

function restablecerSelectorFecha(contenedorId) {
  const reg = _selectoresFecha[contenedorId];
  if (!reg) return;
  const hoy = fechaHoyLocal();
  const partes = hoy.split('-');
  reg.anio = Number(partes[0]);
  reg.mes = Number(partes[1]) - 1;
  reg.seleccionada = hoy;
  document.getElementById(reg.inputId).value = hoy;
  reg.abierto = false;
  renderSelectorFecha(contenedorId);
  if (reg.onCambio) reg.onCambio(hoy);
}

// Folios próximos por asignar
function renderProximosFolios(contenedorId, areaId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;
  const siglaArea = getSiglaByAreaId(areaId) || getAreaNameById(areaId) || 'SPyAP';
  const anio = new Date().getFullYear();
  const chipsId = contenedor.getAttribute('data-chips-id') || '';

  const badge = document.getElementById(contenedor.getAttribute('data-badge-id') || '');
  if (badge) badge.textContent = 'Serie ' + siglaArea;

  let html = '';
  Object.keys(TIPOS_DOCUMENTO_CHIP).forEach(tipo => {
    const info = TIPOS_DOCUMENTO_CHIP[tipo];
    const num = siguienteNumeroFolioArea(TIPOS_OFICIO[tipo], areaId);
    const serie = siglaArea + '/' + String(num).padStart(3, '0') + '/' + anio;
    html += `
      <div class="folios-preview-item" role="button" tabindex="0" aria-label="Asignar ${escapeHtml(info.label)}: siguiente folio ${escapeHtml(serie)}" onclick="abrirPanelAsignar('${escapeJs(tipo)}', '${escapeJs(chipsId)}')" onkeydown="if(event.key==='Enter'||event.key===' '){abrirPanelAsignar('${escapeJs(tipo)}', '${escapeJs(chipsId)}');event.preventDefault();}">
        <span class="folios-preview-icono" aria-hidden="true">${info.icono}</span>
        <span class="fp-estado">Disponible</span>
        <span class="folios-preview-tipo">${escapeHtml(info.label)}</span>
        <span class="fp-etiqueta">Próximo folio</span>
        <span class="folios-preview-folio" aria-label="Siguiente folio de ${escapeHtml(info.label)}">
          <span class="fp-num"><span class="fp-num-part">${escapeHtml(siglaArea)}/</span>${String(num).padStart(3, '0')}<span class="fp-num-part">/${anio}</span></span>
        </span>
        <button type="button" class="fp-enlace" onclick="event.stopPropagation(); abrirPanelAsignar('${escapeJs(tipo)}', '${escapeJs(chipsId)}')">Asignar folio <span aria-hidden="true">&rarr;</span></button>
      </div>
    `;
  });
  contenedor.innerHTML = html;
}

function abrirPanelAsignar(tipo, chipsId) {
  // Si la página usa pestañas/subpaneles, se muestra primero el de asignación.
  if (typeof window.mostrarSeccionMenu === 'function') window.mostrarSeccionMenu('generar', { sinHash: true, sinScroll: true });
  if (typeof window.mostrarSubpanelGenerar === 'function' && document.getElementById('subpanel-asignar')) window.mostrarSubpanelGenerar('asignar');
  const contenedor = document.getElementById(chipsId);
  if (!contenedor) return;
  setTipoOficioChip(chipsId, tipo);
  const form = contenedor.closest('form');
  if (!form) return;
  const panel = form.closest('.fp-panel-form');
  if (panel) {
    mostrarPanelAsignar(panel);
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const asunto = form.querySelector('#asunto-oficio, #asunto-oficio-area') || form.querySelector('input[type="text"]:not([readonly])');
  if (asunto) setTimeout(function () { asunto.focus({ preventScroll: true }); }, 380);
}

function mostrarPanelAsignar(panel) {
  if (typeof bootstrap !== 'undefined' && panel.classList.contains('collapse') && bootstrap.Collapse) {
    bootstrap.Collapse.getOrCreateInstance(panel).show();
  } else {
    panel.classList.remove('collapse');
    panel.classList.add('show');
  }
}

function cerrarPanelAsignar() {
  const panel = document.querySelector('.fp-panel-form.show') || document.querySelector('.fp-panel-form');
  if (!panel) return;
  if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
    const collapse = bootstrap.Collapse.getInstance(panel);
    if (collapse) collapse.hide(); else panel.classList.add('collapse');
  } else {
    panel.classList.add('collapse');
    panel.classList.remove('show');
  }
}

window.crearSelectorFecha = crearSelectorFecha;
window.alternarSelectorFecha = alternarSelectorFecha;
window.navegarSelectorFecha = navegarSelectorFecha;
window.elegirDiaSelectorFecha = elegirDiaSelectorFecha;
window.hoySelectorFecha = hoySelectorFecha;
window.restablecerSelectorFecha = restablecerSelectorFecha;
window.renderProximosFolios = renderProximosFolios;
window.abrirPanelAsignar = abrirPanelAsignar;
window.cerrarPanelAsignar = cerrarPanelAsignar;

window.renderCalendarioFolios = renderCalendarioFolios;
window.cambiarMesAnioSelectorFecha = cambiarMesAnioSelectorFecha;
window.cambiarMesCalendario = cambiarMesCalendario;
window.mostrarDetalleDia = mostrarDetalleDia;

// ---- Menú lateral con secciones independientes ----
// Cada botón .menu-lateral__item[data-seccion="x"] muestra únicamente <section id="seccion-x" class="cd-seccion">.
// La sección activa se recuerda en el hash de la URL (#x), así que recargar la página conserva la vista.
let _menuSecciones = [];

function iniciarMenuLateral(opciones) {
  const cfg = opciones || {};
  iniciarFiltroAnioSeguimiento();
  const items = Array.prototype.slice.call(document.querySelectorAll('.menu-lateral__item[data-seccion], .tab-link[data-seccion], .recuadro-seccion[data-seccion]'));
  _menuSecciones = items
    .map(b => b.getAttribute('data-seccion'))
    .filter(k => document.getElementById('seccion-' + k));
  if (!_menuSecciones.length) return;

  items.forEach(b => b.addEventListener('click', () => mostrarSeccionMenu(b.getAttribute('data-seccion'))));
  window.addEventListener('hashchange', () => {
    const clave = window.location.hash.slice(1);
    if (_menuSecciones.indexOf(clave) !== -1) mostrarSeccionMenu(clave, { sinHash: true });
  });

  const delHash = window.location.hash.slice(1);
  const inicial = _menuSecciones.indexOf(delHash) !== -1 ? delHash
    : (_menuSecciones.indexOf(cfg.inicial) !== -1 ? cfg.inicial : _menuSecciones[0]);
  mostrarSeccionMenu(inicial, { sinHash: true, sinScroll: true });
  actualizarContadoresMenu();
}

function mostrarSeccionMenu(clave, opciones) {
  const op = opciones || {};
  if (_menuSecciones.indexOf(clave) === -1) return;

  document.querySelectorAll('.cd-seccion').forEach(s => { s.hidden = s.id !== 'seccion-' + clave; });
  document.querySelectorAll('.menu-lateral__item[data-seccion], .tab-link[data-seccion], .recuadro-seccion[data-seccion]').forEach(b => {
    const activo = b.getAttribute('data-seccion') === clave;
    if (b.classList.contains('tab-link') || b.classList.contains('recuadro-seccion')) {
      b.classList.toggle('active', activo);
      b.setAttribute('aria-selected', activo ? 'true' : 'false');
      return;
    }
    b.classList.toggle('activo', activo);
    if (activo) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });

  const filtroAnio = document.getElementById('filtroAnioSeguimiento');
  if (filtroAnio) filtroAnio.hidden = clave !== 'seguimiento';

  const seccion = document.getElementById('seccion-' + clave);
  const titulo = document.getElementById('titulo-seccion');
  if (titulo && seccion) titulo.textContent = seccion.getAttribute('data-titulo') || '';

  if (!op.sinHash) {
    try { window.history.replaceState(null, '', '#' + clave); } catch (e) { /* p. ej. file:// restringido */ }
  }
  const panel = document.getElementById('menuLateral');
  if (panel && typeof bootstrap !== 'undefined' && bootstrap.Offcanvas) {
    const instancia = bootstrap.Offcanvas.getInstance(panel);
    if (instancia) instancia.hide();
  }
  if (!op.sinScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Copia al menú los totales de cada sección; los marcados con data-alerta se resaltan si hay pendientes.
function actualizarContadoresMenu() {
  refrescarOpcionesAnioSeguimiento();
  document.querySelectorAll('.menu-lateral__contador[data-fuente], .tab-count[data-fuente]').forEach(el => {
    const fuente = document.getElementById(el.getAttribute('data-fuente'));
    if (fuente) el.textContent = fuente.textContent.trim();
    el.classList.toggle(el.classList.contains('tab-count') ? 'tab-count--alerta' : 'menu-lateral__contador--alerta', el.hasAttribute('data-alerta') && Number(el.textContent) > 0);
  });
}

window.iniciarMenuLateral = iniciarMenuLateral;
window.mostrarSeccionMenu = mostrarSeccionMenu;
window.actualizarContadoresMenu = actualizarContadoresMenu;

document.addEventListener('DOMContentLoaded', function () {
  const isLoginPage = window.location.pathname.endsWith('index.html') ||
                      window.location.pathname.endsWith('/') ||
                      window.location.pathname === '';
  const session = getSession();

  if (!isLoginPage && !session) {
    window.location.href = 'index.html';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const campoPassword = document.getElementById('password');
    if (campoPassword && LOGIN_SIN_PASSWORD_TEMPORAL) campoPassword.required = false;
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const empleado = document.getElementById('empleado').value.trim();
      const password = document.getElementById('password').value.trim();

      const result = login(empleado, password);

      if (result.success) {
        showToast(`Bienvenido, ${result.session.nombre}`, 'success');
        setTimeout(function () {
          window.location.href = getDashboardByRol(result.session);
        }, 1200);
      } else {
        showToast(result.mensaje, 'danger');
      }
    });
  }
});

window.getSession = getSession;
window.login = login;
window.logout = logout;
window.getAreas = getAreas;
window.getAreaById = getAreaById;
window.getAreaNameById = getAreaNameById;
window.getSiglaByAreaId = getSiglaByAreaId;
window.guardarAreas = guardarAreas;
window.guardarUsuarios = guardarUsuarios;
window.guardarOficios = guardarOficios;
window.getUsuarios = getUsuarios;
window.getOficios = getOficios;
window.generarNextAreaId = generarNextAreaId;
window.generarNextUserId = generarNextUserId;
window.areaExistsBySigla = areaExistsBySigla;
window.empleadoExists = empleadoExists;
window.escapeHtml = escapeHtml;
window.escapeJs = escapeJs;
window.aFechaLocal = aFechaLocal;
window.presentarFecha = presentarFecha;
window.poblarDatalistSolicitantes = poblarDatalistSolicitantes;
window.pintarUsuario = pintarUsuario;
window.badgeEstatus = badgeEstatus;
window.asignarOficioManual = asignarOficioManual;
window.rechazarSolicitudManual = rechazarSolicitudManual;
window.cancelarFolioManual = cancelarFolioManual;
window.abrirReasignarFolio = abrirReasignarFolio;
window.guardarReasignarFolio = guardarReasignarFolio;
window.mostrarDetalleFolioModal = mostrarDetalleFolioModal;
window.renderSolicitudesEnviadas = renderSolicitudesEnviadas;
window.TODAS_LAS_TABLAS = TODAS_LAS_TABLAS;
window.showToast = showToast;
window.TIPOS_OFICIO = TIPOS_OFICIO;
window.tipoUsaCargoOrigen = tipoUsaCargoOrigen;
window.etiquetaOrigen = etiquetaOrigen;
window.valorOrigen = valorOrigen;
window.tipoDeRegistro = tipoDeRegistro;
window.asignarOrigenARegistro = asignarOrigenARegistro;
window.leerOrigenFormulario = leerOrigenFormulario;
window.NOMBRES_OFICIO = NOMBRES_OFICIO;


// Limita la altura de una lista/tabla a N filas visibles; el resto se ve con scroll.
// filasSel: selector de las filas dentro del contenedor; observarSel: elemento cuyo tamaño cambia al renderizar.
function limitarFilasVisibles(contenedor, filasSel, max, observarSel) {
  if (!contenedor || contenedor.dataset.limiteFilas) return;
  contenedor.dataset.limiteFilas = '1';
  contenedor.classList.add('scroll-limitado');
  const objetivo = (observarSel && contenedor.querySelector(observarSel)) || contenedor;
  const recalcular = () => {
    const filas = contenedor.querySelectorAll(filasSel);
    if (filas.length <= max) {
      contenedor.style.maxHeight = '';
      contenedor.classList.remove('scroll-limitado--activo');
      return;
    }
    const base = contenedor.getBoundingClientRect().top;
    const cabecera = contenedor.querySelector('thead');
    let alto = cabecera ? cabecera.getBoundingClientRect().height : 0;
    for (let i = 0; i < max; i++) alto += filas[i].getBoundingClientRect().height;
    if (alto <= 0 || base === undefined) return;
    contenedor.style.maxHeight = Math.ceil(alto + 2) + 'px';
    contenedor.classList.add('scroll-limitado--activo');
  };
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(recalcular).observe(objetivo);
  new MutationObserver(recalcular).observe(contenedor, { childList: true, subtree: true });
  window.addEventListener('resize', recalcular);
  recalcular();
}

// Seguimiento (asignadores): tablas con máximo 5 folios visibles.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('#seccion-seguimiento .table-responsive').forEach(c => {
    limitarFilasVisibles(c, 'tbody tr', 5, 'table');
  });
});
window.limitarFilasVisibles = limitarFilasVisibles;

window.setAnioSeguimiento = setAnioSeguimiento;
window.getAnioSeguimiento = getAnioSeguimiento;
