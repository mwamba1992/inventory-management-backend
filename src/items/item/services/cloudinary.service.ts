import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    // Configure Cloudinary with environment variables
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    this.logger.log('Cloudinary configured');
  }

  /**
   * Upload image to Cloudinary
   * @param file - The uploaded file buffer
   * @param folder - Folder path in Cloudinary (default: 'inventory/products')
   * @returns Promise with Cloudinary upload response
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'inventory/products',
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          // Optimization options
          transformation: [
            {
              width: 800,
              height: 800,
              crop: 'limit', // Don't upscale, only downscale if larger
              quality: 'auto:good',
              fetch_format: 'auto', // Automatically choose best format (WebP, etc)
            },
          ],
        },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error) {
            this.logger.error('Cloudinary upload error:', error);
            return reject(error);
          }
          this.logger.log(`Image uploaded successfully: ${result.secure_url}`);
          resolve(result);
        },
      );

      // Convert buffer to stream and pipe to Cloudinary
      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(upload);
    });
  }

  /**
   * Delete image from Cloudinary
   * @param publicId - The public ID of the image to delete
   */
  async deleteImage(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted: ${publicId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting image ${publicId}:`, error);
      throw error;
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param url - Cloudinary image URL
   * @returns Public ID
   */
  extractPublicId(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = parts.slice(parts.indexOf('upload') + 2, -1).join('/');
    return folder ? `${folder}/${publicId}` : publicId;
  }
}
