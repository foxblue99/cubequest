import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageService } from './storage.service';

@Controller('api/upload')
export class UploadController {
  constructor(private storage: StorageService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) cb(new Error('Only images allowed'), false);
      else cb(null, true);
    },
  }))
  async uploadImage(@UploadedFile() file: any) {
    const url = await this.storage.uploadBuffer(file.buffer, 'images', `${Date.now()}-${file.originalname}`);
    return { url };
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_, file, cb) => {
      if (!file.mimetype.match(/\/(mp4|webm|ogg|mov)$/)) cb(new Error('Only videos allowed'), false);
      else cb(null, true);
    },
  }))
  async uploadVideo(@UploadedFile() file: any) {
    const url = await this.storage.uploadBuffer(file.buffer, 'videos', `${Date.now()}-${file.originalname}`);
    return { url };
  }
}
