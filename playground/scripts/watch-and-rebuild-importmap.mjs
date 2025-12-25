import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_PATH = path.join(__dirname, '../../npm_package/dist');
const TARGET_PATH = path.join(__dirname, '../public/assets');

console.log(`Watching for changes in: ${DIST_PATH}...`);

// Watch the dist folder for changes.
fs.watch(DIST_PATH, { recursive: true }, debounce((_, filename) => {
  if (!filename) {
    return;
  }

  console.log(`Change detected: ${filename}. Processing...`);
  recompileProject();
}, 500));

// Let's do an initial compilation with some delay to let other watchers start properly.
setTimeout(recompileProject, 500);

/**
 * Re-compiles the playground project by removing the old build folder and
 * running the asset-map:compile command.
 */
function recompileProject() {
  try {
    if (fs.existsSync(TARGET_PATH)) {
      fs.rmSync(TARGET_PATH, { recursive: true, force: true });
      console.log('Removed old build folder.');
    }

    console.log('Compiling assets...');

    execSync('php ./bin/console asset-map:compile', {
      cwd: path.join(__dirname, '../'),
      stdio: 'inherit',
    });

    console.log('Done! Waiting for further changes...');
  }
  catch (error) {
    console.error('An error occurred during the operation:', error.message);
  }
}

/**
 * Creates a debounced version of the given callback.
 */
function debounce(callback, delay) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
}
