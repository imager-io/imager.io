---
layout: index.liquid
---

# About

Imager is a tool for automated image compression, and can competitively optimize very noisy, high resolution images into rather “tiny” files.

It's pretty easy too.

### Using the CLI interface

Basic:
```shell
$ imager -i input/image.jpeg -o output/image.jpeg -f jpeg
```

Offering JPEG/WebP variants:
```shell
$ imager -i input/image.jpeg -O output/dir/ -f jpeg webp
```

### Using the JavaScript non-blocking API

```javascript
const {ImageBuffer} = require("imager-io");
ImageBuffer
	.open("source-image.jpeg")
	.then(buffer => buffer.opt())
	.then(buffer => buffer.save("result.jpeg"))
	.then(() => console.log("done"));
```


# [Image Compression Benchmarks<i style="font-size: 18px; margin-left: 3px;" class="fas fa-external-link-alt"></i>](https://github.com/colbyn/imager-bench-2019-11-2)

```text
source        : ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ 39.00M (4 images)
kraken.io     : ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ 24M
jpegmini.com  : ▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇▇ 16M
compression.ai: ▇▇▇▇▇▇▇▇ 8.90M
imager        : ▇▇▇▇ 4.20M
```


# Articles

* [Modern Image Optimization for 2020 - Issues, Solutions, and Open Source Solutions](https://medium.com/@colbyn/modern-image-optimization-for-2020-issues-solutions-and-open-source-solutions-543af00e3e51)
