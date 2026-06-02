import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, rolesPermitidos,soloSuperAdmin=false }) {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        const rol = user?.rol || '';
        const isSuperuser = user?.is_superuser || false;

        if (soloSuperAdmin) {
            return isSuperuser ? children : <Navigate to="/login" replace />;
        }

        if (isSuperuser) {
            return <Navigate to="/superadmin" replace />;
        }

        if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
            if (rol === 'Operador') return <Navigate to="/ventas/turno" replace />;
            if (rol === 'Administrador') return <Navigate to="/admin" replace />;
            if (rol === 'Gerente') return <Navigate to="/admin" replace />;
            if (rol === 'Auditor') return <Navigate to="/bitacora" replace />;
            return <Navigate to="/" replace />;
        }

        return children;
    } catch (e) {
        return <Navigate to="/login" replace />;
    }
}

export default ProtectedRoute;