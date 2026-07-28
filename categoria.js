// ============================================
// CATÁLOGO DINÁMICO DESDE FIRESTORE — catalogo-db.js
// ============================================

import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// --- Elementos del DOM ---
const categoryFiltersContainer = document.getElementById('category-filters');
const subcategoryFiltersContainer = document.getElementById('subcategory-filters');
const productGrid = document.getElementById('product-grid');

// --- Estado local aislado del módulo ---
let listaCategorias = [];
let listaProductos = [];
let categoriaActiva = 'todas';
let subcategoriaActiva = 'todas';

// --- Cargar datos de Firestore al iniciar ---
async function inicializarCatalogo() {
  try {
    // Carga paralela de categorías y productos
    await Promise.all([
      cargarCategoriasDesdeFirestore(),
      cargarProductosActivosDesdeFirestore()
    ]);

    renderizarFiltrosCategorias();
    renderizarProductos();
  } catch (error) {
    console.error('Error al inicializar catálogo:', error);
    if (productGrid) {
      productGrid.innerHTML = '<p class="admin-error">Hubo un error al cargar los productos.</p>';
    }
  }
}

// Fetch de Categorías
async function cargarCategoriasDesdeFirestore() {
  const snapshot = await getDocs(collection(db, 'categorias'));
  listaCategorias = [];
  snapshot.forEach(docSnap => {
    listaCategorias.push({ id: docSnap.id, ...docSnap.data() });
  });
}

// Fetch de Productos Activos
async function cargarProductosActivosDesdeFirestore() {
  const q = query(collection(db, 'productos'), where('activo', '==', true));
  const snapshot = await getDocs(q);
  listaProductos = [];
  snapshot.forEach(docSnap => {
    listaProductos.push({ id: docSnap.id, ...docSnap.data() });
  });
}

// --- Renderizado de Botones de Categorías ---
function renderizarFiltrosCategorias() {
  if (!categoryFiltersContainer) return;

  let html = `
    <button class="filter-btn ${categoriaActiva === 'todas' ? 'active' : ''}" data-slug="todas">
      Todas
    </button>
  `;

  listaCategorias.forEach(cat => {
    html += `
      <button class="filter-btn ${categoriaActiva === cat.slug ? 'active' : ''}" data-slug="${cat.slug}">
        ${cat.label}
      </button>
    `;
  });

  categoryFiltersContainer.innerHTML = html;
}

// --- Renderizado de Botones de Subcategorías ---
function renderizarFiltrosSubcategorias() {
  if (!subcategoryFiltersContainer) return;

  if (categoriaActiva === 'todas') {
    subcategoryFiltersContainer.innerHTML = '';
    subcategoryFiltersContainer.style.display = 'none';
    return;
  }

  const catActual = listaCategorias.find(c => c.slug === categoriaActiva);

  if (!catActual || !catActual.subcategorias || catActual.subcategorias.length === 0) {
    subcategoryFiltersContainer.innerHTML = '';
    subcategoryFiltersContainer.style.display = 'none';
    return;
  }

  subcategoryFiltersContainer.style.display = 'flex';

  let html = `
    <button class="subfilter-btn ${subcategoriaActiva === 'todas' ? 'active' : ''}" data-subslug="todas">
      Todo en ${catActual.label}
    </button>
  `;

  catActual.subcategorias.forEach(sub => {
    html += `
      <button class="subfilter-btn ${subcategoriaActiva === sub.slug ? 'active' : ''}" data-subslug="${sub.slug}">
        ${sub.label}
      </button>
    `;
  });

  subcategoryFiltersContainer.innerHTML = html;
}

// --- Renderizado de Productos en Pantalla ---
function renderizarProductos() {
  if (!productGrid) return;

  const filtrados = listaProductos.filter(p => {
    const coincideCat = categoriaActiva === 'todas' || p.categoria === categoriaActiva;
    const coincideSub = subcategoriaActiva === 'todas' || p.subcategoria === subcategoriaActiva;
    return coincideCat && coincideSub;
  });

  if (filtrados.length === 0) {
    productGrid.innerHTML = '<p class="empty-state">No hay productos en esta categoría por el momento.</p>';
    return;
  }

  // Tomamos el teléfono global si existe en window, si no usamos un fallback
  const numeroWsp = typeof TELEFONO !== 'undefined' ? TELEFONO : '5491150522026';

  productGrid.innerHTML = filtrados.map(p => {
    const mensajeWsp = `Hola! Quisiera consultar por el producto: ${p.nombre}`;
    const linkWsp = `https://wa.me/${numeroWsp}?text=${encodeURIComponent(mensajeWsp)}`;

    return `
      <article class="product-card">
        <div class="product-image-container">
          <img src="${p.imagenUrl || 'https://placehold.co/300x200/1a2744/ffffff?text=Sin+foto'}" alt="${p.nombre}" loading="lazy" />
        </div>
        <div class="product-content">
          <h3>${p.nombre}</h3>
          <p class="product-description">${p.descripcion || ''}</p>
          <div class="product-footer">
            <span class="product-price">$${Number(p.precio).toLocaleString('es-AR')}</span>
            <a href="${linkWsp}" target="_blank" rel="noopener noreferrer" class="btn btn-solid btn-sm">
              Consultar
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// --- Listeners para los clicks en filtros ---
if (categoryFiltersContainer) {
  categoryFiltersContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-slug]');
    if (!btn) return;

    categoriaActiva = btn.dataset.slug;
    subcategoriaActiva = 'todas';

    renderizarFiltrosCategorias();
    renderizarFiltrosSubcategorias();
    renderizarProductos();
  });
}

if (subcategoryFiltersContainer) {
  subcategoryFiltersContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-subslug]');
    if (!btn) return;

    subcategoriaActiva = btn.dataset.subslug;

    renderizarFiltrosSubcategorias();
    renderizarProductos();
  });
}

// Arrancar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarCatalogo);