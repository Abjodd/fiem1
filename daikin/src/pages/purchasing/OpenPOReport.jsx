import PageLayout from '../../layouts/PageLayout.jsx'
import GenericPage from '../GenericPage.jsx'

export default function OpenPOReport() {
  return (
    <PageLayout>
      <GenericPage
        title="Open PO Report"
        description="View all open purchase orders assigned to your supplier account."
        icon="📊"
      />
    </PageLayout>
  )
}
