
export class FileUploadDto {
    /**
     * The multi-part form-data field containing the uploaded image.
     * This type is set to 'any' to cleanly handle the multipart parsing layer,
     * while the controller handles binary validation via ParseFilePipe.
     */
    file: any;
  }