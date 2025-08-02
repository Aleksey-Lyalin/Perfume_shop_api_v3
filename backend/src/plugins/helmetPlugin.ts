import { FastifyInstance } from 'fastify'
import fastifyHelmet from '@fastify/helmet'

/**
 * Плагин для настройки безопасности с помощью Helmet
 * Добавляет различные HTTP-заголовки для защиты от распространенных веб-уязвимостей
 */
export default async function helmetPlugin(app: FastifyInstance) {
  // Регистрируем Helmet с настройками
  await app.register(fastifyHelmet, {
    // Базовые настройки
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Добавлено для Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"], // Добавлено для Swagger UI
        imgSrc: ["'self'", "data:", "blob:", "validator.swagger.io"], // Добавлено validator.swagger.io
        connectSrc: ["'self'", "https:", "http:", "ws:", "wss:", "validator.swagger.io"], // Добавлено http:, ws:, wss: и validator.swagger.io
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "data:", "blob:"], // Добавлено data: и blob:
        frameSrc: ["'none'"],
      }
    },
    // Защита от кликджекинга
    xFrameOptions: {
      action: 'deny'
    },
    // Защита от MIME-sniffing
    contentTypeOptions: true,
    // Защита от XSS
    xssFilter: true,
    // Запрет на загрузку в iframe
    frameguard: {
      action: 'deny'
    },
    // Запрет на кэширование конфиденциальных данных
    noCache: true,
    // Запрет на отображение в iframe
    referrerPolicy: {
      policy: 'no-referrer'
    },
    // Запрет на определение типа MIME
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none'
    },
    // Защита от DNS prefetching
    dnsPrefetchControl: {
      allow: false
    },
    // Защита от кликджекинга
    hidePoweredBy: true
  })

  app.log.info('Helmet security headers enabled')
}
