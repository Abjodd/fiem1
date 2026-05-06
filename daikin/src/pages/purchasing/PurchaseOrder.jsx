import PageLayout from '../../layouts/PageLayout.jsx'
import GenericPage from '../GenericPage.jsx'

export default function PurchaseOrder() {
  return (
    <PageLayout>
      <GenericPage
        title="Purchase Order"
        description="View and acknowledge purchase orders issued to your organization."
        icon="🧾"
      />
    </PageLayout>
  )
}
