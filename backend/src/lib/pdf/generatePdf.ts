import { AppError } from '../../errors/AppError';

// ADR-06 — Puppeteer (Chromium headless) renderizando o template HTML/Tailwind do sistema.
// Import dinâmico: em ambientes de desenvolvimento sem Chromium instalado (ver backend/.npmrc),
// falha com mensagem clara em vez de derrubar o processo na subida do servidor.
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } catch (error) {
    throw new AppError(
      'Não foi possível gerar o PDF (Chromium indisponível neste ambiente). Verifique a instalação do Puppeteer.',
      500,
      'PDF_GENERATION_FAILED',
      error instanceof Error ? error.message : undefined
    );
  }
}
