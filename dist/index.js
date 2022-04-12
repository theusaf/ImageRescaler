import Canvas from "canvas";
import sizeOf from "image-size";
import fs from "fs/promises";
import path from "path";
const cwd = process.cwd(), args = process.argv.slice(2), [filename, output, inputWidth, inputHeight] = args, { createCanvas, loadImage } = Canvas, TARGET_RATIO = calculateRatio(+inputWidth || 6, +inputHeight || 4);
if (args.length < 1) {
    console.log("Usage: node index.js <file/folder> <output folder> [width] [height]");
    process.exit(1);
}
/**
 * Calculates a ratio between two numbers.
 *
 * @param a
 * @param b
 * @returns The ratio of a to b
 */
function calculateRatio(a, b) {
    return a / b;
}
function getImage(fileName) {
    return fs.readFile(fileName);
}
async function resizeImage(image, fileName, outputFile) {
    const { width, height } = sizeOf(image), ratioWidthHeight = calculateRatio(width, height), ratioHeightWidth = calculateRatio(height, width), canvasImage = await loadImage(image), ratioCompareWidthHeight = ratioWidthHeight / TARGET_RATIO, ratioCompareHeightWidth = ratioHeightWidth / TARGET_RATIO, changeRequiredHeight = ratioCompareWidthHeight * height - height, changeRequiredWidth = ratioCompareHeightWidth * width - width;
    let finalWidth = width, finalHeight = height;
    if (changeRequiredWidth >= 0 && (changeRequiredWidth <= changeRequiredHeight || changeRequiredHeight <= 0)) {
        finalWidth = width + changeRequiredWidth;
    }
    else if (changeRequiredHeight >= 0 && (changeRequiredHeight <= changeRequiredWidth || changeRequiredWidth <= 0)) {
        finalHeight = height + changeRequiredHeight;
    }
    else {
        // both are negative!
        const absoluteChangeRequiredWidth = Math.abs(changeRequiredWidth), absoluteChangeRequiredHeight = Math.abs(changeRequiredHeight);
        if (absoluteChangeRequiredHeight < absoluteChangeRequiredWidth) {
            finalWidth = width + absoluteChangeRequiredHeight * TARGET_RATIO;
        }
        else {
            finalHeight = height + absoluteChangeRequiredWidth * TARGET_RATIO;
        }
    }
    console.log(`Output ratio for ${fileName}: ${calculateRatio(finalWidth, finalHeight).toFixed(2)}/${calculateRatio(finalHeight, finalWidth).toFixed(2)}`);
    const canvas = createCanvas(finalWidth, finalHeight), ctx = canvas.getContext("2d");
    // white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, finalWidth, finalHeight);
    // draw the image on the canvas centered
    ctx.drawImage(canvasImage, (finalWidth - width) / 2, (finalHeight - height) / 2);
    await fs.writeFile(path.resolve(outputFile, path.parse(fileName).name + ".png"), canvas.toBuffer());
}
const inputFile = path.resolve(cwd, filename), outputFile = path.resolve(cwd, output), inputFileStat = await fs.stat(inputFile);
// create output folder if it doesn't exist
await fs.mkdir(outputFile, { recursive: true });
if (inputFileStat.isDirectory()) {
    const files = await fs.readdir(inputFile), images = await Promise.all(files.map(async (file) => {
        const filePath = path.resolve(inputFile, file), fileStat = await fs.stat(filePath);
        if (fileStat.isFile()) {
            return {
                image: await getImage(filePath),
                fileName: file
            };
        }
    }));
    for (const imageData of images) {
        if (!imageData) {
            continue;
        }
        const { image, fileName } = imageData;
        resizeImage(image, fileName, outputFile);
    }
}
else {
    const image = await getImage(inputFile), fileName = path.basename(inputFile);
    resizeImage(image, fileName, outputFile);
}
