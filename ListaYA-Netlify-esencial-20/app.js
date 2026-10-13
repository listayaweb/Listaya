'use strict';
// Add verified business contacts here when the owner provides them.
const CONTACT = {whatsapp: '543413201120', instagram: 'https://www.instagram.com/listayaok/'};
const $ = id => document.getElementById(id);
const money = new Intl.NumberFormat('es-AR', {style:'currency', currency:'ARS', maximumFractionDigits:0});
const catalogues = {
 indumentaria: {name:'Alma Estudio', subtitle:'Básicos para todos los días · catálogo de muestra', products:[
  {id:'remera',name:'Remera esencial',category:'Prendas',price:18000,unit:'Unidad',image:'remera'},
  {id:'buzo',name:'Buzo de todos los días',category:'Prendas',price:34000,unit:'Unidad',image:'buzo'},
  {id:'mochila',name:'Mochila urbana',category:'Accesorios',price:26000,unit:'Unidad',image:'bolso'}]},
 alimentos: {name:'Raíz · Almacén natural', subtitle:'Elegí por unidad o por kilo · catálogo de muestra', products:[
  {id:'avena',name:'Avena tradicional',category:'Cereales',price:4500,unit:'Kilo',image:'granola'},
  {id:'cafe',name:'Café en grano · 250 g',category:'Almacén',price:8500,unit:'Unidad',image:'cafe'},
  {id:'pan',name:'Pan artesanal',category:'Almacén',price:6000,unit:'Unidad',image:'pan'}]},
 mayorista: {name:'Norte Distribuidora', subtitle:'Presentaciones claras para comprar por cantidad · catálogo de muestra', products:[
  {id:'pack-cafe',name:'Café en grano · pack × 6',category:'Packs',price:45000,unit:'Pack',image:'cafe'},
  {id:'bolsa-avena',name:'Avena tradicional · 1 kg',category:'Bolsas',price:3900,unit:'Unidad',image:'granola'},
  {id:'caja-pan',name:'Pan artesanal · caja × 12',category:'Cajas',price:60000,unit:'Caja',image:'pan'}]}
};
let selected = 'indumentaria', filter = 'Todos', cart = new Map();
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
function openDialog(dialog){dialog.showModal();document.body.classList.add('dialog-open');}
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog=>{
 dialog.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open');});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
});
$('menu-toggle').addEventListener('click',()=>{
 const open=$('navigation').classList.toggle('open');$('menu-toggle').setAttribute('aria-expanded',String(open));$('menu-toggle').setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
});
document.querySelectorAll('#navigation a').forEach(a=>a.addEventListener('click',()=>{$('navigation').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');$('menu-toggle').setAttribute('aria-label','Abrir menú');}));
document.querySelectorAll('[data-plan]').forEach(a=>a.addEventListener('click',()=>{$('contact-plan').value=a.dataset.plan;}));
document.querySelectorAll('[data-demo]').forEach(button=>button.addEventListener('click',()=>{
 selected=button.dataset.demo;filter='Todos';cart=new Map();$('demo-search').value='';$('order-preview').hidden=true;
 $('demo-title').textContent=catalogues[selected].name;$('demo-subtitle').textContent=catalogues[selected].subtitle;
 renderFilters();renderProducts();renderCart();openDialog($('demo-dialog'));
}));
function renderFilters(){
 const categories=['Todos',...new Set(catalogues[selected].products.map(p=>p.category))];$('demo-filters').replaceChildren();
 categories.forEach(category=>{const button=document.createElement('button');button.textContent=category;button.setAttribute('aria-pressed',String(filter===category));button.addEventListener('click',()=>{filter=category;renderFilters();renderProducts();});$('demo-filters').append(button);});
}
function renderProducts(){
 const search=normalize($('demo-search').value);const list=catalogues[selected].products.filter(p=>(filter==='Todos'||p.category===filter)&&normalize(p.name+' '+p.category).includes(search));
 $('demo-products').innerHTML=list.length?list.map(p=>`<article class="product-card"><img src="assets/${p.image}.jpg" alt="${p.name}" width="600" height="600"><h3>${p.name}</h3><p>${p.unit==='Kilo'?'Precio por kilo':p.unit==='Pack'?'Precio por pack':p.unit==='Caja'?'Precio por caja':'Precio por unidad'}</p><strong>${money.format(p.price)}</strong><button data-add="${p.id}" aria-label="Agregar ${p.name}">+ Agregar</button></article>`).join(''):'<p class="demo-empty-results">No encontramos productos. Probá con otro nombre o categoría.</p>';
 $('demo-products').querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>changeQuantity(button.dataset.add,1)));
}
$('demo-search').addEventListener('input',renderProducts);
function productById(id){return catalogues[selected].products.find(p=>p.id===id);}
function changeQuantity(id,direction){const p=productById(id);const step=p.unit==='Kilo'?0.5:1;const quantity=Math.round(((cart.get(id)||0)+step*direction)*100)/100;if(quantity<=0)cart.delete(id);else cart.set(id,quantity);$('order-preview').hidden=true;renderCart();$('demo-status').textContent=quantity>0?`${p.name}: ${quantity} ${p.unit==='Kilo'?'kilos':'en el pedido'}`:`${p.name} eliminado del pedido`;}
function total(){return [...cart].reduce((sum,[id,q])=>sum+productById(id).price*q,0);}
function renderCart(){
 $('cart-count').textContent=String(cart.size);$('cart-total').textContent=money.format(total());$('prepare-order').disabled=cart.size===0;
 $('cart-items').innerHTML=cart.size?[...cart].map(([id,q])=>{const p=productById(id);return `<div class="cart-row"><div><strong>${p.name}</strong><button class="remove-item" data-remove="${id}" aria-label="Quitar ${p.name}">Quitar</button></div><div class="quantity-row"><div class="quantity-buttons"><button data-qty="${id}" data-direction="-1" aria-label="Restar cantidad de ${p.name}">−</button><span>${q.toLocaleString('es-AR')}${p.unit==='Kilo'?' kg':''}</span><button data-qty="${id}" data-direction="1" aria-label="Sumar cantidad de ${p.name}">+</button></div><span>${money.format(p.price*q)}</span></div></div>`;}).join(''):'<p class="cart-empty">Elegí un producto para ver cómo se arma el pedido.</p>';
 $('cart-items').querySelectorAll('[data-qty]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.qty,direction=Number(b.dataset.direction);changeQuantity(id,direction);const match=[...$('cart-items').querySelectorAll('[data-qty]')].find(x=>x.dataset.qty===id&&Number(x.dataset.direction)===direction);if(match)match.focus();else $('demo-search').focus();}));
 $('cart-items').querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{const p=productById(b.dataset.remove);cart.delete(b.dataset.remove);$('order-preview').hidden=true;renderCart();$('demo-status').textContent=`${p.name} eliminado del pedido`;$('demo-search').focus();}));
}
$('prepare-order').addEventListener('click',()=>{
 const lines=[`Hola, ${catalogues[selected].name}. Quisiera consultar por este pedido:`, '',...[...cart].map(([id,q])=>{const p=productById(id);return `${q.toLocaleString('es-AR')}${p.unit==='Kilo'?' kg':' ×'} ${p.name} — ${money.format(p.price*q)}`;}),'',`Total estimado: ${money.format(total())}`,'A confirmar precio y disponibilidad.'];
 $('order-message').value=lines.join('\n');$('order-preview').hidden=false;$('copy-order').textContent='Copiar pedido';$('order-preview').scrollIntoView({block:'nearest',behavior:'smooth'});
});
async function copyText(text,field,status){try{await navigator.clipboard.writeText(text);status('Copiado.');}catch{field.focus();field.select();status('Seleccionamos el texto. Usá la opción Copiar de tu dispositivo.');}}
$('copy-order').addEventListener('click',()=>copyText($('order-message').value,$('order-message'),message=>{$('copy-order').textContent=message;$('demo-status').textContent=message;}));
$('contact-form').addEventListener('submit',event=>{
 event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;const data=new FormData(form);
 const summary=`Hola, ListaYA. Me gustaría consultar por un catálogo web.\n\nMi nombre: ${data.get('name').trim()}\nMi negocio: ${data.get('business').trim()}\nQué vendo: ${data.get('sector').trim()}\nMe interesa: ${data.get('plan')}\n\nLo que necesito:\n${data.get('message').trim()}`;
 $('contact-summary').value=summary;$('contact-status').textContent='';
 if(CONTACT.whatsapp){window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(summary)}`,'_blank','noopener,noreferrer');}else{openDialog($('contact-dialog'));}
});
$('copy-contact').addEventListener('click',()=>copyText($('contact-summary').value,$('contact-summary'),message=>{$('contact-status').textContent=message;}));
$('download-contact').addEventListener('click',()=>{
 const blob=new Blob([$('contact-summary').value],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='mi-consulta-listaya.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('contact-status').textContent='Resumen preparado para descargar.';
});
