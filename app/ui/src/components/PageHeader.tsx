import React from "react";
import aiDocIcon from '../assets/ai-doc.png';
import useStyles from "../styles/useStyles";


interface PageHeaderProps {
  title: string;
  description: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <div className={classes.headerContent}>
        <div className={classes.heroImage}>
          <img src={aiDocIcon} alt="AI Document Review Icon" width="150" />
        </div>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
