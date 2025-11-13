export type FilterComponent = {
  options: {
    label: string
    value: string | number | boolean
    description?: string
  }[]
  selected: Set<string>
  id: string
}
