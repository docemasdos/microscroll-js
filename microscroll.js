/**
 * MicroScroll.js
 * Creado por Gabriel Luis Esposito Papakiriacopulos & Gemini (Google AI)
 * Licencia: MIT
 */
document.addEventListener("DOMContentLoaded", () => {
    const guideContainers = document.querySelectorAll("[id^='guide-']");
    const scenes = [];

    let vh = window.innerHeight;

    guideContainers.forEach(guideContainer => {
        const idSuffix = guideContainer.id.replace("guide-", "");
        const contentContainer = document.getElementById(`content-${idSuffix}`);

        if (!contentContainer) {
            console.warn(`[MicroScroll] No se encontró content-${idSuffix}`);
            return;
        }

        const contentDivs = contentContainer.querySelectorAll("[data-anim-name]");
        const contentMap = new Map();
        contentDivs.forEach(div => {
            const name = div.dataset.animName;
            if (name) contentMap.set(name, div);
        });

        const guideDivs = guideContainer.querySelectorAll("[data-anim-name]");

        const parsedTimeline = Array.from(guideDivs).map(gDiv => {
            const height = gDiv.getAttribute("data-anim-height") || gDiv.style.height || "100vh";
            gDiv.style.height = height;

            const animName = gDiv.getAttribute("data-anim-name");
            const rawTop = gDiv.getAttribute("data-anim-top") || gDiv.getAttribute("data-top") || "0";
            const topPct = parseFloat(rawTop);

            const spanElements = gDiv.querySelectorAll("span");

            const styles = Array.from(spanElements).map(span => {
                span.style.display = "none"; // Ocultar span instructivo de la guía

                const rawText = span.textContent.trim();
                if (!rawText) return null;

                const eqIndex = rawText.indexOf("=");
                if (eqIndex === -1) return null;

                const property = rawText.slice(0, eqIndex).trim();
                let valExpr = rawText.slice(eqIndex + 1).trim().replace(/^;|,|;$/g, "");

                // Evaluación ultra-segura de expresiones
                let evaluator;
                try {
                    // Si ya viene con backticks `...`, los usamos directamente para la plantilla
                    if (valExpr.startsWith("`") && valExpr.endsWith("`")) {
                        evaluator = new Function("x", "return " + valExpr + ";");
                    } else {
                        // Si es un valor simple o JS directo
                        evaluator = new Function("x", "return `" + valExpr + "`;");
                    }
                } catch (e) {
                    console.error(`[MicroScroll] Error al parsear expresión en "${rawText}":`, e);
                    return null;
                }

                return { property, evaluator, valExpr };
            }).filter(Boolean);

            const tgt = contentMap.get(animName);

            if (!tgt) {
                console.warn(`[MicroScroll] Sin target para data-anim-name="${animName}"`);
            }

            return {
                gDiv,
                target: tgt,
                styles,
                topPct,
                isInitialState: gDiv.classList.contains("anim-initial-state"),
                lastX: null
            };
        });

        scenes.push({
            guideContainer,
            contentContainer,
            timeline: parsedTimeline
        });
    });

    // 1. Estados iniciales
    scenes.forEach(scene => {
        scene.timeline.forEach(step => {
            if (step.target && step.isInitialState) {
                step.styles.forEach(item => {
                    try {
                        step.target.style[item.property] = item.evaluator(0);
                    } catch (e) {
                        console.error(`[MicroScroll] Error en estado inicial (${item.property}):`, e);
                    }
                });
            }
        });
    });

    // 2. Cálculo físico de scroll
    function update() {
        const sy = window.scrollY;

        scenes.forEach(scene => {
            scene.timeline.forEach(step => {
                if (!step.target || step.isInitialState) return;

                const el = step.gDiv;
                const rect = el.getBoundingClientRect();
                const xi1 = rect.top + sy;
                const x12 = el.offsetHeight;

                if (x12 <= 0) return;

                const topOffset = (vh * step.topPct) / 100;

                let rawX = ((sy + topOffset) - xi1) / x12;
                let x = Math.min(Math.max(rawX, 0), 1);
                x = Math.round(x * 100) / 100;

                if (step.lastX !== x) {
                    step.lastX = x;
                    step.styles.forEach(style => {
                        try {
                            step.target.style[style.property] = style.evaluator(x);
                        } catch (e) {
                            console.error(`[MicroScroll] Error aplicando ${style.property}:`, e);
                        }
                    });
                }
            });
        });
    }

    // 3. Ticking Optimizado
    let ticking = false;

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(() => {
                update();
                ticking = false;
            });
            ticking = true;
        }
    }

    update();

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", () => {
        vh = window.innerHeight;
        requestTick();
    });
});
