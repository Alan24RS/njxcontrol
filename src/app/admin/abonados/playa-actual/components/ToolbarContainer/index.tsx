import AbonadosToolbar from '@/app/admin/abonados/components/shared/AbonadosToolbar'

export default function ToolbarContainer({ params }: { params: any }) {
  return <AbonadosToolbar params={params} filterByPlaya={true} />
}
