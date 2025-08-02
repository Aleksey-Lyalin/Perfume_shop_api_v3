import { FastifySchema } from 'fastify'

// Схема для GET /api/perfumes
export const getPerfumesSchema: FastifySchema = {
  querystring: {
    type: 'object',
    properties: {
      limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      offset: { type: 'integer', minimum: 0, default: 0 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          article: { type: 'integer' },
          name: { type: 'string' },
          fullName: { type: 'string' },
          imageUrl: { type: ['string', 'null'] },
          brand: { type: 'string' },
          gender: { type: 'string' },
          density: { type: 'string' }
        },
        required: ['article', 'name', 'fullName', 'brand', 'gender', 'density']
      }
    }
  }
}

// Схема для GET /api/perfumes/:article
export const getPerfumeByArticleSchema: FastifySchema = {
  params: {
    type: 'object',
    properties: {
      article: { type: 'integer' }
    },
    required: ['article'],
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        article: { type: 'integer' },
        name: { type: 'string' },
        fullName: { type: 'string' },
        description: { type: ['string', 'null'] },
        price: { type: 'number' },
        releaseYear: { type: ['integer', 'null'] },
        brandId: { type: 'integer' },
        densityId: { type: 'integer' },
        genderId: { type: 'integer' },
        brand: { 
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' }
          }
        },
        density: { 
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' }
          }
        },
        gender: { 
          type: 'object',
          properties: {
            id: { type: 'integer' },
            gender: { type: 'string' }
          }
        },
        images: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              url: { type: 'string' },
              isMain: { type: 'boolean' },
              sortOrder: { type: 'integer' },
              altText: { type: ['string', 'null'] }
            }
          }
        }
      },
      required: ['article', 'name', 'fullName', 'price', 'brandId', 'densityId', 'genderId']
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  }
}

// Схема для POST /api/perfumes
export const createPerfumeSchema: FastifySchema = {
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      fullName: { type: 'string', minLength: 1 },
      description: { type: ['string', 'null'] },
      price: { type: 'number', minimum: 0 },
      releaseYear: { type: ['integer', 'null'], minimum: 1800, maximum: 2100 },
      brandId: { type: 'integer', minimum: 1 },
      densityId: { type: 'integer', minimum: 1 },
      genderId: { type: 'integer', minimum: 1 }
    },
    required: ['name', 'fullName', 'price', 'brandId', 'densityId', 'genderId'],
    additionalProperties: false
  },
  response: {
    201: {
      type: 'object',
      properties: {
        article: { type: 'integer' },
        name: { type: 'string' },
        fullName: { type: 'string' },
        description: { type: ['string', 'null'] },
        price: { type: 'number' },
        releaseYear: { type: ['integer', 'null'] },
        brandId: { type: 'integer' },
        densityId: { type: 'integer' },
        genderId: { type: 'integer' }
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

// Схема для PUT /api/perfumes/:article
export const updatePerfumeSchema: FastifySchema = {
  params: {
    type: 'object',
    properties: {
      article: { type: 'integer' }
    },
    required: ['article'],
    additionalProperties: false
  },
  body: {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      fullName: { type: 'string', minLength: 1 },
      description: { type: ['string', 'null'] },
      price: { type: 'number', minimum: 0 },
      releaseYear: { type: ['integer', 'null'], minimum: 1800, maximum: 2100 },
      brandId: { type: 'integer', minimum: 1 },
      densityId: { type: 'integer', minimum: 1 },
      genderId: { type: 'integer', minimum: 1 }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      properties: {
        article: { type: 'integer' },
        name: { type: 'string' },
        fullName: { type: 'string' },
        description: { type: ['string', 'null'] },
        price: { type: 'number' },
        releaseYear: { type: ['integer', 'null'] },
        brandId: { type: 'integer' },
        densityId: { type: 'integer' },
        genderId: { type: 'integer' }
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

// Схема для DELETE /api/perfumes/:article
export const deletePerfumeSchema: FastifySchema = {
  params: {
    type: 'object',
    properties: {
      article: { type: 'integer' }
    },
    required: ['article'],
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

