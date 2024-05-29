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
    const deletePath = '/uploads/test.docx';  // Укажите путь к ресурсу, который нужно удалить
    const deleteResponse = await yandexDiskService.disk_resources_delete(deletePath);
    console.log('Delete Response:', deleteResponse);
  } catch (error) {
    console.error((error as any).message);
  }
})();
