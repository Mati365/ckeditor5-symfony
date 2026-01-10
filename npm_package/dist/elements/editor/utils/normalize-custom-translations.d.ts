import { Translations } from 'ckeditor5';
import { EditorCustomTranslationsDictionary } from '../typings';
/**
 * This function takes a custom translations object and maps it to the format expected by CKEditor5.
 * Each translation dictionary is wrapped in an object with a `dictionary` key.
 *
 * @param translations - The custom translations to normalize.
 * @returns A normalized translations object suitable for CKEditor5.
 */
export declare function normalizeCustomTranslations(translations: EditorCustomTranslationsDictionary): Translations;
//# sourceMappingURL=normalize-custom-translations.d.ts.map