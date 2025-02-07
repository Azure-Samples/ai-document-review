import { IPublicClientApplication } from "@azure/msal-browser";
import { MsalAuthenticationTemplate, MsalProvider } from "@azure/msal-react";
import { Avatar, Button, makeStyles } from "@fluentui/react-components";
import { ChevronLeft20Regular } from "@fluentui/react-icons";
import { useLocation, useNavigate } from "react-router-dom";
import logo from './assets/Azure.svg';
import { interactionType, loginRequest } from "./authConfig";
import { NavMenu, Pages } from "./Navigation";


type AppProps = {
  pca: IPublicClientApplication;
};

const useStyles = makeStyles({
  app: { backgroundColor: '#f5f5f5', color: '#fff', minHeight: '100vh', overflowX: 'hidden'},
  header: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', padding: '8px', width: '100%', boxSizing: 'border-box' },
  logo: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: '20px',
    '& img': {
      height: '25px',
      padding: '5px',
      marginLeft: '10px'
    },
    '& h3': {
      color: '#000'
    }
  },
  logoText: { textDecoration: 'none', color: '#000' },
  main: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
});

function App({ pca }: AppProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const classes = useStyles();

  return (
    <MsalProvider instance={pca}>
      <MsalAuthenticationTemplate interactionType={interactionType} authenticationRequest={loginRequest}>
        <div className={classes.app}>
          <header className={classes.header}>
            <div className={classes.logo}>
              {
                location.key !== 'default' &&
                  <Button size="large" shape="circular" icon={<ChevronLeft20Regular />} onClick={() => navigate(-1)} /> 
              }
              <img src={logo} alt="logo" />
              <h3>AI Document Review</h3>
            </div>
            <div className={classes.rightSection}>
              <NavMenu />
              <Avatar aria-label="User" size={32} />
            </div>

          </header>

          <main className={classes.main}>
            <Pages />
          </main>
        </div>
      </MsalAuthenticationTemplate>
    </MsalProvider>
  );
}


export default App;
