// Mercado Sumaq · Cooperativa Agraria Sumaq Quinua (caso didáctico ficticio)
// Los datos van incrustados para que el sitio funcione al abrir index.html directamente.
const productos = [
  { id: 1, nombre: "Quinua blanca", categoria: "Granos", precio: 12.5, stock: 120 },
  { id: 2, nombre: "Quinua roja", categoria: "Granos", precio: 14, stock: 0 },
  { id: 3, nombre: "Cañihua", categoria: "Granos", precio: 16, stock: 35 },
  { id: 4, nombre: "Harina de quinua", categoria: "Derivados", precio: 9.5, stock: 60 },
  { id: 5, nombre: "Hojuelas de quinua", categoria: "Derivados", precio: 28, stock: 18 }
];

const pedido = new Map(); // id del producto → cantidad
const $ = (selector) => document.querySelector(selector);
const dinero = (n) => `S/ ${n.toFixed(2)}`;

const lista = $("#lista");
const buscador = $("#buscar");
const filtroCategoria = $("#categoria");

/* ---------- Menú móvil ---------- */
const menuBoton = $("#menu-boton");
const menu = $("#menu");
menuBoton.addEventListener("click", () => {
  const abierto = menu.classList.toggle("abierto");
  menuBoton.setAttribute("aria-expanded", String(abierto));
});
menu.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    menu.classList.remove("abierto");
    menuBoton.setAttribute("aria-expanded", "false");
  }
});

/* ---------- Catálogo ---------- */
function cargarCategorias() {
  const categorias = [...new Set(productos.map((p) => p.categoria))];
  for (const c of categorias) {
    const op = document.createElement("option");
    op.value = c;
    op.textContent = c;
    filtroCategoria.append(op);
  }
}

function mostrar() {
  const texto = buscador.value.trim().toLowerCase();
  const cat = filtroCategoria.value;
  const visibles = productos.filter(
    (p) => p.nombre.toLowerCase().includes(texto) && (!cat || p.categoria === cat)
  );
  lista.replaceChildren();
  for (const p of visibles) {
    const li = document.createElement("li");
    li.className = "tarjeta";

    const categoria = document.createElement("span");
    categoria.className = "tarjeta__cat";
    categoria.textContent = p.categoria;

    const titulo = document.createElement("h3");
    titulo.textContent = p.nombre;

    const precio = document.createElement("span");
    precio.className = "tarjeta__precio";
    precio.textContent = `${dinero(p.precio)} el kg`;

    const stock = document.createElement("span");
    stock.className = "tarjeta__stock";
    stock.textContent = p.stock > 0 ? `Disponible: ${p.stock} kg` : "Sin stock";

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton";
    boton.dataset.id = p.id;
    boton.textContent = p.stock > 0 ? "Agregar al pedido" : "Agotado";
    boton.disabled = p.stock === 0;

    li.append(categoria, titulo, precio, stock, boton);
    lista.append(li);
  }
  $("#contador").textContent = `${visibles.length} producto(s) encontrado(s)`;
}

buscador.addEventListener("input", mostrar);
filtroCategoria.addEventListener("change", mostrar);

// Delegación de eventos: un solo manejador para todos los botones
lista.addEventListener("click", (e) => {
  const boton = e.target.closest("button");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const p = productos.find((x) => x.id === id);
  const actual = pedido.get(id) || 0;
  if (actual >= p.stock) return;
  pedido.set(id, actual + 1);
  actualizarPedido();
});

/* ---------- Resumen del pedido ---------- */
function actualizarPedido() {
  const resumen = $("#resumen");
  resumen.replaceChildren();
  let total = 0;

  if (pedido.size === 0) {
    const li = document.createElement("li");
    li.className = "vacio";
    li.textContent = "Pedido vacío";
    resumen.append(li);
  }

  for (const [id, cantidad] of pedido) {
    const p = productos.find((x) => x.id === id);
    const subtotal = p.precio * cantidad;
    total += subtotal;

    const li = document.createElement("li");
    const texto = document.createElement("span");
    texto.textContent = `${cantidad} × ${p.nombre} · ${dinero(subtotal)}`;

    const quitar = document.createElement("button");
    quitar.type = "button";
    quitar.dataset.id = id;
    quitar.setAttribute("aria-label", `Quitar una unidad de ${p.nombre}`);
    quitar.textContent = "−";

    li.append(texto, quitar);
    resumen.append(li);
  }
  $("#total").textContent = `Total: ${dinero(total)}`;
}

$("#resumen").addEventListener("click", (e) => {
  const boton = e.target.closest("button");
  if (!boton) return;
  const id = Number(boton.dataset.id);
  const nueva = (pedido.get(id) || 0) - 1;
  if (nueva <= 0) pedido.delete(id);
  else pedido.set(id, nueva);
  actualizarPedido();
});

$("#vaciar").addEventListener("click", () => {
  pedido.clear();
  actualizarPedido();
});

/* ---------- Validación de formularios ---------- */
function validarCampo(campo, mensajes) {
  const error = $(`#error-${campo.id}`);
  let texto = "";
  const v = campo.validity;
  if (v.valueMissing) texto = mensajes.vacio;
  else if (v.tooShort) texto = mensajes.corto;
  else if (v.patternMismatch) texto = mensajes.patron;
  else if (v.typeMismatch) texto = mensajes.tipo;
  error.textContent = texto;
  campo.setAttribute("aria-invalid", texto ? "true" : "false");
  return !texto;
}

$("#form-pedido").addEventListener("submit", (e) => {
  e.preventDefault();
  const mensaje = $("#mensaje-pedido");
  mensaje.textContent = "";
  mensaje.style.color = "";

  const resultados = [
    validarCampo($("#nombre"), { vacio: "Escriba su nombre completo.", corto: "El nombre debe tener al menos 3 letras." }),
    validarCampo($("#celular"), { vacio: "Escriba su celular.", patron: "Use 9 dígitos y que empiece en 9." }),
    validarCampo($("#correo"), { tipo: "El correo debe tener la forma nombre@dominio.pe" }),
    validarCampo($("#ciudad"), { vacio: "Elija la ciudad de entrega." })
  ];

  if (resultados.includes(false)) return;

  if (pedido.size === 0) {
    mensaje.textContent = "Agregue al menos un producto desde el catálogo.";
    mensaje.style.color = "#a1361b";
    return;
  }

  mensaje.textContent = `¡Gracias, ${$("#nombre").value.trim()}! Su pedido fue registrado (demostración).`;
  pedido.clear();
  actualizarPedido();
  e.target.reset();
});

$("#boletin").addEventListener("submit", (e) => {
  e.preventDefault();
  const campo = $("#correo-boletin");
  const error = $("#error-boletin");
  if (campo.validity.valueMissing) error.textContent = "Escriba su correo electrónico.";
  else if (campo.validity.typeMismatch) error.textContent = "El correo debe tener la forma nombre@dominio.pe";
  else error.textContent = "";
  campo.setAttribute("aria-invalid", error.textContent ? "true" : "false");
  if (!error.textContent) {
    error.style.color = "#1d6b3a";
    error.textContent = "¡Suscripción registrada!";
    e.target.reset();
  } else {
    error.style.color = "";
  }
});

/* ---------- Inicio ---------- */
cargarCategorias();
mostrar();
actualizarPedido();
