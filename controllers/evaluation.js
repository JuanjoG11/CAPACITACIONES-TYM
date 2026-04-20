import { neon } from 'https://esm.sh/jsr/@neon/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_lZf8U5sRDhWn@ep-misty-waterfall-an5hzirp-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const sql = neon(DATABASE_URL)

document.getElementById('startBtn')?.addEventListener('click', () => {
    document.getElementById('evalForm')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
});

const respuestasCorrectas = window.EvaluationModel?.respuestasCorrectas

const form = document.getElementById("evalForm")

async function guardarResultadoEnBD(porcentajeTotal, porcentajesModulo) {
    const usuarioActual = JSON.parse(localStorage.getItem("usuarioActual"))
    // Prioridad 1: El área grabada en el perfil del usuario.
    // Prioridad 2: El almacenamiento temporal.
    // Prioridad 3: TYM por defecto.
    const empresa = (usuarioActual?.area || localStorage.getItem('empresaSeleccionada') || 'TYM').toUpperCase();

    if (!usuarioActual || !usuarioActual.id) {
        throw new Error('No se encontró el usuario actual')
    }

    const result = await sql`
        INSERT INTO resultados_evaluacion (
            usuario_id,
            porcentaje_total,
            modulo_1,
            modulo_2,
            modulo_3,
            modulo_4,
            modulo_5,
            modulo_6,
            empresa,
            tipo_evaluacion
        )
        VALUES (
            ${usuarioActual.id},
            ${porcentajeTotal},
            ${porcentajesModulo[0]},
            ${porcentajesModulo[1]},
            ${porcentajesModulo[2]},
            ${porcentajesModulo[3]},
            ${porcentajesModulo[4]},
            ${porcentajesModulo[5]},
            ${empresa.toUpperCase()},
            'SST'
        )
        RETURNING *
    `

    return result[0]
}

if (form){
    form.addEventListener("submit", async function(e){
        e.preventDefault()

        const formData = new FormData(this)

        let resultadosModulo = [0,0,0,0,0,0]
        let totalCorrectas = 0

        if (!respuestasCorrectas || Object.keys(respuestasCorrectas).length === 0) {
            alert("Error: no se cargaron las respuestas correctas (EvaluationModel).")
            return
        }

        for(let pregunta in respuestasCorrectas) {
            const respuestaUsuario = formData.get(pregunta)

            if(!respuestaUsuario) {
                alert("Debes responder todas las preguntas.")
                return
            }

            if (respuestaUsuario === respuestasCorrectas[pregunta]) {
                totalCorrectas++

                const numeroPregunta = parseInt(pregunta.replace("q", ""))
                const indiceModulo = Math.floor((numeroPregunta - 1)/ 3)

                resultadosModulo[indiceModulo]++
            }
        }

        const porcentajesModulo = resultadosModulo.map(correctas =>
            Math.round((correctas/3)*100)
        )

        const porcentajeTotal = Math.round((totalCorrectas / 18) * 100)

        localStorage.setItem("porcentajeTotal", porcentajeTotal)
        localStorage.setItem("porcentajesModulo", JSON.stringify(porcentajesModulo))

        try {
            await guardarResultadoEnBD(porcentajeTotal, porcentajesModulo)
            window.location.href = "resultado1.html"
        } catch (error) {
            console.error(error)
            alert("No se pudo guardar el resultado en la base de datos")
        }
    })
}

let chartInstance = null

function generarGrafico(datos) {
    const canvas = document.getElementById("graficoResultados")

    if (!canvas) return

    const ctx = canvas.getContext("2d")

    if(chartInstance){
        chartInstance.destroy()
    }

    chartInstance = new Chart(ctx,{
        type: "bar",
        data:{
            labels:[
                "SST",
                "Accidentes",
                "PESV",
                "Brigada",
                "CCL",
                "COPASST"
            ],
            datasets:[{
                data: datos,
                backgroundColor: function(context){
                    const chart = context.chart
                    const {ctx, chartArea} = chart

                    if (!chartArea) {
                        return [
                            "#0B4FA1",
                            "#374151",
                            "#F2C94C",
                            "#D32F2F",
                            "#2E7D32",
                            "#072146"
                        ][context.dataIndex]
                    }

                    const gradientes = [
                        crearGradiente(ctx, chartArea, "#0B4FA1", "#4A90E2"),
                        crearGradiente(ctx, chartArea, "#374151", "#6B7280"),
                        crearGradiente(ctx, chartArea, "#F2C94C", "#FDE68A"),
                        crearGradiente(ctx, chartArea, "#D32F2F", "#EF5350"),
                        crearGradiente(ctx, chartArea, "#2E7D32", "#66BB6A"),
                        crearGradiente(ctx, chartArea, "#072146", "#1A3D7C")
                    ]

                    return gradientes[context.dataIndex]
                },
                borderRadius: 8,
                barThickness: 50
            }]
        },
        options: {
            responsive: true,
            plugins:{
                legend:{
                    display:false
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => context.raw + "%"
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: (value) => value + "%"
                    }
                }
            }
        },
    })
}

function crearGradiente(ctx, chartArea, color1, color2){
    const gradient = ctx.createLinearGradient(
        0,
        chartArea.bottom,
        0,
        chartArea.top
    )

    gradient.addColorStop(0, color1)
    gradient.addColorStop(1, color2)

    return gradient
}

if (document.getElementById("graficoResultados")) {
    const porcentajeTotal = localStorage.getItem("porcentajeTotal")
    const porcentajesModulo = JSON.parse(localStorage.getItem("porcentajesModulo"))
    const porcentajeEl = document.getElementById("porcentajeFinal")
    const nombreUsuarioEl = document.getElementById("nombreUsuario")

    if(porcentajeEl) {
        porcentajeEl.innerText = porcentajeTotal + "%"
    }

    if(nombreUsuarioEl) {
        const usuarioActual = localStorage.getItem("usuarioActual") || "Usuario"
        nombreUsuarioEl.innerText = JSON.parse(usuarioActual).nombre
    }

    generarGrafico(porcentajesModulo)
}