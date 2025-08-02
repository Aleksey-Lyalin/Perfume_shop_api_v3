import { FastifySchema } from 'fastify'

// Схема для POST /api/upload-image
export const uploadImageSchema: FastifySchema = {
  // Для multipart/form-data нельзя использовать стандартную валидацию body
  // Вместо этого мы будем валидировать данные внутри обработчика
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        image: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            article: { type: 'integer' },
            url: { type: 'string' },
            isMain: { type: 'boolean' },
            sortOrder: { type: 'integer' },
            altText: { type: ['string', 'null'] }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
}

// Схема для PUT /api/images/:id
export const updateImageSchema: FastifySchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer' }
    },
    required: ['id'],
    additionalProperties: false
  },
  body: {
    type: 'object',
    properties: {
      isMain: { type: 'boolean' },
      sortOrder: { type: 'integer', minimum: 1 },
      altText: { type: ['string', 'null'] }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        article: { type: 'integer' },
        url: { type: 'string' },
        isMain: { type: 'boolean' },
        sortOrder: { type: 'integer' },
        altText: { type: ['string', 'null'] }
      }
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
}

// Схема для DELETE /api/images/:id
export const deleteImageSchema: FastifySchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer' }
    },
    required: ['id'],
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
}

