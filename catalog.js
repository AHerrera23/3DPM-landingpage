// ============================================
// CATÁLOGO PÚBLICO — Lee productos y categorías desde Firestore
// ============================================

import { db } from './firebase-config.js';
import {
  collection, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// --- Elementos del DOM ---
const grid = document.getElementById('catalogo-grid');
const categorySelect = document.getElementById('category-select');
const subcategorySelect = document.getElementById('subcategory-select');
const subcategoryGroup = document.getElementById('subcategory-group');

// --- Parámetros de URL ---
const params = new URLSearchParams(window.location.search);
let activeCategoria = params.get('categoria') || 'todas';
let activeSubcategoria = params.get('subcategoria') || 'todas';

// --- Caché local de datos ---
let productosCache = [];
let categoriasCache = [];

// 1. Poblamos el desplegable principal de Categorías
function renderCategorySelect() {
  if (!categorySelect) return;

  // Si hay un filtro en la URL pero ya no existe en Firestore, volvemos a 'todas'
  if (activeCategoria !== 'todas' && !categoriasCache.some(c => c.slug === activeCategoria)) {
    activeCategoria = 'todas';
    activeSubcategoria = 'todas';
    updateURL();
  }

  let html = `<option value="todas">Todas las categorías</option>`;
  categoriasCache.forEach(cat => {
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

  const cat = categoriasCache.find(c => c.slug === activeCategoria);
  if (!cat || !cat.subcategorias || cat.subcategorias.length === 0) {
    subcategoryGroup.style.display = 'none';
    activeSubcategoria = 'todas';
    return;
  }

  // Validar si la subcategoría activa pertenece a la categoría seleccionada
  if (activeSubcategoria !== 'todas' && !cat.subcategorias.some(s => s.slug === activeSubcategoria)) {
    activeSubcategoria = 'todas';
    updateURL();
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

// 3. Renderizamos las tarjetas trayendo los datos filtrados
function renderProductos() {
  if (!grid) return;

  const filtrados = productosCache.filter(p => {
    // Ocultar productos desactivados desde el panel admin
    if (p.activo === false) return false;

    const matchCat = activeCategoria === 'todas' || p.categoria === activeCategoria;
    const matchSub = activeSubcategoria === 'todas' || p.subcategoria === activeSubcategoria;
    return matchCat && matchSub;
  });

  if (filtrados.length === 0) {
    grid.innerHTML = '<p class="empty-state">Todavía no hay productos cargados en esta categoría.</p>';
    return;
  }

  grid.innerHTML = filtrados.map(p => {
    const mensajeWsp = `Hola! Quisiera consultar por el producto: ${p.nombre}`;
    const linkWsp = `https://wa.me/5491150522026?text=${encodeURIComponent(mensajeWsp)}`;

    return `
      <div class="product-card" data-categoria="${p.categoria}" data-subcategoria="${p.subcategoria}">
        <img src="${p.imagenUrl || 'https://placehold.co/320x240/1a2744/ffffff?text=Sin+foto'}" alt="${p.nombre}" loading="lazy" />
        <div class="product-card-body">
          <h3>${p.nombre}</h3>
          <p class="product-desc">${p.descripcion || ''}</p>
          <span class="product-price">$${Number(p.precio).toLocaleString('es-AR')}</span>
          <a href="${linkWsp}" target="_blank" rel="noopener noreferrer" class="btn btn-outline">Consultar</a>
        </div>
      </div>
    `;
  }).join('');
}

// 4. Mantenemos la URL sincronizada para compartir links con filtros
function updateURL() {
  const url = new URL(window.location);
  if (activeCategoria === 'todas') url.searchParams.delete('categoria');
  else url.searchParams.set('categoria', activeCategoria);

  if (activeSubcategoria === 'todas') url.searchParams.delete('subcategoria');
  else url.searchParams.set('subcategoria', activeSubcategoria);

  window.history.replaceState({}, '', url);
}

// 5. Escuchadores de cambio en los selects
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

// 6. Escucha en tiempo real de Categorías en Firestore
const qCategorias = query(collection(db, 'categorias'));
onSnapshot(qCategorias, (snapshot) => {
  categoriasCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderCategorySelect();
  renderSubcategorySelect();
  renderProductos();
}, (error) => {
  console.error("Error al obtener categorías de Firestore:", error);
});

// 7. Escucha en tiempo real de Productos en Firestore
const qProductos = query(collection(db, 'productos'), orderBy('creadoEn', 'desc'));
onSnapshot(qProductos, (snapshot) => {
  productosCache = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderProductos();
}, (error) => {
  if (grid) grid.innerHTML = '<p class="empty-state">No pudimos cargar el catálogo. Probá recargar la página.</p>';
  console.error("Error al obtener productos de Firestore:", error);
});