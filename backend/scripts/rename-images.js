const fs = require('fs-extra');
const path = require('path');
const pLimit = require('p-limit').default;

// ————————————————————— Настройки —————————————————————
const OLD_IMAGE_ROOT = 'C:/image_old';
const NEW_IMAGE_ROOT = 'C:/image';
const CSV_FILE = './MatchId.csv';  // Поддерживает .csv с , или ;
const CONCURRENCY_LIMIT = 30;

// ——————————————————— Проверка и чтение CSV ———————————————————
console.log('🔥 Запуск скрипта...');

if (!fs.existsSync(CSV_FILE)) {
  console.error(`❌ Файл ${CSV_FILE} не найден! Убедитесь, что он лежит в этой папке.`);
  process.exit(1);
}

const content = fs.readFileSync(CSV_FILE, 'utf-8');

if (!content.trim()) {
  console.error(`❌ Файл ${CSV_FILE} пустой!`);
  process.exit(1);
}

console.log('📄 Содержимое файла (первые 200 символов):');
console.log('---\n' + content.substring(0, 200).replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '\n---');

const rows = content
  .trim()
  .split(/\r?\n/)                   // Корректно разбиваем по \n или \r\n
  .map(line => line.trim())         // Убираем пробелы и \r
  .filter(line => line.length > 0)  // Пропускаем пустые строки
  .map(line => line.split(/[,;]/).map(x => x.trim()))  // Разделитель: , или ;
  .filter(([oldId, newId], index) => {
    // Пропускаем заголовок (если есть)
    if (index === 0 && (!isNaN(oldId) && !isNaN(newId))) {
      // Первая строка — числа → не заголовок
      return true;
    }
    if (index === 0 && (isNaN(oldId) || isNaN(newId))) {
      console.warn(`⚠️ Пропущена первая строка (возможно, заголовок): [${oldId}, ${newId}]`);
      return false;
    }
    // Все остальные строки: проверяем как данные
    if (!oldId || !newId) {
      console.warn(`⚠️ Пропущена строка: пустые значения → [${oldId}, ${newId}]`);
      return false;
    }
    if (isNaN(oldId) || isNaN(newId)) {
      console.warn(`⚠️ Пропущена строка: не числовые значения → [${oldId}, ${newId}]`);
      return false;
    }
    return true;
  })
  .map(([oldId, newId]) => [Number(oldId), Number(newId)]);

console.log(`✅ Найдено ${rows.length} пар для обработки`);

if (rows.length === 0) {
  console.error('❌ Нет данных для обработки. Проверьте формат файла CSV.');
  process.exit(1);
}

// ——————————————————— Подготовка задач ———————————————————
const tasks = [];
const limit = pLimit(CONCURRENCY_LIMIT);

for (const [oldId, newId] of rows) {
  tasks.push(
    limit(async () => {
      const oldDir = path.join(OLD_IMAGE_ROOT, String(oldId));
      const newDir = path.join(NEW_IMAGE_ROOT, String(newId));

      if (!fs.existsSync(oldDir)) {
        console.warn(`⚠️ Папка не найдена: ${oldDir}`);
        return;
      }

      try {
        await fs.ensureDir(newDir);
        const files = await fs.readdir(oldDir);

        if (files.length === 0) {
          console.log(`🟡 ${oldDir} пустая — ничего копировать`);
          return;
        }

        for (const file of files) {
          const ext = path.extname(file);
          const name = path.basename(file, ext);

          // Проверяем, что файл начинается с oldId
          if (!name.startsWith(String(oldId))) {
            console.log(`⏭️ Пропущен файл (не соответствует oldId): ${file}`);
            continue;
          }

          const suffix = name.substring(String(oldId).length);
          const newFileName = `${newId}${suffix}${ext}`;
          const srcPath = path.join(oldDir, file);
          const destPath = path.join(newDir, newFileName);

          await fs.copyFile(srcPath, destPath);
          console.log(`✅ ${file} → ${newFileName}`);
        }
      } catch (err) {
        console.error(`❌ Ошибка при обработке папки ${oldId}:`, err.message);
      }
    })
  );
}

// ——————————————————— Запуск ———————————————————
(async () => {
  console.log(`🚀 Начинаем копирование...`);
  await Promise.all(tasks);
  console.log('🎉 Все задачи завершены!');
})();