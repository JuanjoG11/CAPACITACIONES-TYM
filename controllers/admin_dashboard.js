import { neon } from 'https://esm.sh/jsr/@neon/serverless'

const DATABASE_URL = 'postgresql://neondb_owner:npg_lZf8U5sRDhWn@ep-misty-waterfall-an5hzirp-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const sql = neon(DATABASE_URL)

const PREGUNTAS_MODULOS = {
    'Auxiliar Logístico': [
        '¿Cuál es la principal responsabilidad del auxiliar logístico?',
        '¿Qué debe hacer el auxiliar antes de iniciar la ruta?',
        '¿Qué debe hacer si el cliente devuelve el pedido?',
        '¿Qué debe hacer con el dinero recaudado en ruta?',
        'Al finalizar la jornada el auxiliar debe:',
        '¿Qué debe hacer con la documentación entregada?'
    ],
    'Jefe de Bodega': [
        '¿Quién es el responsable del inventario?',
        '¿Qué se debe hacer en caso de avería?',
        '¿Cuál es el proceso de cierre mensual?',
        '¿Cómo se maneja el personal a cargo?',
        '¿Qué documentos debe firmar el jefe?',
        '¿Cuál es la frecuencia del control de limpieza?'
    ],
    'Auxiliar de Bodega': [
        '¿Qué implementos de seguridad debe usar?',
        '¿Cómo se organiza la mercancía?',
        '¿Qué hacer si falta un producto?',
        '¿Cuál es el horario de recepción?',
        '¿Cómo se reportan las averías?',
        '¿A quién se reporta al finalizar?'
    ],
    'Auxiliar de Separación': [
        '¿Qué es el picking?',
        '¿Cómo se verifican las cantidades?',
        '¿Qué documentos usa el separador?',
        '¿Cómo se apilan las cajas?',
        '¿A dónde va la mercancía separada?',
        '¿Qué hacer si la caja está dañada?'
    ]
};

let todosLosResultados = [];

async function cargarResultados() {
    const tableBody = document.getElementById('adminResultsTable');
    
    try {
        const resultados = await sql`
            SELECT 
                r.*,
                u.nombre as usuario_nombre,
                u.num_doc as usuario_cedula,
                u.cargo as usuario_cargo
            FROM resultados_modulo_especifico r
            JOIN usuarios u ON r.usuario_id = u.id
            ORDER BY r.created_at DESC
        `;

        todosLosResultados = resultados;
        renderTable(resultados);

        document.getElementById('adminSearch').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtrados = resultados.filter(r => 
                r.usuario_nombre.toLowerCase().includes(term) || 
                r.usuario_cedula.toLowerCase().includes(term)
            );
            renderTable(filtrados);
        });

    } catch (error) {
        console.error('Error cargando datos:', error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #ff4d4d; padding: 2rem;">Error de base de datos.</td></tr>`;
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('adminResultsTable');
    tableBody.innerHTML = '';

    data.forEach(res => {
        const fecha = new Date(res.created_at).toLocaleDateString();
        const aprobado = res.porcentaje_total >= 75;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fecha}</td>
            <td style="font-weight: 600;">${res.usuario_nombre}</td>
            <td>${res.usuario_cedula}</td>
            <td>${res.modulo_nombre}</td>
            <td><strong>${res.total_correctas} / ${res.total_preguntas}</strong> (${res.porcentaje_total}%)</td>
            <td>
                <span class="badge ${aprobado ? 'badge-success' : 'badge-danger'}">
                    ${aprobado ? 'APROBADO' : ' REPROBADO'}
                </span>
            </td>
            <td>
                <button class="btn-print" onclick="imprimirReporteIndividual('${res.id}')">🖨️ Imprimir Acta</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.imprimirReporteIndividual = function(id) {
    console.log('Generando reporte para ID:', id);
    const res = todosLosResultados.find(r => r.id == id);
    if (!res) {
        console.error('Resultado no encontrado');
        return;
    }

    const printArea = document.getElementById('printArea');
    
    // ARREGLO CRÍTICO: Detectar si ya es un objeto o viene como texto
    let detalle = [];
    try {
        detalle = typeof res.detalle_resultado === 'string' 
            ? JSON.parse(res.detalle_resultado) 
            : res.detalle_resultado;
        
        if (!Array.isArray(detalle)) detalle = [];
    } catch (e) {
        console.error('Error procesando detalle:', e);
        detalle = [];
    }

    const preguntasTexto = PREGUNTAS_MODULOS[res.modulo_nombre] || [];
    const fechaExtensa = new Date(res.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let rowsHTML = '';
    detalle.forEach((det, i) => {
        const textoPregunta = preguntasTexto[i] || `Pregunta ${i + 1}`;
        rowsHTML += `
            <tr>
                <td>${i + 1}</td>
                <td><strong>${textoPregunta}</strong></td>
                <td>Rpta: ${det.respuestaUsuario || 'N/A'}</td>
                <td>Correcta: ${det.respuestaCorrecta || 'N/A'}</td>
                <td class="${det.esCorrecta ? 'status-ok' : 'status-err'}">
                    ${det.esCorrecta ? 'ACERTÓ ✅' : 'FALLÓ ❌'}
                </td>
            </tr>
        `;
    });

    printArea.innerHTML = `
        <div class="report-header">
            <div class="company-info">
                <h2>TIENDAS Y MARCAS EJE CAFETERO</h2>
                <p>Gestión de Talento Humano y SST</p>
                <p style="font-size: 10px; opacity: 0.7;">ACTA DE EVALUACIÓN INDIVIDUAL</p>
            </div>
            <img src="IMG/tym-img.jpg" class="logo-report">
        </div>

        <div class="report-title">Soporte de Evaluación: ${res.modulo_nombre}</div>

        <div class="report-grid">
            <div class="info-item"><strong>Nombre del Trabajador:</strong><br>${res.usuario_nombre}</div>
            <div class="info-item"><strong>Documento C.C.:</strong><br>${res.usuario_cedula}</div>
            <div class="info-item"><strong>Cargo Evaluado:</strong><br>${res.usuario_cargo || 'Personal de Operaciones'}</div>
            <div class="info-item"><strong>Fecha y Hora:</strong><br>${fechaExtensa}</div>
        </div>

        <div class="report-summary-box">
            <div class="summary-score">
                <h3>${res.porcentaje_total}%</h3>
                <p>RESULTADO</p>
            </div>
            <div class="summary-score">
                <h3>${res.total_correctas} / ${res.total_preguntas}</h3>
                <p>ACIERTOS</p>
            </div>
            <div class="summary-score">
                <h3>${res.porcentaje_total >= 75 ? 'APTITUD DEMOSTRADA' : 'NO APTO'}</h3>
                <p>CONCEPTO FINAL</p>
            </div>
        </div>

        <h3>Desglose de la Evaluación:</h3>
        <table class="questions-detail">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Pregunta Realizada</th>
                    <th>Usuario</th>
                    <th>Correcta</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>

        <div class="footer-signatures">
            <div class="sig-section">
                <div class="sig-line">Firma del Trabajador</div>
                <div style="font-size: 10px; margin-top:5px;">C.C. ${res.usuario_cedula}</div>
            </div>
            <div class="sig-section">
                <div class="sig-line">Responsable SST / Operaciones</div>
                <div style="font-size: 10px; margin-top:5px;">Huella dactilar</div>
            </div>
        </div>
    `;

    // Truco para forzar la impresión: Aseguramos que el DOM se cargue antes de llamar al print
    setTimeout(() => {
        window.print();
    }, 500);
};

document.addEventListener('DOMContentLoaded', cargarResultados);
