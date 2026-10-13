// Almacen de los Congelados. Configuración exclusiva de esta planilla.
// SHEET_ID: solo el ID entre /d/ y /edit del enlace de Google Sheets.
// WHATSAPP: número internacional confirmado, solo dígitos.
const CONFIG = {
  SHEET_ID: '1OvmlH2GbthgoCC3jDsdoC9fw8R0uaFokckloZAi-5BE',
  TAB: 'Productos',
  WHATSAPP: '543413274903'
};
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Almacen de los Congelados | Catálogo')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function normalizar_(v) {
  return String(v == null ? '' : v).trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function getCatalog() {
  if (!CONFIG.SHEET_ID || CONFIG.SHEET_ID.indexOf('PEGAR_') === 0) throw new Error('Configurá SHEET_ID en Code.gs.');
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(CONFIG.TAB);
  if (!sheet) throw new Error('No existe la pestaña Productos. Revisá el nombre en CONFIG.TAB.');
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift().map(normalizar_);
  const names = ['ID', 'Mostrar en web', 'Estado de stock', 'Categoría', 'Marca',
    'Nombre del producto', 'Descripción / contenido', 'Tipo de venta',
    'Presentación mayorista', 'Precio ARS', 'URL de imagen', 'Código / SKU'];
  const cols = names.map(n => headers.indexOf(normalizar_(n)));
  if (cols.some(c => c < 0)) throw new Error('Faltan columnas: ' + names.filter((n,i) => cols[i] < 0).join(', '));
  const result = [], seen = new Set();
  rows.forEach((row, i) => {
    const v = cols.map(c => row[c]);
    if (v.every(x => x === '' || x == null)) return;
    if (normalizar_(v[1]) === 'no') return;
    const error = text => { throw new Error('Fila ' + (i+2) + ': ' + text); };
    if (normalizar_(v[1]) !== 'si') error('Mostrar en web debe ser Sí o No.');
    const id = String(v[0]).trim();
    if (!id || seen.has(id)) error('ID vacío o repetido.');
    seen.add(id);
    const stock = normalizar_(v[2]);
    if (!['disponible','sin stock'].includes(stock)) error('Estado de stock debe ser Disponible o Sin stock.');
    const type = normalizar_(v[7]);
    if (!['unidad','kilo','caja','pack','bulto'].includes(type)) error('Tipo de venta no válido.');
    if (typeof v[9] !== 'number' || !Number.isFinite(v[9]) || v[9] < 0) error('Precio ARS debe ser un número, sin escribir el símbolo $.');
    if (!String(v[5]).trim()) error('Falta Nombre del producto.');
    const image = String(v[10] || '').trim();
    if (image && !/^https:\/\//i.test(image)) error('URL de imagen debe comenzar con https://.');
    result.push({id, name:String(v[5]), brand:String(v[4] || ''), category:String(v[3] || 'Otros'),
      unit:String(v[6] || ''), type, presentation:String(v[8] || ''), price:v[9],
      image, sku:String(v[11] || ''), available:stock === 'disponible'});
  });
  return {products:result, whatsappReady:/^[1-9]\d{7,14}$/.test(CONFIG.WHATSAPP)};
}
// Consulta precios y disponibilidad. No registra pedidos ni descuenta stock.
function prepareOrder(items) {
  if (!Array.isArray(items) || !items.length || items.length > 500) throw new Error('El pedido está vacío o no es válido.');
  const data = getCatalog();
  if (!data.whatsappReady) throw new Error('Por el momento no se pueden preparar pedidos por WhatsApp.');
  const byId = new Map(data.products.map(p => [p.id,p]));
  const seen = new Set(); let total = 0;
  const money = n => '$' + n.toLocaleString('es-AR', {minimumFractionDigits:2,maximumFractionDigits:2});
  const lines = items.map(item => {
    const id = String(item.id), p = byId.get(id), q = item.qty;
    if (!p || !p.available) throw new Error('Un producto está oculto o sin stock. Actualizá el catálogo y revisá tu pedido.');
    if (seen.has(id)) throw new Error('Producto repetido.');
    seen.add(id);
    if (typeof q !== 'number' || !Number.isFinite(q) || q <= 0 || q > 9999 ||
      (p.type !== 'kilo' && !Number.isInteger(q)) || Math.abs(q*100-Math.round(q*100)) > 0.000001)
      throw new Error('Cantidad no válida para ' + p.name + '.');
    if (item.price !== p.price || item.type !== p.type) throw new Error('Cambió el precio o tipo de venta. Actualizá el catálogo y revisá el total.');
    const subtotal = Math.round(p.price*q*100)/100; total += subtotal;
    return q.toLocaleString('es-AR') + ' ' + p.type + ' × ' + p.name +
      (p.sku ? ' ['+p.sku+']' : '') + (p.unit || p.presentation ? '\n' + [p.unit, p.presentation].filter(Boolean).join(' · ') : '') +
      '\nPrecio por '+p.type+': '+money(p.price)+' · Subtotal: '+money(subtotal);
  });
  const text = 'Hola, Almacen de los Congelados. Quiero consultar este pedido:\n\n' + lines.join('\n\n') +
    '\n\nTotal estimado: '+money(total)+'\n¿Me confirmás disponibilidad y precio final?';
  return {url:'https://wa.me/'+CONFIG.WHATSAPP+'?text='+encodeURIComponent(text)};
}
