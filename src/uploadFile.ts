import dotenv from 'dotenv';
import YandexDiskService from './yandexDiskService';

dotenv.config();

(async () => {
  const token = process.env.YANDEX_DISK_TOKEN;
  const allowedExtensions = (process.env.ALLOWED_EXTENSIONS || '').split(',');
  const allowedContentTypes = (process.env.ALLOWED_CONTENT_TYPES || '').split(',');
  const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '0', 10);

  if (!token) {
    throw new Error('YANDEX_DISK_TOKEN is not defined in .env file');
  }

  const yandexDiskService = new YandexDiskService(token, allowedExtensions, allowedContentTypes, maxFileSize);

  try {
    const filePath = 'C:/Users/nikit/Pictures/IMG_4183.jpg';  // Укажите полный путь к вашему файлу
    const uploadResponse = await yandexDiskService.disk_resources_upload(filePath, '/uploads');
    console.log('Upload Response:', uploadResponse);
  } catch (error) {
    console.error((error as any).message);
  }
})();
