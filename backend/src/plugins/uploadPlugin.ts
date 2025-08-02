import { FastifyInstance } from 'fastify'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import util from 'util'
import prisma from '../lib/prisma'
import { uploadImageSchema, updateImageSchema, deleteImageSchema } from '../schemas/upload'

const mkdir = util.promisify(fs.mkdir)
const unlink = util.promisify(fs.unlink)

export default async function uploadPlugin(app: FastifyInstance) {
  // POST /api/upload-image - загрузка изображения
  app.post('/upload-image', { schema: uploadImageSchema }, async (req, reply) => {
    try {
      const data = await req.file()
      
      if (!data) {
        return reply.status(400).send({ error: 'Файл не найден' })
      }

      // Валидация article
      const articleValue = req.body?.article
      if (!articleValue) {
        return reply.status(400).send({ error: 'Отсутствует параметр article' })
      }

      const article = Number(articleValue)
      if (isNaN(article) || article <= 0) {
        return reply.status(400).send({ error: 'Некорректный параметр article' })
      }

      // Проверяем существование парфюма
      const perfume = await prisma.perfume.findUnique({
        where: { article }
      })

      if (!perfume) {
        return reply.status(400).send({ error: 'Парфюм с указанным артикулом не найден' })
      }

      // Валидация типа файла
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedMimeTypes.includes(data.mimetype)) {
        return reply.status(400).send({ 
          error: 'Неподдерживаемый формат файла. Разрешены только JPEG, PNG и WebP' 
        })
      }

      const folderPath = path.join(__dirname, '../../public/images', article.toString())
      await mkdir(folderPath, { recursive: true })

      const extension = path.extname(data.filename) || '.jpg'
      const newFileName = uuidv4() + extension
      const filePath = path.join(folderPath, newFileName)

      await data.toFile(filePath)

      // URL, под которым будет доступна картинка
      const relativeUrl = `/public/images/${article}/${newFileName}`

      // Сохраняем в БД
      const count = await prisma.perfumeImage.count({
        where: { article }
      })

      const saved = await prisma.perfumeImage.create({
        data: {
          article,
          url: relativeUrl,
          isMain: count === 0, // первая загруженная → isMain = true
          sortOrder: count + 1,
          altText: req.body?.altText || null
        }
      })

      return { success: true, image: saved }
    } catch (error) {
      app.log.error(error)
      return reply.status(500).send({ error: 'Ошибка при загрузке изображения' })
    }
  })

  // PUT /api/images/:id - обновление информации об изображении
  app.put('/images/:id', { schema: updateImageSchema }, async (req, reply) => {
    const { id } = req.params as { id: number }
    const updateData = req.body as {
      isMain?: boolean
      sortOrder?: number
      altText?: string | null
    }

    try {
      // Проверяем существование изображения
      const existingImage = await prisma.perfumeImage.findUnique({
        where: { id }
      })

      if (!existingImage) {
        return reply.status(404).send({ error: 'Изображение не найдено' })
      }

      // Если устанавливаем isMain = true, сбрасываем isMain у других изображений этого парфюма
      if (updateData.isMain === true) {
        await prisma.perfumeImage.updateMany({
          where: {
            article: existingImage.article,
            id: { not: id }
          },
          data: {
            isMain: false
          }
        })
      }

      // Обновляем изображение
      const updatedImage = await prisma.perfumeImage.update({
        where: { id },
        data: updateData
      })

      return updatedImage
    } catch (error) {
      app.log.error(error)
      return reply.status(400).send({ error: 'Ошибка при обновлении изображения' })
    }
  })

  // DELETE /api/images/:id - удаление изображения
  app.delete('/images/:id', { schema: deleteImageSchema }, async (req, reply) => {
    const { id } = req.params as { id: number }

    try {
      // Проверяем существование изображения
      const existingImage = await prisma.perfumeImage.findUnique({
        where: { id }
      })

      if (!existingImage) {
        return reply.status(404).send({ error: 'Изображение не найдено' })
      }

      // Получаем физический путь к файлу
      const filePath = path.join(__dirname, '../..', existingImage.url)

      // Удаляем запись из БД
      await prisma.perfumeImage.delete({
        where: { id }
      })

      // Удаляем файл с диска
      try {
        await unlink(filePath)
      } catch (fileError) {
        app.log.error(`Не удалось удалить файл ${filePath}: ${fileError}`)
        // Продолжаем выполнение, даже если файл не удалось удалить
      }

      // Если удаленное изображение было основным, назначаем новое основное изображение
      if (existingImage.isMain) {
        const firstImage = await prisma.perfumeImage.findFirst({
          where: { article: existingImage.article },
          orderBy: { sortOrder: 'asc' }
        })

        if (firstImage) {
          await prisma.perfumeImage.update({
            where: { id: firstImage.id },
            data: { isMain: true }
          })
        }
      }

      return { success: true }
    } catch (error) {
      app.log.error(error)
      return reply.status(400).send({ error: 'Ошибка при удалении изображения' })
    }
  })
}

