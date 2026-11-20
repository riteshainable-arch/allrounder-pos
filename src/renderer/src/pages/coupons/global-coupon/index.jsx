import { Chip, Divider, Switch, Typography } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useEffect, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import KitDebouncedInput from "../../../../../kit/components/KitDebouncedInput";
import KitShow from "../../../../../kit/components/KitShow/KitShow";
import KitDeleteDialog from "../../../../../kit/components/KitDeleteDialog";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
    useDeleteGlobalCoupon,
    useGetAllGlobalCouponList,
    useUpdateGlobalCouponStatus,
} from "../../../../../kit/hooks/data/globalCoupons";
import { formatPrice } from "../../../../../kit/utils/priceFormat";
import AddUpdateGlobalCouponModal from "../../../components/Coupons/GlobalCoupons/AddUpdateGlobalCouponModal";

export default function GlobalCoupon() {
    const searchRef = useRef(null);
    const refreshRef = useRef(null);
    const createRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [selectedItem, setSelectedItem] = useState();
    const [isAddUpdateModalOpen, setIsAddUpdateModalOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [activeColumn, setActiveColumn] = useState("delete");

    const { globalCouponList, isGlobalCouponListLoading, globalCouponListError, refreshpGlobalCouponList } =
        useGetAllGlobalCouponList({
            page,
            size: pageSize,
            search: search,
        });
    const { deleteRecord, isDeleting } = useDeleteGlobalCoupon(String(selectedItem?.id));
    const { update: onUpdateCouponStatus, isUpdatingGlobalCouponStatus } = useUpdateGlobalCouponStatus(
        String(selectedItem?.id)
    );

    const couponRows = globalCouponList?.data?.items ?? [];

    const toggleAddUpdateCGSTModal = () => setIsAddUpdateModalOpen(!isAddUpdateModalOpen);
    const toggleDeleteDialog = () => setShowDeleteDialog(!showDeleteDialog);
    const toggleStatusModal = () => setIsStatusModalOpen(!isStatusModalOpen);

    const handleAdd = () => {
        setSelectedItem(undefined);
        toggleAddUpdateCGSTModal();
    };

    const handleDelete = (data) => {
        setSelectedItem(data);
        toggleDeleteDialog();
    };

    const handlStaus = (data) => {
        setSelectedItem(data);
        toggleStatusModal();
    };

    const onDelete = async () => {
        if (selectedItem) {
            try {
                await deleteRecord(selectedItem);
                toast.success("Global Coupon Deleted successfully!");
                refreshpGlobalCouponList();
                toggleDeleteDialog();
            } catch (error) {
                toast.error("Failed to delete");
            } finally {
                setDeleteId("");
                setSelectedItem(undefined);
            }
        }
    };

    const onStatus = async () => {
        if (selectedItem) {
            try {
                await onUpdateCouponStatus({ isActive: !selectedItem?.isActive });
                toggleStatusModal();
                toast.success("Global Coupon Status Updated successfully!");
                refreshpGlobalCouponList();
                toggleStatusModal();
            } catch (error) {
                toast.error("Failed to Update");
            } finally {
                setStatusId("");
                setSelectedItem(undefined);
            }
        }
    };

    const columns = [
        {
            field: "schemeCode",
            headerName: "Scheme Code",
            minWidth: 150,
            flex: 0.8,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.schemeCode ?? "-"}>
                    {params.row.schemeCode || "-"}
                </Typography>
            ),
        },
        {
            field: "schemeName",
            headerName: "Scheme Name",
            minWidth: 200,
            flex: 1.2,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.schemeName ?? ""}>
                    {params.row.schemeName || "-"}
                </Typography>
            ),
        },
        {
            field: "description",
            headerName: "Description",
            minWidth: 200,
            flex: 1.2,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.description ?? ""}>
                    {params.row.description || "-"}
                </Typography>
            ),
        },
        {
            field: "schemeType",
            headerName: "Scheme Type",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.row.schemeType === "ITEM_PRICE"
                        ? "Item Price"
                        : params.row.schemeType === "BILL_DISCOUNT"
                          ? "Bill Discount"
                          : "-"}
                </Typography>
            ),
        },
        {
            field: "discountType",
            headerName: "Discount Type",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2">{params.row.discountType?.replaceAll("_", " ") || "-"}</Typography>
            ),
        },
        {
            field: "minBillAmount",
            headerName: "Min Bill Amount",
            minWidth: 150,
            flex: 0.9,
            renderCell: (params) => (
                <Typography variant="body2">₹{formatPrice(params.row.minBillAmount ?? 0)}</Typography>
            ),
        },
        {
            field: "reward",
            headerName: "Reward",
            minWidth: 180,
            flex: 1,
            sortable: false,
            renderCell: (params) => {
                const { schemeType, discountType, discountValue, maxDiscountAmount } = params.row;

                if (discountValue == null) {
                    return <Typography variant="body2">-</Typography>;
                }

                if (discountType === "PRICE") {
                    return <Typography variant="body2">₹{formatPrice(discountValue)} per item</Typography>;
                }

                if (discountType === "PERCENTAGE") {
                    return (
                        <Typography variant="body2">
                            {discountValue}% off
                            {schemeType === "BILL_DISCOUNT" && maxDiscountAmount != null
                                ? ` (max ₹${formatPrice(maxDiscountAmount)})`
                                : ""}
                        </Typography>
                    );
                }

                return <Typography variant="body2">₹{formatPrice(discountValue)} off</Typography>;
            },
        },
        {
            field: "validFrom",
            headerName: "Valid From",
            minWidth: 140,
            flex: 0.8,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.row.validFrom ? format(new Date(params.row.validFrom), "dd MMM yyyy") : "-"}
                </Typography>
            ),
        },
        {
            field: "validTill",
            headerName: "Valid Till",
            minWidth: 140,
            flex: 0.8,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.row.validTill ? format(new Date(params.row.validTill), "dd MMM yyyy") : "-"}
                </Typography>
            ),
        },
        {
            field: "isActive",
            headerName: "Status",
            minWidth: 120,
            flex: 0.7,
            renderCell: (params) => (
                <Chip
                    size="small"
                    label={params.row.isActive ? "ACTIVE" : "INACTIVE"}
                    color={params.row.isActive ? "success" : "error"}
                    variant="outlined"
                    className="text-xs! p-0!"
                />
            ),
        },
        {
            field: "active",
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
            width: 100,
            sortable: false,
            disableColumnMenu: true,
            headerClassName: "sticky-column",
            cellClassName: "sticky-column",
            renderHeader: () => <Typography variant="body2">Actions</Typography>,
            renderCell: (params) => (
                <div className="flex gap-2">
                    <KitButton
                        size="small"
                        variant="outlined"
                        color="error"
                        className="w-auto!"
                        onClick={() => handleDelete(params.row)}
                    >
                        Delete
                    </KitButton>
                </div>
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            e.preventDefault();

            switch (e.key.toLowerCase()) {
                case "o":
                    searchRef.current?.focus();
                    break;

                case "c":
                    createRef.current?.click();
                    break;

                case "r":
                    refreshRef.current?.click();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (!couponRows.length) return;

        const row = couponRows[activeRowIndex];
        if (!row) return;

        const rows = document.querySelectorAll(".MuiDataGrid-row");
        const activeGridRow = Array.from(rows).find((element) => element.getAttribute("data-id") === String(row.id));

        if (!activeGridRow) return;

        const element =
            activeColumn === "switch"
                ? activeGridRow.querySelector('input[type="checkbox"]')
                : activeGridRow.querySelector("button");

        if (element instanceof HTMLElement) {
            element.focus({ preventScroll: true });
        }
    }, [activeRowIndex, activeColumn, couponRows]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!couponRows.length) return;

            const target = e.target;

            if (
                target instanceof HTMLElement &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) &&
                !target.closest(".MuiDataGrid-cell")
            ) {
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();

                const row = couponRows[activeRowIndex];

                if (!row) return;

                if (activeColumn === "switch") {
                    handlStaus(row);
                } else {
                    handleDelete(row);
                }

                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                setActiveRowIndex((prev) => Math.min(prev + 1, couponRows.length - 1));
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                return;
            }

            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();
                setActiveColumn(e.key === "ArrowLeft" ? "switch" : "delete");
                return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [couponRows, activeRowIndex, activeColumn]);

    useEffect(() => {
        setActiveRowIndex(0);
        setActiveColumn("delete");
    }, [page, pageSize, search]);

    return (
        <div>
            <Divider className="mb-5!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <div className="flex justify-between">
                    <KitHeader
                        title="Global Coupons"
                        subtitle="View and manage coupon details and discounts"
                        icon="tabler:file-invoice"
                        count={globalCouponList?.data?.totalItems ?? 0}
                        countLabel="records"
                    />

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + O" className="-top-5!" />
                            <KitDebouncedInput
                                ref={searchRef}
                                value={search}
                                onChange={(value) => setSearch(String(value))}
                                placeholder="Product Name / Product Code"
                                className="w-52"
                                size="small"
                            />
                        </div>

                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + C" className="-top-5" />
                            <KitButton
                                ref={createRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                onClick={() => handleAdd()}
                            >
                                Add
                            </KitButton>
                        </div>

                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <KitButton
                                ref={refreshRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                onClick={() => refreshpGlobalCouponList()}
                            >
                                Refresh
                            </KitButton>
                        </div>
                    </div>
                </div>

                <KitDataGrid
                    columns={columns}
                    rows={couponRows}
                    getRowId={(row) => row.id}
                    rowCount={globalCouponList?.data?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    isLoading={isGlobalCouponListLoading}
                    error={!!globalCouponListError}
                    disableRowSelectionOnClick
                    getRowClassName={(params) =>
                        couponRows[activeRowIndex]?.id === params.row.id ? "keyboard-active-row" : ""
                    }
                    sx={{
                        "& .keyboard-active-row": {
                            backgroundColor: "var(--mui-palette-customColors-primaryHover, #E8F5E9) !important",
                            outline: "2px solid var(--mui-palette-primary-main, #5AC268)",
                            outlineOffset: "-2px",
                        },
                        "& .keyboard-active-row:hover": {
                            backgroundColor: "var(--mui-palette-customColors-primaryHover, #E8F5E9) !important",
                        },
                        "& .keyboard-active-row .MuiDataGrid-cell": {
                            backgroundColor: "transparent",
                        },
                    }}
                />
            </div>

            <KitShow show={isAddUpdateModalOpen}>
                <AddUpdateGlobalCouponModal
                    isOpen={isAddUpdateModalOpen}
                    onClose={toggleAddUpdateCGSTModal}
                    onRefresh={refreshpGlobalCouponList}
                    selectedItem={selectedItem}
                />
            </KitShow>

            <KitShow show={showDeleteDialog}>
                <KitDeleteDialog
                    isOpen={showDeleteDialog}
                    onClose={toggleDeleteDialog}
                    title={`Delete the coupon`}
                    subTitle={`Are you sure to delete this Coupon?`}
                    onDelete={onDelete}
                    isBtnLoading={isDeleting}
                />
            </KitShow>

            <KitShow show={isStatusModalOpen}>
                <KitDeleteDialog
                    isOpen={isStatusModalOpen}
                    onClose={toggleStatusModal}
                    title={selectedItem?.isActive ? "Suspend Global Coupon Scheme?" : "Activate Global Coupon Scheme?"}
                    subTitle={
                        selectedItem?.isActive
                            ? "Are you sure you want to suspend this global coupon scheme? Customers will no longer be able to use it."
                            : "Are you sure you want to activate this global coupon scheme? Customers will be able to use it according to its validity and eligibility rules."
                    }
                    onDelete={onStatus}
                    isBtnLoading={isUpdatingGlobalCouponStatus}
                />
            </KitShow>
        </div>
    );
}
