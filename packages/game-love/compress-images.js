
import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';
import imageminMozjpeg from 'imagemin-mozjpeg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageName = process.argv[2];

const locale = process.argv[3]; // Locale as the second argument

if (!packageName) {
	console.error('Please provide the package name as an argument!');
	process.exit(1);
}

if (!locale) {
	console.error('Please provide the locale as a second argument!');
	process.exit(1);
}

const inputDir = path.join(
	__dirname,
	`./assets/images/common/afterload{m}`
);
const outputDir = path.join(
	__dirname,
	`./assets/images/common/preload{m}`
);
const moveToDir = path.join(__dirname, `./raw-assets`);
const localeSrcDir = path.join(
	__dirname,
	`./assets/images/locales{m}/${locale}`
);

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(moveToDir)) {
	fs.mkdirSync(moveToDir, { recursive: true });
}

// Helper function to recursively process images in directories and add 'low-' prefix
async function processDirectory(
	currentDir,
	relativePath = '',
	isTopLevel = true
) {
	const entries = fs.readdirSync(currentDir, { withFileTypes: true });

	for (const entry of entries) {
		// Ignore hidden files like .DS_Store
		if (entry.name.startsWith('.')) {
			continue;
		}

		const fullPath = path.join(currentDir, entry.name);

		// Add 'low-' prefix to all files and directories
		const prefix = 'low-';
		const outputDirPath = path.join(outputDir, relativePath);

		if (!fs.existsSync(outputDirPath)) {
			fs.mkdirSync(outputDirPath, { recursive: true });
		}

		const outputFileName = `${prefix}${entry.name}`;
		const outputPath = path.join(outputDirPath, outputFileName);

		if (entry.isDirectory()) {
			// Recursively process subdirectories, applying the prefix
			await processDirectory(
				fullPath,
				path.join(relativePath, outputFileName),
				false
			);
		} else if (
			entry.isFile() &&
			(entry.name.endsWith('.png') ||
				entry.name.endsWith('.jpg') ||
				entry.name.endsWith('.jpeg'))
		) {
			try {
				const compressedBuffer = await imagemin.buffer(
					fs.readFileSync(fullPath),
					{
						plugins: [
							imageminPngquant({ quality: [0.1, 0.2] }),
							imageminMozjpeg({ quality: 30 }),
						],
					}
				);

				fs.writeFileSync(outputPath, compressedBuffer);
				console.log(
					`Compressed, renamed with prefix, and saved: ${entry.name} -> ${outputPath}`
				);
			} catch (err) {
				console.log(`Failed to process ${entry.name}:`, err);
			}
		}
	}
}

// Step 1: Compress images from 'afterload{m}', add 'low-' prefix, and place them into 'preload{m}'
async function compressAndMoveImages() {
	console.log(`Processing directory: ${inputDir}`);

	await processDirectory(inputDir);
	console.log(
		'All images from afterload{m} have been prefixed with "low-" and moved to preload{m}!'
	);
}

// Step 2: Copy 'assets' folder files to 'raw-assets' but ignore 'locales'
function copyCommonFiles() {
	console.log('🐯🐯🐯 Copying common assets, ignoring locales 🐯🐯🐯');
	const originDir = path.join(__dirname, `./assets/`);
	const rawDir = path.join(moveToDir, '');

	// Log the source and destination paths
	console.log(`Copying from: ${originDir} to ${rawDir}`);

	try {
		// Recursively copy everything from 'common' to 'raw-assets', ignoring 'locales'
		fs.cpSync(originDir, rawDir, {
			recursive: true,
			filter: (src) => {
				const relativePath = path.relative(originDir, src);
				return !relativePath.startsWith('locales'); // Ignore 'locales' folder
			},
		});
		console.log(
			'Common assets copied to raw-assets, locales folder ignored!'
		);
	} catch (err) {
		console.log(`Failed to copy files from ${originDir} to ${rawDir}:`, err);
	}
}

// Step 3: Copy locale-specific files into 'raw-assets/images/common/locales{m}' directly, without subfolders
function copyLocaleFiles() {
	// We need to change this to be more direct - IMPORTANT change here
	const destinationDir = path.join(moveToDir, 'images', 'locales{m}');

	// Log paths to verify
	console.log('Destination directory:', destinationDir);

	// Create destination directory without language subfolders
	fs.mkdirSync(destinationDir, { recursive: true });

	// Source directory for the specific locale
	const sourceLocalePath = localeSrcDir;
	console.log('Source directory:', sourceLocalePath);

	// Copy files DIRECTLY to locales{m}
	try {
		// Delete any existing language folders first
		if (fs.existsSync(destinationDir)) {
			fs.readdirSync(destinationDir, { withFileTypes: true })
				.filter((entry) => entry.isDirectory())
				.forEach((dir) => {
					fs.rmSync(path.join(destinationDir, dir.name), {
						recursive: true,
					});
				});
		}

		// Now copy files
		fs.readdirSync(sourceLocalePath, { withFileTypes: true })
			.filter((entry) => entry.isFile())
			.forEach((file) => {
				const sourcePath = path.join(sourceLocalePath, file.name);
				const destPath = path.join(destinationDir, file.name);
				fs.copyFileSync(sourcePath, destPath);
				console.log(`Copied ${file.name} to ${destPath}`);
			});
	} catch (err) {
		console.error('Error:', err);
	}
}

// Main process
async function main() {
	// Step 1: Compress afterload{m} images, rename them with 'low-', and move to preload{m}
	await compressAndMoveImages();
	// Step 2: Copy all 'common' folder contents to 'raw-assets/common'
	copyCommonFiles();
	// Step 3: Copy locale-specific files to 'raw-assets/locales{m}'
	copyLocaleFiles();
}

main();
