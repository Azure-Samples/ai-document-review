import React from 'react'
import aiDocIcon from '../assets/ai-doc.png'
import { sharedStyles } from '../styles/sharedStyles'
import { makeStyles } from '@fluentui/react-components'


interface PageHeaderProps {
  title: string
  description: string
  customElement?: React.ReactNode
}

const componentStyles = makeStyles({
  headerContent: {
    margin: '16px',
    color: '#000',
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, customElement }) => {
  const sharedClasses = sharedStyles()
  const componentClasses = componentStyles()

  return (
    <div className={sharedClasses.container}>
      <div className={componentClasses.headerContent}>
        <div className={sharedClasses.heroImage}>
          <img src={aiDocIcon} alt="AI Document Review Icon" width="150" />
        </div>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
          {customElement && <div>{customElement}</div>}
        </div>
      </div>
    </div>
  )
}

export default PageHeader
