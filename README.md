# MicroScroll.js 🚀

> **A Declarative, Dependency-Free & High-Performance Scroll-Driven Animation Engine.**

**MicroScroll.js** is a lightweight, agnostic, zero-dependency scroll-driven animation engine. It allows developers to craft complex scroll sequences using a decoupled dual-container architecture (*Guides* and *Content*), declaring dynamic CSS properties directly in HTML template literals evaluated against a normalized scroll progress variable ($x \in [0, 1]$).

Co-authored and maintained by [Gabriel Luis Esposito Papakiriacopulos](https://github.com/docemasdos) and Gemini (Google AI).

---

## 🌟 Key Features

- **Zero Dependencies:** Pure vanilla JavaScript with zero external overhead.
- **Hybrid Performance Engine:** Event-driven scroll listening decoupled via `requestAnimationFrame` and passive event listeners (`{ passive: true }`), preventing *Layout Thrashing* and eliminating CPU idle consumption.
- **Automatic Initial State Hydration:** Native support for the `.anim-initial-state` class, ensuring base CSS styles are injected on `DOMContentLoaded` before scroll interaction begins.
- **Declarative & Flexible:** Inline JavaScript expressions inside HTML `<span>` elements evaluated dynamically.
- **Precise Physical Offsets (`data-anim-top`):** Configurable activation thresholds relative to the viewport height (`vh`).

---

## 📦 Installation & Setup

Simply include `microscroll.js` at the end of your `<body>` or inside the `<head>` tag of your document:

```html
<script src="microscroll.js" defer></script>
```

## 🏗️ Architecture

Each scene consists of two linked container groups identified by matching numeric suffixes (e.g., `guide-1` and `content-1`):

1. **`guide-X` (Scroll Track):** Manages scroll flow, section height, and animation step timing.

2. **`content-X` (Visual Layer):** Holds the animated elements (typically styled with `position: fixed` or `position: sticky`).

```html
<!-- ==================== SCROLL TRACK (GUIDE) ==================== -->
<div id="guide-1" class="guide-group">
    <section>
        <!-- Mandatory base state to hydrate DOM properties -->
        <div class="anim-initial-state" data-anim-name="hero-card">
            <span>opacity=`0`</span>
            <span>transform=`scale(0.8)`</span>
        </div>

        <!-- Step 1: Entrance animation -->
        <div data-anim-height="150vh" 
             data-anim-name="hero-card" 
             data-anim-top="0">
            <span>opacity=`${x}`</span>
            <span>transform=`scale(${0.8 + 0.2 * x})`</span>
        </div>

        <!-- Step 2: Exit animation -->
        <div data-anim-height="100vh" 
             data-anim-name="hero-card" 
             data-anim-top="0">
            <span>opacity=`${1 - x}`</span>
        </div>
    </section>
</div>

<!-- ==================== VISUAL LAYER (CONTENT) ==================== -->
<div id="content-1" class="content-group">
    <section>
        <div data-anim-name="hero-card" class="card">
            <h2>MicroScroll JS</h2>
        </div>
    </section>
</div>
```

## ⚙️ Configuration Attributes

| Attribute | Type | Description | Example |
|--|--|--|--|
|`data-anim-name`|`string`| Binds the guide step to a target element in the content container. | `data-anim-name="card-1"` |
|`data-anim-height`|`string`|CSS height allocated to the scroll track step (defaults to `100vh`).|`data-anim-height="150vh"`
| data-anim-top | number | Viewport top offset percentage (`vh`) at which animation triggers. | data-anim-top="20" |
| .anim-initial-state | class | Class applied to the initial guide `div` to set base CSS properties at $x=0$. | class="anim-initial-state" |

## 🧮 The Progress Variable `x`

Inside the `<span>` tags of your guide elements, **`x`** represents the normalized scroll progress of the current step:

* **$x = 0$:** Top edge of the guide element reaches the `data-anim-top` threshold.

* **$x = 1$:** Bottom edge of the guide element reaches the `data-anim-top` threshold.

You can interpolate any valid JavaScript expression returning a CSS property value:

```html
<span>opacity=`${x}`</span>
<span>letter-spacing=`${10 * x}px`</span>
<span>transform=`translate3d(0, ${-50 * x}px, 0) rotate(${360 * x}deg)`</span>
```

## 📄 License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.
