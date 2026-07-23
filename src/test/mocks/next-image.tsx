import type { ImgHTMLAttributes } from 'react';

/**
 * Shared next/image mock for unit tests.
 * Strips next-only props so React does not warn on <img>.
 * Sets data-fill when fill is used (layout tests).
 */
export default function MockNextImage({
  src,
  alt,
  fill,
  priority: _priority,
  sizes: _sizes,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  loader: _loader,
  quality: _quality,
  unoptimized: _unoptimized,
  onLoadingComplete: _onLoadingComplete,
  loading,
  width,
  height,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  placeholder?: string;
  blurDataURL?: string;
  loader?: unknown;
  quality?: number;
  unoptimized?: boolean;
  onLoadingComplete?: unknown;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={String(src ?? '')}
      alt={alt ?? ''}
      data-fill={fill ? 'true' : undefined}
      loading={loading}
      width={width}
      height={height}
      {...props}
    />
  );
}
