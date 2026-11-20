import { useEffect, useMemo, useRef, useState } from "react";
import { Chip, IconButton, Paper, Typography } from "@mui/material";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import UserFormModal from "./UserFormModal";
import { useCreateUser, useUsersDropdown } from "../../../../kit/hooks/data/users";
import { Role } from "../../../../kit/configs/general";
import { parseApiList } from "../../../../kit/utils/parseApiList";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";

const normalizeRole = (role = "") => String(role || "").trim().toLowerCase();

const isCashier = (user) => {
    if (!user?.role) return true;
    return normalizeRole(user.role) === Role.CASHIER;
};

export default function ManagerUsersPanel() {
    const addCashierButtonRef = useRef(null);
    const refreshButtonRef = useRef(null);

    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    const { usersDropdown, usersDropdownError, isUsersDropdownLoading, refreshUsersDropdown } = useUsersDropdown();
    const { createUser, isCreatingUser } = useCreateUser();

    const cashiers = useMemo(
        () => parseApiList(usersDropdown).filter(isCashier),
        [usersDropdown]
    );

    const rows = useMemo(
        () =>
            cashiers.map((user) => ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: normalizeRole(user.role) || Role.CASHIER,
                isActive: user.isActive ?? true,
            })),
        [cashiers]
    );

    const handleCreateCashier = async (payload) => {
        await createUser({ ...payload, role: Role.CASHIER });
        await refreshUsersDropdown();
    };

    const columns = [
        {
            field: "firstName",
            headerName: "Name",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography className="text-sm!">
                    {[params.row.firstName, params.row.lastName].filter(Boolean).join(" ") || "-"}
                </Typography>
            ),
        },
        {
            field: "email",
            headerName: "Email",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography className="text-sm!">
                    {params.row.email || "-"}
                </Typography>
            ),
        },
        {
            field: "role",
            headerName: "Role",
            minWidth: 120,
            renderCell: () => (
                <Chip
                    size="small"
                    label="Cashier"
                    color="success"
                    variant="outlined"
                />
            ),
        },
        {
            field: "isActive",
            headerName: "Status",
            minWidth: 120,
            renderCell: (params) => (
                <Chip
                    size="small"
                    label={params.row.isActive ? "Active" : "Inactive"}
                    color={params.row.isActive ? "success" : "default"}
                    variant="outlined"
                />
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "a":
                    e.preventDefault();
                    addCashierButtonRef.current?.click();
                    break;

                case "r":
                    e.preventDefault();
                    refreshButtonRef.current?.click();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="flex flex-col gap-3 mt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <KitHeader
                    title='Cashiers'
                    subtitle="Cashiers for this store"
                    icon="tabler:user"
                    count={rows.length ?? 0}
                    countLabel="records"
                />
                <div className="flex gap-2">
                    <div className="relative">
                        <ShortcutBadge shortcut="Alt+A" />
                        <KitButton
                            ref={addCashierButtonRef}
                            size="small"
                            variant="contained"
                            className="w-auto"
                            startIcon={<KitIcon icon="tabler:user-plus" className="text-sm!" />}
                            onClick={() => setIsUserModalOpen(true)}
                        >
                            Add Cashier
                        </KitButton>
                    </div>
                    <div className="relative">
                        <ShortcutBadge shortcut="Alt+R" />
                        <IconButton
                            className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            onClick={() => refreshUsersDropdown()}
                        >
                            <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                        </IconButton>
                    </div>
                </div>
            </div>

            <KitDataGrid
                rows={rows}
                columns={columns}
                loading={isUsersDropdownLoading}
                rowCount={rows.length}
                paginationMode="client"
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                error={!!usersDropdownError}
            />

            <KitShow show={isUserModalOpen}>
                <UserFormModal
                    open={isUserModalOpen}
                    onClose={() => setIsUserModalOpen(false)}
                    onCreateUser={handleCreateCashier}
                    isSaving={isCreatingUser}
                    cashierOnly
                />
            </KitShow>
        </div>
    );
}
