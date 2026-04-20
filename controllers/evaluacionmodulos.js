import { neon } from 'https://esm.sh/jsr/@neon/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_lZf8U5sRDhWn@ep-misty-waterfall-an5hzirp-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const sql = neon(DATABASE_URL)

const CONFIG_EVALUACIONES = {
  'jefe-formEvaluacion': {
    moduloNombre: 'Jefe de Bodega',
    resultadoUrl: 'result_jefe_bod.html',
    respuestasCorrectas: {
      p1: 'B',
      p2: 'C',
      p3: 'B',
      p4: 'C',
      p5: 'C',
      p6: 'D'
    }
  },
  'log-formEvaluacion': {
    moduloNombre: 'Auxiliar Logístico',
    resultadoUrl: 'result_aux_log.html',
    respuestasCorrectas: {
      p1: 'B',
      p2: 'B',
      p3: 'C',
      p4: 'B',
      p5: 'C',
      p6: 'C'
    }
  },
  'bod-formEvaluacion': {
    moduloNombre: 'Auxiliar de Bodega',
    resultadoUrl: 'result_aux_bod.html',
    respuestasCorrectas: {
      p1: 'B',
      p2: 'B',
      p3: 'C',
      p4: 'C',
      p5: 'C',
      p6: 'B'
    }
  },
  'sep-formEvaluacion': {
    moduloNombre: 'Auxiliar de Separación',
    resultadoUrl: 'result_aux_sep.html',
    respuestasCorrectas: {
      p1: 'B',
      p2: 'C',
      p3: 'D',
      p4: 'D',
      p5: 'C',
      p6: 'B'
    }
  }
}

let chartInstance = null

function obtenerConfiguracionActual() {
  for (const formId in CONFIG_EVALUACIONES) {
    const form = document.getElementById(formId)
    if (form) {
      return {
        form,
        formId,
        ...CONFIG_EVALUACIONES[formId]
      }
    }
  }
  return null
}

function obtenerElementoPorcentaje() {
  return document.getElementById('porcentajeFinal')
}

function obtenerElementoDetalle() {
  return document.getElementById('detalleTexto')
}

function esPaginaResultado() {
  return !!document.getElementById('graficoResultados')
}

function esPaginaEvaluacion() {
  return !!obtenerConfiguracionActual()
}

async function guardarResultadoModulo(data) {
  const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'))
  // Prioridad 1: El área grabada en el perfil del usuario.
  // Prioridad 2: El almacenamiento temporal.
  const seleccionEmpresa = (usuarioActual?.area || localStorage.getItem('empresaSeleccionada') || 'TYM').toUpperCase();

  if (!usuarioActual || !usuarioActual.id) {
    throw new Error('No se encontró el usuario actual')
  }

  // Insertamos incluyendo la marca de la empresa
  const result = await sql`
    INSERT INTO resultados_modulo_especifico (
      usuario_id,
      modulo_nombre,
      porcentaje_total,
      total_correctas,
      total_preguntas,
      respuestas_usuario,
      respuestas_correctas,
      detalle_resultado,
      empresa,
      tipo_evaluacion
    )
    VALUES (
      ${usuarioActual.id},
      ${data.moduloNombre},
      ${data.porcentajeTotal},
      ${data.totalCorrectas},
      ${data.totalPreguntas},
      ${JSON.stringify(data.respuestasUsuario)},
      ${JSON.stringify(data.respuestasCorrectas)},
      ${JSON.stringify(data.detalleResultado)},
      ${seleccionEmpresa.toUpperCase()},
      'CARGO'
    )
    RETURNING *
  `

  return result[0]
}

function generarGraficoCircular(porcentaje) {
  const canvas = document.getElementById('graficoResultados')

  if (!canvas || typeof Chart === 'undefined') return

  const ctx = canvas.getContext('2d')

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Acierto', 'Pendiente'],
      datasets: [{
        data: [porcentaje, 100 - porcentaje],
        backgroundColor: ['#2980b9', 'rgba(255,255,255,0.1)'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '80%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true
        }
      }
    },
    plugins: [{
      id: 'textoCentro',
      beforeDraw(chart) {
        const { width, height, ctx } = chart
        ctx.save()
        ctx.font = '800 32px Poppins'
        ctx.fillStyle = '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(porcentaje + '%', width / 2, height / 2)
        ctx.restore()
      }
    }]
  })
}

window.clasificar = async function () {
  const config = obtenerConfiguracionActual()

  if (!config) {
    alert('No se encontró el formulario de evaluación')
    return
  }

  const { form, moduloNombre, resultadoUrl, respuestasCorrectas } = config
  const formData = new FormData(form)
  const preguntas = Object.keys(respuestasCorrectas)
  const respuestasUsuario = {}
  const detalleResultado = []
  let totalCorrectas = 0

  for (const pregunta of preguntas) {
    const respuesta = formData.get(pregunta)

    if (!respuesta) {
      alert('Debes responder todas las preguntas.')
      return
    }

    respuestasUsuario[pregunta] = respuesta

    const esCorrecta = respuesta === respuestasCorrectas[pregunta]

    if (esCorrecta) {
      totalCorrectas++
    }

    detalleResultado.push({
      pregunta,
      respuestaUsuario: respuesta,
      respuestaCorrecta: respuestasCorrectas[pregunta],
      esCorrecta
    })
  }

  const totalPreguntas = preguntas.length
  const porcentajeTotal = Math.round((totalCorrectas / totalPreguntas) * 100)

  const resultado = {
    moduloNombre,
    porcentajeTotal,
    totalCorrectas,
    totalPreguntas,
    respuestasUsuario,
    respuestasCorrectas,
    detalleResultado
  }

  localStorage.setItem('resultadoModuloEspecifico', JSON.stringify(resultado))

  try {
    await guardarResultadoModulo(resultado)
    window.location.href = resultadoUrl
  } catch (error) {
    console.error(error)
    alert('No se pudo guardar el resultado en la base de datos')
  }
}

function cargarResultado() {
  const resultado = JSON.parse(localStorage.getItem('resultadoModuloEspecifico'))
  const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'))
  console.log(usuarioActual)
  document.querySelector('#nombreUsuario').innerText = usuarioActual.nombre
  
  if (!resultado) return

  const porcentajeEl = obtenerElementoPorcentaje()
  const detalleEl = obtenerElementoDetalle()

  if (porcentajeEl) {
    porcentajeEl.innerText = resultado.porcentajeTotal + '%'
  }

  if (detalleEl) {
    detalleEl.innerText = resultado.totalCorrectas + ' de ' + resultado.totalPreguntas + ' respuestas correctas'
  }

  generarGraficoCircular(resultado.porcentajeTotal)
}

document.addEventListener('DOMContentLoaded', function () {
  if (esPaginaResultado()) {
    cargarResultado()
  }
})