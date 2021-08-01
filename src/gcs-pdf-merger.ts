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
    for (let i = 0; i < fileNames.length; i++) {
      merger.add(path.join(TEMP_PDF_DIR, fileNames[i]));
    }
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
  const matchingNames: string[] = fileNames.filter((name) =>
    existingNames.find((n) => n === name)
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

function verifyInputs(pdfs: string[], outputPdf: string) {
  if(outputPdf.indexOf('.pdf') === -1) {
    throw new Error("Output file must be a PDF")
  }
  for(let i = 0; i < pdfs.length; i++) {
    if(pdfs[i].indexOf('.pdf') === -1) {
      throw new Error("Can only merge PDF files")
    }
  }
}

export const testables = {
  getMatchingFiles,
  downloadFilesFromBucket,
  uploadMerged,
  mergeFiles,
  verifyInputs
};

/**
 * The merge function that combines PDF files within a Google Storage Bucket.
 * @param bucket The Google Storage Bucket instance. 
 * @param pdfs An array of PDF filenames; fileOne.pdf, fileTwo.pdf
 * @param outputPdf The output file name for the merged PDFs.
 */
export async function merge(bucket: any, pdfs: string[], outputPdf: string) {
  try {
    verifyInputs(pdfs, outputPdf);
    const fileNames = await getMatchingFiles(pdfs, outputPdf, bucket);
    await downloadFilesFromBucket(fileNames, bucket);
    await mergeFiles(fileNames, outputPdf);
    await uploadMerged(outputPdf, bucket);
    await fse.emptyDir(TEMP_PDF_DIR);
  } catch (err) {
    throw err;
  }
}
