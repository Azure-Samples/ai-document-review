import { Card, makeStyles, Text, tokens } from '@fluentui/react-components'
import { AddRegular } from '@fluentui/react-icons'


interface AddCardProps {
  onClick: () => void
  labelText: string
}

const componentSyles = makeStyles({
  addIconText: {
    textAlign: 'center',
    fontWeight: tokens.fontWeightSemibold
  },
  disabledCard: {
    width: '200px',
    maxWidth: '100%',
    height: '260px'
  },
  addIcon: {
    fontSize: '72px',
    color: tokens.colorNeutralForeground3,
    margin: 'auto',
    opacity: 0.5,
    pointerEvents: 'none'
  }
})

const AddCard: React.FC<AddCardProps> = ({ onClick, labelText }) => {
  const componentClasses = componentSyles()

  const handleClick = onClick || (() => {})

  return (
    <Card
      aria-label={labelText}
      role="button"
      className={componentClasses.disabledCard}
      appearance="filled-alternative"
      onClick={handleClick}
    >
      <AddRegular className={componentClasses.addIcon} />
      <Text className={componentClasses.addIconText}>{labelText}</Text>
    </Card>
  )
}

export default AddCard
