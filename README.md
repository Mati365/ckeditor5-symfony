# ckeditor5-symfony

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-green.svg?style=flat-square)](http://makeapullrequest.com)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/mati365/ckeditor5-symfony?style=flat-square)
[![GitHub issues](https://img.shields.io/github/issues/mati365/ckeditor5-symfony?style=flat-square)](https://github.com/Mati365/ckeditor5-symfony/issues)
[![PHP Coverage](https://img.shields.io/badge/PHP-100%25-brightgreen?logo=php&logoColor=white&style=flat-square)](https://app.codecov.io/gh/Mati365/ckeditor5-symfony/tree/main/src)

CKEditor 5 for Symfony >=6.4.x — a lightweight WYSIWYG editor integration for Symfony. Easy to set up, it supports custom builds, dynamic loading, and localization. The package includes JavaScript and CSS assets, making it simple to integrate CKEditor 5 into your Symfony applications.

> [!IMPORTANT]
> This integration is unofficial and not maintained by CKSource. For official CKEditor 5 documentation, visit [ckeditor.com](https://ckeditor.com/docs/ckeditor5/latest/). If you encounter any issues in editor, please report them on the [GitHub repository](https://github.com/ckeditor/ckeditor5/issues).

<p align="center">
  <img src="docs/intro-classic-editor.png" alt="CKEditor 5 Classic Editor in Symfony (PHP) application">
</p>

## Under construction 🚧

This package is currently under active development. It'll be ready for production use soon. Stay tuned!

## Installation 🚀

Install the package via Composer:

```bash
composer require mati365/ckeditor5-symfony
```

Then, configure the Assets Mapper, templates and CSS files by running the command:

```bash
php bin/console ckeditor5:assets-mapper:install # --distribution=cloud
```

Voila! CKEditor 5 is now ready to use in your Symfony application.

## Development ⚙️

To start the development environment, run:

```bash
pnpm run dev
```

The playground app will be available at [http://localhost:8000](http://localhost:8000).

### Running Tests 🧪

The project includes comprehensive PHP unit tests with 100% code coverage requirement:

```bash
# Run all tests
composer test

# Run tests with coverage report (requires pcov)
composer test:coverage
```

## Psst... 👀

If you're looking for similar stuff, check these out:

- [ckeditor5-livewire](https://github.com/Mati365/ckeditor5-livewire)
  Effortless CKEditor 5 integration for Laravel Livewire. Supports dynamic content, localization, and custom builds with minimal setup.

- [ckeditor5-phoenix](https://github.com/Mati365/ckeditor5-phoenix)
  Seamless CKEditor 5 integration for Phoenix Framework. Plug & play support for LiveView forms with dynamic content, localization, and custom builds.

- [ckeditor5-rails](https://github.com/Mati365/ckeditor5-rails)
  Smooth CKEditor 5 integration for Ruby on Rails. Works with standard forms, Turbo, and Hotwire. Easy setup, custom builds, and localization support.

## Trademarks 📜

CKEditor® is a trademark of [CKSource Holding sp. z o.o.](https://cksource.com/) All rights reserved. For more information about the license of CKEditor® please visit [CKEditor's licensing page](https://ckeditor.com/legal/ckeditor-oss-license/).

This package is not owned by CKSource and does not use the CKEditor® trademark for commercial purposes. It should not be associated with or considered an official CKSource product.

## License 📜

This project is licensed under the terms of the [MIT LICENSE](LICENSE).
