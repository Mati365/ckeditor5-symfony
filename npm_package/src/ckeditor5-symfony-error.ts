/**
 * Custom error class for CKEditor5 Symfony-related errors.
 */
export class CKEditor5SymfonyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CKEditor5SymfonyError';
  }
}
