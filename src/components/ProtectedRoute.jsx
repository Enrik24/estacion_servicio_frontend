import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, rolesPermitidos }) {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    if (!token || !userStr) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        const rol = user?.rol || '';

        if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
            // Redirigir según el rol del usuario
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