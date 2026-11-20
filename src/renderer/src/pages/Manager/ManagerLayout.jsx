import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import KitDeleteDialog from "../../../../kit/components/KitDeleteDialog";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import storage from "../../../../kit/hooks/data/services/storage";
import useUser from "../../../../kit/hooks/useUser";
import ManagerMenuDrawer from "../../components/Manager/ManagerMenuDrawer";
import { Typography, Tooltip } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import {
    Menubar,
    MenuPopup,
    MenuPortal,
    MenuPositioner,
    MenuRoot,
    MenuSeparator,
    MenuItem,
    MenuTrigger,
} from "../../../../kit/components/KitMenuGroupLabel/KitMenuGroupLabel";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import ShortcutBadge from "../../components/Dashboard/ShortcutBadge";

export default function ManagerLayout() {
    const navigate = useNavigate();
    const userData = useUser();
    const profileButtonRef = useRef(null);
    const [showMenuDrawer, setShowMenuDrawer] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = () => setShowLogoutDialog(true);
    const onLogout = () => {
        storage.removeItem("token");
        storage.removeItem("userData");
        setShowLogoutDialog(false);
        navigate("/");
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey || e.ctrlKey || e.shiftKey || e.metaKey) return;

            switch (e.key.toLowerCase()) {
                case "h":
                    e.preventDefault();
                    navigate("/manager-collect");
                    break;

                case "l":
                    e.preventDefault();
                    profileButtonRef.current?.click();
                    break;

                case "m":
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenuDrawer((prev) => !prev);
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [navigate]);

    return (
        <>
            <div className="p-3 min-h-full">
                <div className="mb-3 mt-3 flex items-center justify-between">
                    <div>
                        <div className="text-lg font-semibold">Manager</div>
                        <Typography className="text-sm! text-third-500">{userData?.email}</Typography>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt+H" />
                            <Tooltip title="Home" placement="bottom">
                                <button
                                    type="button"
                                    onClick={() => navigate("/manager-collect")}
                                    className="min-w-fit! cursor-pointer rounded-sm border! border-blue-600! p-1!"
                                >
                                    <KitIcon icon="tabler:home" className="text-xl text-blue-600" />
                                </button>
                            </Tooltip>
                        </div>

                        <div className="relative">
                            <ShortcutBadge shortcut="Alt+L" />

                            <Tooltip title="Profile" placement="bottom">
                                <Menubar>
                                    <MenuRoot>
                                        <MenuTrigger
                                            ref={profileButtonRef}
                                            className="min-w-fit! border! border-blue-600! p-1!"
                                        >
                                            <PersonIcon color="primary" fontSize="small" className="p-0!" />
                                        </MenuTrigger>

                                        <MenuPortal>
                                            <MenuPositioner sideOffset={4} alignOffset={-2} style={{ zIndex: 9999 }}>
                                                <MenuPopup>
                                                    <MenuItem icon={<PersonIcon fontSize="small" />}>
                                                        {userData?.email || "Demo"}
                                                    </MenuItem>

                                                    <MenuSeparator />

                                                    <MenuItem
                                                        icon={<LogoutIcon fontSize="small" />}
                                                        onClick={handleLogout}
                                                    >
                                                        Logout
                                                    </MenuItem>
                                                </MenuPopup>
                                            </MenuPositioner>
                                        </MenuPortal>
                                    </MenuRoot>
                                </Menubar>
                            </Tooltip>
                        </div>

                        <div className="relative">
                            <ShortcutBadge shortcut="Alt+M" />
                            <Tooltip title="Menu" placement="bottom">
                                <button
                                    type="button"
                                    onClick={() => setShowMenuDrawer((isOpen) => !isOpen)}
                                    className="min-w-fit! cursor-pointer rounded-sm border! border-blue-600! p-1!"
                                >
                                    <KitIcon icon="tabler:menu-2" className="text-xl text-blue-600" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
                <Outlet
                    context={{
                        handleLogout,
                        toggleProfileMenu: () => profileButtonRef.current?.click(),
                    }}
                />
            </div>

            <KitShow show={showLogoutDialog}>
                <KitDeleteDialog
                    isOpen={showLogoutDialog}
                    onClose={() => setShowLogoutDialog(false)}
                    title="Logout"
                    subTitle="Do You Want to Logout?"
                    onDelete={onLogout}
                    isBtnLoading={false}
                    cancelButtonText="No"
                />
            </KitShow>

            <KitShow show={showMenuDrawer}>
                <ManagerMenuDrawer
                    isOpen={showMenuDrawer}
                    onClose={() => setShowMenuDrawer(false)}
                    userData={userData}
                    handleLogout={() => setShowLogoutDialog(true)}
                />
            </KitShow>
        </>
    );
}
