document.addEventListener("DOMContentLoaded", () => {

const modules = [
    {
        prefix: "log",
        evaluacion: "logistico_evaluation.html" // nombre real del archivo de evaluación
    },
    {
        prefix: "sep",
        evaluacion: "separacion_evaluacion.html"
    }
];

modules.forEach(module => {

const container = document.querySelector(`.${module.prefix}-carousel__slides`);
const slides = document.querySelectorAll(`.${module.prefix}-slide`);

const next = document.getElementById(`${module.prefix}-next`);
const prev = document.getElementById(`${module.prefix}-prev`);

const contador = document.getElementById(`${module.prefix}-contador`);
const btnEvaluacion = document.getElementById(`${module.prefix}-btnEvaluacion`);

if (!container || slides.length === 0) return;

let index = 0;

function updateSlide(i){

slides.forEach((slide, position)=>{
slide.classList.toggle("active", position === i);
});

if(contador){
contador.textContent = `${i + 1}/${slides.length}`;
}

if(btnEvaluacion){
btnEvaluacion.disabled = i !== slides.length - 1;
}

}

if(next){
next.addEventListener("click", () => {

if(index < slides.length - 1){
index++;
updateSlide(index);
}

});
}

if(prev){
prev.addEventListener("click", () => {

if(index > 0){
index--;
updateSlide(index);
}

});
}

window.addEventListener("keydown", (e)=>{

if(e.key === "ArrowRight" && index < slides.length - 1){
index++;
updateSlide(index);
}

if(e.key === "ArrowLeft" && index > 0){
index--;
updateSlide(index);
}

});

if(btnEvaluacion){
btnEvaluacion.addEventListener("click", () => {
window.location.href = module.evaluacion;
});
}

updateSlide(index);

});

});