import fse from "fs-extra";
import path from "path";
import PDFMerger from "pdf-merger-js";

const TEMP_PDF_DIR: string = process.env.TEMP_PDF_DIR || "/tmp/gcs-pdfs";

async function downloadFilesFromBucket(fileNames: string[], bucket: any) {
  try {
    /**
     * Deletes directory contents if the directory is not empty.
     * If the directory does not exist, it is created.
     * The directory itself is not deleted.
     */
    await fse.emptyDir(TEMP_PDF_DIR);

    // Download all the files...
    await Promise.all(
      fileNames.map(async (fileName) => {
        await bucket.file(fileName).download({
          destination: path.join(TEMP_PDF_DIR, fileName),
        });
      })
    );
  } catch (err) {
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
    throw err;
  }
}

export const testables = {
  getMatchingFiles,
  downloadFilesFromBucket,
  uploadMerged,
  mergeFiles,
};

export async function merge(bucket: any, pdfs: string[], outputPdf: string) {
  try {
    const fileNames = await getMatchingFiles(pdfs, outputPdf, bucket);
    await downloadFilesFromBucket(fileNames, bucket);
    await mergeFiles(fileNames, outputPdf);
    await uploadMerged(outputPdf, bucket);
    await fse.emptyDir(TEMP_PDF_DIR);
  } catch (err) {
    throw err;
  }
}
