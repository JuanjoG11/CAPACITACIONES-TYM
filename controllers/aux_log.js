document.addEventListener("DOMContentLoaded", () => {
    // Definimos qué evaluación le corresponde a cada página actual
    const urlEvalMap = {
        "aux_log.html": "logistico_evaluation.html",
        "aux_sep.html": "separacion_evaluation.html",
        "aux_bod.html": "auxbodega_evaluation.html",
        "jefe_bod.html": "jefe_evaluation.html"
    };

    const currentPage = window.location.pathname.split("/").pop() || "aux_log.html";
    const targetEval = urlEvalMap[currentPage] || "logistico_evaluation.html"; // Default robusto para aux_log

    const slides = document.querySelectorAll(`.ind-slide`);
    const nextBtn = document.getElementById(`ind-next`);
    const prevBtn = document.getElementById(`ind-prev`);
    const contador = document.getElementById(`ind-contador`);
    const btnEval = document.getElementById(`ind-btnEvaluacion`);

    if (!slides.length) return;

    let index = 0;

    function updateSlide(i) {
        slides.forEach((slide, pos) => {
            slide.classList.toggle("active", pos === i);
        });

        if (contador) {
            contador.textContent = `${i + 1} / ${slides.length}`;
        }

        if (btnEval) {
            // Solo habilitar el botón de evaluación al llegar al final
            btnEval.disabled = i !== slides.length - 1;
        }
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            if (index < slides.length - 1) {
                index++;
                updateSlide(index);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            if (index > 0) {
                index--;
                updateSlide(index);
            }
        });
    }

    // Navegación por teclado
    window.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" && index < slides.length - 1) {
            index++;
            updateSlide(index);
        } else if (e.key === "ArrowLeft" && index > 0) {
            index--;
            updateSlide(index);
        }
    });

    if (btnEval) {
        btnEval.addEventListener("click", () => {
            window.location.href = targetEval;
        });
    }

    updateSlide(index);
});