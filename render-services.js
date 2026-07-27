// ============================================
// RENDER DE CARDS DE SERVICIO (landing)
// ============================================
// Genera una card desplegable por cada categoría en CATEGORIAS.
// Al hacer click en el header de la card (mobile y desktop),
// se despliega la descripción y las subcategorías. Cada
// subcategoría linkea al catálogo con el filtro ya aplicado.
// En desktop con mouse, además se despliega con hover (ver CSS).
// ============================================
// ============================================
// RENDER DE SERVICIOS EN LANDING (index.html)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('servicios-container');
  if (!container || typeof SERVICIOS === 'undefined') return;

  SERVICIOS.forEach(servicio => {
    const card = document.createElement('div');
    card.className = 'service-card';

    // Encabezado de la card
    const header = document.createElement('div');
    header.className = 'service-card-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'false');
    header.innerHTML = `
      <h3>${servicio.label}</h3>
      <span class="service-card-toggle">+</span>
    `;

    // Contenido desplegable
    const expand = document.createElement('div');
    expand.className = 'service-card-expand';

    // Imagen del servicio
    const imgHTML = servicio.imagen ? `<img src="${servicio.imagen}" alt="${servicio.label}" class="service-card-img" />` : '';

    // Lista de ítems/prestaciones del servicio
    const itemsHTML = servicio.items.map(item => `<li>✔ ${item}</li>`).join('');

    expand.innerHTML = `
      ${imgHTML}
      <p class="service-card-desc">${servicio.descripcion}</p>
      <ul class="service-items-list">
        ${itemsHTML}
      </ul>
      <div class="service-card-action">
        <a href="${servicio.linkCatalogo}" class="btn btn-outline btn-sm">Consultar por este servicio</a>        
      </div>
    `;

    function toggleCard() {
      const isOpen = card.classList.toggle('expanded');
      header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      header.querySelector('.service-card-toggle').textContent = isOpen ? '−' : '+';
    }

    header.addEventListener('click', toggleCard);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard();
      }
    });

    card.appendChild(header);
    card.appendChild(expand);
    container.appendChild(card);
  });
});