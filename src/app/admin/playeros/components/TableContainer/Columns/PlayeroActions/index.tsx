'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  ActionColumnButton,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui'
import { useRevalidateCache } from '@/hooks/useRevalidateCache'
import type { PlayeroPlaya } from '@/services/playeros/types'

import {
  deletePlayeroAction,
  resendInvitationAction
} from '../../../../actions'

interface PlayeroActionsProps {
  playero: PlayeroPlaya
}

export default function PlayeroActions({ playero }: PlayeroActionsProps) {
  const [isDeletingPlayero, setIsDeletingPlayero] = useState(false)
  const [isResendingInvitation, setIsResendingInvitation] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()
  const { revalidate } = useRevalidateCache()

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false)
    setIsDeletingPlayero(true)

    try {
      const result = await deletePlayeroAction({
        playeroId: playero.playeroId || '',
        playaId: playero.playasAsignadas[0]?.playa_id || '',
        motivo: 'Eliminado por el dueño'
      })

      if (result.success && result.data) {
        let actionText = ''
        let successMessage = ''

        switch (result.data.action) {
          case 'deleted':
            actionText = 'eliminado'
            break
          case 'suspended':
            actionText = 'suspendido'
            break
        }

        if (result.data.action !== ('invitation_deleted' as any)) {
          const affectedPlayas = (result as any).affected_playas || 1
          const roleRemovedText = (result as any).roleRemoved
            ? ' y rol PLAYERO removido'
            : ''

          successMessage = `Playero ${actionText} de ${affectedPlayas} playa${affectedPlayas > 1 ? 's' : ''}${roleRemovedText}`
        }

        toast.success(successMessage, { duration: 4000 })

        queryClient.invalidateQueries({
          queryKey: ['playeros']
        })

        if ((result as any).roleRemoved) {
          toast.info('Actualizando interfaz...', { duration: 1000 })

          // Revalidar datos específicos en lugar de recargar la página
          try {
            await revalidate('playas')
            await revalidate('playa-stats')
            router.refresh() // Refrescar la página para actualizar la UI
          } catch (error) {
            console.error('Error revalidating cache:', error)
            // Fallback a reload si la revalidation falla
            setTimeout(() => {
              window.location.reload()
            }, 1200)
          }
        }
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error inesperado')
    } finally {
      setIsDeletingPlayero(false)
    }
  }

  const handleResendInvitation = async () => {
    if (!isPendingInvitation) {
      toast.error('Solo se pueden reenviar invitaciones pendientes')
      return
    }

    setIsResendingInvitation(true)

    try {
      const result = await resendInvitationAction(playero.usuario.email)

      if (result.success) {
        toast.success('Invitación reenviada correctamente')
      } else {
        toast.error(result.error || 'Error al reenviar invitación')
      }
    } catch {
      toast.error('Error inesperado')
    } finally {
      setIsResendingInvitation(false)
    }
  }

  const isPendingInvitation = playero.tipoRegistro === 'INVITACION_PENDIENTE'

  const isAnyLoading = isDeletingPlayero || isResendingInvitation

  return (
    <>
      <div className="flex items-center justify-center gap-1 px-2">
        {!isPendingInvitation && playero.playeroId && (
          <ActionColumnButton
            icon="edit"
            tooltip="Editar playero"
            href={`/admin/playeros/${playero.playeroId}`}
          />
        )}
        {isPendingInvitation && (
          <ActionColumnButton
            icon="refresh"
            tooltip="Reenviar invitación"
            onClick={handleResendInvitation}
            disabled={isAnyLoading}
            className={`text-blue-600 hover:text-blue-700 ${isResendingInvitation ? '[&_svg]:animate-spin' : ''}`}
          />
        )}
        <ActionColumnButton
          icon="delete"
          tooltip={
            isPendingInvitation
              ? 'Eliminar invitación'
              : 'Eliminar playero de todas las playas'
          }
          onClick={handleDeleteClick}
          disabled={isAnyLoading}
          className="text-destructive hover:text-destructive/80"
        />
      </div>

      {/* Modal de confirmación para eliminar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isPendingInvitation
                ? '¿Eliminar invitación?'
                : '¿Eliminar playero?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isPendingInvitation ? (
                <>
                  ¿Estás seguro de que quieres eliminar la invitación enviada a{' '}
                  <span className="font-medium">{playero.usuario.email}</span>?
                  <br />
                  <br />
                  Esta acción no se puede deshacer. Si el usuario intenta usar
                  el enlace de invitación después de eliminarlo, se le mostrará
                  un mensaje de error.
                </>
              ) : (
                <>
                  ¿Estás seguro de que quieres eliminar a{' '}
                  <span className="font-medium">{playero.usuario.email}</span>{' '}
                  de TODAS tus playas?
                  <br />
                  <br />
                  Esta acción no se puede deshacer y el playero será removido de{' '}
                  {playero.totalPlayas} playa
                  {playero.totalPlayas > 1 ? 's' : ''}.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPendingInvitation
                ? 'Sí, eliminar invitación'
                : 'Sí, eliminar playero'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
