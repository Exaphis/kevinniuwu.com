# Newsreader web fonts

Source: [Google Fonts Newsreader v26](https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap), designed by [Production Type](https://github.com/productiontype/Newsreader). The accompanying OFL.txt applies to these derived files.

The site uses weights 400 and 700. The Latin and Latin Extended subsets, in upright and italic styles, are instantiated at those weights, retaining the complete variable optical-size axis (6–72). Only upright Latin 400 is preloaded; browsers request the other weights/styles/subsets when needed.

Generated with fontTools 4.68.0 and Brotli 1.2.1. To regenerate, retrieve the upstream Latin and Latin Extended WOFF2 subsets from that CSS using a modern browser user agent, then run this for each subset/style and weight (400 and 700):

```sh
uv run --with fonttools==4.68.0 --with brotli==1.2.1 fonttools varLib.instancer original-latin-normal.woff2 wght=400 --output=newsreader-latin-normal-400.woff2
```

Keep the Unicode ranges in src/styles/fonts.css aligned with the upstream subsets. Preserve optical sizing; do not pin the opsz axis. [fontTools instancing documentation](https://fonttools.readthedocs.io/en/latest/varLib/instancer.html).
