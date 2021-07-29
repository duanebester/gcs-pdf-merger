import * as chai from "chai";
import * as sinon from "sinon";

import fse from "fs-extra";
import PDFMerger from "pdf-merger-js";
import { Bucket, File } from "@google-cloud/storage";
import { merge, testables } from "./gcs-pdf-merger";

const expect = chai.expect;
describe("GCS PDF Merger", () => {
  sinon.stub(fse, "emptyDir").resolves();

  const mergerStub = sinon.createStubInstance(PDFMerger);
  mergerStub.add.returns(undefined);
  mergerStub.save.resolves(undefined);

  const fileStub = sinon.createStubInstance(File);
  fileStub.download.resolves([]);

  const bucketStub = sinon.createStubInstance(Bucket);
  bucketStub.file.returns(fileStub as unknown as File);
  bucketStub.upload.resolves();
  bucketStub.getFiles.resolves([
    [{ name: "A.pdf" }, { name: "B.pdf" }, { name: "C.pdf" }],
    {},
    null,
  ]);

  describe("merge", () => {
    it("should be able to merge files", async () => {
      expect(async () => {
        await merge(bucketStub, ["A.pdf", "B.pdf"], "merge.pdf");
      }).to.not.throw;
    });
  });

  describe("downloadFilesFromBucket", () => {
    it("should be able to downloadFilesFromBucket", async () => {
      expect(async () => {
        await testables.downloadFilesFromBucket(["A.pdf", "B.pdf"], bucketStub);
      }).to.not.throw;
    });
  });

  describe("uploadMerged", () => {
    it("should be able to uploadMerged", async () => {
      expect(async () => {
        await testables.uploadMerged("merged.pdf", bucketStub);
      }).to.not.throw;
    });
  });

  describe("mergeFiles", () => {
    it("should be able to mergeFiles", async () => {
      expect(async () => {
        await testables.mergeFiles(["A.pdf", "B.pdf"], "merged.pdf");
      }).to.not.throw;
    });
  });

  describe("getMatchingFiles", () => {
    it("should be able to handle no files", async () => {
      const resp = await testables.getMatchingFiles([], "test.pdf", bucketStub);
      expect(resp.length).to.equal(0);
    });

    it("should throw on output being same as input", async () => {
      expect(async () => {
        await testables.getMatchingFiles(["test.pdf"], "test.pdf", bucketStub);
      }).throws;
    });

    it("should be able to handle 1 file", async () => {
      const resp = await testables.getMatchingFiles(
        ["A.pdf"],
        "test.pdf",
        bucketStub
      );
      expect(resp[0]).to.equal("A.pdf");
    });

    it("should be able to handle 1 non-matching file", async () => {
      const resp = await testables.getMatchingFiles(
        ["X.pdf"],
        "test.pdf",
        bucketStub
      );
      expect(resp.length).to.equal(0);
    });
  });
});
