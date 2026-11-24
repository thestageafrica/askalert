# Auth story images

The sign-in slideshow uses branded gradient fallbacks until real photos are added.

## Rules

- Use photos AskAlert owns or licenses for commercial use.
- No recognisable people without a release.
- No third-party brand logos.

## Suggested subjects

1. Lekki waterfront at dusk  
2. Bright shortlet living room  
3. Event table setup  
4. Driver opening a car door  
5. Caterer or photographer at work  

## Specs

- Desktop WebP: about 1600×1000, under 150 KB  
- Mobile WebP: about 900×1200, under 80 KB  
- Serve with `<picture>`; preload only the first slide  

Place files under `apps/web/public/auth/` and set `imageSrc` on slides in `src/lib/auth/story-slides.ts`.
