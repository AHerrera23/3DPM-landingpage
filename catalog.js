// ============================================
// CATÁLOGO PÚBLICO — lee productos desde Firestore
// ============================================
// Depende de:
// - firebase-config.js (exporta db)
// - categorias.js (define la variable global CATEGORIAS)
// ============================================

import { db } from './firebase-config.js';
import {
  collection, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const grid = document.getElementById('catalogo-grid');
const categorySelect = document.getElementById('category-select');
const subcategorySelect = document.getElementById('subcategory-select');
const subcategoryGroup = document.getElementById('subcategory-group');

const params = new URLSearchParams(window.location.search);
let activeCategoria = params.get('categoria') || 'todas';
let activeSubcategoria = params.get('subcategoria') || 'todas';

// Validación por si llega un link viejo o mal armado
if (activeCategoria !== 'todas' && !CATEGORIAS.find(c => c.slug === activeCategoria)) {
  activeCategoria = 'todas';
  activeSubcategoria = 'todas';
}

let productosCache = [];

// 1. Poblamos el desplegable principal de Categorías
function renderCategorySelect() {
  if (!categorySelect) return;
  
  let html = `<option value="todas">Todas las categorías</option>`;
  CATEGORIAS.forEach(cat => {
    const selected = activeCategoria === cat.slug ? 'selected' : '';
    html += `<option value="${cat.slug}" ${selected}>${cat.label}</option>`;
  });
  
  categorySelect.innerHTML = html;
  categorySelect.value = activeCategoria;
}

// 2. Poblamos el desplegable de Subcategorías según la categoría activa
function renderSubcategorySelect() {
  if (!subcategorySelect || !subcategoryGroup) return;

  if (activeCategoria === 'todas') {
    subcategoryGroup.style.display = 'none';
    activeSubcategoria = 'todas';
    return;
  }

  const cat = CATEGORIAS.find(c => c.slug === activeCategoria);
  if (!cat || !cat.subcategorias || cat.subcategorias.length === 0) {
    subcategoryGroup.style.display = 'none';
    activeSubcategoria = 'todas';
    return;
  }

  let html = `<option value="todas">Todas las subcategorías</option>`;
  cat.subcategorias.forEach(sub => {
    const selected = activeSubcategoria === sub.slug ? 'selected' : '';
    html += `<option value="${sub.slug}" ${selected}>${sub.label}</option>`;
  });

  subcategorySelect.innerHTML = html;
  subcategorySelect.value = activeSubcategoria;
  subcategoryGroup.style.display = 'flex';
}

// 3. Renderizamos las tarjetas trayendo los datos filtrados de la memoria cache
function renderProductos() {
  if (!grid) return;

  const filtrados = productosCache.filter(p => {
    // Si el producto no está activo, no se muestra
    if (p.activo === false) return false;
    const matchCat = activeCategoria === 'todas' || p.categoria === activeCategoria;
    const matchSub = activeSubcategoria === 'todas' || p.subcategoria === activeSubcategoria;
    return matchCat && matchSub;
  });

  if (filtrados.length === 0) {
    grid.innerHTML = '<p class="empty-state">Todavía no hay productos cargados en esta categoría.</p>';
    return;
  }

  grid.innerHTML = filtrados.map(p => `
    <div class="product-card" data-categoria="${p.categoria}" data-subcategoria="${p.subcategoria}">
      <img src="${p.imagenUrl || 'https://placehold.co/320x240/1a2744/ffffff?text=Sin+foto'}" alt="${p.nombre}" />
      <div class="product-card-body">
        <h3>${p.nombre}</h3>
        <p class="product-desc">${p.descripcion || ''}</p>
        <span class="product-price">$${p.precio}</span>
        <a href="mailto:herreraabel892@gmail.com?subject=Consulta%20por%20${encodeURIComponent(p.nombre)}" class="btn btn-outline">Consultar</a>
      </div>
    </div>
  `).join('');
}

// 4. Mantenemos la URL sincronizada para poder compartir links con filtros
function updateURL() {
  const url = new URL(window.location);
  if (activeCategoria === 'todas') url.searchParams.delete('categoria');
  else url.searchParams.set('categoria', activeCategoria);
  if (activeSubcategoria === 'todas') url.searchParams.delete('subcategoria');
  else url.searchParams.set('subcategoria', activeSubcategoria);
  window.history.replaceState({}, '', url);
}

// 5. Escuchadores de cambio (CHANGE) en los select
if (categorySelect) {
  categorySelect.addEventListener('change', (e) => {
    activeCategoria = e.target.value;
    activeSubcategoria = 'todas';
    renderSubcategorySelect();
    renderProductos();
    updateURL();
  });
}

if (subcategorySelect) {
  subcategorySelect.addEventListener('change', (e) => {
    activeSubcategoria = e.target.value;
    renderProductos();
    updateURL();
  });
}

// Inicializamos la UI con los select
renderCategorySelect();
renderSubcategorySelect();

// 6. Escucha en tiempo real de Firestore
const q = query(collection(db, 'productos'), orderBy('creadoEn', 'desc'));
onSnapshot(q, (snapshot) => {
  productosCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProductos();
}, (error) => {
  if (grid) grid.innerHTML = '<p class="empty-state">No pudimos cargar el catálogo. Probá recargar la página.</p>';
  console.error(error);
});