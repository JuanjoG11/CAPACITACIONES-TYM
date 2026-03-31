import { neon } from 'https://esm.sh/jsr/@neon/serverless'

(function () {
  const DATABASE_URL = 'postgresql://neondb_owner:npg_lZf8U5sRDhWn@ep-misty-waterfall-an5hzirp-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  const sql = neon(DATABASE_URL)

  function onReady(fn) {
    if (document.readyState !== 'loading') {
      fn()
    } else {
      document.addEventListener('DOMContentLoaded', fn)
    }
  }

  onReady(function () {
    try {
      const params = new URLSearchParams(location.search)
      const area = params.get('area')
      const formTat = document.getElementById('login-tat')
      const formTym = document.getElementById('login-tym')
      if (area === 'tat' || area === 'tym') {
        if (formTat) formTat.style.display = area === 'tat' ? 'block' : 'none'
        if (formTym) formTym.style.display = area === 'tym' ? 'block' : 'none'
      }
    } catch (e) {
      console.warn('No se pudo leer area param:', e)
    }

    function filtrarNombre(input) {
      input.value = input.value.replace(/[^a-záéíóúñA-ZÁÉÍÓÚÑ\s]/g, '')
    }

    function filtrarNumeros(input) {
      input.value = input.value.replace(/[^0-9]/g, '')
    }

    const nombre1 = document.getElementById('nombre1')
    const nombre2 = document.getElementById('nombre2')
    const num_doc1 = document.getElementById('num_doc1')
    const num_doc2 = document.getElementById('num_doc2')

    if (nombre1) nombre1.addEventListener('input', function () { filtrarNombre(this) })
    if (nombre2) nombre2.addEventListener('input', function () { filtrarNombre(this) })
    if (num_doc1) num_doc1.addEventListener('input', function () { filtrarNumeros(this) })
    if (num_doc2) num_doc2.addEventListener('input', function () { filtrarNumeros(this) })

    function validarFormulario(form) {
      const nombre = form.querySelector('[id^="nombre"]')
      const tipo_doc = form.querySelector('[id^="tipo_doc"]')
      const num_doc = form.querySelector('[id^="num_doc"]')
      const cargo = form.querySelector('[id^="cargo"]')
      const errores = []

      if (!nombre.value.trim()) {
        errores.push('El nombre completo es obligatorio.')
      } else if (nombre.value.trim().length < 3) {
        errores.push('El nombre debe tener al menos 3 carácteres')
      }

      if (!tipo_doc.value.trim()) {
        errores.push('Seleccione un tipo de documento')
      }

      if (!num_doc.value.trim()) {
        errores.push('El número de documento es obligatorio')
      } else if (num_doc.value.length < 6) {
        errores.push('El número de documento debe tener al menos 6 dígitos')
      }

      if (!cargo.value) {
        errores.push('Selecciones el cargo')
      }

      return errores
    }

    function recopilaDatos(form) {
      const nombre = form.querySelector('[id^="nombre"]').value.trim()
      const tipo_doc = form.querySelector('[id^=tipo_doc]').value
      const num_doc = form.querySelector('[id^=num_doc]').value
      const cargo = form.querySelector('[id^=cargo]').value
      const area = new URLSearchParams(location.search).get('area') || 'desconocido'

      return {
        nombre,
        tipo_doc,
        num_doc,
        cargo,
        area,
        fecha: new Date().toISOString()
      }
    }

    async function guardarOIniciarSesion(datos) {
      const result = await sql`
        INSERT INTO usuarios (nombre, tipo_doc, num_doc, cargo, area, fecha)
        VALUES (${datos.nombre}, ${datos.tipo_doc}, ${datos.num_doc}, ${datos.cargo}, ${datos.area}, NOW())
        ON CONFLICT (tipo_doc, num_doc, area)
        DO UPDATE SET
          nombre = EXCLUDED.nombre,
          cargo = EXCLUDED.cargo,
          fecha = NOW()
        RETURNING id, nombre, tipo_doc, num_doc, cargo, area, fecha
      `
      return result[0]
    }

    async function cargarResultadosUsuario(usuarioId) {
      const resultadoGeneral = await sql`
        SELECT porcentaje_total, modulo_1, modulo_2, modulo_3, modulo_4, modulo_5, modulo_6, created_at
        FROM resultados_evaluacion
        WHERE usuario_id = ${usuarioId}
        ORDER BY created_at DESC
        LIMIT 1
      `

      const resultadoModulo = await sql`
        SELECT modulo_nombre, porcentaje_total, total_correctas, total_preguntas, respuestas_usuario, respuestas_correctas, detalle_resultado, created_at
        FROM resultados_modulo_especifico
        WHERE usuario_id = ${usuarioId}
        ORDER BY created_at DESC
        LIMIT 1
      `

      if (resultadoGeneral.length > 0) {
        const general = resultadoGeneral[0]
        localStorage.setItem('porcentajeTotal', general.porcentaje_total)
        localStorage.setItem('porcentajesModulo', JSON.stringify([
          general.modulo_1,
          general.modulo_2,
          general.modulo_3,
          general.modulo_4,
          general.modulo_5,
          general.modulo_6
        ]))
      } else {
        localStorage.removeItem('porcentajeTotal')
        localStorage.removeItem('porcentajesModulo')
      }

      if (resultadoModulo.length > 0) {
        const modulo = resultadoModulo[0]

        localStorage.setItem('resultadoModuloEspecifico', JSON.stringify({
          moduloNombre: modulo.modulo_nombre,
          porcentajeTotal: modulo.porcentaje_total,
          totalCorrectas: modulo.total_correctas,
          totalPreguntas: modulo.total_preguntas,
          respuestasUsuario: modulo.respuestas_usuario,
          respuestasCorrectas: modulo.respuestas_correctas,
          detalleResultado: modulo.detalle_resultado
        }))
      } else {
        localStorage.removeItem('resultadoModuloEspecifico')
      }
    }

    const botones = document.querySelectorAll('.login-button')
    botones.forEach(boton => {
      boton.addEventListener('click', async function (e) {
        e.preventDefault()

        const form = this.closest('form')
        const errores = validarFormulario(form)

        if (errores.length > 0) {
          alert('Por favor corrige los siguientes errores: \n\n' + errores.join('\n'))
          return
        }

        const datos = recopilaDatos(form)

        try {
          const usuario = await guardarOIniciarSesion(datos)
          localStorage.setItem('usuarioActual', JSON.stringify(usuario))
          await cargarResultadosUsuario(usuario.id)
          window.location.href = 'mode_capacitation.html'
        } catch (error) {
          console.error(error)
          alert('Ocurrió un error al iniciar sesión')
        }
      })
    })
  })
})()