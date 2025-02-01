import { Button, Divider } from '@fluentui/react-components'
import PageHeader from '../../components/PageHeader'
import { sharedStyles } from '../../styles/sharedStyles'
import SettingsList from '../../components/SettingsList'


function Settings() {
  const sharedClasses = sharedStyles()

  return (
    <div className={sharedClasses.container}>
      <PageHeader
        title="Manage Settings"
        description="View and update the AI doc review agent configurations by updating existing settings or by adding
            new ones to enhance your document analysis."
      />

      <Divider className={sharedClasses.divider} />
      <SettingsList />
    </div>
  )
}

export default Settings
