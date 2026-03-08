export interface PdfRendererPort {
  generateAprovadosPdf(editalId?: number): Promise<Buffer>;
}

