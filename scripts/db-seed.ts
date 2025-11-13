import { createClient } from '@supabase/supabase-js'

import { PLAYERO_PLAYA_ESTADO } from '../src/constants/playeroEstado'

import { caracteristicas } from './seeds/base/caracteristicas'
import { ciudades } from './seeds/dev/ciudades'
import { testModalidadesOcupacion } from './seeds/dev/modalidades'
import {
  PLAYA_1_ID,
  PLAYA_2_ID,
  PLAYA_3_ID,
  PLAYA_4_ID,
  testMetodosPago,
  testPlayas,
  testPlazas,
  testTarifas,
  testTiposPlaza,
  testTiposVehiculo
} from './seeds/dev/playas'
import { testUsers } from './seeds/dev/users'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      apikey: supabaseServiceRoleKey
    }
  }
})

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n')

  console.log('📦 Seeding base data...\n')
  await seedBaseData()

  console.log('\n🎭 Seeding dev data...\n')
  await seedDevData()

  console.log('\n✅ Database seeding complete!')
  process.exit(0)
}

async function seedBaseData() {
  console.log('⭐ Seeding plaza characteristics...')

  for (const caracteristica of caracteristicas) {
    const { error } = await supabase
      .from('caracteristica')
      .upsert(caracteristica, { onConflict: 'nombre', ignoreDuplicates: true })

    if (error && !error.message.includes('duplicate')) {
      console.error(
        `   Error inserting ${caracteristica.nombre}:`,
        error.message
      )
    }
  }

  console.log(`   ✅ Processed ${caracteristicas.length} characteristics`)
}

async function seedDevData() {
  const createdUserIds = await seedUsers()

  const duenoId = createdUserIds['dueno@test.com']
  const playeroId = createdUserIds['playero@test.com']
  const playerodosId = createdUserIds['playerodos@test.com']
  const duenodosId = createdUserIds['duenodos@test.com']
  const playerotresId = createdUserIds['playerotres@test.com']
  const playerocuatroId = createdUserIds['playerocuatro@test.com']

  if (
    !duenoId ||
    !playeroId ||
    !playerodosId ||
    !duenodosId ||
    !playerotresId ||
    !playerocuatroId
  ) {
    console.error('❌ Could not get all user IDs. Aborting...')
    process.exit(1)
  }

  await seedRoles(createdUserIds)
  await seedCiudades()
  await seedPlayas(createdUserIds)
}

async function seedUsers() {
  console.log('👤 Creating/updating test users...')
  const createdUserIds: { [key: string]: string } = {}

  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUsersMap = new Map(
    existingUsers?.users.map((u) => [u.email, u]) || []
  )

  for (const user of testUsers) {
    const role = user.user_metadata.role
    const roleLower = role?.toLowerCase()
    const existingUser = existingUsersMap.get(user.email)

    if (existingUser) {
      createdUserIds[user.email] = existingUser.id

      const currentRole =
        existingUser.user_metadata?.role || existingUser.user_metadata?.rol
      const needsRoleUpdate =
        currentRole?.toLowerCase() !== roleLower ||
        existingUser.user_metadata?.name !== user.user_metadata.name

      if (needsRoleUpdate) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            user_metadata: {
              ...existingUser.user_metadata,
              name: user.user_metadata.name,
              role: roleLower,
              rol: roleLower
            }
          }
        )

        if (updateError) {
          console.error(
            `   ⚠️  Error updating metadata for ${user.email}:`,
            updateError.message
          )
        } else {
          console.log(`   ✅ Updated metadata for ${user.email}`)
        }
      }
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.user_metadata.name,
          role: roleLower,
          rol: roleLower
        }
      })

      if (error) {
        console.error(`   ❌ Error creating ${user.email}:`, error.message)
        continue
      }

      if (data.user?.id) {
        createdUserIds[user.email] = data.user.id
        console.log(`   ✅ Created user ${user.email}`)
      }
    }
  }

  console.log(`   ✅ Users ready: ${Object.keys(createdUserIds).length}`)

  console.log('   ⏳ Ensuring users exist in public.usuario...')
  await new Promise((resolve) => setTimeout(resolve, 2000))

  for (const email in createdUserIds) {
    const userId = createdUserIds[email]
    if (!userId) continue

    let retries = 3
    let userExists = false

    while (retries > 0 && !userExists) {
      const { data } = await supabase
        .from('usuario')
        .select('usuario_id')
        .eq('usuario_id', userId)
        .maybeSingle()

      if (data) {
        userExists = true
      } else {
        retries--
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    if (!userExists) {
      const userData = testUsers.find((u) => u.email === email)
      const { error: insertError } = await supabase.from('usuario').upsert(
        {
          usuario_id: userId,
          email: email,
          nombre: userData?.user_metadata.name || '',
          telefono: null
        },
        { onConflict: 'usuario_id' }
      )

      if (insertError) {
        console.error(
          `   ⚠️  Error ensuring user ${email} exists:`,
          insertError.message
        )
      }
    }
  }

  return createdUserIds
}

async function seedRoles(userIds: { [key: string]: string }) {
  console.log('👥 Ensuring roles are assigned...')

  const roles = [
    { usuario_id: userIds['dueno@test.com'], rol: 'DUENO' },
    { usuario_id: userIds['playero@test.com'], rol: 'PLAYERO' },
    { usuario_id: userIds['playerodos@test.com'], rol: 'PLAYERO' },
    { usuario_id: userIds['duenodos@test.com'], rol: 'DUENO' },
    { usuario_id: userIds['playerotres@test.com'], rol: 'PLAYERO' },
    { usuario_id: userIds['playerocuatro@test.com'], rol: 'PLAYERO' }
  ]

  for (const role of roles) {
    if (!role.usuario_id) {
      console.error(`   ⚠️  Skipping role assignment: usuario_id is null`)
      continue
    }

    const { data: existingRole } = await supabase
      .from('rol_usuario')
      .select('*')
      .eq('usuario_id', role.usuario_id)
      .eq('rol', role.rol)
      .maybeSingle()

    if (!existingRole) {
      const { error } = await supabase
        .from('rol_usuario')
        .upsert(role, { onConflict: 'usuario_id,rol' })

      if (error) {
        if (error.message.includes('foreign key constraint')) {
          console.error(
            `   ⚠️  User ${role.usuario_id} doesn't exist in public.usuario. Attempting to create...`
          )
          const userEmail = Object.keys(userIds).find(
            (email) => userIds[email] === role.usuario_id
          )
          if (userEmail) {
            const userData = testUsers.find((u) => u.email === userEmail)
            const { error: createError } = await supabase
              .from('usuario')
              .upsert(
                {
                  usuario_id: role.usuario_id,
                  email: userEmail,
                  nombre: userData?.user_metadata.name || '',
                  telefono: null
                },
                { onConflict: 'usuario_id' }
              )

            if (!createError) {
              const { error: retryError } = await supabase
                .from('rol_usuario')
                .upsert(role, { onConflict: 'usuario_id,rol' })
              if (!retryError) {
                console.log(`   ✅ Assigned role ${role.rol} to user`)
              }
            }
          }
        } else {
          console.error(
            `   ⚠️  Error assigning role ${role.rol}:`,
            error.message
          )
        }
      }
    }
  }

  console.log('   ✅ Roles verified/assigned')
}

async function seedCiudades() {
  console.log('🏙️  Seeding cities...')
  const { error } = await supabase
    .from('ciudad')
    .upsert(ciudades, { onConflict: 'ciudad_id' })

  if (error) {
    console.error('   Error:', error.message)
  } else {
    console.log(`   ✅ Seeded ${ciudades.length} cities`)
  }
}

async function seedPlayas(userIds: { [key: string]: string }) {
  console.log('🅿️  Setting up playas...')

  const duenoId = userIds['dueno@test.com']
  const duenodosId = userIds['duenodos@test.com']

  if (!duenoId || !duenodosId) {
    console.error('   ❌ Missing required user IDs. Cannot create playas.')
    return
  }

  for (const playaData of testPlayas) {
    let playaDuenoId = duenoId

    if (
      playaData.playa_id === PLAYA_3_ID ||
      playaData.playa_id === PLAYA_4_ID
    ) {
      playaDuenoId = duenodosId
    }

    const { data: existingPlaya } = await supabase
      .from('playa')
      .select('playa_id, nombre')
      .eq('playa_id', playaData.playa_id)
      .maybeSingle()

    const { error: playaError } = await supabase.from('playa').upsert(
      {
        playa_id: playaData.playa_id,
        playa_dueno_id: playaDuenoId,
        nombre: playaData.nombre,
        direccion: playaData.direccion,
        ciudad_id: playaData.ciudad_id,
        latitud: playaData.latitud,
        longitud: playaData.longitud,
        horario: playaData.horario,
        descripcion: playaData.descripcion,
        estado: playaData.estado
      },
      { onConflict: 'playa_id' }
    )

    if (playaError) {
      console.error(
        `   ⚠️  Error ${existingPlaya ? 'updating' : 'creating'} ${playaData.nombre}:`,
        playaError.message
      )
      continue
    }

    console.log(
      `   ✅ ${existingPlaya ? 'Updated' : 'Created'} playa ${playaData.nombre}`
    )
  }

  console.log('🔧 Setting up tipos de plaza...')
  for (const item of testTiposPlaza) {
    const { error } = await supabase.from('tipo_plaza').upsert(
      item.tipos.map((tipo) => ({
        tipo_plaza_id: tipo.tipo_plaza_id,
        playa_id: item.playa_id,
        nombre: tipo.nombre,
        descripcion: tipo.descripcion
      })),
      { onConflict: 'tipo_plaza_id,playa_id' }
    )
    if (error) console.error('   Error:', error.message)
  }
  console.log('   ✅ Tipos de plaza created')

  console.log('🔧 Setting up modalidades...')
  for (const item of testModalidadesOcupacion) {
    const { error } = await supabase.from('modalidad_ocupacion_playa').upsert(
      item.modalidades.map((mod) => ({
        playa_id: item.playa_id,
        modalidad_ocupacion: mod.modalidad_ocupacion,
        estado: mod.estado
      })),
      { onConflict: 'playa_id,modalidad_ocupacion' }
    )
    if (error) console.error('   Error:', error.message)
  }
  console.log('   ✅ Modalidades created')

  console.log('🔧 Setting up métodos de pago...')
  for (const item of testMetodosPago) {
    const { error } = await supabase.from('metodo_pago_playa').upsert(
      item.metodos.map((metodo) => ({
        playa_id: item.playa_id,
        metodo_pago: metodo.metodo_pago,
        estado: metodo.estado
      })),
      { onConflict: 'playa_id,metodo_pago' }
    )
    if (error) console.error('   Error:', error.message)
  }
  console.log('   ✅ Métodos de pago created')

  console.log('🔧 Setting up tipos de vehículo...')
  for (const item of testTiposVehiculo) {
    const { error } = await supabase.from('tipo_vehiculo_playa').upsert(
      item.tipos.map((tipo) => ({
        playa_id: item.playa_id,
        tipo_vehiculo: tipo.tipo_vehiculo,
        estado: tipo.estado
      })),
      { onConflict: 'playa_id,tipo_vehiculo' }
    )
    if (error) console.error('   Error:', error.message)
  }
  console.log('   ✅ Tipos de vehículo created')

  console.log('🅿️  Setting up plazas...')
  for (const item of testPlazas) {
    const { error } = await supabase.from('plaza').upsert(
      item.plazas.map((plaza) => ({
        plaza_id: plaza.plaza_id,
        playa_id: item.playa_id,
        tipo_plaza_id: plaza.tipo_plaza_id,
        identificador: plaza.identificador,
        estado: plaza.estado
      })),
      { onConflict: 'plaza_id' }
    )
    if (error) console.error('   Error:', error.message)
  }
  console.log('   ✅ Plazas created')

  console.log('💰 Setting up tarifas...')
  for (const item of testTarifas) {
    const tarifasUnicas = item.tarifas.filter(
      (tarifa, index, self) =>
        index ===
        self.findIndex(
          (t) =>
            t.tipo_plaza_id === tarifa.tipo_plaza_id &&
            t.modalidad_ocupacion === tarifa.modalidad_ocupacion &&
            t.tipo_vehiculo === tarifa.tipo_vehiculo
        )
    )

    const { error } = await supabase.from('tarifa').upsert(
      tarifasUnicas.map((tarifa) => ({
        playa_id: item.playa_id,
        tipo_plaza_id: tarifa.tipo_plaza_id,
        modalidad_ocupacion: tarifa.modalidad_ocupacion,
        tipo_vehiculo: tarifa.tipo_vehiculo,
        precio_base: tarifa.precio_base
      })),
      { onConflict: 'playa_id,tipo_plaza_id,modalidad_ocupacion,tipo_vehiculo' }
    )
    if (error) {
      console.error('   Error:', error.message)
    }
  }
  console.log('   ✅ Tarifas created')

  await seedPlayeroPlayaRelations(userIds)
}

async function seedPlayeroPlayaRelations(userIds: { [key: string]: string }) {
  console.log('🔗 Linking playeros to playas...')

  const duenoId = userIds['dueno@test.com']
  const duenodosId = userIds['duenodos@test.com']
  const playeroId = userIds['playero@test.com']
  const playerodosId = userIds['playerodos@test.com']
  const playerotresId = userIds['playerotres@test.com']
  const playerocuatroId = userIds['playerocuatro@test.com']

  if (
    !duenoId ||
    !duenodosId ||
    !playeroId ||
    !playerodosId ||
    !playerotresId ||
    !playerocuatroId
  ) {
    console.error('   ⚠️  Missing required user IDs. Cannot create relations.')
    return
  }

  const relations = [
    {
      playero_id: playeroId,
      playa_id: PLAYA_1_ID,
      dueno_invitador_id: duenoId,
      estado: PLAYERO_PLAYA_ESTADO.ACTIVO
    },
    {
      playero_id: playerodosId,
      playa_id: PLAYA_1_ID,
      dueno_invitador_id: duenoId,
      estado: PLAYERO_PLAYA_ESTADO.ACTIVO
    },
    {
      playero_id: playerodosId,
      playa_id: PLAYA_2_ID,
      dueno_invitador_id: duenoId,
      estado: PLAYERO_PLAYA_ESTADO.ACTIVO
    },
    {
      playero_id: playerotresId,
      playa_id: PLAYA_3_ID,
      dueno_invitador_id: duenodosId,
      estado: PLAYERO_PLAYA_ESTADO.ACTIVO
    },
    {
      playero_id: playerotresId,
      playa_id: PLAYA_4_ID,
      dueno_invitador_id: duenodosId,
      estado: PLAYERO_PLAYA_ESTADO.ACTIVO
    },
    {
      playero_id: playerocuatroId,
      playa_id: PLAYA_3_ID,
      dueno_invitador_id: duenodosId,
      estado: PLAYERO_PLAYA_ESTADO.ACTIVO
    },
    {
      playero_id: playerocuatroId,
      playa_id: PLAYA_4_ID,
      dueno_invitador_id: duenodosId,
      estado: PLAYERO_PLAYA_ESTADO.ACTIVO
    }
  ]

  let successCount = 0
  let errorCount = 0

  for (const relation of relations) {
    const { data: existingRelation } = await supabase
      .from('playero_playa')
      .select('*')
      .eq('playero_id', relation.playero_id)
      .eq('playa_id', relation.playa_id)
      .maybeSingle()

    if (!existingRelation) {
      const { error } = await supabase
        .from('playero_playa')
        .upsert(relation, { onConflict: 'playero_id,playa_id' })

      if (error) {
        errorCount++
        if (
          !error.message.includes('no tiene acceso') &&
          !error.message.includes('foreign key')
        ) {
          console.error(`   ⚠️  Error linking playero to playa:`, error.message)
        }
      } else {
        successCount++
      }
    } else {
      successCount++
    }
  }

  console.log(
    `   ✅ Playero-playa relations: ${successCount} ready, ${errorCount} errors`
  )
}

seedDatabase().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
