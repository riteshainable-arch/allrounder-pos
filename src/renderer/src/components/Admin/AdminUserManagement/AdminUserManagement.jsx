import { Chip, IconButton, Paper, Switch, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { toast } from "react-toastify";
import KitSelect from "../../../../../kit/components/KitSelect";
import { useGetAllUsersList, useUpdateUserStatus } from "../../../../../kit/hooks/data/users";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { STATUS_FILTER_OPTIONS } from "../../../../../kit/configs/general";
import KitDeleteDialog from "../../../../../kit/components/KitDeleteDialog";
import KitShow from "../../../../../kit/components/KitShow/KitShow";
import { format } from "date-fns";
import AdminResetPasswordModal from "./AdminResetPasswordModal";
import AddUpdateUserModal from "./AddUpdateUserModal";

export default function CrmItemsTab() {
    const nameRef = useRef(null);
    const linkRef = useRef(null);
    const refreshRef = useRef(null);
    const importRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [selectedItem, setSelectedItem] = useState();
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [showRemarkDialog, setShowRemarkDialog] = useState(false);
    const [isAddUpdateModalOpen, setIsAddUpdateModalOpen] = useState(false);
    const [activeColumn, setActiveColumn] = useState("switch");

    const query = {
        page,
        limit: pageSize,
        ...(search && { search: search }),
        ...(statusFilter && { isActive: statusFilter }),
    };

    const { UsersList, isUsersListLoading, UsersListError, refreshpUsersList } = useGetAllUsersList(query);
    const { update: onUpdateUserStatus, isUpdatingUserStatus } = useUpdateUserStatus(String(selectedItem?.id));

    const toggleStatusModal = () => setIsStatusModalOpen(!isStatusModalOpen);
    const toggleRemarkModal = () => setShowRemarkDialog(!showRemarkDialog);
    const toggleAddUpdateCGSTModal = () => setIsAddUpdateModalOpen(!isAddUpdateModalOpen);

    const dataRows = UsersList?.data?.users ?? [];

    const handlStaus = (data) => {
        setSelectedItem(data);
        toggleStatusModal();
    };

    const handlPassword = (data) => {
        setSelectedItem(data);
        toggleRemarkModal();
    };

    const handleAdd = () => {
        setSelectedItem(undefined);
        toggleAddUpdateCGSTModal();
    };

    const handleEditRow = (data) => {
        setSelectedItem(data);
        toggleAddUpdateCGSTModal();
    };

    const onStatus = async () => {
        if (selectedItem) {
            try {
                await onUpdateUserStatus({ isActive: !selectedItem?.isActive });
                toast.success("User Status Updated successfully!");
                refreshpUsersList();
                toggleStatusModal();
            } catch (error) {
                toast.error("Failed to Update");
            } finally {
                setStatusId("");
                setSelectedItem(undefined);
            }
        }
    };

    const getFullName = (user) => `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Unnamed user";

    const columns = [
        {
            field: "user",
            headerName: "User",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={getFullName(params.row)}>
                    {getFullName(params.row)}
                </Typography>
            ),
        },
        {
            field: "email",
            headerName: "Email",
            minWidth: 200,
            flex: 1.2,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.email ?? ""}>
                    {params.row.email || "-"}
                </Typography>
            ),
        },
        {
            field: "role",
            headerName: "Role",
            minWidth: 140,
            flex: 0.8,
            sortable: false,
            renderCell: (params) => (
                <Chip label={params.row.role || "-"} color="info" variant="outlined" size="small" />
            ),
        },
        {
            field: "status",
            headerName: "isActive",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Chip
                    label={params.row.isActive === false ? "Login blocked" : "Login allowed"}
                    variant="outlined"
                    color={params.row.isActive === false ? "error" : "success"}
                    size="small"
                    className="text-xs!"
                />
            ),
        },
        {
            field: "b2bRoles",
            headerName: "B2B Roles",
            minWidth: 260,
            flex: 1.2,
            sortable: false,
            renderCell: (params) => {
                const user = params.row;

                return (
                    <div className="flex flex-wrap items-center gap-1">
                        {user.isB2BMode && <Chip label="B2B Mode" color="info" variant="outlined" size="small" />}

                        {user.canConvertToInvoice && (
                            <Chip label="Invoice" color="success" variant="outlined" size="small" />
                        )}

                        {user.canConvertToConsumption && (
                            <Chip label="Consumption" color="secondary" variant="outlined" size="small" />
                        )}

                        {!user.isB2BMode && !user.canConvertToInvoice && !user.canConvertToConsumption && (
                            <Typography variant="caption" color="text.disabled">
                                -
                            </Typography>
                        )}
                    </div>
                );
            },
        },
        {
            field: "lastLoginAt",
            headerName: "Last Login",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2">{format(params.row.lastLoginAt, "dd MMM yyyy, hh:mm a")}</Typography>
            ),
        },
        {
            field: "isActive",
            headerName: "Active",
            minWidth: 100,
            flex: 0.6,
            sortable: false,
            renderCell: (params) => (
                <Switch
                    size="small"
                    checked={params.row.isActive ?? false}
                    onChange={() => handlStaus(params.row)}
                    sx={{
                        "& .MuiSwitch-switchBase.Mui-focusVisible": {
                            outline: "none",
                        },
                        "&:has(.MuiSwitch-input:focus)": {
                            outline: "2px solid #cda500",
                            outlineOffset: "2px",
                            borderRadius: "20px",
                        },
                    }}
                />
            ),
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 160,
            flex: 0.8,
            sortable: false,
            filterable: false,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <div className="flex items-center justify-end gap-1">
                    <KitButton
                        size="small"
                        variant="outlined"
                        className="w-auto!"
                        onClick={() => handleEditRow?.(params.row)}
                    >
                        Edit
                    </KitButton>

                    <KitButton
                        size="small"
                        variant="outlined"
                        className="w-auto!"
                        onClick={() => handlPassword?.(params.row)}
                    >
                        Password
                    </KitButton>
                </div>
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "n":
                    nameRef.current?.focus();
                    break;
                case "s":
                    linkRef.current?.focus();
                    break;
                case "a":
                    importRef.current?.click();
                    break;
                case "r":
                    refreshRef.current?.click();
                    break;
                default:
                    return;
            }

            e.preventDefault();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (!dataRows.length) return;

        const row = dataRows[activeRowIndex];
        if (!row) return;

        let secondFrameId;

        const firstFrameId = requestAnimationFrame(() => {
            secondFrameId = requestAnimationFrame(() => {
                const activeGridRow = Array.from(document.querySelectorAll(".MuiDataGrid-row")).find(
                    (element) => element.getAttribute("data-id") === String(row.id)
                );

                if (!activeGridRow) return;

                let element = null;

                switch (activeColumn) {
                    case "switch":
                        element = activeGridRow.querySelector(".MuiDataGrid-cell[data-field='isActive'] input");
                        break;

                    case "edit":
                        element = activeGridRow.querySelector(
                            ".MuiDataGrid-cell[data-field='actions'] button:nth-of-type(1)"
                        );
                        break;

                    case "password":
                        element = activeGridRow.querySelector(
                            ".MuiDataGrid-cell[data-field='actions'] button:nth-of-type(2)"
                        );
                        break;
                }

                element?.focus({ preventScroll: true });
            });
        });

        return () => {
            cancelAnimationFrame(firstFrameId);
            if (secondFrameId) cancelAnimationFrame(secondFrameId);
        };
    }, [dataRows, activeRowIndex, activeColumn]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const target = e.target;

            if (
                target instanceof HTMLElement &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) &&
                !(target instanceof HTMLInputElement && target.type === "checkbox")
            ) {
                return;
            }

            if (!dataRows.length) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();

                setActiveColumn("switch");
                setActiveRowIndex((prev) => Math.min(prev + 1, dataRows.length - 1));
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();

                setActiveColumn("switch");
                setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                return;
            }

            if (e.key === "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();

                setActiveColumn((prev) => (prev === "switch" ? "edit" : prev === "edit" ? "password" : "password"));
                return;
            }

            if (e.key === "ArrowLeft") {
                e.preventDefault();
                e.stopPropagation();

                setActiveColumn((prev) => (prev === "password" ? "edit" : prev === "edit" ? "switch" : "switch"));
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);

        return () => window.removeEventListener("keydown", handleKeyDown, true);
    }, [dataRows, activeRowIndex]);

    useEffect(() => {
        setActiveRowIndex(0);
    }, [page, pageSize, search, statusFilter]);

    useEffect(() => {
        setActiveRowIndex((prev) => (dataRows.length === 0 ? 0 : Math.min(prev, dataRows.length - 1)));
    }, [dataRows.length]);

    return (
        <div>
            <div className="flex flex-col gap-3 w-full min-w-0">
                <KitHeader
                    title="User Management"
                    subtitle="Create login accounts, reset passwords and control access to Allrounder."
                    icon="tabler:file-invoice"
                    count={UsersList?.data?.totalItems ?? 0}
                    countLabel="records"
                />
                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="grid grid-cols-2 items-end gap-x-2 gap-y-3 md:flex md:flex-wrap md:gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + N" className="top-0 hidden md:block" />
                            <KitTextField
                                inputRef={nameRef}
                                size="small"
                                height="32px"
                                label="Search"
                                placeholderFontSize={14}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name or email"
                                className="w-full sm:w-56"
                            />
                        </div>
                        <div className="relative w-full min-w-0 sm:w-60">
                            <ShortcutBadge shortcut="Alt + S" className="top-0 hidden md:block" />
                            <KitSelect
                                ref={linkRef}
                                label="Status"
                                placeholder="Select Status"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={STATUS_FILTER_OPTIONS}
                                value={
                                    STATUS_FILTER_OPTIONS.find(
                                        (option) => String(option.value) === String(statusFilter)
                                    ) ?? ""
                                }
                                onChange={(option) => setStatusFilter(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + A" className="-top-5 hidden md:block" />
                            <KitButton
                                ref={importRef}
                                size="small"
                                variant="contained"
                                className="w-full md:w-auto"
                                onClick={() => handleAdd()}
                            >
                                Add User
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5 hidden md:block" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshpUsersList()}
                                className="w-full! md:w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <KitDataGrid
                    columns={columns}
                    rows={UsersList?.data?.users || []}
                    getRowId={(row) => row.id}
                    rowCount={UsersList?.data?.totalItems ?? 0}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    loading={isUsersListLoading}
                    error={!!UsersListError}
                    disableRowSelectionOnClick
                    sx={{
                        "& .MuiDataGrid-cellCheckbox .MuiCheckbox-root:focus-within": {
                            outline: "2px solid #cda500",
                            outlineOffset: 0,
                            borderRadius: "4px",
                        },
                    }}
                    getRowClassName={(params) =>
                        dataRows[activeRowIndex]?.id === params.id ? "keyboard-active-row" : ""
                    }
                />
            </div>

            <KitShow show={isStatusModalOpen}>
                <KitDeleteDialog
                    isOpen={isStatusModalOpen}
                    onClose={toggleStatusModal}
                    title={selectedItem?.isActive ? "Suspend User?" : "Activate User?"}
                    subTitle={
                        selectedItem?.isActive
                            ? "Are you sure you want to suspend this user? They will no longer be able to log in."
                            : "Are you sure you want to activate this user? They will be able to log in and access the system."
                    }
                    onDelete={onStatus}
                    isBtnLoading={isUpdatingUserStatus}
                />
            </KitShow>

            <KitShow show={showRemarkDialog}>
                <AdminResetPasswordModal
                    isOpen={showRemarkDialog}
                    onClose={toggleRemarkModal}
                    selectedItem={selectedItem}
                    onRefresh={refreshpUsersList}
                />
            </KitShow>

            <KitShow show={isAddUpdateModalOpen}>
                <AddUpdateUserModal
                    isOpen={isAddUpdateModalOpen}
                    onClose={toggleAddUpdateCGSTModal}
                    onRefresh={refreshpUsersList}
                    selectedItem={selectedItem}
                />
            </KitShow>
        </div>
    );
}
