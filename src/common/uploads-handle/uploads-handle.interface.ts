// Estas son las entidades que permitirán a los desarrolladores subir archivos a la aplicación.
export enum UploadsHandleEntity {
  BANNER = 'BANNER',
  IMG_ROOM = 'IMG_ROOM',
  ROOM = 'ROOM',
  // Agrega aquí más entidades si es necesario
}

export interface UploadsHandleConfig {
  uploadsPath: string
  servePath: string
  maxFileSize: number
  fileType: string // 'image' | 'video' | 'audio' | 'document'
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  allowedExtensions?: string[] // ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
  thumbsWidth?: number
  thumbsFolder?: string
}
