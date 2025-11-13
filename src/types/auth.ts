import { Role } from '@/constants/rol'

export type User = {
  id: string
  email: string
  name: string
  phone: string
  roles: Role[]
  avatar?: string
}
