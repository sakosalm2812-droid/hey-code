declare module 'pdf-parse' {
  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, any>;
    metadata: Record<string, any>;
    version: string;
    text: string;
  }

  type PdfParseInput = Buffer | Uint8Array | string;

  function pdfParse(dataBuffer: PdfParseInput, options?: Record<string, any>): Promise<PdfParseResult>;
  export default pdfParse;
}