# Estacion Servicio Frontend

Frontend web del sistema construido con React, Vite y Axios.

## Requisitos
- Node.js 20 o superior
- npm 10 o superior
- Backend Django corriendo localmente

## Instalacion
1. Entra a la carpeta del proyecto:

```powershell
cd "D:\si2\3er sprint\estacion_servicio_frontend-CU01_DE_CU06 (4)\estacion_servicio_frontend-CU01_DE_CU06"
```

2. Instala dependencias:

```powershell
npm install
```

## Configuracion Del Archivo .env
Vite lee variables de entorno desde archivos `.env`, `.env.local`, `.env.development` o `.env.production`.

Para desarrollo local, crea en la raiz del frontend un archivo `.env` o `.env.local` con este contenido:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## Variable De Entorno Disponible
- `VITE_API_URL`: URL base del backend consumida por Axios. Si no se define, el proyecto usa `http://127.0.0.1:8000/api` por defecto.

Referencia en codigo:
- [api.js](file:///d:/si2/3er%20sprint/estacion_servicio_frontend-CU01_DE_CU06%20(4)/estacion_servicio_frontend-CU01_DE_CU06/src/services/api.js)

## Ejecucion Local
Inicia el servidor de desarrollo:

```powershell
npm run dev
```

Si quieres fijar el puerto manualmente:

```powershell
npm run dev -- --host 0.0.0.0 --port 5173
```

La aplicacion quedara disponible normalmente en:
- `http://localhost:5173`

## Flujo Recomendado Con Backend Local
1. Levanta el backend en `http://127.0.0.1:8000`.
2. Verifica que `VITE_API_URL` apunte a `http://127.0.0.1:8000/api`.
3. Inicia el frontend con `npm run dev`.
4. Abre `http://localhost:5173`.

## Scripts Disponibles
- Desarrollo:

```powershell
npm run dev
```

- Build de produccion:

```powershell
npm run build
```

- Vista previa del build:

```powershell
npm run preview
```

- Lint:

```powershell
npm run lint
```

## Solucion De Problemas
- El frontend no conecta al backend: revisa `VITE_API_URL`.
- Error de CORS: confirma que el backend tenga autorizado `http://localhost:5173`.
- El token expira y vuelve al login: verifica que el backend este levantado y el refresh token siga vigente.
- El frontend abre en otro puerto: arranca Vite con `--port 5173`.
