import apiClient from './api';

/**
 * Inicia el reconocimiento de voz usando la Web Speech API del navegador.
 * Devuelve una Promise que se resuelve con el texto reconocido.
 * @returns {Promise<{ text: string, stop: Function }>}
 */
export const reconocerVoz = () => {
    return new Promise((resolve, reject) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            reject(new Error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.'));
            return;
        }

        let settled = false; // Evita resolver/rechazar la Promise más de una vez

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = true; // No cortar al primer silencio

        // Timeout de seguridad: 15 segundos máximo de escucha
        const timeout = setTimeout(() => {
            if (!settled) {
                console.warn('[VoiceService] Timeout de 15s alcanzado, deteniendo...');
                recognition.stop();
            }
        }, 15000);

        recognition.onresult = (event) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);

            // Tomar el último resultado final
            const lastResult = event.results[event.results.length - 1];
            const transcript = lastResult[0].transcript;
            const confidence = lastResult[0].confidence;

            console.log('[VoiceService] Texto reconocido:', transcript);
            console.log('[VoiceService] Confianza:', (confidence * 100).toFixed(1) + '%');

            recognition.stop(); // Detener después de obtener resultado
            resolve({ text: transcript, recognition });
        };

        recognition.onerror = (event) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);

            console.error('[VoiceService] Error de reconocimiento:', event.error);
            const mensajes = {
                'not-allowed': 'Permiso de micrófono denegado. Habilítalo en la configuración del navegador.',
                'no-speech': 'No se detectó voz. Intenta hablar más cerca del micrófono.',
                'audio-capture': 'No se encontró un micrófono. Conecta uno e inténtalo de nuevo.',
                'network': 'Error de red al procesar la voz. Verifica tu conexión.',
                'aborted': 'Grabación cancelada.',
            };
            reject(new Error(mensajes[event.error] || `Error de reconocimiento de voz: ${event.error}`));
        };

        recognition.onend = () => {
            console.log('[VoiceService] Reconocimiento finalizado. settled =', settled);
            clearTimeout(timeout);
            // Si onend se dispara sin que onresult ni onerror hayan resuelto la Promise
            if (!settled) {
                settled = true;
                reject(new Error('No se detectó voz. Intenta hablar más cerca del micrófono.'));
            }
        };

        try {
            recognition.start();
            console.log('[VoiceService] Escuchando... (máximo 15s)');
        } catch (err) {
            settled = true;
            clearTimeout(timeout);
            console.error('[VoiceService] Error al iniciar reconocimiento:', err);
            reject(new Error('No se pudo iniciar el micrófono. ¿Está siendo usado por otra aplicación?'));
        }
    });
};

/**
 * Envía el texto reconocido al backend para que Gemini lo interprete.
 * POST /api/reportes/interpretar/
 * @param {string} texto - El comando de voz reconocido
 * @returns {Promise<{ pestana: string, params: object, formato: string }>}
 */
export const interpretarComando = async (texto) => {
    try {
        const token = localStorage.getItem('access_token');
        console.log('[VoiceService] --- INICIO INTERPRETACIÓN ---');
        console.log('[VoiceService] Texto a enviar:', texto);
        console.log('[VoiceService] Endpoint: POST /api/reportes/interpretar/');
        console.log('[VoiceService] Token presente:', !!token);

        const response = await apiClient.post('/reportes/interpretar/', { texto });
        
        console.log('[VoiceService] Respuesta del backend (exitosa):', response.data);
        console.log('[VoiceService] --- FIN INTERPRETACIÓN ---');
        return response.data;
    } catch (error) {
        console.error('[VoiceService] --- ERROR EN INTERPRETACIÓN ---');
        console.error('[VoiceService] Status:', error.response?.status);
        console.error('[VoiceService] Data:', error.response?.data);
        console.error('[VoiceService] Error objeto:', error);

        // Mensajes amigables según el status code
        const status = error.response?.status;
        const serverMsg = error.response?.data?.error;

        const mensajes = {
            400: serverMsg || 'El comando de voz estaba vacío. Intenta de nuevo.',
            401: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
            500: 'Error interno del servidor. Intenta más tarde.',
            502: 'No se pudo contactar al servicio de IA. Intenta más tarde.',
            504: 'El servicio de IA tardó demasiado. Intenta con un comando más corto.',
            422: 'No se pudo interpretar la respuesta de la IA. Intenta reformular tu comando.',
        };

        throw new Error(mensajes[status] || serverMsg || `Error inesperado (${status || 'sin conexión'}). Verifica tu conexión.`);
    }
};
