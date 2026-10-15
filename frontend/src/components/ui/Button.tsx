import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import styles from './Button.module.css'

type Variant = 'primary' | 'outline' | 'outline-light' | 'light' | 'ghost'
type Size = 'md' | 'lg'

interface CommonProps {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  loading?: boolean
  children: ReactNode
  className?: string
}

type AsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { to?: never; href?: never }
type AsRouterLink = CommonProps & Omit<LinkProps, keyof CommonProps> & { href?: never }
type AsExternalLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string; to?: never }

export type ButtonProps = AsButton | AsRouterLink | AsExternalLink

/**
 * Botão único do design system. Renderiza <button>, <Link> (rota interna)
 * ou <a> (link externo) conforme as props, mantendo o mesmo visual.
 */
export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', fullWidth, loading, className, children, ...rest } = props
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={styles.label}>{children}</span>
    </>
  )

  if ('to' in rest && rest.to !== undefined) {
    return (
      <Link className={classes} {...(rest as LinkProps)}>
        {content}
      </Link>
    )
  }

  if ('href' in rest && rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {content}
      </a>
    )
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button
      type="button"
      className={classes}
      {...buttonProps}
      disabled={buttonProps.disabled || loading}
      aria-busy={loading || undefined}
    >
      {content}
    </button>
  )
}
