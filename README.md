# Google Storage PDF Merger

Want a small node.js library to easily merge PDFs within a Google Storage Bucket?

> Requires Node 8+

[![NPM](https://nodei.co/npm/gcs-pdf-merger.png)](https://nodei.co/npm/gcs-pdf-merger/)

```js
const { Storage } = require("@google-cloud/storage");
const { merge } = require("gcs-pdf-merger");

const storage = new Storage();
const bucket = storage.bucket("bucket-name");

(async () => {
  await merge(bucket, ["A.pdf", "B.pdf", "C.pdf"], "ABC.pdf");
})().catch((err) => {
  console.error(err);
});
```

Creates the temp pdf directory at `/tmp/gcs-pdfs` but this can be overidden with:
```.env
TEMP_PDF_DIR=/some/path/here
```
