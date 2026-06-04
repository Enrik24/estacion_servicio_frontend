import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, rolesPermitidos,soloSuperAdmin=false }) {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        const rol = (user?.roles_detalle?.[0]?.nombre || user?.rol || '').toLowerCase();
        const isSuperuser = user?.is_superuser || false;

        if (soloSuperAdmin) {
            return isSuperuser ? children : <Navigate to="/login" replace />;
        }

        if (isSuperuser) {
            return <Navigate to="/superadmin" replace />;
        }

        if (rolesPermitidos && !rolesPermitidos.map(r => r.toLowerCase()).includes(rol)) {
            if (rol === 'operador') return <Navigate to="/ventas/turno" replace />;
            if (rol === 'administrador') return <Navigate to="/admin" replace />;
            if (rol === 'gerente') return <Navigate to="/admin" replace />;
            if (rol === 'auditor') return <Navigate to="/bitacora" replace />;
            return <Navigate to="/" replace />;
        }

        return children;
    } catch (e) {
        return <Navigate to="/login" replace />;
    }
}

export default ProtectedRoute;