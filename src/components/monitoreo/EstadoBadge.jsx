function EstadoBadge({ estado }) {
    const colores = {
        ACTIVO: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        INACTIVO: 'bg-gray-100 text-gray-600 border border-gray-200',
        FALLA: 'bg-red-100 text-red-700 border border-red-200 animate-pulse',
    };

    const labels = {
        ACTIVO: 'Activo',
        INACTIVO: 'Inactivo',
        FALLA: 'Falla',
    };

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colores[estado] || colores.INACTIVO}`}>
            {labels[estado] || estado}
        </span>
    );
}

export default EstadoBadge;