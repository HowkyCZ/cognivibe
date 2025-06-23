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
} from "@heroui/react";
import {
  IconSettingsFilled,
  IconHelpCircleFilled,
  IconLogout,
  IconBrain,
} from "@tabler/icons-react";
import logotypeSvg from "../../assets/logotype.svg";
import { useAuth, useUserData } from "../../hooks";

interface CogniVibeNavbarProps {
  isMeasuring: boolean;
  onMeasuringToggle: () => void;
  onHelpOpen: () => void;
  onLogoutOpen: () => void;
  onSettingsOpen: () => void;
}

const CogniVibeNavbar: React.FC<CogniVibeNavbarProps> = ({
  isMeasuring,
  onMeasuringToggle,
  onHelpOpen,
  onLogoutOpen,
  onSettingsOpen,
}) => {
  const { session } = useAuth();
  const { userData, loading: userLoading } = useUserData(session?.user?.id);

  const displayName = userData?.nickname;
  const organizationName = "CogniVibe"; // Default organization name
  const displayEmail = session?.user?.email;
  const avatarSrc = userData?.avatar_url || undefined;

  // Format display name with organization
  const formattedDisplayName =
    displayName && organizationName
      ? `${displayName} | ${organizationName}`
      : displayName;

  return (
    <Navbar className="pt-4 ">
      <NavbarBrand>
        <img
          src={logotypeSvg}
          alt="CogniVibe Logo"
          className="object-contain h-12 "
        />
      </NavbarBrand>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          {/* Measuring Toggle Button */}
          <div className=" flex justify-center hover:scale-105 transition-all ">
            <button
              onClick={onMeasuringToggle}
              className={`relative inline-flex h-12 w-48 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition-all duration-300 ${
                isMeasuring ? "shadow-lg shadow-purple-500/25" : ""
              }`}
            >
              {isMeasuring && (
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
              )}
              <span
                className={`inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full px-6 py-1 text-sm font-medium backdrop-blur-3xl transition-all duration-300 ${
                  isMeasuring
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-950 border border-slate-300 hover:bg-slate-50"
                }`}
              >
                {isMeasuring ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    Measuring
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-slate-400 rounded-full mr-2"></div>
                    Start Measuring
                  </>
                )}
              </span>
            </button>
          </div>
        </NavbarItem>
      </NavbarContent>{" "}
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
    </Navbar>
  );
};

export default CogniVibeNavbar;
