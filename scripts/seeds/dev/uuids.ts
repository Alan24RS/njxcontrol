import { randomUUID } from 'crypto'

export const CIUDAD_RESISTENCIA_ID = '60c439c3-dd79-4491-8923-7732568bfbdd'
export const CIUDAD_CORRIENTES_ID = '836a9f6f-39bb-4171-915f-0e7384b0fa47'

export const PLAYA_1_ID = '0c0d0388-82f9-46a4-8af7-df05c615ccff'
export const PLAYA_2_ID = '5985117f-a0b1-4a4f-9fe0-047a627d67c1'
export const PLAYA_3_ID = 'ad50a942-ecc6-45eb-8b2b-44c1f96efdd0'
export const PLAYA_4_ID = 'b9bf4790-a11f-450b-aaaa-92f919b08327'

export const PLAYA_1_PLAZAS = {
  PLAZA_1: '2d287399-2695-4cfc-b35c-e0454ad7c487',
  PLAZA_2: '0f5842e9-1ff3-4826-83e3-f788a1ec7442',
  PLAZA_3: 'a5a89c41-b5f1-4413-bf84-5e889a1feb92',
  PLAZA_4: '138d164b-499f-4de7-ab89-852f440ef185',
  PLAZA_5: '24c2b421-eab3-4634-b43a-6cbe0a1ab2d7',
  PLAZA_6: 'e490590c-81f0-45c1-a709-f21f82fec95e',
  PLAZA_7: 'efeed9a3-608d-4546-98cd-8fd3c43f18c9'
} as const

export const PLAYA_2_PLAZAS = {
  PLAZA_1: 'b875b2ac-a274-4500-bb4d-4cbffdfb9dc8',
  PLAZA_2: '5983716a-3215-4695-ab84-d9dedaf5e961',
  PLAZA_3: '9240fc7d-c223-4aff-afa6-5f8f5ab11248',
  PLAZA_4: '256c3c95-9f2f-4230-aeff-a9d14731d227',
  PLAZA_5: 'c8f9f3a7-325b-4be5-adfe-6ea4e09bf1fc',
  PLAZA_6: '475fa5db-d9e8-47dc-8836-05a166d9c342',
  PLAZA_7: '1b033e48-c165-44d1-af5c-fa1e9acb055d',
  PLAZA_8: '584325c5-c7e9-4d8a-ba4d-04d3e47217f8',
  PLAZA_9: '9ccb61a8-f0f5-45f4-bc7c-335085bf0829',
  PLAZA_10: 'ce5b23b3-5328-421c-b2f5-abaeb1339db5'
} as const

export const PLAYA_3_PLAZAS = {
  PLAZA_1: '02e454ad-dd13-4420-b269-d024cc7ea48b',
  PLAZA_2: '21a6e922-348f-4a1a-852b-1bbaca320e82',
  PLAZA_3: 'a1d292dd-aeaf-4c2c-b1f5-502fe4e108ee',
  PLAZA_4: 'c8e3e069-d962-4d1e-a4be-ab76004dcdde',
  PLAZA_5: '1ed919ff-875b-4af9-94d2-f2086e33eb22',
  PLAZA_6: '62cbab40-2627-42aa-9db1-947c18fc2781',
  PLAZA_7: 'eefe659a-5c82-4500-a5fb-b148abdb31b1',
  PLAZA_8: 'b7e3a1ad-c4f4-4afa-93c3-6decf3f00f17'
} as const

export const PLAYA_4_PLAZAS = {
  PLAZA_1: 'cd1d316a-fbe0-4996-a2e5-4c986e0e9d0a',
  PLAZA_2: 'c7c1491b-649f-4576-998b-3bf2d828da8e',
  PLAZA_3: '59ae4548-f3fb-4d84-8c45-2be23b280cf4',
  PLAZA_4: '38971d9b-37df-4c53-b08a-b52b49199eb1',
  PLAZA_5: '98e2e229-d9b8-4351-be2b-dee0a8475250',
  PLAZA_6: 'cf18b01f-71f2-4162-8b5b-b867692a0cad',
  PLAZA_7: '794bff2c-3c12-43db-afeb-1fa710f359fb',
  PLAZA_8: '2044c373-d301-482b-95fc-b3fb3711e238',
  PLAZA_9: '7e97857b-7845-4e5c-8716-72cc0e57e6f8'
} as const

export function generateValidUUID(): string {
  return randomUUID()
}

export function generateValidUUIDs(count: number): string[] {
  return Array.from({ length: count }, () => randomUUID())
}

export function isValidRFC4122UUID(uuid: string): boolean {
  const version = parseInt(uuid[14], 16)
  const variant = parseInt(uuid[19], 16)

  return version >= 1 && version <= 5 && variant >= 8 && variant <= 11
}
