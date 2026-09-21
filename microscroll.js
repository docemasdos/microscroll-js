/**
 * MicroScroll.js
 * Creado por Gabriel Luis Esposito Papakiriacopulos & Gemini (Google AI)
 * Licencia: MIT
 */

 // =========================================================================
 // PARCHE TEMPORAL: Previene el clipping gráfico de fuentes/GPU en la 1era carga
 // =========================================================================
 if (!sessionStorage.getItem("microscroll_first_load_patched")) {
     sessionStorage.setItem("microscroll_first_load_patched", "true");
     window.location.reload();
 }

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
                span.style.display = "none"; // Ocultar span de la guía

                const rawText = span.textContent.trim();
                if (!rawText) return null;

                const eqIndex = rawText.indexOf("=");
                if (eqIndex === -1) return null;

                const property = rawText.slice(0, eqIndex).trim();

                // Limpiar comas o punto y comas solo en los extremos
                let valExpr = rawText.slice(eqIndex + 1).trim().replace(/^[;,]+|[;,]+$/g, "");
                valExpr = valExpr.replace(/^[`'"]|[`'"]$/g, "");

                let evaluator;
                try {
                    evaluator = new Function("x", "return `" + valExpr + "`;");
                } catch (e) {
                    console.error(`[MicroScroll] Error al parsear expresión en "${rawText}":`, e);
                    return null;
                }

                return { property, evaluator, valExpr };
            }).filter(Boolean);

            const tgt = contentMap.get(animName);

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

    // BUCLE PRINCIPAL DE ANIMACIÓN
    function update() {
        const sy = window.scrollY;

        scenes.forEach(scene => {
            scene.timeline.forEach(step => {
                if (!step.target) return;

                const el = step.gDiv;
                const rect = el.getBoundingClientRect();
                const xi1 = rect.top + sy;
                const x12 = el.offsetHeight;

                if (x12 <= 0) return;

                const topOffset = (vh * step.topPct) / 100;
                let rawX = ((sy + topOffset) - xi1) / x12;

                // Si es un estado inicial explícito (.anim-initial-state)
                if (step.isInitialState) {
                    if (rawX <= 0) {
                        step.styles.forEach(style => {
                            try {
                                step.target.style[style.property] = style.evaluator(0);
                            } catch (e) {}
                        });
                    }
                    return;
                }

                // Cálculo de X para pasos normales
                let x;
                if (rawX < 0) {
                    x = 0;
                } else if (rawX > 1) {
                    x = 1;
                } else {
                    x = Math.round(rawX * 100) / 100;
                }

                // Aplicación de estilos solo si hay cambio de valor de x
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

        // Bucle continuo para sincronización perfecta con la GPU
        requestAnimationFrame(update);
    }

    // Evento de resize para recalcular dimensiones de ventana
    window.addEventListener("resize", () => {
        vh = window.innerHeight;
    });

    // Arrancar el bucle continuo en el primer frame
    requestAnimationFrame(update);
});
