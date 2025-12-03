// Este script funciona como checklist informativo, sin consultas a tablas del sistema.
// Usa el Dashboard o el CLI para verificar pg_cron y cron jobs.

async function main() {
  console.log('🔎 Checklist de verificación de cron jobs (informativo)\n')
  console.log('1) Verifica en Supabase Studio:')
  console.log('   • Database → Extensions: pg_cron habilitada')
  console.log('   • Database → Cron Jobs: deben existir los 3 jobs activos\n')

  const jobs = [
    {
      name: 'actualizar-boletas-vencidas',
      schedule: '1 0 * * *',
      description: 'Actualiza boletas PENDIENTE → VENCIDA (00:01 diario)'
    },
    {
      name: 'generar-boletas-mensuales',
      schedule: '5 0 1 * *',
      description: 'Genera boletas mensuales (00:05 día 1 de cada mes)'
    },
    {
      name: 'notificar-boletas-por-vencer',
      schedule: '0 9 * * *',
      description:
        'Envía notificaciones 3 días antes del vencimiento (09:00 diario)'
    }
  ]

  console.log('Cron jobs esperados:')
  for (const job of jobs) {
    console.log(`• ${job.name}`)
    console.log(`  Schedule: ${job.schedule}`)
    console.log(`  ${job.description}\n`)
  }

  console.log('🧪 Pruebas manuales sugeridas en SQL Editor:')
  console.log('   SELECT generar_boletas_mensuales();')
  console.log('   SELECT actualizar_boletas_vencidas();')
  console.log('   SELECT notificar_boletas_proximas_vencer();\n')

  console.log(
    '✅ Checklist mostrado. Usa el CLI para verificar con conexión directa a Postgres.'
  )
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(0))
