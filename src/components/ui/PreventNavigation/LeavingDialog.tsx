import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

type LeavingDialogProps = {
  isOpen: boolean
  yesCallback: () => void
  noCallback: () => void
  title?: string
  description?: string
}

export const LeavingDialog = ({
  isOpen,
  yesCallback,
  noCallback,
  title = '¿Estás seguro que deseas irte?',
  description = 'Si abandonas la página perderás los cambios realizados.'
}: LeavingDialogProps) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => noCallback()}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => yesCallback()}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
