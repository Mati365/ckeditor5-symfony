import { Translations } from 'ckeditor5';
/**
 * Loads all required translations for the editor based on the language configuration.
 *
 * @param language - The language configuration object containing UI and content language codes.
 * @param language.ui - The UI language code.
 * @param language.content - The content language code.
 * @param hasPremium - Whether premium features are enabled and premium translations should be loaded.
 * @returns A promise that resolves to an array of loaded translation objects.
 */
export declare function loadAllEditorTranslations(language: {
    ui: string;
    content: string;
}, hasPremium: boolean): Promise<Translations[]>;
//# sourceMappingURL=load-editor-translations.d.ts.map