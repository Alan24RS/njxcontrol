import { UserCheck } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui'

import SelfAssignModal from './InvitarPlayeroForm/SelfAssignModal'

export default function SelfAssignInfoCard() {
  return (
    <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-blue-900 dark:text-blue-100">
            ¿Quieres participar como playero?
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Asígnate como playero en las playas que necesites para gestionar
            operaciones directamente.
          </p>
        </div>
        <div className="ml-4">
          <SelfAssignModal />
        </div>
      </AlertDescription>
    </Alert>
  )
}
