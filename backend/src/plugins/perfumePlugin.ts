import { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma'
import { PATHS } from '../config/paths'
import { 
  getPerfumesSchema, 
  getPerfumeByArticleSchema,
  createPerfumeSchema,
  updatePerfumeSchema,
  deletePerfumeSchema
} from '../schemas/perfume'

export default async function perfumePlugin(app: FastifyInstance) {
  // GET /api/perfumes - получение списка парфюмов
  app.get('/perfumes', { 
    schema: getPerfumesSchema,
    // Добавляем метаданные для Swagger
    config: {
      tags: ['perfumes'],
      description: 'Получение списка парфюмов с пагинацией',
      summary: 'Получить список парфюмов'
    }
  }, async (req, reply) => {
    const { limit = 20, offset = 0 } = req.query as {
      limit?: number
      offset?: number
    }

    const perfumes = await prisma.perfume.findMany({
      skip: offset,
      take: limit,
      include: {
        images: {
          where: { isMain: true },
          select: { url: true }
        },
        brand: true,
        density: true,
        gender: true
      },
      orderBy: {
        releaseYear: 'desc'
      }
    })

    return perfumes.map(p => ({
      article: p.article,
      name: p.name,
      fullName: p.fullName,
      imageUrl: PATHS.getImageUrl(p.images[0]?.url || null),
      brand: p.brand.name,
      gender: p.gender.gender,
      density: p.density.name
    }))
  })

  // GET /api/perfumes/:article - получение парфюма по артикулу
  app.get('/perfumes/:article', { 
    schema: getPerfumeByArticleSchema,
    config: {
      tags: ['perfumes'],
      description: 'Получение детальной информации о парфюме по его артикулу',
      summary: 'Получить парфюм по артикулу'
    }
  }, async (req, reply) => {
    const { article } = req.params as { article: number }

    const perfume = await prisma.perfume.findUnique({
      where: { article },
      include: {
        images: {
          orderBy: { sortOrder: 'asc' }
        },
        brand: true,
        density: true,
        gender: true
      }
    })

    if (!perfume) {
      return reply.status(404).send({ error: 'Парфюм не найден' })
    }

    // Преобразуем URL изображений
    const perfumeWithImageUrls = {
      ...perfume,
      images: perfume.images.map(img => ({
        ...img,
        url: PATHS.getImageUrl(img.url)
      }))
    }

    return perfumeWithImageUrls
  })

  // POST /api/perfumes - создание нового парфюма
  app.post('/perfumes', { 
    schema: createPerfumeSchema,
    config: {
      tags: ['perfumes'],
      description: 'Создание нового парфюма',
      summary: 'Создать новый парфюм'
    }
  }, async (req, reply) => {
    const perfumeData = req.body as {
      name: string
      fullName: string
      description?: string | null
      price: number
      releaseYear?: number | null
      brandId: number
      densityId: number
      genderId: number
    }

    try {
      const newPerfume = await prisma.perfume.create({
        data: perfumeData
      })

      return reply.status(201).send(newPerfume)
    } catch (error) {
      app.log.error(error)
      return reply.status(400).send({ error: 'Ошибка при создании парфюма' })
    }
  })

  // PUT /api/perfumes/:article - обновление парфюма
  app.put('/perfumes/:article', { 
    schema: updatePerfumeSchema,
    config: {
      tags: ['perfumes'],
      description: 'Обновление существующего парфюма по артикулу',
      summary: 'Обновить парфюм'
    }
  }, async (req, reply) => {
    const { article } = req.params as { article: number }
    const updateData = req.body as {
      name?: string
      fullName?: string
      description?: string | null
      price?: number
      releaseYear?: number | null
      brandId?: number
      densityId?: number
      genderId?: number
    }

    try {
      // Проверяем существование парфюма
      const existingPerfume = await prisma.perfume.findUnique({
        where: { article }
      })

      if (!existingPerfume) {
        return reply.status(404).send({ error: 'Парфюм не найден' })
      }

      // Обновляем парфюм
      const updatedPerfume = await prisma.perfume.update({
        where: { article },
        data: updateData
      })

      return updatedPerfume
    } catch (error) {
      app.log.error(error)
      return reply.status(400).send({ error: 'Ошибка при обновлении парфюма' })
    }
  })

  // DELETE /api/perfumes/:article - удаление парфюма
  app.delete('/perfumes/:article', { 
    schema: deletePerfumeSchema,
    config: {
      tags: ['perfumes'],
      description: 'Удаление парфюма по артикулу',
      summary: 'Удалить парфюм'
    }
  }, async (req, reply) => {
    const { article } = req.params as { article: number }

    try {
      // Проверяем существование парфюма
      const existingPerfume = await prisma.perfume.findUnique({
        where: { article }
      })

      if (!existingPerfume) {
        return reply.status(404).send({ error: 'Парфюм не найден' })
      }

      // Удаляем парфюм
      await prisma.perfume.delete({
        where: { article }
      })

      return { success: true }
    } catch (error) {
      app.log.error(error)
      return reply.status(400).send({ error: 'Ошибка при удалении парфюма' })
    }
  })
}

