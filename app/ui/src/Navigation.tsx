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
  Avatar,
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
import Agents from "./pages/admin/Agents";
import Files from "./pages/files/Files";
import Review from "./pages/review/Review";
import Settings from "./pages/admin/Settings";
import useStyles from "./styles/useStyles";


// paths
const paths = {
  home: "/",
  adminAgents: "/admin/agents",
  review: "/review",
  settings: "/admin/settings",
};

const documentation_url = "https://github.com/Azure-Samples/ai-document-review";

const NavMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const classes = useStyles()

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
            className={isSelected(paths.home) ? classes.selected  : ""}
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
              className={isSelected(paths.adminAgents) ? classes.selected : ""}
            >
              Agents Manager
            </MenuItem>
            <MenuItem
              icon={<Settings20Filled />}
              onClick={() => navigate(paths.settings)}
              className={isSelected(paths.settings) ? classes.selected : ""}
            >
              Settings
            </MenuItem>
          </MenuGroup>
          <MenuDivider />
          <MenuItemLink icon={<DocumentBulletListFilled />} href={documentation_url} target="_blank" rel="noopener noreferrer">
            Documentation
          </MenuItemLink>

          {/* Account */}
          <MenuItem>
            <Avatar aria-label="User" size={32} />
          </MenuItem>
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

const Pages = () => (
  <Routes>
    <Route path={paths.home} element={<Files />} />
    <Route path={paths.review} element={<Review />} />
    <Route path={paths.adminAgents} element={<Agents />} />
    <Route path={paths.settings} element={<Settings />} />
  </Routes>
);

export { NavMenu, Pages };
