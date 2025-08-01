import fs from 'fs/promises'
import path from 'path'
import prisma from '../src/lib/prisma'
import cliProgress from 'cli-progress'
import { existsSync } from 'fs'

// Константы
const IMAGES_ROOT = 'C:/image'
const BATCH_SIZE = 10
const RESUME_FILE = path.join(__dirname, 'resume.json')
const IMAGE_BASE_URL = process.env.IMAGE_BASE_PATH || '/images/'

// Интерфейс
interface ResumeData {
  processedDirs: string[]
  processedFiles: { [dir: string]: string[] }
}

async function loadResumeData(): Promise<ResumeData> {
  if (existsSync(RESUME_FILE)) {
    const data = await fs.readFile(RESUME_FILE, 'utf-8')
    return JSON.parse(data)
  }
  return { processedDirs: [], processedFiles: {} }
}

async function saveResumeData(data: ResumeData): Promise<void> {
  await fs.writeFile(RESUME_FILE, JSON.stringify(data, null, 2))
}

async function processImageFile(articleDir: string, file: string) {
  try {
    if (!file.toLowerCase().match(/\.(webp|jpg|jpeg|png)$/)) {
      return null
    }

    const match = file.match(/^(\d+)_([nzs])(\d+)\.(webp|jpg|jpeg|png)$/i)
    if (!match) {
      console.warn(`Пропущен файл: ${file}`)
      return null
    }

    const [, fileArticle, type, indexStr] = match
    const article = parseInt(fileArticle)
    const index = parseInt(indexStr)

    const perfume = await prisma.perfume.findUnique({ where: { article } })
    if (!perfume) {
      console.warn(`Парфюм с артикулом ${article} не найден`)
      return null
    }

    const imageUrl = path.join(IMAGE_BASE_URL, fileArticle, file).replace(/\\/g, '/')

    return {
      article,
      url: imageUrl,
      ismain: type === 'n' && index === 1,
      sortorder: index,
      alttext: `${perfume.fullName}, изображение ${type}${index}`
    }
  } catch (error) {
    console.error(`Ошибка обработки файла ${file}:`, error)
    return null
  }
}

async function processBatch(batch: { dir: string, file: string }[], progressBar: cliProgress.SingleBar) {
  const imageData = await Promise.all(
    batch.map(({ dir, file }) => processImageFile(dir, file))
  )

  const validImageData = imageData.filter((data): data is NonNullable<typeof data> => data !== null)

  if (validImageData.length > 0) {
    await prisma.perfumeImage.createMany({
      data: validImageData,
      skipDuplicates: true
    })
  }

  progressBar.increment(batch.length)
}

async function checkDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Соединение с базой данных установлено')
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error)
    throw error
  }
}

async function main() {
  try {
    await checkDatabaseConnection()
    console.log('📂 Начало обработки изображений...')
    const resumeData = await loadResumeData()
    
    const perfumeDirs = await fs.readdir(IMAGES_ROOT)
    console.log(`📁 Найдено директорий: ${perfumeDirs.length}`)
    
    let totalFiles = 0
    let batch: { dir: string, file: string }[] = []

    for (const dir of perfumeDirs) {
      if (resumeData.processedDirs.includes(dir)) continue
      const fullDirPath = path.join(IMAGES_ROOT, dir)
      const stat = await fs.stat(fullDirPath)
      if (stat.isDirectory()) {
        const files = await fs.readdir(fullDirPath)
        totalFiles += files.filter(f => f.match(/\.(webp|jpg|jpeg|png)$/i)).length
      }
    }

    console.log(`📊 Всего файлов для обработки: ${totalFiles}`)

    const progressBar = new cliProgress.SingleBar({
      format: 'Прогресс |{bar}| {percentage}% || {value}/{total} файлов',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
    })

    progressBar.start(totalFiles, 0)

    for (const articleDir of perfumeDirs) {
      if (resumeData.processedDirs.includes(articleDir)) continue

      const fullDirPath = path.join(IMAGES_ROOT, articleDir)
      const stat = await fs.stat(fullDirPath)
      if (!stat.isDirectory()) continue

      const files = await fs.readdir(fullDirPath)
      
      for (const file of files) {
        if (!file.toLowerCase().match(/\.(webp|jpg|jpeg|png)$/)) continue
        if (resumeData.processedFiles[articleDir]?.includes(file)) {
          progressBar.increment(1)
          continue
        }

        batch.push({ dir: articleDir, file })
        
        if (batch.length >= BATCH_SIZE) {
          await processBatch(batch, progressBar)
          
          for (const { dir, file } of batch) {
            if (!resumeData.processedFiles[dir]) resumeData.processedFiles[dir] = []
            resumeData.processedFiles[dir].push(file)
          }
          await saveResumeData(resumeData)
          batch = []
        }
      }

      resumeData.processedDirs.push(articleDir)
      await saveResumeData(resumeData)
    }

    if (batch.length > 0) {
      await processBatch(batch, progressBar)
    }

    progressBar.stop()
    console.log('✅ Загрузка изображений успешно завершена')

    await fs.unlink(RESUME_FILE).catch(() => {})
  } catch (error) {
    console.error('❌ Ошибка при загрузке изображений:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Критическая ошибка:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('👋 Соединение с базой данных закрыто')
  })
