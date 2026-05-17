import {
    Body,
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
    Version,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  
  import { OcrService } from './ocr.service';
  import { FileUploadDto } from './dto/upload-ocr.dto';
  
  @Controller('ocr')
  export class OcrController {
    constructor(private readonly service: OcrService) {}
  
    @Version('1')
    @Post('upload')
    @UseInterceptors(
      FileInterceptor('file', {
        storage: diskStorage({
          destination: './uploads',
          filename: (req, file, cb) => {
            const uniqueName = `${Date.now()}-${file.originalname}`;
            cb(null, uniqueName);
          },
        }),
      }),
    )
    async upload(
      @UploadedFile(
        new ParseFilePipe({
          validators: [
            new MaxFileSizeValidator({
              maxSize: 1024 * 1024 * 5, // 5MB
            }),
            //validation can be implemented
            // new FileTypeValidator({
            //   fileType: /^(image\/png|image\/jpeg|image\/jpg)$/i,
            // }),
          ],
        }),
      )
      file: Express.Multer.File,
  
      @Body()
      fileUploadDto: FileUploadDto,
    ): Promise<{
      jobId: string;
      status: string;
    }> {
      console.log(file);
      return this.service.createJob(file);
    }
  }