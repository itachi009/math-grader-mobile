/**
 * Capacitor Native Camera Helper
 * Funzioni per cattura foto nativa con controllo risoluzione
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

// Configurazione camera ottimizzata (1024x1024, qualità 80%)
const CAMERA_CONFIG = {
    quality: 80,
    width: 1024,
    height: 1024,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    saveToGallery: false
};

// Cattura foto per Traccia
export async function captureTracciaPhoto(onSuccess, onError) {
    try {
        const image = await Camera.getPhoto(CAMERA_CONFIG);
        const base64 = image.base64String;
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        if (onSuccess) {
            onSuccess({ base64, dataUrl });
        }
        return { base64, dataUrl };

    } catch (error) {
        console.error('Errore camera traccia:', error);
        if (error.message !== 'User cancelled photos app') {
            if (onError) onError(error);
        }
        throw error;
    }
}

// Cattura foto per Compiti
export async function captureCompitiPhoto(onSuccess, onError) {
    try {
        const image = await Camera.getPhoto(CAMERA_CONFIG);
        const base64 = image.base64String;
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        if (onSuccess) {
            onSuccess({ base64, dataUrl });
        }
        return { base64, dataUrl };

    } catch (error) {
        console.error('Errore camera compiti:', error);
        if (error.message !== 'User cancelled photos app') {
            if (onError) onError(error);
        }
        throw error;
    }
}
