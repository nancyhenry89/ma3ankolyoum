export type Testament = 'ot' | 'nt'

export type BookDef = {
  key: string
  slug: string
  nameAr: string
  maxChapters: number
  testament: Testament
}
export const BOOKS: BookDef[] = [
     // ===== New Testament (default) =====
     { key: 'Matthew', slug: 'matthew', nameAr: 'متى', maxChapters: 28, testament: 'nt' },
     { key: 'Mark', slug: 'mark', nameAr: 'مرقس', maxChapters: 16, testament: 'nt' },
     { key: 'Luke', slug: 'luke', nameAr: 'لوقا', maxChapters: 24, testament: 'nt' },
     { key: 'John', slug: 'john', nameAr: 'يوحنا', maxChapters: 21, testament: 'nt' },
     { key: 'Acts', slug: 'acts', nameAr: 'أعمال الرسل', maxChapters: 28, testament: 'nt' },
     { key: 'Romans', slug: 'romans', nameAr: 'رومية', maxChapters: 16, testament: 'nt' },
     { key: '1Corinthians', slug: '1corinthians', nameAr: '١ كورنثوس', maxChapters: 16, testament: 'nt' },
     { key: '2Corinthians', slug: '2corinthians', nameAr: '٢ كورنثوس', maxChapters: 13, testament: 'nt' },
     { key: 'Galatians', slug: 'galatians', nameAr: 'غلاطية', maxChapters: 6, testament: 'nt' },
     { key: 'Ephesians', slug: 'ephesians', nameAr: 'أفسس', maxChapters: 6, testament: 'nt' },
     { key: 'Philippians', slug: 'philippians', nameAr: 'فيلبي', maxChapters: 4, testament: 'nt' },
     { key: 'Colossians', slug: 'colossians', nameAr: 'كولوسي', maxChapters: 4, testament: 'nt' },
     { key: '1Thessalonians', slug: '1thessalonians', nameAr: '١ تسالونيكي', maxChapters: 5, testament: 'nt' },
     { key: '2Thessalonians', slug: '2thessalonians', nameAr: '٢ تسالونيكي', maxChapters: 3, testament: 'nt' },
     { key: '1Timothy', slug: '1timothy', nameAr: '١ تيموثاوس', maxChapters: 6, testament: 'nt' },
     { key: '2Timothy', slug: '2timothy', nameAr: '٢ تيموثاوس', maxChapters: 4, testament: 'nt' },
     { key: 'Titus', slug: 'titus', nameAr: 'تيطس', maxChapters: 3, testament: 'nt' },
     { key: 'Philemon', slug: 'philemon', nameAr: 'فليمون', maxChapters: 1, testament: 'nt' },
     { key: 'Hebrews', slug: 'hebrews', nameAr: 'عبرانيين', maxChapters: 13, testament: 'nt' },
     { key: 'James', slug: 'james', nameAr: 'يعقوب', maxChapters: 5, testament: 'nt' },
     { key: '1Peter', slug: '1peter', nameAr: '١ بطرس', maxChapters: 5, testament: 'nt' },
     { key: '2Peter', slug: '2peter', nameAr: '٢ بطرس', maxChapters: 3, testament: 'nt' },
     { key: '1John', slug: '1john', nameAr: '١ يوحنا', maxChapters: 5, testament: 'nt' },
     { key: '2John', slug: '2john', nameAr: '٢ يوحنا', maxChapters: 1, testament: 'nt' },
     { key: '3John', slug: '3john', nameAr: '٣ يوحنا', maxChapters: 1, testament: 'nt' },
     { key: 'Jude', slug: 'jude', nameAr: 'يهوذا', maxChapters: 1, testament: 'nt' },
     { key: 'Revelation', slug: 'revelation', nameAr: 'رؤيا يوحنا', maxChapters: 22, testament: 'nt' },
   
   // ===== Old Testament (canonical + Deuterocanon) =====
 { key: 'Genesis', slug: 'genesis', nameAr: 'التكوين', maxChapters: 50, testament: 'ot' },
 { key: 'Exodus', slug: 'exodus', nameAr: 'الخروج', maxChapters: 40, testament: 'ot' },
 { key: 'Leviticus', slug: 'leviticus', nameAr: 'اللاويين', maxChapters: 27, testament: 'ot' },
 { key: 'Numbers', slug: 'numbers', nameAr: 'العدد', maxChapters: 36, testament: 'ot' },
 { key: 'Deuteronomy', slug: 'deuteronomy', nameAr: 'التثنية', maxChapters: 34, testament: 'ot' },
 { key: 'Joshua', slug: 'joshua', nameAr: 'يشوع', maxChapters: 24, testament: 'ot' },
 { key: 'Judges', slug: 'judges', nameAr: 'القضاة', maxChapters: 21, testament: 'ot' },
 { key: 'Ruth', slug: 'ruth', nameAr: 'راعوث', maxChapters: 4, testament: 'ot' },
 { key: '1Samuel', slug: '1samuel', nameAr: '١ صموئيل', maxChapters: 31, testament: 'ot' },
 { key: '2Samuel', slug: '2samuel', nameAr: '٢ صموئيل', maxChapters: 24, testament: 'ot' },
 { key: '1Kings', slug: '1kings', nameAr: '١ ملوك', maxChapters: 22, testament: 'ot' },
 { key: '2Kings', slug: '2kings', nameAr: '٢ ملوك', maxChapters: 25, testament: 'ot' },
 
 { key: '1Chronicles', slug: '1chronicles', nameAr: '١ أخبار', maxChapters: 29, testament: 'ot' },
 { key: '2Chronicles', slug: '2chronicles', nameAr: '٢ أخبار', maxChapters: 36, testament: 'ot' },
 { key: 'PrayerOfManasseh', slug: 'prayerofmanasseh', nameAr: 'صلاة منسّى', maxChapters: 1, testament: 'ot' },
 
 { key: 'Ezra', slug: 'ezra', nameAr: 'عزرا', maxChapters: 10, testament: 'ot' },
 { key: 'Nehemiah', slug: 'nehemiah', nameAr: 'نحميا', maxChapters: 13, testament: 'ot' },
 
 // ===== Deuterocanonical – Historical =====
 { key: 'Tobit', slug: 'tobit', nameAr: 'طوبيا', maxChapters: 14, testament: 'ot' },
 { key: 'Judith', slug: 'judith', nameAr: 'يهوديت', maxChapters: 16, testament: 'ot' },
 { key: 'Esther', slug: 'esther', nameAr: 'أستير', maxChapters: 10, testament: 'ot' },
 
 // ===== Poetic / Wisdom =====
 { key: 'Job', slug: 'job', nameAr: 'أيوب', maxChapters: 42, testament: 'ot' },
 { key: 'Psalms', slug: 'psalms', nameAr: 'المزامير', maxChapters: 150, testament: 'ot' },
 { key: 'Proverbs', slug: 'proverbs', nameAr: 'الأمثال', maxChapters: 31, testament: 'ot' },
 { key: 'Ecclesiastes', slug: 'ecclesiastes', nameAr: 'الجامعة', maxChapters: 12, testament: 'ot' },
 { key: 'SongOfSolomon', slug: 'songofsolomon', nameAr: 'نشيد الأنشاد', maxChapters: 8, testament: 'ot' },
 { key: 'Wisdom', slug: 'wisdom', nameAr: 'الحكمة', maxChapters: 19, testament: 'ot' },
 { key: 'Sirach', slug: 'sirach', nameAr: 'يشوع بن سيراخ', maxChapters: 51, testament: 'ot' },
 
 // ===== Major Prophets =====
 { key: 'Isaiah', slug: 'isaiah', nameAr: 'إشعياء', maxChapters: 66, testament: 'ot' },
 { key: 'Jeremiah', slug: 'jeremiah', nameAr: 'إرميا', maxChapters: 52, testament: 'ot' },
 { key: 'Lamentations', slug: 'lamentations', nameAr: 'مراثي إرميا', maxChapters: 5, testament: 'ot' },
 { key: 'Baruch', slug: 'baruch', nameAr: 'باروخ', maxChapters: 6, testament: 'ot' },
 { key: 'Ezekiel', slug: 'ezekiel', nameAr: 'حزقيال', maxChapters: 48, testament: 'ot' },
 { key: 'Daniel', slug: 'daniel', nameAr: 'دانيال', maxChapters: 14, testament: 'ot' },
 
 // ===== Minor Prophets =====
 { key: 'Hosea', slug: 'hosea', nameAr: 'هوشع', maxChapters: 14, testament: 'ot' },
 { key: 'Joel', slug: 'joel', nameAr: 'يوئيل', maxChapters: 3, testament: 'ot' },
 { key: 'Amos', slug: 'amos', nameAr: 'عاموس', maxChapters: 9, testament: 'ot' },
 { key: 'Obadiah', slug: 'obadiah', nameAr: 'عوبديا', maxChapters: 1, testament: 'ot' },
 { key: 'Jonah', slug: 'jonah', nameAr: 'يونان', maxChapters: 4, testament: 'ot' },
 { key: 'Micah', slug: 'micah', nameAr: 'ميخا', maxChapters: 7, testament: 'ot' },
 { key: 'Nahum', slug: 'nahum', nameAr: 'ناحوم', maxChapters: 3, testament: 'ot' },
 { key: 'Habakkuk', slug: 'habakkuk', nameAr: 'حبقوق', maxChapters: 3, testament: 'ot' },
 { key: 'Zephaniah', slug: 'zephaniah', nameAr: 'صفنيا', maxChapters: 3, testament: 'ot' },
 { key: 'Haggai', slug: 'haggai', nameAr: 'حجي', maxChapters: 2, testament: 'ot' },
 { key: 'Zechariah', slug: 'zechariah', nameAr: 'زكريا', maxChapters: 14, testament: 'ot' },
 { key: 'Malachi', slug: 'malachi', nameAr: 'ملاخي', maxChapters: 4, testament: 'ot' },
 { key: '1Maccabees', slug: '1maccabees', nameAr: '١ مكابيين', maxChapters: 16, testament: 'ot' },
 { key: '2Maccabees', slug: '2maccabees', nameAr: '٢ مكابيين', maxChapters: 15, testament: 'ot' },
 
]