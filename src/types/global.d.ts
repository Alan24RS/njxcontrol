declare global {
  type SearchParamsType = Promise<{
    [key: string]: string | string[] | undefined
  }>
}

export {}
