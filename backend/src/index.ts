import Fastify from 'fastify'
import path from 'path'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastifyCors from '@fastify/cors'
import { PATHS } from './config/paths'
import dotenv from 'dotenv'
import perfumePlugin from './plugins/perfumePlugin'
import uploadPlugin from './plugins/uploadPlugin'
// import swaggerPlugin from './plugins/swaggerPlugin' // ЭТА СТРОКА ДОЛЖНА БЫТЬ ЗАКОММЕНТИРОВАНА ИЛИ УДАЛЕНА

import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'


// Загружаем переменные окружения
dotenv.config()

// Создаем экземпляр приложения
const app = Fastify({
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: true,
      useDefaults: true
    }
  }
})

/// Регистрируем плагины
async function registerPlugins() {
  // CORS для работы с фронтендом
  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  } )

  // Настройка раздачи статических файлов
  await app.register(fastifyStatic, {
    root: path.dirname(PATHS.IMAGES_ROOT), // Корневая папка public
    prefix: '/', // Базовый префикс
    decorateReply: false
  })

  // Поддержка multipart для загрузки файлов
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB лимит на файл
    }
  })

  // Регистрируем плагины с маршрутами
  await app.register(perfumePlugin, { prefix: '/api' })
  await app.register(uploadPlugin, { prefix: '/api' })

  // !!! ЭТОТ БЛОК ДОЛЖЕН БЫТЬ ТАК !!!
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Perfume Shop API',
        description: 'API для интернет-магазина парфюмерии',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@perfumeshop.com'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        },
        {
          url: 'https://api.perfumeshop.com',
          description: 'Production server'
        }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      },
      tags: [
        { name: 'perfumes', description: 'Операции с парфюмерией' },
        { name: 'images', description: 'Операции с изображениями' }
      ]
    }
  } )

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true
    },
    staticCSP: true,
    transformStaticCSP: (header) => header
  })
}


// Функция запуска сервера
async function startServer() {
  try {
    await registerPlugins()

    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
    const host = process.env.HOST || '0.0.0.0'

    await app.listen({ port, host })
    console.log(`🚀 Сервер запущен на ${host}:${port}`)

    app.ready((err) => {
      if (err) throw err
      // app.swagger() // ЭТА СТРОКА ДОЛЖНА БЫТЬ ЗАКОММЕНТИРОВАНА ИЛИ УДАЛЕНА
      console.log(`📚 Документация API доступна по адресу http://${host}:${port}/docs` )
    })

  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Обработка необработанных ошибок
process.on('unhandledRejection', (err) => {
  console.error('❌ Необработанная ошибка:', err)
  process.exit(1)
})

startServer()
