// Estas son las entidades que permitirán a los desarrolladores subir archivos a la aplicación.
export enum UploadsHandleEntity {
  BANNER = 'BANNER',
  ROOM_IMG = 'ROOM_IMG',
  ROOM = 'ROOM',
  HOTEL = 'HOTEL',
  HOTEL_IMG = 'HOTEL_IMG',
  POPUP = 'POPUP',
  // Agrega aquí más entidades si es necesario
}

export interface UploadsHandleConfig {
  uploadsPath: string
  servePath: string
  maxFileSize: number
  fileType: string // 'image' | 'video' | 'audio' | 'document'
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  allowedExtensions: string[] // ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
  thumbsWidth: number
  thumbsFolder: string
}

export interface UploadsHandleReturn {
  fileUploaded: string
  thumbUploaded: string
  // fileUrl: string
  // thumbUrl: string
}
