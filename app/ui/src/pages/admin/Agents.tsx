import { Divider } from '@fluentui/react-components'
import PageHeader from '../../components/PageHeader'
import useStyles from '../../styles/useStyles'

function Agents() {
  const classes = useStyles()

  return (
    <div className={classes.container}>
      <PageHeader
        title="Manage Agents"
        description="View and update the AI doc review agents by updating existing agent prompts or by adding
            new ones to enhance your document analysis."
      />
      <Divider className={classes.divider} />
    </div>
  )
}

export default Agents
