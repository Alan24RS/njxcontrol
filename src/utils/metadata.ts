import type { Metadata } from 'next'
interface PageMetadata {
  title: string
  description: string
  pageRoute: string
  ogImgRoute?: string
}

const siteConfig = {
  url: 'https://valet.ar',
  siteName: 'Valet'
}

export const generateSyncMetadata = (args: PageMetadata): Metadata => {
  const { title, description, pageRoute, ogImgRoute } = args

  const concatTitle = `${title} | ${siteConfig.siteName}`

  return {
    title: pageRoute === '/' ? siteConfig.siteName : concatTitle,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: pageRoute
    },
    openGraph: {
      title,
      description,
      url: pageRoute,
      siteName: siteConfig.siteName,
      ...(ogImgRoute && {
        images: [
          {
            url: ogImgRoute,
            width: 1200,
            height: 630,
            alt: title
          }
        ]
      }),
      type: 'website'
    },
    twitter: {
      title,
      description,
      ...(ogImgRoute && {
        images: [ogImgRoute]
      })
    }
  }
}
