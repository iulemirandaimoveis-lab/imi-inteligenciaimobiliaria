'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadMultipleFiles, deleteFile } from '@/lib/supabase-storage';
import Image from 'next/image';

interface PropertyImageUploadProps {
    propertyId?: string;
    existingImages?: string[];
    onChange: (images: string[]) => void;
    maxImages?: number;
}

export function PropertyImageUpload({
    propertyId = 'temp',
    existingImages = [],
    onChange,
    maxImages = 10
}: PropertyImageUploadProps) {

    const [images, setImages] = useState<string[]>(existingImages);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (images.length + acceptedFiles.length > maxImages) {
            setError(`Máximo de ${maxImages} imagens permitido`);
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // Upload para Supabase Storage
            const results = await uploadMultipleFiles(
                acceptedFiles,
                'media',
                `properties/${propertyId}`
            );

            const uploadedUrls = results.filter(r => r.url).map(r => r.url);

            const newImages = [...images, ...uploadedUrls];
            setImages(newImages);
            onChange(newImages);

        } catch (err: any) {
            setError(err.message || 'Erro ao fazer upload');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    }, [images, propertyId, maxImages, onChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxSize: 5242880, // 5MB
        disabled: uploading || images.length >= maxImages
    });

    const handleRemove = async (url: string, index: number) => {
        try {
            // Extrair o caminho correto da URL pública para exclusão
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            // public URL is usually /storage/v1/object/public/bucket/folder/file
            const pathIndex = pathParts.indexOf('public') + 2;
            const path = pathParts.slice(pathIndex).join('/');

            // Deletar do Supabase
            if (path) {
                await deleteFile(path, 'media');
            }

            // Atualizar estado
            const newImages = images.filter((_, i) => i !== index);
            setImages(newImages);
            onChange(newImages);

        } catch (err: any) {
            setError(err.message || 'Erro ao deletar imagem');
        }
    };

    return (
        <div className="space-y-4">

            {/* Área de upload */}
            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading || images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}
        `}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-2">
                    {uploading ? (
                        <>
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                            <p className="text-sm text-gray-600">Fazendo upload...</p>
                        </>
                    ) : (
                        <>
                            <Upload className="w-12 h-12 text-gray-400" />
                            <p className="text-sm font-medium">
                                {isDragActive ? 'Solte as imagens aqui' : 'Arraste imagens ou clique para selecionar'}
                            </p>
                            <p className="text-xs text-gray-500">
                                PNG, JPG, WEBP até 5MB • Máx {maxImages} imagens
                            </p>
                            <p className="text-xs text-gray-400">
                                {images.length}/{maxImages} imagens
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Mensagem de erro */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                    {error}
                </div>
            )}

            {/* Grid de imagens */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                        <div key={url} className="relative group aspect-square">
                            <Image
                                src={url}
                                alt={`Imagem ${index + 1}`}
                                fill
                                className="object-cover rounded-lg"
                            />

                            {/* Botão remover */}
                            <button
                                onClick={() => handleRemove(url, index)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                title="Remover imagem"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Badge de ordem */}
                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                                #{index + 1}
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
