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
    const arrQuery = {
      path: '/',
      fields: '_embedded.items.name,_embedded.items.type',
      limit: 100,
      offset: 0,
      preview_crop: '',
      preview_size: '',
      sort: ''
    };
    const activeDirectories = await yandexDiskService.disk_resources(arrQuery, 'standart');
    console.log('Active Directories:', JSON.stringify(activeDirectories, null, 2));

    const trashDirectories = await yandexDiskService.disk_resources(arrQuery, 'trash');
    console.log('Trash Directories:', JSON.stringify(trashDirectories, null, 2));
  } catch (error) {
    console.error((error as any).message);
  }
})();
