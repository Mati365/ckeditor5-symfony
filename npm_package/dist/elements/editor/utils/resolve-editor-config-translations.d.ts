import { Translations } from 'ckeditor5';
/**
 * Resolves translation references in a configuration object.
 *
 * The configuration may contain objects with the form `{ $translation: "some.key" }`.
 * These are replaced with the actual string from the provided translations map.
 *
 * The function will walk the provided object recursively, handling arrays and
 * nested objects. Primitive values are returned as-is. If a translation key is
 * not present in the map, a warning is logged and `null` is returned for that
 * value.
 *
 * @param translations - An array of CKEditor `Translations` objects. Each translation
 *                       pack will be searched in order for the requested key, and the
 *                       first matching value will be returned. This mirrors the format
 *                       returned by `loadAllEditorTranslations` and simplifies the
 *                       caller's API.
 * @param language - Language identifier to look up in the packs. Only this locale
 *                   will be consulted, ensuring that keys from other languages are
 *                   ignored even if they appear earlier in the array.
 * @param obj - Configuration object to process
 * @returns Processed configuration object with resolved translations.
 */
export declare function resolveEditorConfigTranslations<T>(translations: Translations[], language: string, obj: T): T;
//# sourceMappingURL=resolve-editor-config-translations.d.ts.map