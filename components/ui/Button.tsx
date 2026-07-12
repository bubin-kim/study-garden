'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'

type Variant = 'primary' | 'soft' | 'ghost'
type Size = 'lg' | 'md'

const variantCls: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary shadow-btn hover:brightness-105',
  soft: 'bg-primary-soft text-ink hover:brightness-[0.98]',
  ghost: 'text-muted hover:text-ink',
}

const sizeCls: Record<Size, string> = {
  lg: 'h-[54px] px-12 text-[16px]',
  md: 'h-11 px-5 text-[14px]',
}

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: Size
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 480, damping: 15 }}
      className={`inline-flex select-none items-center justify-center rounded-full font-medium transition-[color,background-color,filter,box-shadow] duration-200 ${sizeCls[size]} ${variantCls[variant]} ${className}`}
      {...props}
    />
  )
}
