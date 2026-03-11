const container = document.querySelector(".carousel__slides");
const slides = Array.from(container.querySelectorAll(".slide"));
const next = document.getElementById("next");
const prev = document.getElementById("prev");
const contador = document.getElementById("contadro"); // coincides con el id en HTML
const btnEvaluacion = document.getElementById("btnEvaluacion");

let index = 0;

function updateIndex(i) {
    index = i;
    contador.textContent = `${i + 1} / ${slides.length}`;
    btnEvaluacion.disabled = index !== slides.length - 1;
    slides.forEach((s, idx) => s.classList.toggle("active", idx === index));
}

function scrollToIndex(i) {
    container.scrollTo({ left: slides[i].offsetLeft, behavior: "smooth" });
    updateIndex(i);
}

next.addEventListener("click", () => {
    if (index < slides.length - 1) scrollToIndex(index + 1);
});

prev.addEventListener("click", () => {
    if (index > 0) scrollToIndex(index - 1);
});

// navegar con teclas flecha
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
        if (index < slides.length - 1) scrollToIndex(index + 1);
    } else if (e.key === "ArrowLeft") {
        if (index > 0) scrollToIndex(index - 1);
    }
});

// ajustar el índice cuando el usuario hace scroll manual
container.addEventListener("scroll", () => {
    const scrolled = container.scrollLeft;
    const slideWidth = slides[0].offsetWidth;
    const newIndex = Math.round(scrolled / slideWidth);
    if (newIndex !== index) updateIndex(newIndex);
});

// inicialización
updateIndex(0);
