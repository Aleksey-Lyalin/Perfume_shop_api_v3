import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

export const PATHS = {
  // Базовый путь для статических файлов из .env
  STATIC_BASE: process.env.IMAGE_BASE_PATH || '/public/',
  
  // Физический путь к папке с изображениями
  IMAGES_ROOT: path.join(__dirname, '../../public'),
  
  // Функция для формирования полного URL изображения
  getImageUrl: (relativePath: string): string => {
    // Убираем начальный слеш если он есть
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
    // Формируем полный путь
    return path.join(PATHS.STATIC_BASE, cleanPath).replace(/\\/g, '/')
  }
}