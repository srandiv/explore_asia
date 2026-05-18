import type { ImageMetadata } from "astro";

const localImages = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/images/**/*.{avif,gif,jpeg,jpg,png,svg,webp}",
  { eager: true },
);

export function resolveContentImage(image: string) {
  if (/^(https?:)?\/\//.test(image)) {
    return image;
  }

  const normalizedImage = image.startsWith("/")
    ? image
    : image.startsWith("src/")
      ? `/${image}`
      : image;

  return localImages[normalizedImage]?.default.src ?? image;
}
