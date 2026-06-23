import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#1a365d' },
  section: { marginBottom: 15 },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', marginTop: 10 },
  tableRow: { flexDirection: 'row' },
  tableColHeader: { width: '35%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', backgroundColor: '#f0f4f8', padding: 5, fontWeight: 'bold' },
  tableCol: { width: '35%', borderStyle: 'solid', borderWidth: 1, borderColor: '#bfbfbf', padding: 5 },
  signatures: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 }
});

export const ComprobanteProveedorPDF = ({ pagoData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          {/* Aquí renderiza dinámicamente el nombre del Surtidor */}
          <Text style={{ fontWeight: 'bold', fontSize: 12, uppercase: true }}>
            {pagoData?.estacion?.nombre || 'ESTACIÓN DE SERVICIO'}
          </Text>
          <Text>Sucursal: {pagoData?.estacion?.sucursal}</Text>
          <Text>NIT Estación: {pagoData?.estacion?.nit}</Text>
          <Text>Operador: {pagoData?.estacion?.encargado}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.title}>COMPROBANTE DE PAGO</Text>
          <Text style={{ color: '#dc2626', fontWeight: 'bold' }}>Nº {pagoData?.id_correlativo || '0001'}</Text>
          <Text>Fecha: {pagoData?.fecha}</Text>
        </View>
      </View>

      {/* Datos del Proveedor */}
      <View style={styles.section}>
        <Text style={{ backgroundColor: '#e2e8f0', padding: 3, fontWeight: 'bold' }}>DATOS DEL PROVEEDOR</Text>
        <Text>Proveedor: {pagoData?.proveedor?.razon_social}</Text>
        <Text>NIT: {pagoData?.proveedor?.nit}</Text>
      </View>

      {/* Detalle de Facturas */}
      <View style={styles.section}>
        <Text style={{ fontWeight: 'bold' }}>DETALLE DE LIQUIDACIÓN</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableColHeader}>Nro Factura</Text>
            <Text style={styles.tableColHeader}>Concepto</Text>
            <Text style={styles.tableColHeader}>Monto</Text>
          </View>
          {pagoData?.detalles?.map((det, index) => (
            <View style={styles.tableRow} key={index}>
              <Text style={styles.tableCol}>{det.nro_factura}</Text>
              <Text style={styles.tableCol}>{det.concepto}</Text>
              <Text style={styles.tableCol}>{det.monto} Bs.</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Firmas */}
      <View style={styles.signatures}>
        <Text style={{ borderTopWidth: 1, pt: 5, width: 150, textAlign: 'center' }}>Entregado Por</Text>
        <Text style={{ borderTopWidth: 1, pt: 5, width: 150, textAlign: 'center' }}>Recibido Conforme</Text>
      </View>
    </Page>
  </Document>
);