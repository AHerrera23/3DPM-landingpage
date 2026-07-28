// ============================================
// PANEL DE ADMINISTRACIÓN — Lógica Integrada
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

// Formulario Categorías
const categoryForm = document.getElementById('category-form');
const catFormTitle = document.getElementById('cat-form-title');
const catEditingIdInput = document.getElementById('cat-editing-id');
const catLabelInput = document.getElementById('cat-label');
const catDescInput = document.getElementById('cat-descripcion');
const newSubcatInput = document.getElementById('new-subcat-label');
const addSubcatBtn = document.getElementById('add-subcat-btn');
const subcatList = document.getElementById('subcategories-list');
const catSubmitBtn = document.getElementById('cat-submit-btn');
const catCancelBtn = document.getElementById('cat-cancel-btn');
const adminCategoryList = document.getElementById('admin-category-list');

// Formulario Productos
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

// --- Estado local ---
let categoriasData = [];
let subcategoriasTemporales = [];
let unsubscribeCategorias = null;
let unsubscribeProductos = null;

// --- Helper para slugs limpios de URL ---
function crearSlug(texto) {
  return texto
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// --- Conversor de Imagen Google Drive ---
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
    imagenPreviewError.textContent = 'No se pudo cargar la imagen. Verificá los permisos del archivo en Drive.';
  };
  imagenPreview.src = url;
}

imagenUrlInput.addEventListener('input', actualizarPreview);
imagenUrlInput.addEventListener('blur', actualizarPreview);

// ============================================
// LÓGICA DE CATEGORÍAS (Firestore)
// ============================================

function escucharCategorias() {
  const q = query(collection(db, 'categorias'));
  unsubscribeCategorias = onSnapshot(q, (snapshot) => {
    categoriasData = [];
    snapshot.forEach(docSnap => {
      categoriasData.push({ id: docSnap.id, ...docSnap.data() });
    });

    renderizarListaCategorias();
    poblarCategoriasSelect();
  }, (error) => {
    console.error('Error al obtener categorías:', error);
    adminCategoryList.innerHTML = '<p class="empty-state">Error al cargar categorías.</p>';
  });
}

function renderizarListaCategorias() {
  if (categoriasData.length === 0) {
    adminCategoryList.innerHTML = '<p class="empty-state">Aún no agregaste categorías.</p>';
    return;
  }

  adminCategoryList.innerHTML = categoriasData.map(cat => {
    const subNombres = cat.subcategorias && cat.subcategorias.length > 0
      ? cat.subcategorias.map(s => s.label).join(', ')
      : 'Sin subcategorías';

    return `
      <div class="admin-product-row">
        <div class="admin-product-info">
          <strong>${cat.label} <small style="color:#888;">(${cat.slug})</small></strong>
          <span>${subNombres}</span>
        </div>
        <div class="admin-product-actions">
          <button data-id="${cat.id}" data-action="edit-cat" class="btn btn-outline">Editar</button>
          <button data-id="${cat.id}" data-action="delete-cat" class="btn btn-outline">Eliminar</button>
        </div>
      </div>
    `;
  }).join('');
}

// Subcategorías temporales en formulario
addSubcatBtn.addEventListener('click', () => {
  const label = newSubcatInput.value.trim();
  if (!label) return;

  const slug = crearSlug(label);
  subcategoriasTemporales.push({ label, slug });
  newSubcatInput.value = '';
  renderSubcategoriasForm();
});

function renderSubcategoriasForm() {
  subcatList.innerHTML = subcategoriasTemporales.map((sub, index) => `
    <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.08); padding:4px 10px; border-radius:4px; margin: 2px;">
      <small><strong>${sub.label}</strong></small>
      <button type="button" data-index="${index}" data-action="remove-subcat" style="background:none; border:none; color:#e30613; cursor:pointer; font-weight:bold;">✕</button>
    </div>
  `).join('');
}

subcatList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action="remove-subcat"]');
  if (!btn) return;
  const index = Number(btn.dataset.index);
  subcategoriasTemporales.splice(index, 1);
  renderSubcategoriasForm();
});

// Guardar categoría
categoryForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  catSubmitBtn.disabled = true;

  const label = catLabelInput.value.trim();
  const slug = crearSlug(label);
  const descripcion = catDescInput.value.trim();
  const editId = catEditingIdInput.value;

  const datos = {
    label,
    slug,
    descripcion,
    subcategorias: subcategoriasTemporales
  };

  try {
    if (editId) {
      await updateDoc(doc(db, 'categorias', editId), datos);
    } else {
      await addDoc(collection(db, 'categorias'), datos);
    }
    resetCatForm();
  } catch (err) {
    console.error(err);
    alert('Error al guardar la categoría.');
  } finally {
    catSubmitBtn.disabled = false;
  }
});

function resetCatForm() {
  categoryForm.reset();
  catEditingIdInput.value = '';
  subcategoriasTemporales = [];
  renderSubcategoriasForm();
  catFormTitle.textContent = 'Agregar categoría';
  catSubmitBtn.textContent = 'Agregar categoría';
  catCancelBtn.style.display = 'none';
}

catCancelBtn.addEventListener('click', resetCatForm);

// Eventos sobre la lista de categorías
adminCategoryList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === 'delete-cat') {
    if (!confirm('¿Eliminar esta categoría? Los productos asociados pueden quedar desorganizados.')) return;
    await deleteDoc(doc(db, 'categorias', id));
  }

  if (action === 'edit-cat') {
    const cat = categoriasData.find(c => c.id === id);
    if (!cat) return;

    catEditingIdInput.value = cat.id;
    catLabelInput.value = cat.label;
    catDescInput.value = cat.descripcion || '';
    subcategoriasTemporales = [...(cat.subcategorias || [])];

    renderSubcategoriasForm();
    catFormTitle.textContent = 'Editar categoría';
    catSubmitBtn.textContent = 'Guardar cambios';
    catCancelBtn.style.display = 'inline-block';
    categoryForm.scrollIntoView({ behavior: 'smooth' });
  }
});

// ============================================
// LÓGICA DE PRODUCTOS (Firestore)
// ============================================

function poblarCategoriasSelect() {
  if (categoriasData.length === 0) {
    categoriaSelect.innerHTML = '<option value="">No hay categorías creadas</option>';
    return;
  }

  const selectedPrev = categoriaSelect.value;
  categoriaSelect.innerHTML = '<option value="">Elegí una categoría</option>' +
    categoriasData.map(cat => `<option value="${cat.slug}">${cat.label}</option>`).join('');

  if (selectedPrev) {
    categoriaSelect.value = selectedPrev;
  }
}

function poblarSubcategoriasSelect(categoriaSlug) {
  const cat = categoriasData.find(c => c.slug === categoriaSlug);
  if (!cat || !cat.subcategorias || cat.subcategorias.length === 0) {
    subcategoriaSelect.innerHTML = '<option value="">Sin subcategorías</option>';
    subcategoriaSelect.disabled = true;
    return;
  }
  subcategoriaSelect.disabled = false;
  subcategoriaSelect.innerHTML = '<option value="">Elegí una subcategoría</option>' +
    cat.subcategorias.map(sub => `<option value="${sub.slug}">${sub.label}</option>`).join('');
}

categoriaSelect.addEventListener('change', () => {
  poblarSubcategoriasSelect(categoriaSelect.value);
});

function formatearCategoria(categoriaSlug, subcategoriaSlug) {
  const cat = categoriasData.find(c => c.slug === categoriaSlug);
  if (!cat) return '—';
  const sub = cat.subcategorias?.find(s => s.slug === subcategoriaSlug);
  return sub ? `${cat.label} · ${sub.label}` : cat.label;
}

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

// Acciones sobre la lista de productos
productList.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;
  const accion = btn.dataset.action;

  if (accion === 'delete') {
    if (!confirm('¿Seguro que querés eliminar este producto?')) return;
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

async function cargarProductoEnFormulario(id) {
  const snap = await getDoc(doc(db, 'productos', id));
  if (!snap.exists()) return;
  const p = snap.data();

  editingIdInput.value = id;
  nombreInput.value = p.nombre || '';
  precioInput.value = p.precio || '';
  
  categoriaSelect.value = p.categoria || '';
  poblarSubcategoriasSelect(p.categoria);
  subcategoriaSelect.value = p.subcategoria || '';
  
  descripcionInput.value = p.descripcion || '';
  imagenUrlInput.value = p.imagenUrlOriginal || p.imagenUrl || '';
  actualizarPreview();

  formTitle.textContent = 'Editar producto';
  submitBtn.textContent = 'Guardar cambios';
  cancelEditBtn.style.display = 'inline-block';
  productForm.scrollIntoView({ behavior: 'smooth' });
}

cancelEditBtn.addEventListener('click', resetFormularioProductos);

function resetFormularioProductos() {
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
      imagenUrlOriginal: linkOriginal
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

    resetFormularioProductos();
  } catch (err) {
    alert('Error al guardar el producto.');
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = editingIdInput.value ? 'Guardar cambios' : 'Agregar producto';
  }
});

// ============================================
// AUTENTICACIÓN & CONTROL DE SESIÓN
// ============================================

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
    
    // Iniciar suscripciones a Firestore
    escucharCategorias();
    escucharProductos();
  } else {
    loginView.style.display = 'flex';
    adminView.style.display = 'none';
    
    // Desconectar suscripciones
    if (unsubscribeCategorias) unsubscribeCategorias();
    if (unsubscribeProductos) unsubscribeProductos();
  }
});