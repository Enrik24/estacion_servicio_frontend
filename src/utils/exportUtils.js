import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exportar datos a Excel (.xlsx)
 */
export const exportToExcel = (data, headers, sheetName = 'Reporte', fileName = 'reporte') => {
    try {
        const ws = XLSX.utils.json_to_sheet(data, { header: headers.map(h => h.key) });
        // Renombrar encabezados
        headers.forEach((h, i) => {
            const col = XLSX.utils.encode_col(i);
            ws[`${col}1`] = { v: h.label, t: 's' };
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    } catch (error) {
        console.error('[ExportUtils] Error al generar Excel:', error);
    }
};

/**
 * Exportar datos a PDF
 */
export const exportToPDF = (data, headers, title = 'Reporte', fileName = 'reporte') => {
    try {
        console.log('[ExportUtils] Iniciando exportación PDF:', { title, rowCount: data.length });
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(title, 14, 20);
        doc.setFontSize(9);
        doc.text(`Generado: ${new Date().toLocaleString('es-BO')}`, 14, 28);

        autoTable(doc, {
            startY: 35,
            head: [headers.map(h => h.label)],
            body: data.map(row => headers.map(h => row[h.key] ?? '')),
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [16, 185, 129], textColor: 255 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        doc.save(`${fileName}.pdf`);
        console.log('[ExportUtils] PDF guardado con éxito');
    } catch (error) {
        console.error('[ExportUtils] Error al generar PDF:', error);
        alert('Error al generar el PDF. Revisa la consola.');
    }
};

/**
 * Exportar datos a HTML descargable
 */
export const exportToHTML = (data, headers, title = 'Reporte', fileName = 'reporte') => {
    const rows = data.map(row =>
        `<tr>${headers.map(h => `<td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${row[h.key] ?? ''}</td>`).join('')}</tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
body{font-family:system-ui,sans-serif;margin:40px;color:#1e293b;background:#f8fafc}
h1{font-size:24px;margin-bottom:4px}
p{font-size:12px;color:#64748b;margin-bottom:20px}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}
th{background:#10b981;color:#fff;padding:10px 12px;text-align:left;font-size:13px}
td{font-size:13px}
tr:nth-child(even){background:#f1f5f9}
</style>
</head>
<body>
<h1>${title}</h1>
<p>Generado: ${new Date().toLocaleString('es-BO')}</p>
<table>
<thead><tr>${headers.map(h => `<th>${h.label}</th>`).join('')}</tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.html`;
    a.click();
    URL.revokeObjectURL(url);
};
