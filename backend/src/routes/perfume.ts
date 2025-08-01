import { FastifyInstance } from 'fastify'
import prisma from '../lib/prisma'
import { PATHS } from '../config/paths'

export default async function perfumeRoutes(app: FastifyInstance) {
  app.get('/perfumes', async (req, reply) => {
    const { limit = 20, offset = 0 } = req.query as {
      limit?: string
      offset?: string
    }

    const perfumes = await prisma.perfume.findMany({
      skip: Number(offset),
      take: Number(limit),
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
}
