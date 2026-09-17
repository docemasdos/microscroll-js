/**
 * MicroScroll.js
 * Creado por Gabriel Luis Esposito Papakiriacopulos & Gemini (Google AI)
 * Licencia: MIT
 */
document.addEventListener("DOMContentLoaded", () => {
    const guideContainers = document.querySelectorAll("[id^='guide-']");
    const scenes = [];

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

            const stepNumber = parseInt(gDiv.getAttribute("data-step") || "0", 10);
            const animName = gDiv.getAttribute("data-anim-name");

            const topAttr = gDiv.getAttribute("data-anim-top") || "0%";
            const botAttr = gDiv.getAttribute("data-anim-bot") || "100%";
            const topPct = parseFloat(topAttr) / 100;
            const botPct = parseFloat(botAttr) / 100;

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

                return { property, evaluator };
            }).filter(Boolean);

            return {
                step: stepNumber,
                gDiv,
                target: contentMap.get(animName),
                topPct,
                botPct,
                styles,
                lastX: null // Para evitar aplicar estilos si el estado no cambia
            };
        });

        const timeline = parsedTimeline.sort((a, b) => a.step - b.step);

        scenes.push({
            guideContainer,
            contentContainer,
            timeline
        });
    });

    function update() {
        const vh = window.innerHeight;
        const sy = window.scrollY;

        scenes.forEach(scene => {
            const { timeline } = scene;

            timeline.forEach(step => {
                if (!step.target) return;

                const el = step.gDiv;
                const rect = el.getBoundingClientRect();
                const et = rect.top + sy;
                const eh = el.offsetHeight;

                const scrollStart = et - (step.botPct * vh);
                const scrollEnd = (et + eh) - (step.topPct * vh);
                const totalDistance = scrollEnd - scrollStart;

                if (totalDistance <= 0) return;

                let rawX = (sy - scrollStart) / totalDistance;

                // Clampear x entre 0 y 1 para asegurar inicio y fin perfectos
                let x = Math.min(Math.max(rawX, 0), 1);
                x = Math.round(x * 1000) / 1000;

                // Solo actualizar si x ha cambiado para optimizar rendimiento
                if (step.lastX !== x) {
                    step.lastX = x;
                    step.styles.forEach(style => {
                        step.target.style[style.property] = style.evaluator(x);
                    });
                }
            });
        });

        requestAnimationFrame(update);
    }

    // Inicialización rápida para colocar todas las animaciones en x = 0
    update();
    requestAnimationFrame(update);
    window.addEventListener("resize", update);
});
