# Google Storage PDF Merger

Want a small library to easily merge PDFs within a Google Storage Bucket?

> Requires Node 8 or newer

[![NPM](https://nodei.co/npm/gcs-pdf-merger.png)](https://nodei.co/npm/gcs-pdf-merger/)

```js
const { merge } = require("gcs-pdf-merger");

(async () => {
    "bucket-name",
    [
      "A.pdf",
      "B.pdf",
      "C.pdf",
    ],
    "merged.pdf"
  );
})().catch((err) => {
  console.error(err);
});
```