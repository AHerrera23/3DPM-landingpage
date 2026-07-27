// ============================================
// FILTRO DE CATÁLOGO (productos.html)
// ============================================
// Lee ?categoria=...&subcategoria=... de la URL (por si
// llega un link desde la landing) y filtra las product-card
// según sus atributos data-categoria / data-subcategoria.
// También arma los tabs de categoría/subcategoría a partir
// de CATEGORIAS y mantiene la URL sincronizada al clickear.
// ============================================
// ============================================
// FILTRO DE CATÁLOGO (productos.html)
// ============================================

// ============================================
// FILTRO DE CATÁLOGO DESPLEGABLE (productos.html)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const categorySelect = document.getElementById('category-select');
  const subcategorySelect = document.getElementById('subcategory-select');
  const subcategoryGroup = document.getElementById('subcategory-group');
  const cards = document.querySelectorAll('.product-card');

  if (!categorySelect || !subcategorySelect || typeof CATEGORIAS === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  let activeCategoria = params.get('categoria') || 'todas';
  let activeSubcategoria = params.get('subcategoria') || 'todas';

  if (activeCategoria !== 'todas' && !CATEGORIAS.find(c => c.slug === activeCategoria)) {
    activeCategoria = 'todas';
    activeSubcategoria = 'todas';
  }

  function populateCategories() {
    let html = `<option value="todas">Todas las categorías</option>`;
    CATEGORIAS.forEach(cat => {
      const selected = activeCategoria === cat.slug ? 'selected' : '';
      html += `<option value="${cat.slug}" ${selected}>${cat.label}</option>`;
    });
    categorySelect.innerHTML = html;
  }

  function populateSubcategories() {
    if (activeCategoria === 'todas') {
      subcategoryGroup.style.display = 'none';
      subcategorySelect.innerHTML = '';
      return;
    }

    const cat = CATEGORIAS.find(c => c.slug === activeCategoria);
    if (!cat || !cat.subcategorias || cat.subcategorias.length === 0) {
      subcategoryGroup.style.display = 'none';
      subcategorySelect.innerHTML = '';
      return;
    }

    let html = `<option value="todas">Todas las subcategorías</option>`;
    cat.subcategorias.forEach(sub => {
      const selected = activeSubcategoria === sub.slug ? 'selected' : '';
      html += `<option value="${sub.slug}" ${selected}>${sub.label}</option>`;
    });
    subcategorySelect.innerHTML = html;
    subcategoryGroup.style.display = 'flex';
  }

  function applyFilter() {
    cards.forEach(card => {
      const cardCat = card.dataset.categoria;
      const cardSub = card.dataset.subcategoria;
      const matchCat = activeCategoria === 'todas' || cardCat === activeCategoria;
      const matchSub = activeSubcategoria === 'todas' || cardSub === activeSubcategoria;
      card.style.display = (matchCat && matchSub) ? '' : 'none';
    });
  }

  function updateURL() {
    const url = new URL(window.location);
    if (activeCategoria === 'todas') url.searchParams.delete('categoria');
    else url.searchParams.set('categoria', activeCategoria);

    if (activeSubcategoria === 'todas') url.searchParams.delete('subcategoria');
    else url.searchParams.set('subcategoria', activeSubcategoria);

    window.history.replaceState({}, '', url);
  }

  categorySelect.addEventListener('change', (e) => {
    activeCategoria = e.target.value;
    activeSubcategoria = 'todas';
    populateSubcategories();
    applyFilter();
    updateURL();
  });

  subcategorySelect.addEventListener('change', (e) => {
    activeSubcategoria = e.target.value;
    applyFilter();
    updateURL();
  });

  populateCategories();
  populateSubcategories();
  applyFilter();
});