# PWA icons

Source of truth: `apps/web/public/brand/AskAlert-New-Icon.png`.

| File | Size | Purpose |
| --- | --- | --- |
| `icon-192.png` | 192×192 | Standard install icon |
| `icon-512.png` | 512×512 | High-res install / splash |
| `icon-maskable-512.png` | 512×512 | Android maskable (~10% navy padding) |

Manifest: `apps/web/src/app/manifest.ts` (bump `ICON_VERSION` when swapping artwork).

Regenerate:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File apps/web/scripts/generate-pwa-icons.ps1
```
