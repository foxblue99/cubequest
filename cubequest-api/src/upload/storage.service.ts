import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly useOSS: boolean;

  constructor() {
    this.useOSS = !!(process.env.OSS_ACCESS_KEY_ID && process.env.OSS_BUCKET);
    if (this.useOSS) {
      this.logger.log('对象存储模式: OSS');
    } else {
      this.logger.log('本地存储模式: uploads/');
    }
  }

  async uploadBuffer(buffer: Buffer, prefix: string, filename?: string): Promise<string> {
    if (this.useOSS) return this.ossUpload(buffer, prefix, filename);
    return this.localUpload(buffer, prefix, filename);
  }

  async deleteFile(url: string): Promise<void> {
    try {
      if (this.useOSS) await this.ossDelete(url);
      else await this.localDelete(url);
    } catch (err) {
      this.logger.warn(`删除文件失败: ${url} — ${(err as Error)?.message}`);
    }
  }

  // ── Local disk ──
  private async localUpload(buffer: Buffer, prefix: string, filename?: string): Promise<string> {
    const dir = path.join(process.cwd(), 'uploads', prefix);
    await fs.mkdir(dir, { recursive: true });
    const name = filename || `${randomUUID()}.bin`;
    const filepath = path.join(dir, name);
    await fs.writeFile(filepath, buffer);
    return `/uploads/${prefix}/${name}`;
  }

  private async localDelete(url: string): Promise<void> {
    const filePath = path.join(process.cwd(), url.replace(/^\//, ''));
    await fs.unlink(filePath);
  }

  // ── OSS (placeholder — replace with actual SDK calls) ──
  private async ossUpload(_buffer: Buffer, _prefix: string, _filename?: string): Promise<string> {
    throw new Error('OSS 上传尚未实现真实调用。请先完成 storage.service.ts 的 ossUpload 方法，或清空 OSS_* 环境变量以使用本地存储。');
  }

  private async ossDelete(_url: string): Promise<void> {
    throw new Error('OSS 删除尚未实现真实调用。请先完成 storage.service.ts 的 ossDelete 方法，或清空 OSS_* 环境变量以使用本地存储。');
  }
}
