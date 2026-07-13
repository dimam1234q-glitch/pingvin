/**
 * Маппинг ключей PDF-конспектов на пути к файлам в public/pdfs/.
 * Добавляй новые PDF в public/pdfs/ и регистрируй ключ здесь.
 * На вебе открывается через статическую раздачу Expo web-сервера.
 * На мобильном — через WebBrowser с полным URL.
 */
const PDF_PATHS: Record<string, string> = {
  theory_t1: "/pdfs/theory_t1.pdf",
};

export default PDF_PATHS;
