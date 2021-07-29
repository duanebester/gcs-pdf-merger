const fs = require("fs-extra");
const path = require("path");
const PDFMerger = require("pdf-merger-js");
const { Storage } = require("@google-cloud/storage");

const TEMP_PDF_DIR: string = process.env.TEMP_PDF_DIR || "/tmp/gcs-pdfs";

async function downloadFilesFromBucket(fileNames: string[], bucket: any) {
  try {
    /**
     * Deletes directory contents if the directory is not empty.
     * If the directory does not exist, it is created.
     * The directory itself is not deleted.
     */
    await fs.emptyDir(TEMP_PDF_DIR);

    // Download all the files...
    await Promise.all(
      fileNames.map(async (fileName) => {
        await bucket.file(fileName).download({
          destination: path.join(TEMP_PDF_DIR, fileName),
        });
      })
    );
  } catch (err) {
    // console.error(err);
    throw err;
  }
}

async function mergeFiles(fileNames: string[], outputFileName: string) {
  try {
    const merger = new PDFMerger();
    fileNames.forEach((fileName) =>
      merger.add(path.join(TEMP_PDF_DIR, fileName))
    );
    await merger.save(path.join(TEMP_PDF_DIR, outputFileName));
  } catch (err) {
    // console.error(err);
    throw err;
  }
}

async function getMatchingFiles(
  fileNames: string[],
  outputFile: string,
  bucket: any
): Promise<string[]> {
  const [files] = await bucket.getFiles();
  const existingNames: string[] = files.map((file) => file.name);
  const matchingNames: string[] = existingNames.filter((name) =>
    fileNames.find((n) => n === name)
  );
  if (matchingNames.find((x) => x === outputFile)) {
    throw new Error(`Cannot have duplicate files: ${outputFile}`);
  }
  return matchingNames;
}

async function uploadMerged(fileName: string, bucket: any) {
  try {
    await bucket.upload(path.join(TEMP_PDF_DIR, fileName), {
      destination: fileName,
    });
  } catch (err) {
    // console.error(err);
    throw err;
  }
}

export async function merge(
  bucketName: string,
  pdfs: string[],
  outputPdf: string
) {
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  try {
    const fileNames = await getMatchingFiles(pdfs, outputPdf, bucket);
    // console.log(`Matching files from bucket: ${fileNames}`);
    // console.log(`Downloading files from bucket ${bucketName}...`);
    await downloadFilesFromBucket(fileNames, bucket);
    // console.log(`Merging files to ${outputPdf}...`);
    await mergeFiles(fileNames, outputPdf);
    // console.log(`Merged files to ${outputPdf}!`);
    await uploadMerged(outputPdf, bucket);
    // console.log("Cleaning up temp directory...");
    await fs.emptyDir(TEMP_PDF_DIR);
    // console.log("Finished Merge");
  } catch (err) {
    // console.error(err);
    throw err;
  }
}
