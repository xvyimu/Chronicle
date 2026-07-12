import { IMAGE_BLUR_DATA } from './image-blur-map';

export { IMAGE_BLUR_DATA };

/** Return a precomputed blurDataURL for a known local image path. */
export function blurDataFor(src?: string | null): string | undefined {
  if (!src) return undefined;
  return IMAGE_BLUR_DATA[src];
}

type ImageBlurProps = {
  placeholder?: 'blur';
  blurDataURL?: string;
};

/** next/image blur props for a known local path; empty object when unknown. */
export function imageBlurProps(src?: string | null): ImageBlurProps {
  const blurDataURL = blurDataFor(src);
  if (!blurDataURL) return {};
  return { placeholder: 'blur', blurDataURL };
}
