import { describe, expect, it } from 'vitest';

import { getEditorRootsValues } from './get-editor-roots-values';

describe('getEditorRootsValues', () => {
  it('should return values for all regular roots', () => {
    const editor = {
      model: {
        document: {
          getRoots: () => [
            { rootName: 'main' },
            { rootName: 'header' },
          ],
        },
      },
      getData: ({ rootName }: { rootName: string; }) => ({
        main: '<p>Main</p>',
        header: '<p>Header</p>',
      }[rootName]),
    };

    expect(getEditorRootsValues(editor as any)).toEqual({
      main: '<p>Main</p>',
      header: '<p>Header</p>',
    });
  });

  it('should skip the graveyard root', () => {
    const editor = {
      model: {
        document: {
          getRoots: () => [
            { rootName: 'main' },
            { rootName: '$graveyard' },
          ],
        },
      },
      getData: ({ rootName }: { rootName: string; }) => ({
        main: '<p>Main</p>',
        $graveyard: '<p>Should not be included</p>',
      }[rootName]),
    };

    expect(getEditorRootsValues(editor as any)).toEqual({
      main: '<p>Main</p>',
    });
  });
});
