import Image from 'next/image'

import type { ComponentProps } from 'react'

type Props = Omit<ComponentProps<typeof Image>, 'src' | 'alt'> & {
  alt?: string
}

export const Isologo = ({ alt = 'Logo', ...props }: Props) => (
  <Image src="/brand/logo.png" alt={alt} width={96} height={96} {...props} />
)

export default Isologo
