import { Prisma } from '@prisma/client'

// Расширяем тип PerfumeImage для обработки URL
export type PerfumeImageWithUrl = Prisma.PerfumeImageGetPayload<{
  select: {
    id: true
    article: true
    url: true
    isMain: true
    sortOrder: true
  }
}> & {
  fullUrl?: string  // Добавляем поле для полного URL
}