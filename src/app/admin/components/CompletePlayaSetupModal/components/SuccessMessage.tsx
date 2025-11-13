import { useEffect, useRef } from 'react'

import { CheckCircle2Icon } from 'lucide-react'

import { Alert, AlertDescription, Button } from '@/components/ui'

interface SuccessMessageProps {
  onFinish: () => void
}

export default function SuccessMessage({ onFinish }: SuccessMessageProps) {
  const finishButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Enfocar el botón Finalizar cuando el componente se monta
    if (finishButtonRef.current) {
      finishButtonRef.current.focus()
    }
  }, [])

  return (
    <div className="space-y-6">
      <Alert>
        <CheckCircle2Icon />
        <AlertDescription>
          Tu playa se creó en modo borrador, para que puedas editarla y agregar
          más información si lo necesitas.
        </AlertDescription>
      </Alert>
      <div className="space-y-4">
        <h2 className="text-lg font-medium">¿Qué hacer ahora?</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <p>
              Revisa los datos de tu playa y asegúrate de que estén correctos.
            </p>
          </li>
          <li>
            <p>
              Una vez que estés listo, puedes publicar tu playa y comenzar a
              gestionarla.
            </p>
          </li>
          <li>
            <p>
              Los conductores empezaran a ver tu playa en la app una vez que la
              publiques.
            </p>
          </li>
        </ul>
      </div>
      <div className="flex justify-center pt-4">
        <Button
          ref={finishButtonRef}
          onClick={onFinish}
          size="lg"
          className="px-8"
        >
          Finalizar
        </Button>
      </div>
    </div>
  )
}
