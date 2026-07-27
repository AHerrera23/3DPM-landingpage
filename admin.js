// ============================================
// PANEL DE ADMINISTRACIÓN — lógica
// ============================================
// Depende de:
// - firebase-config.js (exporta db, auth)
// - categorias.js (cargado como script clásico antes que
//   este módulo, define la variable global CATEGORIAS)
//
// Las imágenes NO se suben a ningún storage: el cliente pega
// un link (típicamente de Google Drive) y este script lo
// convierte a un formato que sí funciona como <img src>.
// ============================================

import { db, auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDoc,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// --- Elementos del DOM ---
const loginView = document.getElementById('login-view');
const adminView = document.getElementById('admin-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const productForm = document.getElementById('product-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const editingIdInput = document.getElementById('editing-id');

const nombreInput = document.getElementById('nombre');
const precioInput = document.getElementById('precio');
const categoriaSelect = document.getElementById('categoria');
const subcategoriaSelect = document.getElementById('subcategoria');
const descripcionInput = document.getElementById('descripcion');
const imagenUrlInput = document.getElementById('imagen-url');
const imagenPreview = document.getElementById('imagen-preview');
const imagenPreviewError = document.getElementById('imagen-preview-error');

const productList = document.getElementById('admin-product-list');

let unsubscribeProductos = null;

// --- Convertir un link de Google Drive a un formato que sirve como <img src> ---
// Acepta los dos formatos más comunes que da Drive al compartir:
//   https://drive.google.com/file/d/ARCHIVO_ID/view?usp=sharing
//   https://drive.google.com/open?id=ARCHIVO_ID
// Si no es un link de Drive, lo devuelve tal cual (asumimos que ya
// es una URL de imagen directa de otro origen).
function convertirLinkImagen(url) {
  if (!url) return '';
  url = url.trim();

  const matchFile = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (matchFile) return `https://lh3.googleusercontent.com/d/${matchFile[1]}`;

  const matchOpenId = url.match(/[?&]id=([^&]+)/);
  if (matchOpenId && url.includes('drive.google.com')) {
    return `https://lh3.googleusercontent.com/d/${matchOpenId[1]}`;
  }

  return url;
}

// --- Preview en vivo de la imagen mientras se pega el link ---
function actualizarPreview() {
  const url = convertirLinkImagen(imagenUrlInput.value);
  imagenPreviewError.textContent = '';

  if (!url) {
    imagenPreview.style.display = 'none';
    return;
  }

  imagenPreview.onload = () => {
    imagenPreview.style.display = 'block';
  };
  imagenPreview.onerror = () => {
    imagenPreview.style.display = 'none';
    imagenPreviewError.textContent = 'No se pudo cargar la imagen con ese link. Revisá que el archivo de Drive esté compartido como "Cualquiera con el enlace".';
  };
  imagenPreview.src = url;
}

imagenUrlInput.addEventListener('input', actualizarPreview);
imagenUrlInput.addEventListener('blur', actualizarPreview);

// --- Poblar selects de categoría/subcategoría desde CATEGORIAS ---
function poblarCategorias() {
  categoriaSelect.innerHTML = '<option value="">Elegí una categoría</option>' +
    CATEGORIAS.map(cat => `<option value="${cat.slug}">${cat.label}</option>`).join('');
}

function poblarSubcategorias(categoriaSlug) {
  const cat = CATEGORIAS.find(c => c.slug === categoriaSlug);
  if (!cat) {
    subcategoriaSelect.innerHTML = '<option value="">Elegí primero una categoría</option>';
    subcategoriaSelect.disabled = true;
    return;
  }
  subcategoriaSelect.disabled = false;
  subcategoriaSelect.innerHTML = '<option value="">Elegí una subcategoría</option>' +
    cat.subcategorias.map(sub => `<option value="${sub.slug}">${sub.label}</option>`).join('');
}

categoriaSelect.addEventListener('change', () => {
  poblarSubcategorias(categoriaSelect.value);
});

function formatearCategoria(categoriaSlug, subcategoriaSlug) {
  const cat = CATEGORIAS.find(c => c.slug === categoriaSlug);
  if (!cat) return '—';
  const sub = cat.subcategorias.find(s => s.slug === subcategoriaSlug);
  return sub ? `${cat.label} · ${sub.label}` : cat.label;
}

// --- Login / logout ---
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    loginError.textContent = 'Email o contraseña incorrectos.';
  }
});

logoutBtn.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginView.style.display = 'none';
    adminView.style.display = 'block';
    poblarCategorias();
    escucharProductos();
  } else {
    loginView.style.display = 'flex';
    adminView.style.display = 'none';
    if (unsubscribeProductos) unsubscribeProductos();
  }
});

// --- Escuchar productos en tiempo real ---
function escucharProductos() {
  const q = query(collection(db, 'productos'), orderBy('creadoEn', 'desc'));
  unsubscribeProductos = onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      productList.innerHTML = '<p class="empty-state">Todavía no cargaste ningún producto.</p>';
      return;
    }
    productList.innerHTML = '';
    snapshot.forEach(docSnap => {
      const p = docSnap.data();
      const row = document.createElement('div');
      row.className = 'admin-product-row';
      row.innerHTML = `
        <img src="${p.imagenUrl || 'https://placehold.co/80x80/1a2744/ffffff?text=Sin+foto'}" alt="${p.nombre}" />
        <div class="admin-product-info">
          <strong>${p.nombre}</strong>
          <span>${formatearCategoria(p.categoria, p.subcategoria)}</span>
          <span class="product-price">$${p.precio}</span>
        </div>
        <div class="admin-product-actions">
          <label class="admin-toggle">
            <input type="checkbox" ${p.activo ? 'checked' : ''} data-id="${docSnap.id}" data-action="toggle" />
            Activo
          </label>
          <button data-id="${docSnap.id}" data-action="edit" class="btn btn-outline">Editar</button>
          <button data-id="${docSnap.id}" data-action="delete" class="btn btn-outline">Eliminar</button>
        </div>
      `;
      productList.appendChild(row);
    });
  }, (error) => {
    productList.innerHTML = '<p class="empty-state">No se pudo cargar la lista de productos.</p>';
    console.error(error);
  });
}

// --- Acciones sobre la lista: editar / eliminar / activar-desactivar ---
productList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  const accion = btn.dataset.action;

  if (accion === 'delete') {
    if (!confirm('¿Seguro que querés eliminar este producto? No se puede deshacer.')) return;
    await deleteDoc(doc(db, 'productos', id));
  }

  if (accion === 'edit') {
    cargarProductoEnFormulario(id);
  }
});

productList.addEventListener('change', async (e) => {
  const checkbox = e.target.closest('input[data-action="toggle"]');
  if (!checkbox) return;
  await updateDoc(doc(db, 'productos', checkbox.dataset.id), { activo: checkbox.checked });
});

// --- Cargar un producto existente en el formulario para editarlo ---
async function cargarProductoEnFormulario(id) {
  const snap = await getDoc(doc(db, 'productos', id));
  if (!snap.exists()) return;
  const p = snap.data();

  editingIdInput.value = id;
  nombreInput.value = p.nombre || '';
  precioInput.value = p.precio || '';
  categoriaSelect.value = p.categoria || '';
  poblarSubcategorias(p.categoria);
  subcategoriaSelect.value = p.subcategoria || '';
  descripcionInput.value = p.descripcion || '';
  imagenUrlInput.value = p.imagenUrlOriginal || p.imagenUrl || '';
  actualizarPreview();

  formTitle.textContent = 'Editar producto';
  submitBtn.textContent = 'Guardar cambios';
  cancelEditBtn.style.display = 'inline-block';
  productForm.scrollIntoView({ behavior: 'smooth' });
}

cancelEditBtn.addEventListener('click', resetFormulario);

function resetFormulario() {
  productForm.reset();
  editingIdInput.value = '';
  imagenPreview.style.display = 'none';
  imagenPreviewError.textContent = '';
  subcategoriaSelect.innerHTML = '<option value="">Elegí primero una categoría</option>';
  subcategoriaSelect.disabled = true;
  formTitle.textContent = 'Agregar producto';
  submitBtn.textContent = 'Agregar producto';
  cancelEditBtn.style.display = 'none';
}

// --- Guardar producto (crear o editar) ---
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  submitBtn.textContent = 'Guardando...';

  try {
    const linkOriginal = imagenUrlInput.value.trim();
    const imagenUrl = convertirLinkImagen(linkOriginal);

    const datos = {
      nombre: nombreInput.value.trim(),
      precio: Number(precioInput.value),
      categoria: categoriaSelect.value,
      subcategoria: subcategoriaSelect.value,
      descripcion: descripcionInput.value.trim(),
      imagenUrl,
      imagenUrlOriginal: linkOriginal // guardamos el link tal cual lo pegó, para poder editarlo después
    };

    const editingId = editingIdInput.value;
    if (editingId) {
      await updateDoc(doc(db, 'productos', editingId), datos);
    } else {
      await addDoc(collection(db, 'productos'), {
        ...datos,
        activo: true,
        creadoEn: serverTimestamp()
      });
    }

    resetFormulario();
  } catch (err) {
    alert('Hubo un error al guardar el producto. Revisá la consola del navegador para más detalle.');
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = editingIdInput.value ? 'Guardar cambios' : 'Agregar producto';
  }
});
