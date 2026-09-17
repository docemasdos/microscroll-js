# ⚡ MicroScroll JS

Un motor de animaciones inmersivas guiadas por scroll, multiescena, ultra liviano (Vanilla JS), sin dependencias externas y con sintaxis declarativa directamente en el HTML.

Creado por **Gabriel Luis Esposito Papakiriacopulos** (`docemasdos.com`) & **Gemini (Google AI)**.

---

## ✨ Características
- 📦 **0 Dependencias:** Funciona con JavaScript puro en el 100% de los navegadores actuales.
- 🎭 **Sintaxis Declarativa:** Define animaciones directamente en el HTML usando expresiones con la variable `x` (que va de `0.0` a `1.0`).
- 🎬 **Sistemas Multiescena / Juegos:** Encadena secuencias de animación independientes en fila (`guide-1` / `content-1`, `guide-2` / `content-2`).
- 📐 **Control Físico con `top` y `bot`:** Define los porcentajes de pantalla exacta donde arranca y termina el paso.
- 🚀 **Integración con CSS Transitions:** Añade `transition: all 0.5s ease;` a tus elementos para obtener movimientos ultrasuaves.

---

## 🛠️ Buenas Prácticas y Consejos de Uso

### 1. Suavizado con CSS Transitions
Para lograr animaciones fluidas como la seda, agrega una regla de transición en tu CSS sobre los elementos animados:

```css
.card {
    will-change: transform, opacity, background-color;
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}
