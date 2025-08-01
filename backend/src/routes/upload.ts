import { FastifyInstance } from 'fastify'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import util from 'util'
import prisma from '../lib/prisma'

const mkdir = util.promisify(fs.mkdir)

export default async function uploadRoutes(app: FastifyInstance) {
  app.post('/upload-image', async (req, reply) => {
    const data = await req.file()
    const article = Number(req.body.article)

    if (!article || !data) {
      return reply.status(400).send({ error: 'Missing article or file' })
    }

    const folderPath = path.join(__dirname, '../../public/images', article.toString())
    await mkdir(folderPath, { recursive: true })

    const extension = path.extname(data.filename)
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
        altText: req.body.altText || null
      }
    })

    return { success: true, image: saved }
  })
}
