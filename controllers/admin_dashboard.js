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
                r.id, r.usuario_id, r.modulo_nombre as eval_nombre, 
                r.porcentaje_total, r.total_correctas, r.total_preguntas, 
                r.detalle_resultado::text, r.created_at, r.empresa, r.tipo_evaluacion,
                u.nombre as usuario_nombre, u.num_doc as usuario_cedula, u.cargo as usuario_cargo
            FROM resultados_modulo_especifico r
            JOIN usuarios u ON r.usuario_id = u.id
            
            UNION ALL
            
            SELECT 
                s.id, s.usuario_id, 'Seguridad y Salud (SST)' as eval_nombre,
                s.porcentaje_total, 0 as total_correctas, 18 as total_preguntas,
                json_build_object(
                    'SST General', s.modulo_1, 
                    'Accidentes', s.modulo_2, 
                    'PESV', s.modulo_3, 
                    'Brigada de Emergencia', s.modulo_4, 
                    'CCL (Convivencia)', s.modulo_5, 
                    'COPASST', s.modulo_6
                )::text as detalle_resultado, 
                s.created_at, s.empresa, s.tipo_evaluacion,
                u.nombre as usuario_nombre, u.num_doc as usuario_cedula, u.cargo as usuario_cargo
            FROM resultados_evaluacion s
            JOIN usuarios u ON s.usuario_id = u.id
            
            ORDER BY created_at DESC
        `;

        todosLosResultados = resultados;
        renderTable(resultados);

        document.getElementById('adminSearch').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtrados = resultados.filter(r => 
                r.usuario_nombre.toLowerCase().includes(term) || 
                r.usuario_cedula.toLowerCase().includes(term) ||
                (r.empresa && r.empresa.toLowerCase().includes(term))
            );
            renderTable(filtrados);
        });

    } catch (error) {
        console.error('Error detallado:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: #ff4d4d; padding: 2rem;">
                    <strong>Error de Memoria/Tablas:</strong> ${error.message}<br>
                    <small>Por favor, ejecuta <strong>setup_database.html</strong> para actualizar la estructura.</small>
                </td>
            </tr>`;
    }
}

function renderTable(data) {
    const tableBody = document.getElementById('adminResultsTable');
    tableBody.innerHTML = '';

    data.forEach(res => {
        const fecha = new Date(res.created_at).toLocaleDateString();
        const aprobado = res.porcentaje_total >= 75;
        const colorEmpresa = res.empresa === 'TAT' ? '#3498db' : '#e67e22';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fecha}</td>
            <td><strong style="color: ${colorEmpresa}">${res.empresa || 'TYM'}</strong></td>
            <td style="font-weight: 600;">${res.usuario_nombre}</td>
            <td>${res.usuario_cedula}</td>
            <td><span style="font-size: 1.1rem; opacity: 0.7;">[${res.tipo_evaluacion}]</span> ${res.eval_nombre}</td>
            <td><strong>${res.porcentaje_total}%</strong></td>
            <td>
                <span class="badge ${aprobado ? 'badge-success' : 'badge-danger'}">
                    ${aprobado ? 'APROBADO' : ' REPROBADO'}
                </span>
            </td>
            <td>
                <button class="btn-print" onclick="imprimirReporteIndividual('${res.id}', '${res.tipo_evaluacion}')">🖨️ Acta</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.imprimirReporteIndividual = function(id, tipo) {
    const res = todosLosResultados.find(r => r.id == id && r.tipo_evaluacion == tipo);
    if (!res) return;

    const printArea = document.getElementById('printArea');
    const detalle = (typeof res.detalle_resultado === 'string') ? JSON.parse(res.detalle_resultado || '{}') : (res.detalle_resultado || {});
    const logoEmpresa = res.empresa === 'TAT' ? 'IMG/TAT-logo_RGB-10.png' : 'IMG/Logo tiendas.png';
    
    let rowsHTML = '';
    if (tipo === 'CARGO') {
        const preguntasTexto = PREGUNTAS_MODULOS[res.eval_nombre] || [];
        detalle.forEach((det, i) => {
            rowsHTML += `<tr><td>${i+1}</td><td>${preguntasTexto[i] || 'Pregunta de evaluación'}</td><td>${det.respuestaUsuario}</td><td>${det.respuestaCorrecta}</td><td>${det.esCorrecta ? '✅' : '❌'}</td></tr>`;
        });
    } else {
        // Reporte para SST mostrando los 6 módulos
        Object.keys(detalle).forEach((modulo, i) => {
            const nota = detalle[modulo];
            rowsHTML += `
                <tr>
                    <td>${i+1}</td>
                    <td>Módulo: <strong>${modulo}</strong></td>
                    <td colspan="2">Puntaje Obtenido: ${nota}%</td>
                    <td>${nota >= 75 ? '✅' : '❌'}</td>
                </tr>
            `;
        });
    }

    const fechaExtensa = new Date(res.created_at).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    printArea.innerHTML = `
        <div class="report-header">
            <div class="company-info">
                <h2 style="color: ${res.empresa === 'TAT' ? '#0B4FA1' : '#e67e22'}">${res.empresa === 'TAT' ? 'TAT DISTRIBUCIONES' : 'TIENDAS Y MARCAS'} EJE CAFETERO</h2>
                <p>Gestión de Talento Humano y SST</p>
            </div>
            <img src="${logoEmpresa}" class="logo-report">
        </div>

        <div class="report-title">Resultados de Evaluación ${tipo}: ${res.eval_nombre}</div>

        <div class="report-grid">
            <div class="info-item"><strong>Empresa:</strong><br>${res.empresa || 'TYM'}</div>
            <div class="info-item"><strong>Nombre Trabajador:</strong><br>${res.usuario_nombre}</div>
            <div class="info-item"><strong>Documento de Identidad:</strong><br>${res.usuario_cedula}</div>
            <div class="info-item"><strong>Calificación General:</strong><br>${res.porcentaje_total}% (${res.porcentaje_total >= 75 ? 'APROBADO' : 'REPROBADO'})</div>
        </div>

        <h3>Contenido de la Evaluación:</h3>
        <table class="questions-detail">
            <thead>
                <tr><th>#</th><th>Descripción del Componente</th><th>Usuario</th><th>Correcta / Meta</th><th>Estado</th></tr>
            </thead>
            <tbody>${rowsHTML}</tbody>
        </table>

        <div class="footer-signatures" style="margin-top: 100px;">
            <div class="sig-line">Firma del Trabajador<br><small>C.C. ${res.usuario_cedula}</small></div>
            <div class="sig-line">Responsable SST</div>
        </div>
    `;

    setTimeout(() => { window.print(); }, 500);
};

document.addEventListener('DOMContentLoaded', cargarResultados);
