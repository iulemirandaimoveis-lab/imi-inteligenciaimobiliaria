'use client'

import * as React from 'react'

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { size?: number }
>(({ className = '', size, style, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative flex shrink-0 overflow-hidden rounded-full ${className}`}
    style={{
      width: size,
      height: size,
      ...(style ?? {}),
    }}
    {...props}
  />
))
Avatar.displayName = 'Avatar'

function AvatarImage({
  src,
  alt = '',
  className = '',
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [err, setErr] = React.useState(false)
  if (!src || err) return null
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErr(true)}
      className={`aspect-square h-full w-full object-cover ${className}`}
      {...props}
    />
  )
}

function AvatarFallback({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`absolute inset-0 flex h-full w-full items-center justify-center rounded-full ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
