import { Card, Text } from '@fluentui/react-components'
import { AddRegular } from '@fluentui/react-icons'
import useStyles from '../styles/useStyles'

interface AddCardProps {
  onClick: () => void
  label_text: string
}

const AddCard: React.FC<AddCardProps> = ({ onClick, label_text }) => {
  const classes = useStyles()

  return (
    <Card className={classes.disabledCard} appearance="filled-alternative" onClick={onClick}>
      <AddRegular className={classes.addIcon} />
      <Text className={classes.addIconText}>
        {label_text}
      </Text>
    </Card>
  )
}

export default AddCard
