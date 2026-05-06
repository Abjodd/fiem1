import PageLayout from '../../layouts/PageLayout.jsx'
import GenericPage from '../GenericPage.jsx'

export default function ScheduleRelease() {
  return (
    <PageLayout>
      <GenericPage
        title="Schedule Release"
        description="View and manage schedule releases from the buyer."
        icon="📅"
      />
    </PageLayout>
  )
}
