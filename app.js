// PEGA AQUÍ EL ENLACE QUE TERMINA EN /exec QUE TE DIO APPS SCRIPT
const API_URL = 'https://script.google.com/macros/s/AKfycbzTxwsrTFfqObBjDvUdn7I73lNO_p--5ST8_Ri6qku9fW6ETG18Mx0h9SZ-a4UFSti8xA/exec'; 

// PEGA TU CÓDIGO BASE64 AQUÍ DENTRO DE LAS COMILLAS
const LOGO_BASE64 = ''; 

function cargarLogos() {
  document.querySelectorAll('.logo-app').forEach(img => {
    if(LOGO_BASE64 !== '') img.src = LOGO_BASE64;
  });
}

function safeGet(k) { try { return localStorage.getItem(k); } catch(e) { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch(e) {} }
function safeRemove(k) { try { localStorage.removeItem(k); } catch(e) {} }

function aplicarTemaGuardado() {
  const tema = safeGet('goodContaTema') || 'dark';
  const htmlEl = document.documentElement;
  const btnTheme = document.getElementById('btn-theme');
  const themeText = document.getElementById('theme-text');
  if (tema === 'dark') {
    htmlEl.classList.add('dark');
    if (btnTheme) btnTheme.innerText = '🌙';
    if (themeText) themeText.innerText = 'Modo Claro';
  } else {
    htmlEl.classList.remove('dark');
    if (btnTheme) btnTheme.innerText = '☀️';
    if (themeText) themeText.innerText = 'Modo Oscuro';
  }
}

function toggleTema() {
  const htmlEl = document.documentElement;
  const btnTheme = document.getElementById('btn-theme');
  const themeText = document.getElementById('theme-text');
  if (htmlEl.classList.contains('dark')) {
    htmlEl.classList.remove('dark');
    safeSet('goodContaTema', 'light');
    if (btnTheme) btnTheme.innerText = '☀️';
    if (themeText) themeText.innerText = 'Modo Oscuro';
  } else {
    htmlEl.classList.add('dark');
    safeSet('goodContaTema', 'dark');
    if (btnTheme) btnTheme.innerText = '🌙';
    if (themeText) themeText.innerText = 'Modo Claro';
  }
}

function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if(sidebar.classList.contains('-translate-x-full')) {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  } else {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }
}

window.onload = function() {
  cargarLogos(); 
  aplicarTemaGuardado();
  const correoGuardado = safeGet('goodContaEmail');
  if (correoGuardado) {
    document.getElementById('email').value = correoGuardado;
    validarCorreo();
  }
};

function cerrarSesion() {
  safeRemove('goodContaEmail');
  document.getElementById('app-content').classList.add('hidden');
  document.getElementById('app-content').innerHTML = '';
  document.getElementById('pantalla-login').classList.replace('hidden', 'flex');
  document.getElementById('email').value = '';
  document.getElementById('btn-login').innerText = "INGRESAR";
  document.getElementById('btn-login').disabled = false;
}

function validarCorreo() {
  const email = document.getElementById('email').value;
  if(!email) return;
  document.getElementById('btn-login').innerText = "VERIFICANDO...";
  document.getElementById('btn-login').disabled = true;
  
  fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ accion: 'buscarRucs', correo: email })
  })
  .then(res => res.json())
  .then(res => {
    if (res.exito) iniciarApp(res.datos);
    else throw new Error(res.error);
  })
  .catch(err => {
    alert("Error de conexión: " + err.message);
    document.getElementById('btn-login').innerText = "INGRESAR";
    document.getElementById('btn-login').disabled = false;
  });
}

// ENRUTADOR DINÁMICO SPA
let empresasUsuario = [];

async function cargarModulo(modulo) {
  try {
    const response = await fetch(`./${modulo}.html`);
    if (!response.ok) throw new Error('Módulo no encontrado');
    const html = await response.text();
    
    const appContent = document.getElementById('app-content');
    appContent.innerHTML = html;
    appContent.classList.remove('hidden');
    
    if (modulo === 'archivador') {
      const selLista = document.getElementById('select-ruc-lista');
      const selForm = document.getElementById('select-ruc-form');
      if (selLista && selForm && empresasUsuario.length > 0) {
        selLista.innerHTML = ''; selForm.innerHTML = '';
        empresasUsuario.forEach(empresa => {
          let val = empresa.ruc + " - " + empresa.razonSocial;
          selLista.appendChild(new Option(val, val));
          selForm.appendChild(new Option(val, val));
        });
      }
      
      // DIBUJAR LOS RECUADROS DESDE JAVASCRIPT AHORA QUE EL HTML EXISTE
      renderizarCajasArchivos();

      document.getElementById('pantalla-lista').classList.remove('hidden');
      actualizarRucYHistorial();
      
      // Reinicializar logos si es necesario
      cargarLogos();
    }
  } catch (error) {
    alert("Error cargando el módulo: " + error.message);
  }
}

function iniciarApp(rucs) {
  if (rucs && rucs.length > 0) {
    empresasUsuario = rucs; 
    safeSet('goodContaEmail', document.getElementById('email').value);
    
    document.getElementById('pantalla-login').classList.replace('flex', 'hidden');
    document.getElementById('btn-login').innerText = "INGRESAR";
    document.getElementById('btn-login').disabled = false;

    cargarModulo('archivador');
  } else {
    document.getElementById('btn-login').innerText = "INGRESAR";
    document.getElementById('btn-login').disabled = false;
    document.getElementById('error-login').classList.remove('hidden');
  }
}

function abrirVisor(url, titulo) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return;
  const fileId = match[1];
  const previewUrl = "https://drive.google.com/file/d/" + fileId + "/preview";
  document.getElementById('modal-titulo').innerText = titulo;
  document.getElementById('modal-contenido').innerHTML = '<iframe src="' + previewUrl + '" allow="autoplay" class="w-full h-full border-none"></iframe>';
  document.getElementById('modal-visor').classList.replace('hidden', 'flex');
}

function cerrarVisor() {
  document.getElementById('modal-visor').classList.replace('flex', 'hidden');
  document.getElementById('modal-contenido').innerHTML = '';
}

function actualizarRucYHistorial() {
  const rucValor = document.getElementById('select-ruc-lista').value;
  document.getElementById('contenedor-historial').innerHTML = '<div class="text-center mt-20 dyn-sm font-semibold tracking-wide uppercase" style="color: var(--text-muted);">Buscando documentos…</div>';
  
  fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ accion: 'obtenerHistorial', ruc: rucValor })
  })
  .then(res => res.json())
  .then(res => {
    if (res.exito) pintarHistorial(res.datos);
    else alert("Error: " + res.error);
  })
  .catch(err => alert("Error de conexión: " + err.message));
}

function pintarHistorial(historial) {
  const contenedor = document.getElementById('contenedor-historial');
  if(!historial || historial.length === 0) {
    contenedor.innerHTML = '<div class="text-center mt-20 dyn-sm font-semibold tracking-wide" style="color: var(--text-muted);">Sin registros. Toca “＋” para crear.</div>';
    return;
  }
  let html = '';
  historial.forEach(item => {
    let gridHtml = '';
    for (const [nombreDoc, url] of Object.entries(item.urls)) {
      if (url && url.toString().startsWith('http')) {
        const match = url.toString().match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
          const thumbUrl = "https://lh3.googleusercontent.com/d/" + match[1] + "=s150";
          gridHtml += `
            <div class="thumb flex flex-col items-center p-1.5 cursor-pointer" onclick="abrirVisor('${url}', '${nombreDoc}')">
              <div class="w-full h-14 rounded-lg flex items-center justify-center overflow-hidden relative" style="background-color: var(--bg-panel);">
                <img src="${thumbUrl}" class="w-full h-full object-cover" onerror="this.outerHTML='<span class=\\'text-2xl\\'>📄</span>'">
              </div>
              <span class="dyn-xs mt-1.5 font-bold text-center w-full truncate px-1" style="color: var(--text-muted);">${nombreDoc}</span>
            </div>`;
        }
      }
    }
    html += `
      <div class="doc-card p-5 flex flex-col">
        <div class="flex justify-between items-center pb-3 mb-4 border-b" style="border-color: var(--border);">
          <span class="font-mono font-bold dyn-base" style="color: var(--brand);">${item.codigo}</span>
          <div class="flex items-center gap-2">
            <span class="dyn-xs font-semibold px-2 py-1 rounded-md" style="background: var(--bg-panel-sunken); color: var(--text-muted);">${item.fecha}</span>
            <button type="button" class="flex justify-center items-center rounded-lg transition-transform hover:scale-105" 
                    style="width: 32px; height: 32px; background-color: var(--brand-soft); color: var(--brand); font-size: 14px;" 
                    onclick="abrirEdicion('${item.codigo}')" title="Modificar Registro">
              ✏️
            </button>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-3">${gridHtml}</div>
      </div>`;
  });
  contenedor.innerHTML = html;
}

function gestionarClickArchivo(id) {
  document.getElementById(id).click();
}

function manejarArchivo(input, id) {
  const box = document.getElementById('box-' + id);
  if (box) box.dataset.url = ""; 
  
  const file = input.files[0];
  const icon = document.getElementById('icon-' + id);
  const img = document.getElementById('img-' + id);
  const doc = document.getElementById('doc-' + id);
  icon.style.display = 'none'; img.style.display = 'none'; doc.style.display = 'none';
  if (file) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) { img.src = e.target.result; img.style.display = 'block'; };
      reader.readAsDataURL(file);
    } else {
      let docIcon = '📄';
      const name = file.name.toLowerCase();
      if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) docIcon = '📊';
      else if (name.endsWith('.pdf')) docIcon = '📑';
      else if (name.endsWith('.zip') || name.endsWith('.rar')) docIcon = '📦';
      doc.innerHTML = `<span class="text-2xl">${docIcon}</span><br><strong>${file.name}</strong>`;
      doc.style.display = 'block';
    }
  } else { icon.style.display = 'flex'; }
}

function abrirFormulario() {
  document.getElementById('id-edicion').value = '';
  document.getElementById('titulo-formulario').innerHTML = '📄 Nuevo';
  document.getElementById('form-archivos').reset();
  document.querySelectorAll('.image-box').forEach(box => box.dataset.url = "");
  document.querySelectorAll('.image-box .icon-container').forEach(el => el.style.display = 'flex');
  document.querySelectorAll('.image-box img').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.image-box .doc-name').forEach(el => el.style.display = 'none');
  
  document.getElementById('pantalla-lista').classList.add('hidden');
  document.getElementById('pantalla-formulario').classList.remove('hidden');
  document.getElementById('pantalla-formulario').scrollTop = 0;
}

function cerrarFormulario() {
  document.getElementById('pantalla-formulario').classList.add('hidden');
  document.getElementById('pantalla-lista').classList.remove('hidden');
}

function sincronizarSelects(valor) {
  document.getElementById('select-ruc-lista').value = valor;
  document.getElementById('select-ruc-form').value = valor;
}

async function enviarFormulario() {
  const form = document.getElementById('form-archivos');
  
  // EVITAR BLOQUEO DE EDICIÓN: Quitar 'required' temporalmente si ya hay un archivo guardado
  let inputsRestaurar = [];
  document.querySelectorAll('.image-box').forEach(box => {
    if (box.dataset.url && box.dataset.url !== "") {
      const input = document.getElementById(box.id.replace('box-', ''));
      if (input && input.required) {
        input.removeAttribute('required');
        inputsRestaurar.push(input);
      }
    }
  });

  const esValido = form.checkValidity();
  
  // Restaurar el 'required' de inmediato
  inputsRestaurar.forEach(input => input.setAttribute('required', 'required'));

  if(!esValido) { 
    form.reportValidity(); 
    return; 
  }
  
  document.getElementById('toast-notificacion').classList.replace('hidden', 'flex');
  document.getElementById('btn-enviar').disabled = true;
  cerrarFormulario();

  try {
    // FUNCIÓN DE LECTURA Y COMPRESIÓN DE IMÁGENES
    const leerBase64 = (file) => new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        // Si no es imagen (PDF, Excel), leer directo
        const reader = new FileReader();
        reader.onload = () => resolve({
          nombre: file.name,
          mimeType: file.type,
          base64: reader.result.split(',')[1]
        });
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
        return;
      }

      // Si es imagen, comprimir a JPG reduciendo resolución y calidad
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // Ancho máximo optimizado
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          // Calcular proporciones si la imagen es gigante
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Exportar a JPEG con 70% de calidad (Reduce drásticamente el peso)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          resolve({
            nombre: file.name.replace(/\.[^/.]+$/, "") + ".jpg", // Forzar extensión JPG
            mimeType: 'image/jpeg',
            base64: dataUrl.split(',')[1]
          });
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    let payloadForm = { 
      ruc: document.getElementById('select-ruc-form').value,
      idEdicion: document.getElementById('id-edicion').value,
      usuarioEmail: document.getElementById('email').value 
    };
    const inputsFiles = form.querySelectorAll('input[type="file"]');
    
    // Convertir y comprimir archivos asíncronamente
    for (let input of inputsFiles) {
      if (input.files.length > 0) {
        payloadForm[input.name] = await leerBase64(input.files[0]);
      }
    }

    // Petición POST al backend
    const respuesta = await fetch(API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ accion: 'procesarSubida', formulario: payloadForm })
    });

    // Capturar respuesta en texto puro para evitar el crash del JSON parser
    const texto = await respuesta.text();
    let res;
    try {
      res = JSON.parse(texto);
    } catch (e) {
      console.error("Respuesta HTML de Google bloqueando la subida:", texto);
      throw new Error("El servidor bloqueó la subida de los archivos. Asegúrate de haber publicado como 'Nueva Versión' en Apps Script.");
    }

    document.getElementById('toast-notificacion').classList.replace('flex', 'hidden');
    document.getElementById('btn-enviar').disabled = false;

    if (res.exito) {
      form.reset();
      document.querySelectorAll('.image-box .icon-container').forEach(el => el.style.display = 'flex');
      document.querySelectorAll('.image-box img').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.image-box .doc-name').forEach(el => el.style.display = 'none');
      actualizarRucYHistorial();
    } else {
      alert("Error al guardar: " + res.error);
    }

  } catch (err) {
    // Si la compresión o la subida fallan, atrapar el error sin congelar la pantalla
    document.getElementById('toast-notificacion').classList.replace('flex', 'hidden');
    document.getElementById('btn-enviar').disabled = false;
    alert("Problema al procesar: " + err.message);
  }
}

function abrirEdicion(codigo) {
  document.getElementById('loader').style.display = 'flex';
  
  fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ accion: 'obtenerRegistro', codigo: codigo })
  })
  .then(res => res.json())
  .then(res => {
    document.getElementById('loader').style.display = 'none';
    if (res.exito && res.datos) {
      const datos = res.datos;
      document.getElementById('id-edicion').value = codigo;
      document.getElementById('titulo-formulario').innerHTML = '✏️ Editando';
      
      for (const [id, url] of Object.entries(datos)) {
        const box = document.getElementById('box-' + id);
        if (!box) continue;
        
        const img = document.getElementById('img-' + id);
        const doc = document.getElementById('doc-' + id);
        const icon = document.getElementById('icon-' + id);
        
        if (url && url !== "") {
          box.dataset.url = url;
          icon.style.display = 'none';
          
          const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
          if (match) {
             img.src = "https://lh3.googleusercontent.com/d/" + match[1] + "=s150";
             img.style.display = 'block';
             doc.style.display = 'none';
          } else {
             doc.innerHTML = `<span class="text-2xl">📄</span><br><strong>Archivo guardado</strong>`;
             doc.style.display = 'block';
             img.style.display = 'none';
          }
        } else {
          box.dataset.url = "";
          icon.style.display = 'flex';
          img.style.display = 'none';
          doc.style.display = 'none';
        }
      }

      document.getElementById('pantalla-lista').classList.add('hidden');
      document.getElementById('pantalla-formulario').classList.remove('hidden');
      document.getElementById('pantalla-formulario').scrollTop = 0;
    } else {
      alert("No se encontró el registro.");
    }
  })
  .catch(error => {
    document.getElementById('loader').style.display = 'none';
    alert("Error de conexión: " + error.message);
  });
}

// INYECCIÓN DINÁMICA DE RECUADROS PARA FORMULARIO SPA
function renderizarCajasArchivos() {
  const contenedor = document.getElementById('contenedor-campos-archivos');
  if (!contenedor) return;

  const campos = [
    { id: 'factura', label: 'Factura', req: true },
    { id: 'voucher', label: 'Voucher', req: false },
    { id: 'guiaRemision', label: 'Guía Remisión', req: false },
    { id: 'guiaTransportista', label: 'Guía Transp.', req: false },
    { id: 'cotizacion', label: 'Cotización', req: false },
    { id: 'ordenCompra', label: 'Orden Compra', req: false },
    { id: 'recepcionInventario', label: 'Rec. Invent.', req: false },
    { id: 'adicional', label: 'Adicional', req: false }
  ];

  let html = '';
  campos.forEach(c => {
    html += `
      <div class="form-group flex flex-col gap-2">
        <label class="dyn-xs font-bold uppercase tracking-wide" style="color: var(--text-main);">${c.label}${c.req ? ' <span class="required-dot">●</span>' : ''}</label>
        <div class="image-box" id="box-${c.id}" data-url="" onclick="gestionarClickArchivo('${c.id}')">
          <div class="icon-container flex flex-col items-center" id="icon-${c.id}">
            <div style="font-size: 24px;">📎</div>
            <div class="dyn-xs mt-1 font-medium" style="color: var(--text-muted);">Adjuntar</div>
          </div>
          <img id="img-${c.id}">
          <div class="doc-name" id="doc-${c.id}"></div>
        </div>
        <input type="file" id="${c.id}" name="${c.id}" accept="image/*,application/pdf,.xlsx,.xls,.doc,.docx,.csv,.zip" ${c.req ? 'required' : ''} onchange="manejarArchivo(this, '${c.id}')">
      </div>`;
  });
  contenedor.innerHTML = html;
}
