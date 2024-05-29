import axios, { Method } from 'axios';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

class YandexDiskService {
  private token: string='y0_AgAAAABavlC_AAvbywAAAAEGBYF2AADrItKTxwRDMYFjdtox59nwuHJq4g';
  private allowedExtensions: string[];
  private allowedContentTypes: string[];
  private maxFileSize: number;

  constructor(token: string, allowedExtensions: string[], allowedContentTypes: string[], maxFileSize: number) {
    this.token = token;
    this.allowedExtensions = allowedExtensions;
    this.allowedContentTypes = allowedContentTypes;
    this.maxFileSize = maxFileSize;
  }

  public async sendQueryYaDisk(urlQuery: string, arrQuery: Record<string, any> = {}, methodQuery: Method = 'GET'): Promise<any> {
    let fullUrlQuery = urlQuery;

    if (methodQuery === 'GET' || methodQuery === 'PUT') {
      const queryString = new URLSearchParams(arrQuery).toString();
      fullUrlQuery = `${urlQuery}?${queryString}`;
    }

    try {
      const response = await axios({
        method: methodQuery,
        url: fullUrlQuery,
        headers: {
          'Authorization': `OAuth ${this.token}`
        },
        data: methodQuery === 'POST' ? arrQuery : undefined
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return error.response.data;
      }
      throw new Error('Error sending query to Yandex Disk');
    }
  }

  public async disk_getInfo(): Promise<any> {
    const urlQuery = 'https://cloud-api.yandex.net/v1/disk/';
    return this.sendQueryYaDisk(urlQuery);
  }

  public async disk_resources(arrParams: Record<string, any>, typeDir: string = ''): Promise<any> {
    let urlQuery: string;

    switch (typeDir) {
      case 'trash':
        urlQuery = 'https://cloud-api.yandex.net/v1/disk/trash/resources';
        break;

      case 'standart':
      default:
        urlQuery = 'https://cloud-api.yandex.net/v1/disk/resources';
        break;
    }

    return this.sendQueryYaDisk(urlQuery, arrParams);
  }

  public async disk_resources_create_dir(arrParams: Record<string, any>): Promise<any> {
    const urlQuery = 'https://cloud-api.yandex.net/v1/disk/resources';
    return this.sendQueryYaDisk(urlQuery, arrParams, 'PUT');
  }

  public async disk_resources_upload(filePath: string, dirPath: string = ''): Promise<string> {
    const fileExtension = path.extname(filePath).slice(1);
    const fileMimeType = mime.lookup(filePath);
    const fileSize = fs.statSync(filePath).size;

    if (!this.allowedExtensions.includes(fileExtension)) {
      throw new Error(`File extension .${fileExtension} is not allowed.`);
    }

    if (!fileMimeType || !this.allowedContentTypes.includes(fileMimeType)) {
      throw new Error(`File type ${fileMimeType} is not allowed.`);
    }

    if (fileSize > this.maxFileSize) {
      throw new Error(`File size ${fileSize} bytes exceeds the maximum allowed size of ${this.maxFileSize} bytes.`);
    }

    const remotePath = path.posix.join(dirPath, path.basename(filePath));
    console.log(`Uploading file to: ${remotePath}`);

    const arrParams = {
      path: remotePath,
      overwrite: 'true',
    };

    const urlQuery = 'https://cloud-api.yandex.net/v1/disk/resources/upload';
    const resultQuery = await this.sendQueryYaDisk(urlQuery, arrParams);

    if (!resultQuery.error) {
      const fileStream = fs.createReadStream(filePath);

      try {
        const response = await axios.put(resultQuery.href, fileStream, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Authorization': `OAuth ${this.token}`
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });

        return response.status.toString();
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          return error.response.status.toString();
        }
        throw new Error('Error uploading file to Yandex Disk');
      }
    } else {
      return resultQuery.message;
    }
  }

  public async disk_resources_download(filePath: string, dirPath: string = ''): Promise<{ message: string; path?: string }> {
    const arrParams = {
      path: filePath,
    };

    const urlQuery = 'https://cloud-api.yandex.net/v1/disk/resources/download';
    const resultQuery = await this.sendQueryYaDisk(urlQuery, arrParams);

    if (!resultQuery.error) {
      const fileName = path.join(dirPath, path.basename(filePath));
      const file = fs.createWriteStream(fileName);

      const response = await axios.get(resultQuery.href, {
        responseType: 'stream',
        headers: {
          'Authorization': `OAuth ${this.token}`
        }
      });

      response.data.pipe(file);

      return new Promise((resolve, reject) => {
        file.on('finish', () => {
          file.close();
          resolve({
            message: 'File successfully downloaded',
            path: fileName,
          });
        });

        file.on('error', (err) => {
          fs.unlinkSync(fileName);
          reject({
            message: 'Error downloading file',
            error: err.message,
          });
        });
      });
    } else {
      return {
        message: resultQuery.message,
      };
    }
  }
  public async disk_resources_delete(deletePath: string): Promise<any> {
    const arrParams = { path: deletePath };
    const urlQuery = 'https://cloud-api.yandex.net/v1/disk/resources';
    return this.sendQueryYaDisk(urlQuery, arrParams, 'DELETE');
  }
}

export default YandexDiskService;
