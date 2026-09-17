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

                return { property, evaluator, valExpr };
            }).filter(Boolean);

            const tgt = contentMap.get(animName);

            return {
                step: stepNumber,
                gDiv,
                target: tgt,
                topPct,
                botPct,
                styles,
                isInitialState: gDiv.classList.contains("anim-initial-state"),
                lastX: null
            };
        });

        const timeline = parsedTimeline.sort((a, b) => a.step - b.step);

        scenes.push({
            guideContainer,
            contentContainer,
            timeline
        });
    });

    // =========================================================================
    // 1. REGISTRO Y APLICACIÓN DE ESTADOS INICIALES BASE
    // =========================================================================
    scenes.forEach(scene => {
        scene.timeline.forEach(step => {
            if (step.target && step.isInitialState) {
                step.styles.forEach(item => {
                    // Aplicar estilo directo tomado del valExpr o evaluador en 0
                    step.target.style[item.property] = item.evaluator(0);
                });
            }
        });
    });

    // =========================================================================
    // 2. BUCLE DE ACTUALIZACIÓN CON CONTROL DE RANGOS (BEFORE / INSIDE / AFTER)
    // =========================================================================
    function update() {
        const vh = window.innerHeight;
        const sy = window.scrollY;

        scenes.forEach(scene => {
            const { timeline } = scene;

            timeline.forEach(step => {
                if (!step.target || step.isInitialState) return;

                const el = step.gDiv;
                const rect = el.getBoundingClientRect();
                const et = rect.top + sy;
                const eh = el.offsetHeight;

                const scrollStart = et - (step.botPct * vh);
                const scrollEnd = (et + eh) - (step.topPct * vh);
                const totalDistance = scrollEnd - scrollStart;

                if (totalDistance <= 0) return;

                let rawX = (sy - scrollStart) / totalDistance;

                // Solo si el scroll está en el rango activo o en los límites de transición
                if (rawX >= 0 && rawX <= 1) {
                    let x = Math.min(Math.max(rawX, 0), 1);
                    x = Math.round(x * 1000) / 1000;

                    if (step.lastX !== x) {
                        step.lastX = x;
                        step.styles.forEach(style => {
                            step.target.style[style.property] = style.evaluator(x);
                        });
                    }
                } else if (rawX < 0) {
                    // Si el scroll está ANTES de este paso, reseteamos lastX para estar listos para el reingreso
                    step.lastX = null;
                } else if (rawX > 1) {
                    // Si el scroll ya PASÓ este paso, fijamos x = 1
                    if (step.lastX !== 1) {
                        step.lastX = 1;
                        step.styles.forEach(style => {
                            step.target.style[style.property] = style.evaluator(1);
                        });
                    }
                }
            });
        });

        requestAnimationFrame(update);
    }

    // Ejecutar actualización
    update();
    window.addEventListener("resize", update);
});
