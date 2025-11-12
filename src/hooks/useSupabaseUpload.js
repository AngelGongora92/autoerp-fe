import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { message } from 'antd';
import imageCompression from 'browser-image-compression';

const BUCKET_NAME = 'AutoERP-Storage';

export const useSupabaseUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  /**
   * Sube un archivo a Supabase Storage bajo una ruta estructurada para inventarios.
   * @param {File} file - El archivo a subir.
   * @param {object} options - Opciones para construir la ruta.
   * @param {number|string} options.orderId - El ID de la orden.
   * @param {string} options.inventoryTypeName - El nombre del tipo de inventario (ej. 'carroceria').
   * @param {number|string} options.itemIdOrViewKey - El ID del ítem o la clave de la vista (ej. 25 o 'front').
   * @returns {Promise<string|null>} La URL pública del archivo o null si falla.
   */
  const uploadInventoryFile = async (file, { orderId, inventoryTypeName, itemIdOrViewKey }) => {
    if (!file || !orderId || !inventoryTypeName || !itemIdOrViewKey) {
      message.error('Faltan datos para subir la imagen.');
      return null;
    }

    setIsCompressing(true);
    try {
      // 2. Opciones de compresión
      const options = {
        maxSizeMB: 1,          // Tamaño máximo objetivo en MB
        maxWidthOrHeight: 1920, // Resolución máxima
        useWebWorker: true,    // Usa un web worker para no bloquear la UI
      };

      console.log('Comprimiendo imagen...');
      const compressedFile = await imageCompression(file, options);
      console.log(`Imagen comprimida. Tamaño original: ${(file.size / 1024).toFixed(2)} KB, Tamaño nuevo: ${(compressedFile.size / 1024).toFixed(2)} KB`);

      setIsCompressing(false);
      setIsUploading(true);

      // 3. Subir el archivo comprimido
      const envFolder = import.meta.env.MODE === 'development' ? 'dev' : 'prod';
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
      
      // Nueva ruta unificada
      const filePath = `${envFolder}/inventories/${orderId}/${inventoryTypeName}/${itemIdOrViewKey}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, compressedFile); // Subimos el archivo comprimido

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      if (!data?.publicUrl) throw new Error('No se pudo obtener la URL pública.');
      console.log('Subida completada.');

      return data.publicUrl;
    } catch (error) {
      message.error(`Error al subir la imagen: ${error.message}`);
      return null;
    } finally {
      setIsCompressing(false);
      setIsUploading(false);
    }
  };

  /**
   * Elimina un archivo de Supabase Storage dada su URL pública.
   * @param {string} fileUrl - La URL pública del archivo a eliminar.
   * @returns {Promise<boolean>} True si la eliminación fue exitosa, false si falla.
   */
  const deleteInventoryFile = async (fileUrl) => {
    if (!fileUrl) return false;

    setIsUploading(true); // Usamos el mismo estado para evitar crear uno nuevo
    try {
      const filePath = fileUrl.replace(`${supabase.storage.from(BUCKET_NAME).getPublicUrl('').data.publicUrl}/`, '');
      const { error: deleteError } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);
      if (deleteError) throw deleteError;
      return true;
    } catch (error) {
      message.error(`Error al eliminar la imagen: ${error.message}`);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, isCompressing, uploadInventoryFile, deleteInventoryFile };
};