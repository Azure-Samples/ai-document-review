import { Card, Text } from '@fluentui/react-components'
import { AddRegular } from '@fluentui/react-icons'
import useStyles from '../styles/useStyles'

interface AddCardProps {
  onClick: () => void
  labelText: string
}

const AddCard: React.FC<AddCardProps> = ({ onClick, labelText }) => {
  const classes: Record<string, string> = useStyles()

  const handleClick = onClick || (() => {})

  return (
    <Card
      aria-label={labelText}
      role="button"
      className={classes.disabledCard}
      appearance="filled-alternative"
      onClick={handleClick}
    >
      <AddRegular className={classes.addIcon} />
      <Text className={classes.addIconText}>{labelText}</Text>
    </Card>
  )
}

export default AddCard
