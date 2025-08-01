// import Fastify from 'fastify'
// import perfumeRoutes from './routes/perfume'
// import path from 'path'
// import fastifyMultipart from '@fastify/multipart'
// import fastifyStatic from '@fastify/static'


// const app = Fastify({ logger: true })

// // Подключение multipart
// app.register(fastifyMultipart)

// // Подключение статической папки для изображений
// app.register(fastifyStatic, {
//   root: path.join(__dirname, '../public'),
//   prefix: '/public/', // URL → /public/images/...
// })

// // Роут для загрузки изображений
// app.register(uploadRoutes, { prefix: '/api' })

// app.register(perfumeRoutes, { prefix: '/api' })

// app.listen({ port: 3000 }, (err, address) => {
//   if (err) {
//     app.log.error(err)
//     process.exit(1)
//   }
//   console.log(`Server running at ${address}`)
// })
import Fastify from 'fastify'
import path from 'path'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastifyCors from '@fastify/cors'
import { PATHS } from './config/paths'
import dotenv from 'dotenv'
import uploadRoutes from './routes/upload'
import perfumeRoutes from './routes/perfume'

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

// Регистрируем плагины
async function registerPlugins() {
  // CORS для работы с фронтендом
  await app.register(fastifyCors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  })

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

  // Регистрируем роуты
  await app.register(perfumeRoutes, { prefix: '/api' })
  await app.register(uploadRoutes, { prefix: '/api' })
}

// Функция запуска сервера
async function startServer() {
  try {
    await registerPlugins()
    
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
    const host = process.env.HOST || '0.0.0.0'

    await app.listen({ port, host })
    console.log(`🚀 Сервер запущен на ${host}:${port}`)
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
