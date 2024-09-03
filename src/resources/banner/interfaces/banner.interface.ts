import { Banner } from '../entities/banner.entity'

export interface ProcessedBanner extends Banner {
  imgPath: string
  thumbPath: string
}

export interface BannerCreationResult {
  id: string
  title: string
  description: string
  imgPath: string | undefined
  thumbPath: string | undefined
}

export interface BannerDeletionResult {
  message: string
}

export interface BannerUpdateResult {
  // Ajusta esto según los campos que realmente devuelves en updateBanner
  title?: string
  description?: string
  // ... otros campos
}
