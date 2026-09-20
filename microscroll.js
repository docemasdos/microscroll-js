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

        if (!contentContainer) return;

        const guideDivs = guideContainer.querySelectorAll("section > div");
        const contentDivs = contentContainer.querySelectorAll("section > div");

        const contentMap = new Map();
        contentDivs.forEach(div => {
            const name = div.dataset.animName;
            if (name) contentMap.set(name, div);
        });

        const parsedTimeline = Array.from(guideDivs).map(gDiv => {
            const height = gDiv.getAttribute("data-anim-height") || "100vh";
            gDiv.style.height = height;

            const animName = gDiv.getAttribute("data-anim-name");

            // Leemos data-anim-top o data-top con fallback seguro en 0
            const rawTop = gDiv.getAttribute("data-anim-top") || gDiv.getAttribute("data-top") || "0";
            const topPct = parseFloat(rawTop);

            const spanElements = gDiv.querySelectorAll("span");

            const styles = Array.from(spanElements).map(span => {
                const rawText = span.textContent.trim();
                if (!rawText) return null;

                const eqIndex = rawText.indexOf("=");
                if (eqIndex === -1) return null;

                const property = rawText.slice(0, eqIndex).trim();
                let valExpr = rawText.slice(eqIndex + 1).trim().replace(/^;|,|;$/g, "");

                if (valExpr.startsWith("`") && valExpr.endsWith("`")) {
                    valExpr = valExpr.slice(1, -1);
                }

                const evaluator = new Function("x", `return \`${valExpr}\`;`);

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

    // 1. APLICACIÓN DE ESTADOS INICIALES (.anim-initial-state)
    scenes.forEach(scene => {
        scene.timeline.forEach(step => {
            if (step.target && step.isInitialState) {
                step.styles.forEach(item => {
                    step.target.style[item.property] = item.evaluator(0);
                });
            }
        });
    });

    // 2. BUCLE DE CÁLCULO FÍSICO
    function update() {
        const sy = window.scrollY;

        scenes.forEach(scene => {
            scene.timeline.forEach(step => {
                if (!step.target || step.isInitialState) return;

                const el = step.gDiv;

                // Obtenemos la posición Y absoluta respecto a todo el documento
                const rect = el.getBoundingClientRect();
                const xi1 = rect.top + sy;
                const x12 = el.offsetHeight;

                if (x12 <= 0) return;

                // Offset dinámico desde el top del viewport según el atributo en vh
                const topOffset = (vh * step.topPct) / 100;

                // El avance real se mide comparando la línea del viewport (sy + topOffset) contra xi1
                let rawX = ((sy + topOffset) - xi1) / x12;
                let x = Math.min(Math.max(rawX, 0), 1);
                x = Math.round(x * 100) / 100;

                if (step.lastX !== x) {
                    step.lastX = x;
                    step.styles.forEach(style => {
                        step.target.style[style.property] = style.evaluator(x);
                    });
                }
            });
        });
    }

    // 3. OPTIMIZACIÓN HÍBRIDA CON rAF Y PASSIVE SCROLL
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

    // Render inicial
    update();

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", () => {
        vh = window.innerHeight;
        requestTick();
    });
});
