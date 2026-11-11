// Ejecutar: node tests/folios.test.js   (sin dependencias)
const fs = require('fs'), path = require('path'), assert = require('assert');
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
global.window = global;
global.document = { addEventListener() {}, getElementById() { return null; }, body: { contains() { return false; } } };
const src = fs.readFileSync(path.join(__dirname, '../js/main.js'), 'utf8').replace(/^const /gm, 'var ').replace(/^let /gm, 'var ');
(0, eval)(src);
global.showToast = function () {}; // sin DOM en Node: los avisos se ignoran

const RealDate = Date;
function conFecha(iso, fn) {
  global.Date = class extends RealDate { constructor(...a) { a.length ? super(...a) : super(iso); } static now() { return new RealDate(iso).getTime(); } };
  try { return fn(); } finally { global.Date = RealDate; }
}
const reset = () => { Object.keys(store).forEach(k => delete store[k]); crearDatosPrueba(); };
const campo = { value: '' };
global.document.getElementById = id => (id === 'sol' ? campo : null);
let n = 0; const t = (nombre, fn) => { reset(); fn(); n++; console.log('  ✓', nombre); };

console.log('Folios');
t('reinicia en 001 al cambiar de año', () => {
  const o = getOficios(); o.oficios = [{ folio: 'SPyAP/130/2026', id_area: 1, estatus: 'Asignado' }]; guardarOficios(o);
  assert.strictEqual(conFecha('2026-12-20T10:00:00', () => generarFolioAutomatico('oficio', 'SPyAP', 1)), 'SPyAP/131/2026');
  assert.strictEqual(conFecha('2027-01-05T10:00:00', () => generarFolioAutomatico('oficio', 'SPyAP', 1)), 'SPyAP/001/2027');
});
t('un folio rechazado conserva su número y no se reutiliza', () => {
  login('LS-001', 'x');
  const o = getOficios(); o.oficios = [{ folio: 'SPyAP/001/2026', id_area: 1, estatus: 'Pendiente', id_area_solicitante: 3 }]; guardarOficios(o);
  rechazarSolicitudManual('SPyAP/001/2026', 'oficios');
  const f = getOficios().oficios[0];
  assert.strictEqual(f.estatus, 'Rechazado'); assert.strictEqual(f.folio, 'SPyAP/001/2026');
  assert.strictEqual(conFecha('2026-11-04T10:00:00', () => generarFolioAutomatico('oficio', 'SPyAP', 1)), 'SPyAP/002/2026');
  assert.strictEqual(f.historial.length, 1);
});
t('la numeración es independiente por área y por tipo', () => {
  login('LD-001', 'x');
  campo.value = '';
  assert.ok(asignarOficio('oficio', 'DG', 'a', '2026-01-01', getSession(), 'sol', 'x'));
  assert.ok(asignarOficio('circular', 'DG', 'a', '2026-01-01', getSession(), 'sol', 'x'));
  const f = getOficios();
  assert.strictEqual(f.oficios.length, 1); assert.strictEqual(f.circulares.length, 1);
  assert.ok(/^DG\/001\//.test(f.oficios[0].folio) && /^DG\/001\//.test(f.circulares[0].folio));
});

t('la numeración sigue el año de la fecha del documento: 2025 y 2026 llevan su propia serie desde 001', () => {
  login('LD-001', 'x'); campo.value = '';
  const asignar = f => asignarOficio('oficio', 'DG', 'a', f, getSession(), 'sol', 'x');
  assert.ok(/^DG\/001\/2025$/.test(asignar('2025-01-01')));
  assert.ok(/^DG\/002\/2025$/.test(asignar('2025-01-03')));
  assert.ok(/^DG\/001\/2026$/.test(asignar('2026-01-02'))); // 2026 arranca en 001 aunque 2025 ya tenga folios
  assert.ok(/^DG\/003\/2025$/.test(asignar('2025-02-10'))); // se puede seguir capturando 2025
  const o = getOficios().oficios;
  assert.deepStrictEqual(o.map(f => f.anio), [2025, 2025, 2026, 2025]);
});
t('el filtro de año de Seguimiento solo deja los folios de ese año', () => {
  const o = getOficios(); o.oficios = [
    { folio: 'DG/001/2025', id_area: 4, estatus: 'Asignado', fecha_documento: '2025-01-01' },
    { folio: 'DG/001/2026', id_area: 4, estatus: 'Asignado', fecha_documento: '2026-01-02' },
    { folio: 'DG/002/2026', id_area: 4, estatus: 'Asignado', fecha_documento: '2026-02-02' }]; guardarOficios(o);
  const filas = () => TODAS_LAS_TABLAS.reduce((a, tb) => a.concat((getOficios()[tb] || []).map(f => ({ tabla: tb, f }))), []);
  setAnioSeguimiento(2026);
  assert.deepStrictEqual(filtrarPorAnioSeguimiento(filas()).sort(compararFoliosDesc).map(x => x.f.folio), ['DG/002/2026', 'DG/001/2026']);
  setAnioSeguimiento(2025);
  assert.deepStrictEqual(filtrarPorAnioSeguimiento(filas()).map(x => x.f.folio), ['DG/001/2025']);
  assert.ok(aniosDisponiblesSeguimiento().includes(2025));
  setAnioSeguimiento(new RealDate().getFullYear());
});

t('el año de un folio es el de la fecha del documento, aunque el número del folio diga otro año', () => {
  const o = getOficios(); o.oficios = [
    { folio: 'DG/001/2026', id_area: 4, estatus: 'Asignado', fecha_documento: '2025-12-30', fecha_solicitud: '2026-03-01' },
    { folio: 'DG/002/2026', id_area: 4, estatus: 'Asignado', fecha_documento: '2026-03-01', fecha_solicitud: '2026-03-01' }]; guardarOficios(o);
  const filas = () => TODAS_LAS_TABLAS.reduce((a, tb) => a.concat((getOficios()[tb] || []).map(f => ({ tabla: tb, f }))), []);
  assert.strictEqual(anioDeFolio(getOficios().oficios[0]), 2025);
  setAnioSeguimiento(2026);
  assert.deepStrictEqual(filtrarPorAnioSeguimiento(filas()).map(x => x.f.folio), ['DG/002/2026']);
  setAnioSeguimiento(2025);
  assert.deepStrictEqual(filtrarPorAnioSeguimiento(filas()).map(x => x.f.folio), ['DG/001/2026']);
  setAnioSeguimiento(new RealDate().getFullYear());
});

console.log('Permisos');
t('un foliador no puede foliar en la serie de otra área', () => {
  login('LD-001', 'x'); // área DG
  assert.strictEqual(asignarOficio('oficio', 'SPyAP', 'a', '2026-01-01', getSession(), 'sol', 'x'), null);
});
t('el visor no puede asignar folios', () => {
  login('SEC-001', 'x');
  assert.strictEqual(asignarOficio('oficio', 'SPyAP', 'a', '2026-01-01', getSession(), 'sol', 'x'), null);
});
t('el área solicitante no puede cancelar/reasignar folios de la serie de su superior', () => {
  const o = getOficios();
  o.oficios = [
    { folio: 'JU/001/2026', id_area: 5, id_area_solicitante: 6, estatus: 'Asignado' },
    { folio: 'JU/002/2026', id_area: 5, id_area_solicitante: 6, estatus: 'Asignado' }];
  guardarOficios(o);
  login('SOL-001', 'x'); // área 6
  cancelarFolioManual('JU/001/2026', 'oficios');
  assert.strictEqual(getOficios().oficios[0].estatus, 'Asignado');
  login('LD-002', 'x'); // área 5 (dueña de la serie)
  cancelarFolioManual('JU/001/2026', 'oficios');
  assert.strictEqual(getOficios().oficios[0].estatus, 'Cancelado');
});
t('solo el área destino puede asignar una solicitud', () => {
  const o = getOficios(); o.oficios = [{ folio: 'JU/001/2026', id_area: 5, id_area_solicitante: 6, estatus: 'Pendiente' }]; guardarOficios(o);
  login('SOL-001', 'x'); asignarOficioManual('JU/001/2026', 'oficios');
  assert.strictEqual(getOficios().oficios[0].estatus, 'Pendiente');
  login('LD-002', 'x'); asignarOficioManual('JU/001/2026', 'oficios');
  assert.strictEqual(getOficios().oficios[0].estatus, 'Asignado');
});

console.log('Sesión y login');
t('editar la sesión a mano no cambia el rol', () => {
  login('SOL-001', 'x');
  const s = JSON.parse(store.session); s.rol = 1; s.area = 1; store.session = JSON.stringify(s);
  assert.strictEqual(getSession().rol, 3); assert.strictEqual(getSession().area, 6);
});
t('un usuario desactivado pierde la sesión', () => {
  login('SOL-001', 'x');
  const u = getUsuarios(); u['user-asignador-area-cap'].activo = false; guardarUsuarios(u);
  assert.strictEqual(getSession(), null);
});
t('modo pruebas: cualquier contraseña (o vacía) entra', () => {
  assert.strictEqual(LOGIN_SIN_PASSWORD_TEMPORAL, true);
  assert.ok(login('ADM-001', '').success); assert.ok(login('ADM-001', 'loquesea').success);
  assert.ok(!login('NOEXISTE', '').success);
});
t('con la bandera apagada se exige contraseña (incluso a usuarios sin ella)', () => {
  LOGIN_SIN_PASSWORD_TEMPORAL = false;
  try {
    assert.ok(!login('ADM-001', 'mala').success); assert.ok(login('ADM-001', '1234').success);
    const u = getUsuarios(); u.x = { id: 'x', nombre: 'X', numero_empleado: 'X-1', rol: 3, area: 6, activo: true }; guardarUsuarios(u);
    assert.ok(!login('X-1', 'loquesea').success);
  } finally { LOGIN_SIN_PASSWORD_TEMPORAL = true; }
});

console.log('Datos y jerarquía');
t('cambiar VERSION_DATOS ya no borra lo capturado', () => {
  const o = getOficios(); o.oficios = [{ folio: 'SPyAP/001/2026', id_area: 1, estatus: 'Asignado' }]; guardarOficios(o);
  localStorage.setItem('cd_version_datos', 'otra-version'); crearDatosPrueba();
  assert.strictEqual(getOficios().oficios.length, 1);
});
t('solicitud va al superior inmediato (y la raíz no solicita)', () => {
  assert.strictEqual(getDestinoSolicitud(6), 5); assert.strictEqual(getDestinoSolicitud(5), 3);
  assert.strictEqual(getDestinoSolicitud(3), 1); assert.strictEqual(getDestinoSolicitud(1), 1);
  login('SOL-001', 'x'); campo.value = '';
  const r = solicitarFolio('oficio', 'a', '2026-01-01', getSession(), 'sol', 'x');
  assert.strictEqual(r.destinoSigla, 'JU');
  login('LS-001', 'x'); assert.strictEqual(solicitarFolio('oficio', 'a', '2026-01-01', getSession(), 'sol', 'x'), null);
});
t('detecta ciclos en la jerarquía', () => {
  assert.ok(esDescendienteDe(6, 3)); assert.ok(!esDescendienteDe(3, 6)); assert.ok(!esDescendienteDe(4, 5));
});
t('areaTieneFolios detecta series y solicitantes', () => {
  const o = getOficios(); o.oficios = [{ folio: 'JU/001/2026', id_area: 5, id_area_solicitante: 6, estatus: 'Asignado' }]; guardarOficios(o);
  assert.ok(areaTieneFolios(5)); assert.ok(areaTieneFolios(6)); assert.ok(!areaTieneFolios(8));
});
t('escapeJs es seguro dentro de onclick="..."', () => {
  const s = escapeJs(`a'b"c<d>&\\`);
  assert.ok(!/["<>]/.test(s) && !/'(?<!\\')/.test(s.replace(/\\&#39;/g, '')));
});
t('el Cargo/Dependencia de Origen se guarda junto al folio (asignado y solicitado)', () => {
  login('LD-001', 'x'); campo.value = '';
  const folio = asignarOficio('oficio', 'DG', 'a', '2026-01-01', getSession(), 'sol', 'Dest', 'Cargo Uno');
  const f = getOficios().oficios.find(r => r.folio === folio);
  assert.strictEqual(f.cargo_dependencia_origen, 'Cargo Uno'); assert.strictEqual(f.dirigido_a, 'Dest');
  assert.ok(detalleFolioHtml('oficios', f).includes('Cargo Uno'));
  login('SOL-001', 'x'); campo.value = '';
  const r = solicitarFolio('oficio', 'a', '2026-01-01', getSession(), 'sol', 'Dest', 'Cargo Dos');
  assert.strictEqual(getOficios().oficios.find(x => x.folio === r.folio).cargo_dependencia_origen, 'Cargo Dos');
});
t('Cargo/Dependencia de Origen solo existe en Oficio y Memorándum; Oficina de origen ya no existe', () => {
  login('LD-001', 'x'); campo.value = '';
  ['oficio', 'memorandum', 'circular', 'incidencias', 'memorandum_comision'].forEach(tipo => {
    const folio = asignarOficio(tipo, 'DG', 'a', '2026-01-01', getSession(), 'sol', 'Dest', 'Origen X');
    const tabla = TIPOS_OFICIO[tipo];
    const f = getOficios()[tabla].find(r => r.folio === folio);
    const usaCargo = tipo === 'oficio' || tipo === 'memorandum';
    assert.ok(!('oficina_origen' in f));
    assert.strictEqual(f.cargo_dependencia_origen, usaCargo ? 'Origen X' : '');
    assert.strictEqual(valorOrigen(f, tabla), usaCargo ? 'Origen X' : '');
    const det = detalleFolioHtml(tabla, f);
    assert.strictEqual(det.includes('<th>Cargo/Dependencia de Origen</th>'), usaCargo);
    assert.ok(!det.includes('Oficina de origen'));
  });
});
console.log(`\n${n} pruebas OK`);
