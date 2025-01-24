import { Divider } from '@fluentui/react-components'
import PageHeader from '../../components/PageHeader'
import useStyles from '../../styles/useStyles'

function Settings() {
  const classes = useStyles()

  return (
    <div className={classes.container}>
      <PageHeader
        title="Manage Settings"
        description="View and update the AI doc review agent configurations by updating existing settings or by adding
            new ones to enhance your document analysis."
      />
      <Divider className={classes.divider} />
    </div>
  )
}

export default Settings
