(function () {
  function onReady(fn) {
    if (document.readyState !== 'loading') {
      fn()
    } else {
      document.addEventListener('DOMContentLoaded', fn)
    }
  }

  function obtenerRutaResultadoModulo(moduloNombre) {
    const rutas = {
      'Jefe de Bodega': 'result_jefe_bod.html',
      'Auxiliar Logístico': 'result_aux_log.html',
      'Auxiliar de Bodega': 'result_aux_bod.html',
      'Auxiliar de Separación': 'result_aux_sep.html'
    }

    return rutas[moduloNombre] || 'cards_capacitacion.html'
  }

  onReady(function () {
    const btnGeneral = document.getElementById('btn-general')
    const linkGeneral = document.getElementById('link-general')
    const btnModulo = document.getElementById('btn-modulo')
    const linkModulo = document.getElementById('link-modulo')

    const porcentajeTotal = localStorage.getItem('porcentajeTotal')
    const resultadoModuloEspecifico = JSON.parse(localStorage.getItem('resultadoModuloEspecifico') || 'null')

    if (btnGeneral && linkGeneral && porcentajeTotal !== null) {
      btnGeneral.textContent = 'Ver resultados'
      linkGeneral.href = 'resultado1.html'
    }

    if (btnModulo && linkModulo && resultadoModuloEspecifico && resultadoModuloEspecifico.moduloNombre) {
      btnModulo.textContent = 'Ver resultados'
      linkModulo.href = obtenerRutaResultadoModulo(resultadoModuloEspecifico.moduloNombre)
    }
  })
})()