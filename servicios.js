// ============================================
// CATEGORÍAS Y SUBCATEGORÍAS
// ============================================
// Fuente única de datos: se usa tanto en la landing
// (cards de servicio desplegables) como en el catálogo
// (tabs de filtro). Reemplazá los "label" y "descripcion"
// por el contenido real del cliente. Los "slug" son los
// que van en la URL — evitá espacios, tildes y mayúsculas ahí.
//
// Cuando migres esto a Firestore, cada objeto de este
// array pasa a ser un documento de la colección "categorias".
// ============================================

// ============================================
// CATEGORÍAS Y SUBCATEGORÍAS
// ============================================
const TELEFONO= 5491150522026;

const CATEGORIAS = [
  {
    slug: 'figuras',
    label: 'Figuras y Coleccionables',
    descripcion: 'Impresión y modelado de figuras articuladas y coleccionables.',
    imagen: 'images/servicios/figuras.jpg',
    subcategorias: [
      { slug: 'articuladas', label: 'Articuladas' }
    ]
  },
  {
    slug: 'accesorios',
    label: 'Accesorios y Útiles',
    descripcion: 'Soportes, llaveros y organizadores personalizados.',
    imagen: 'images/servicios/accesorios.jpg',
    subcategorias: [
      { slug: 'soportes', label: 'Soportes' },
      { slug: 'llaveros', label: 'Llaveros' },
      { slug: 'organizadores', label: 'Organizadores' }
    ]
  },
  {
    slug: 'hogar',
    label: 'Hogar y Decoración',
    descripcion: 'Macetas geométricas y objetos decorativos.',
    imagen: 'images/servicios/hogar.jpg',
    subcategorias: [
      { slug: 'macetas', label: 'Macetas' }
    ]
  },
  {
    slug: 'arquitectura',
    label: 'Maquetado y Arquitectura',
    descripcion: 'Réplicas a escala y miniaturas arquitectónicas.',
    imagen: 'images/servicios/arquitectura.jpg',
    subcategorias: [
      { slug: 'maquetas', label: 'Maquetas' }
    ]
  }
];

// ============================================
// SERVICIOS (landing page)
// ============================================

const SERVICIOS = [
  {
    slug: 'impresion-3d',
    label: 'Impresión 3D & Fabricación',
    descripcion: 'Materialización de piezas a medida en PLA, PETG y resina. Soluciones para coleccionistas, uso cotidiano y la industria.',
    imagen: 'images/servicios/impresion3d.jpg',
    // Link opcional al catálogo o a WhatsApp
    linkCatalogo: 'productos.html?categoria=accesorios',
    linkaWhatsapp: 'https://wa.me/5491112345678?text=Hola,%20quisiera%20consultar%20por%20el%20servicio%20de%20impresión%203D'
  },
  {
    slug: 'carteleria',
    label: 'Cartelería & Corpóreos',
    descripcion: 'Diseño y corte de logotipos, carteles y letras volumétricas de gran impacto visual para comercios, marcas y eventos.',
    imagen: 'images/servicios/carteleria.jpg',
    linkCatalogo: '#contacto' // Como es a medida, lleva a contacto
  },
  {
    slug: 'modelado-cad',
    label: 'Diseño & Modelado 3D',
    descripcion: 'Desarrollamos tu idea desde cero. Digitalización 3D, modelado CAD paramétrico y optimización de archivos STL/OBJ.',
    imagen: 'images/servicios/modelado.jpg',
    linkCatalogo: '#contacto'
  }
];

// ============================================
// FUNCION CONTACTO
// ============================================

function obtenerLinkAlinkaWhatsapp(servicio){
const mensaje = `Hola! Quisiera consultar sobre el servicio de ${servicio.label} (ref: ${servicio.slug})`
return `https://wa.me/${TELEFONO}?text=${encodeURIComponent(mensaje)}`
}