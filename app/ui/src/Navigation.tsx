import {
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuGroupHeader,
  MenuDivider,
  MenuItemLink,
} from "@fluentui/react-components";
import {
  ListBar20Filled,
  Prompt20Filled,
  Home20Filled,
  Settings20Filled,
  DocumentBulletListFilled,
} from "@fluentui/react-icons";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import AgentManager from "./pages/admin/AgentManager";
import Files from "./pages/files/Files";
import Review from "./pages/review/Review";
import SettingManager from "./pages/admin/SettingManager";
import { DOCUMENTATION_URL } from "./constants";
import { sharedStyles } from "./styles/sharedStyles";


// paths
const paths = {
  home: "/",
  adminAgents: "/admin/agents",
  review: "/review",
  settings: "/admin/settings",
};


const NavMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const sharedClasses = sharedStyles();

  const isSelected = (path: string) => location.pathname === path;

  return (
    <Menu>
      <MenuTrigger disableButtonEnhancement>
        <Button icon={<ListBar20Filled />} appearance="subtle" />
      </MenuTrigger>
      <MenuPopover>
        <MenuList>
          {/* Navigation */}
          <MenuItem
            icon={<Home20Filled />}
            onClick={() => navigate(paths.home)}
            className={isSelected(paths.home) ? sharedClasses.selected  : ""}
          >
            Home
          </MenuItem>

          <MenuDivider />

          {/* Admin */}
          <MenuGroup>
            <MenuGroupHeader>Admin</MenuGroupHeader>
            <MenuItem
              icon={<Prompt20Filled />}
              onClick={() => navigate(paths.adminAgents)}
              className={isSelected(paths.adminAgents) ? sharedClasses.selected : ""}
            >
              Agents Manager
            </MenuItem>
            <MenuItem
              icon={<Settings20Filled />}
              onClick={() => navigate(paths.settings)}
              className={isSelected(paths.settings) ? sharedClasses.selected : ""}
            >
              Settings
            </MenuItem>
          </MenuGroup>
          <MenuDivider />
          <MenuItemLink icon={<DocumentBulletListFilled />} href={DOCUMENTATION_URL} target="_blank" rel="noopener noreferrer">
            Documentation
          </MenuItemLink>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

const Pages = () => (
  <Routes>
    <Route path={paths.home} element={<Files />} />
    <Route path={paths.review} element={<Review />} />
    <Route path={paths.adminAgents} element={<AgentManager />} />
    <Route path={paths.settings} element={<SettingManager />} />
  </Routes>
);

export { NavMenu, Pages };
