# Regenerates PWA icons from the approved brand asset.
# Source: apps/web/public/brand/AskAlert-New-Icon.png

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$srcPath = Join-Path $root 'public/brand/AskAlert-New-Icon.png'
$outDir = Join-Path $root 'public/icons'

if (-not (Test-Path $srcPath)) {
  throw "Missing approved icon: $srcPath"
}

$src = [System.Drawing.Image]::FromFile($srcPath)

function Save-Resized([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(255, 15, 21, 69))
  $g.DrawImage($src, 0, 0, $size, $size)
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

function Save-Maskable([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(255, 15, 21, 69))
  $pad = [int]($size * 0.1)
  $inner = $size - (2 * $pad)
  $g.DrawImage($src, $pad, $pad, $inner, $inner)
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
Save-Resized 192 (Join-Path $outDir 'icon-192.png')
Save-Resized 512 (Join-Path $outDir 'icon-512.png')
Save-Maskable 512 (Join-Path $outDir 'icon-maskable-512.png')

# Next.js metadata icons
Copy-Item -Force $srcPath (Join-Path $root 'src/app/icon.png')
Copy-Item -Force $srcPath (Join-Path $root 'src/app/apple-icon.png')

$src.Dispose()
Write-Output "Wrote PWA icons from $srcPath"
