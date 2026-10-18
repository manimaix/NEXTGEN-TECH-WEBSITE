param([string]$ManifestPath = (Join-Path $PSScriptRoot 'generation-manifest.json'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$mockupManifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
$mockupNativeDir = Join-Path $PSScriptRoot 'native'
New-Item -ItemType Directory -Path $mockupNativeDir -Force | Out-Null
$mockupReport = @()
foreach ($mockupEntry in $mockupManifest.pages) {
  $mockupNative = Join-Path $mockupNativeDir ($mockupEntry.id + '.png')
  if (-not (Test-Path -LiteralPath $mockupNative)) {
    Copy-Item -LiteralPath $mockupEntry.sourcePath -Destination $mockupNative
  }
  $mockupTarget = Join-Path $PSScriptRoot ($mockupEntry.id + '.png')
  if (Test-Path -LiteralPath $mockupTarget) { throw "Output already exists: $mockupTarget" }
  $mockupSource = [System.Drawing.Image]::FromFile($mockupNative)
  try {
    $mockupBitmap = [System.Drawing.Bitmap]::new(1080, 1920)
    $mockupGraphics = [System.Drawing.Graphics]::FromImage($mockupBitmap)
    try {
      $mockupGraphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $mockupGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $mockupGraphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $mockupGraphics.Clear([System.Drawing.Color]::White)
      $mockupAttributes = [System.Drawing.Imaging.ImageAttributes]::new()
      try {
        $mockupAttributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
        $mockupRect = [System.Drawing.Rectangle]::new(0, 0, 1080, 1920)
        $mockupGraphics.DrawImage($mockupSource, $mockupRect, 0, 0, $mockupSource.Width, $mockupSource.Height, [System.Drawing.GraphicsUnit]::Pixel, $mockupAttributes)
        $mockupBitmap.Save($mockupTarget, [System.Drawing.Imaging.ImageFormat]::Png)
      } finally { $mockupAttributes.Dispose() }
    } finally { $mockupGraphics.Dispose(); $mockupBitmap.Dispose() }
    $mockupCheck = [System.Drawing.Image]::FromFile($mockupTarget)
    try {
      if ($mockupCheck.Width -ne 1080 -or $mockupCheck.Height -ne 1920) { throw 'Export dimensions do not match.' }
      $mockupReport += [pscustomobject]@{
        File = $mockupEntry.id + '.png'
        SourceWidth = $mockupSource.Width
        SourceHeight = $mockupSource.Height
        Width = $mockupCheck.Width
        Height = $mockupCheck.Height
        Bytes = (Get-Item -LiteralPath $mockupTarget).Length
      }
    } finally { $mockupCheck.Dispose() }
  } finally { $mockupSource.Dispose() }
}
$mockupReport | ConvertTo-Json -Depth 4
