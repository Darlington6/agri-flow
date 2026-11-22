# @agriflow/media

Every photo AgriFlow ships, shared by the site (`apps/site`) and the app (`apps/web`).

- `photos/`: the originals. The site's build turns them into responsive AVIF/WebP.
- `src/index.ts`: the register. Each photo records its `source` and `licence`; this repository is public, so
  committing a photo republishes it. `APP_PHOTOS` lists the photos the app uses and how to crop them.
- `app/`: the app's photos as WebP at 640, 1024 and 1600px wide. The app has no image pipeline, so these are
  made ahead of time. After changing `APP_PHOTOS` or `APP_WIDTHS`, run:

  ```sh
  pnpm --filter @agriflow/media app-images
  ```

Tests in `apps/site` (every file registered, licensed and used) and `apps/web` (every sized copy present, none
left over) hold these rules. Photos we can't use yet go in the git-ignored `apps/site/assets/`.
