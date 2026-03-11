function calificar() {
    let respuestas = {
        p1: "B",
        p2: "B",
        p3: "C",
        p4: "B",
        p5: "C",

    }

    let puntaje = 0

    for(let pregunta in respuestas){
        let seleccion = document.querySelector(`input[name="${pregunta}"]: checked`)
        if (seleccion && seleccion.value === respuestas[pregunta]){
            puntaje ++
        }
    }

    let porcentaje = (puntaje / 5) * 100

    let resultado = document.getElementById("resultado")

    resultado.innerHTML = `Resultado: ${porcentaje}% de res´puestas correctas`
}