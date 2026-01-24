# Download Inter Font Files

To complete the self-hosted font setup, download the Inter font files:

## Option 1: Download from Google Fonts (Recommended)

1. Visit: https://fonts.google.com/specimen/Inter
2. Click "Download family"
3. Extract the ZIP file
4. Copy these files to `public/fonts/`:
   - `Inter-Regular.ttf` (or `.woff2` if available)
   - `Inter-Medium.ttf`
   - `Inter-SemiBold.ttf`
   - `Inter-Bold.ttf`

## Option 2: Use fontsource (npm package)

```bash
npm install @fontsource/inter
```

Then import in your layout:

```typescript
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
```

## Option 3: Download from GitHub

```bash
# Clone the Inter font repository
git clone https://github.com/rsms/inter.git temp-inter
# Copy font files
cp temp-inter/docs/font-files/Inter-Regular.woff2 public/fonts/
cp temp-inter/docs/font-files/Inter-Medium.woff2 public/fonts/
cp temp-inter/docs/font-files/Inter-SemiBold.woff2 public/fonts/
cp temp-inter/docs/font-files/Inter-Bold.woff2 public/fonts/
# Clean up
rm -rf temp-inter
```

## Convert TTF to WOFF2 (if needed)

If you only have `.ttf` files, convert them to `.woff2` for better performance:

**Online Tool:** https://cloudconvert.com/ttf-to-woff2

**Or use command line:**

```bash
npm install -g ttf2woff2
ttf2woff2 public/fonts/Inter-Regular.ttf public/fonts/Inter-Regular.woff2
```

## After downloading fonts:

Update `src/app/layout.tsx` to use the local font configuration.
