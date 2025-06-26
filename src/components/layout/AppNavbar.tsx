import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
  useDisclosure,
} from "@heroui/react";
import {
  IconSettingsFilled,
  IconHelpCircleFilled,
  IconLogout,
  IconBrain,
} from "@tabler/icons-react";
import logotypeSvg from "../../assets/logotype.svg";
import { useAuth, useUserData } from "../../hooks";
import MeasureButton from "./MeasureButton";
import { HelpModal, LogoutModal, SettingsModal } from "../modals";

interface AppNavbarProps {
  // No props needed - component manages its own modal states
}

const AppNavbar: React.FC<AppNavbarProps> = () => {
  const { session } = useAuth();
  const { userData, loading: userLoading } = useUserData(session?.user?.id);

  // Modal states managed within the component
  const {
    isOpen: isHelpOpen,
    onOpen: onHelpOpen,
    onOpenChange: onHelpOpenChange,
  } = useDisclosure();
  const {
    isOpen: isLogoutOpen,
    onOpen: onLogoutOpen,
    onOpenChange: onLogoutOpenChange,
  } = useDisclosure();
  const {
    isOpen: isSettingsOpen,
    onOpen: onSettingsOpen,
    onOpenChange: onSettingsOpenChange,
  } = useDisclosure();

  const displayName = userData?.nickname;
  const organizationName = userData?.organization?.brand_name || null;
  const displayEmail = session?.user?.email;
  const avatarSrc = userData?.avatar_url || undefined;

  const formattedDisplayName =
    displayName && organizationName
      ? `${displayName} | ${organizationName}`
      : displayName;

  return (
    <Navbar className="py-4 ">
      <NavbarBrand>
        <img
          src={logotypeSvg}
          alt="CogniVibe Logo"
          className="object-contain h-12 "
        />
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <MeasureButton />
        </NavbarItem>
      </NavbarContent>
      <NavbarContent as="div" justify="end">
        <Dropdown placement="bottom-end" backdrop="blur">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform cursor-pointer hover:scale-105"
              color="secondary"
              name={displayName}
              size="sm"
              src={avatarSrc}
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem
              key="profile"
              className="h-14 gap-2 cursor-default"
              textValue="Profile"
              isReadOnly
            >
              <div className="flex gap-2 items-center">
                <Avatar size="sm" src={avatarSrc} name={displayName} />
                <div className="flex flex-col">
                  <p className="text-small">
                    {userLoading ? "Loading..." : formattedDisplayName}
                  </p>
                  <p className="text-tiny opacity-50">{displayEmail}</p>
                </div>
              </div>
            </DropdownItem>
            <DropdownItem
              key="settings"
              onPress={onSettingsOpen}
              startContent={<IconSettingsFilled className="h-5 w-5 " />}
            >
              My settings
            </DropdownItem>
            <DropdownItem
              key="help"
              onPress={onHelpOpen}
              startContent={<IconHelpCircleFilled className="h-5 w-5 " />}
            >
              Help & support
            </DropdownItem>
            <DropdownItem
              key="research"
              onPress={() =>
                window.open("https://cognivibe.com/research", "_blank")
              }
              startContent={<IconBrain className="h-5 w-5 " />}
            >
              How it works & Research
            </DropdownItem>
            <DropdownItem
              startContent={<IconLogout className="h-5 w-5 " />}
              key="logout"
              color="danger"
              onPress={onLogoutOpen}
            >
              Log out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
      {/* Modals */}
      <HelpModal isOpen={isHelpOpen} onOpenChange={onHelpOpenChange} />
      <LogoutModal isOpen={isLogoutOpen} onOpenChange={onLogoutOpenChange} />
      <SettingsModal
        isOpen={isSettingsOpen}
        onOpenChange={onSettingsOpenChange}
      />
    </Navbar>
  );
};

export default AppNavbar;
