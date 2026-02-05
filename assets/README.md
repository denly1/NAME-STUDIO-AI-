# Assets for NAME STUDIO AI

## Icon Files

To create the application icon from `photo_2024-11-29_14-16-41.jpg`:

1. Use an online converter or tool like ImageMagick to convert the JPG to ICO format
2. Create multiple sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
3. Save as `icon.ico` in this directory

### Quick conversion command (if ImageMagick is installed):
```bash
magick convert ../photo_2024-11-29_14-16-41.jpg -resize 256x256 -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Alternative: Online converter
- Upload `photo_2024-11-29_14-16-41.jpg` to https://convertio.co/jpg-ico/
- Download as `icon.ico`
- Place in this `assets/` folder

## Installer Graphics

For a professional installer, you can also create:
- `installer-header.bmp` (150x57 pixels) - Header image for installer
- `installer-sidebar.bmp` (164x314 pixels) - Sidebar image for installer

These are optional but make the installer look more professional.
