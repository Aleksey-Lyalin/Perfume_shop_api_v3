import { PATHS } from '../config/paths'
import type { PerfumeImageWithUrl } from '../types/prisma'

export const imageUtils = {
  // Добавляет полный URL к объекту изображения
  addFullUrl: (image: PerfumeImageWithUrl): PerfumeImageWithUrl => ({
    ...image,
    fullUrl: PATHS.getImageUrl(image.url)
  }),

  // Обрабатывает массив изображений
  processImages: (images: PerfumeImageWithUrl[]): PerfumeImageWithUrl[] => 
    images.map(imageUtils.addFullUrl)
}