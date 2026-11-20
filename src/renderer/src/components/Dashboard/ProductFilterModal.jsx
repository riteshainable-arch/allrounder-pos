import { useEffect, useMemo, useRef, useState } from "react";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitModal from "../../../../kit/components/KitModal";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import KitSelect from "../../../../kit/components/KitSelect";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitTab from "../../../../kit/components/KitTab/KitTab";
import { FILTER_COLUMNS, FILTER_CONDITIONS, PRODUCT_FILTER_SHORTCUTS, SORT_OPTIONS, TABS } from "../../../../kit/configs/general";
import ShortcutBadge from "./ShortcutBadge";
import { EllipsisText } from "../../../../kit/utils/ellipsisText";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { Typography } from "@mui/material";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import { debounce } from "lodash";

export default function ProductFilterModal({ isOpen, onClose, products = [], cartRows = [], onAddProduct }) {
    const filterColumnRef = useRef(null);
    const sortingRef = useRef(null);
    const activeButtonRef = useRef(null);

    const [activeTab, setActiveTab] = useState("filters");
    const [column, setColumn] = useState("product");
    const [condition, setCondition] = useState("contains");
    const [filterValue, setFilterValue] = useState("");
    const [debouncedFilterValue, setDebouncedFilterValue] = useState("");
    const [sortBy, setSortBy] = useState("nameAsc");
    const [activeProductIndex, setActiveProductIndex] = useState(0);

    const productConditions = FILTER_CONDITIONS.filter((item) =>
        ["contains", "equals", "notEquals"].includes(item.value)
    );

    const availableConditions = column === "product" ? productConditions : FILTER_CONDITIONS;

    const previewProducts = useMemo(() => {
        if (!debouncedFilterValue?.trim()) {
            return [];
        }

        const searchValue = debouncedFilterValue.trim().toLowerCase();

        let filtered = products.filter((product) => {
            let productValue;

            switch (column) {
                case "product":
                    productValue = String(product.productName ?? "");
                    break;

                case "salePrice":
                    productValue = Number(
                        product.salePrice ??
                        product.latestSalePrice ??
                        0
                    );
                    break;

                case "mrp":
                    productValue = Number(
                        product.latestMRP ??
                        product.mrp ??
                        0
                    );
                    break;

                case "stock":
                    productValue = Number(
                        product.stockQty ?? 0
                    );
                    break;

                default:
                    return true;
            }

            // Product name filtering
            if (column === "product") {
                const textValue = String(productValue).toLowerCase();

                switch (condition) {
                    case "contains":
                        return textValue.includes(searchValue);

                    case "equals":
                        return textValue === searchValue;

                    case "notEquals":
                        return textValue !== searchValue;

                    default:
                        return true;
                }
            }

            // Numeric filtering
            const numericProductValue = Number(productValue);
            const numericFilterValue = Number(debouncedFilterValue);

            switch (condition) {
                case "contains":
                    return String(numericProductValue).includes(searchValue);

                case "equals":
                    return numericProductValue === numericFilterValue;

                case "notEquals":
                    return numericProductValue !== numericFilterValue;

                case "greaterThan":
                    return numericProductValue > numericFilterValue;

                case "greaterThanOrEqual":
                    return numericProductValue >= numericFilterValue;

                case "lessThan":
                    return numericProductValue < numericFilterValue;

                case "lessThanOrEqual":
                    return numericProductValue <= numericFilterValue;

                default:
                    return true;
            }
        });

        // SORT
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "nameAsc":
                    return String(a.productName || "")
                        .localeCompare(String(b.productName || ""));

                case "nameDesc":
                    return String(b.productName || "")
                        .localeCompare(String(a.productName || ""));

                case "salePriceAsc":
                    return (
                        Number(a.salePrice ?? a.latestSalePrice ?? 0) -
                        Number(b.salePrice ?? b.latestSalePrice ?? 0)
                    );

                case "salePriceDesc":
                    return (
                        Number(b.salePrice ?? b.latestSalePrice ?? 0) -
                        Number(a.salePrice ?? a.latestSalePrice ?? 0)
                    );

                case "mrpAsc":
                    return (
                        Number(a.latestMRP ?? a.mrp ?? 0) -
                        Number(b.latestMRP ?? b.mrp ?? 0)
                    );

                case "mrpDesc":
                    return (
                        Number(b.latestMRP ?? b.mrp ?? 0) -
                        Number(a.latestMRP ?? a.mrp ?? 0)
                    );

                case "quantityAsc":
                    return (
                        Number(a.quantity ?? a.qty ?? 0) -
                        Number(b.quantity ?? b.qty ?? 0)
                    );

                case "quantityDesc":
                    return (
                        Number(b.quantity ?? b.qty ?? 0) -
                        Number(a.quantity ?? a.qty ?? 0)
                    );

                case "stockAsc":
                    return (
                        Number(a.stockQty ?? 0) -
                        Number(b.stockQty ?? 0)
                    );

                case "stockDesc":
                    return (
                        Number(b.stockQty ?? 0) -
                        Number(a.stockQty ?? 0)
                    );

                default:
                    return 0;
            }
        });

        return filtered.slice(0, 10);

    }, [products, column, condition, debouncedFilterValue, sortBy]);

    const isProductAdded = (product) => {
        return cartRows.some(
            (row) =>
                String(row.productCode) === String(product.productCode) ||
                String(row.id) === String(product.id)
        );
    };

    const getNextAvailableIndex = (startIndex) => {
        for (let i = startIndex; i < previewProducts.length; i++) {
            if (!isProductAdded(previewProducts[i])) {
                return i;
            }
        }

        return -1;
    };

    const getPreviousAvailableIndex = (startIndex) => {
        for (let i = startIndex; i >= 0; i--) {
            if (!isProductAdded(previewProducts[i])) {
                return i;
            }
        }

        return -1;
    };

    const handleAddProduct = (product, index) => {
        if (isProductAdded(product)) {
            const nextIndex = getNextAvailableIndex(index + 1);
            setActiveProductIndex(nextIndex === -1 ? index : nextIndex);
            return;
        }

        onAddProduct(product);

        const nextIndex = getNextAvailableIndex(index + 1);

        if (nextIndex !== -1) {
            setActiveProductIndex(nextIndex);
        } else {
            setActiveProductIndex(-1);
        }
    };

    const columns = [
        {
            field: "productName",
            headerName: "Product name",
            minWidth: 700,
            flex: 1,
            renderCell: (params) =>
                <div className="flex items-center gap-2">
                    <EllipsisText className="text-sm!" text={params.row.productName || "-"} />
                </div>
        },
        {
            field: "price",
            headerName: "Sale Price",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {priceFormat(params.row.price)}
                </Typography>
            ),
        },
        {
            field: "mrp",
            headerName: "MRP",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {priceFormat(params.row.latestMRP || params.row.mrp)}
                </Typography>
            ),
        },
        {
            field: "actions",
            headerName: "Action",
            width: 110,
            sortable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                const added = isProductAdded(params.row);
                const productIndex = previewProducts.findIndex(
                    (product) => String(product.id) === String(params.row.id)
                );
                const isActive = productIndex === activeProductIndex && !added;

                return (
                    <KitButton
                        ref={isActive ? activeButtonRef : null}
                        size="small"
                        variant={added ? "outlined" : "contained"}
                        disabled={added}
                        startIcon={<KitIcon icon={added ? "tabler:check" : "tabler:plus"} />}
                        onFocus={() => {
                            if (!added) {
                                setActiveProductIndex(productIndex);
                            }
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "ArrowDown") {
                                event.preventDefault();
                                const nextIndex = getNextAvailableIndex(productIndex + 1);
                                if (nextIndex !== -1) {
                                    setActiveProductIndex(nextIndex);
                                }
                                return;
                            }

                            if (event.key === "ArrowUp") {
                                event.preventDefault();
                                const previousIndex = getPreviousAvailableIndex(productIndex - 1);
                                if (previousIndex !== -1) {
                                    setActiveProductIndex(previousIndex);
                                }
                                return;
                            }

                            if (event.key === "Enter") {
                                event.preventDefault();
                                if (!added) {
                                    handleAddProduct(params.row, productIndex);
                                }
                            }
                        }}
                    >
                        {added ? "Added" : "Add"}
                    </KitButton>
                );
            },
        },
    ];

    useEffect(() => {
        if (!isOpen) return;

        setColumn("product");
        setCondition("contains");
        setFilterValue("");
        setSortBy("nameAsc");
        setActiveTab("filters");
    }, [isOpen]);

    const handleReset = () => {
        debouncedFilter.cancel();
        setColumn("product");
        setCondition("contains");
        setFilterValue("");
        setDebouncedFilterValue("");
        setSortBy("nameAsc");
        setActiveProductIndex(0);
    };

    const debouncedFilter = useRef(
        debounce((value) => {
            setDebouncedFilterValue(value);
        }, 300)
    ).current;

    useEffect(() => {
        return () => {
            debouncedFilter.cancel();
        };
    }, [debouncedFilter]);

    useEffect(() => {
        if (!isOpen || activeProductIndex < 0) return;

        const timer = setTimeout(() => {
            activeButtonRef.current?.focus?.();
        }, 100);

        return () => clearTimeout(timer);
    }, [activeProductIndex, isOpen]);

    useEffect(() => {
        if (!previewProducts.length) {
            setActiveProductIndex(-1);
            return;
        }

        setActiveProductIndex((currentIndex) => {
            if (currentIndex >= 0 && currentIndex < previewProducts.length) {
                return currentIndex;
            }

            return getNextAvailableIndex(0);
        });
    }, [previewProducts]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event) => {
            if (!event.shiftKey) return;
            if (event.code === "KeyR") {
                event.preventDefault();
                handleReset();
            }
            if (event.code === "Digit1") {
                event.preventDefault();
                setActiveTab("filters");
            }
            if (event.code === "Digit2") {
                event.preventDefault();
                setActiveTab("sorting");
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            if (activeTab === "filters") {
                filterColumnRef.current?.focus?.();
            }

            if (activeTab === "sorting") {
                sortingRef.current?.focus?.();
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [activeTab, isOpen]);

    return (
        <KitModal
            maxWidth="lg"
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 text-base font-semibold">
                    <KitIcon icon="tabler:adjustments-horizontal" className="text-xl text-primary" />
                    Filter & Sorting
                </div>
            }
            titleClass="p-3! border-b"
        >
            <div className="p-4">
                <KitTab
                    tabList={TABS.map((tab) => ({
                        ...tab,
                        label: (
                            <div className="relative flex items-center gap-1">
                                <span>{tab.label}</span>
                                <ShortcutBadge shortcut={PRODUCT_FILTER_SHORTCUTS[tab.value]} className="left-0! w-fit!" />
                            </div>
                        ),
                    }))}
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                />

                {activeTab === "filters" && (
                    <div className="mt-5">
                        <div className="mb-4 text-sm text-third-500">
                            Filter products using sale price, mrp or stock.
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <KitSelect
                                ref={filterColumnRef}
                                label="Column"
                                placeholder="Select column"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                menuShouldScrollIntoView={false}
                                styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
                                options={FILTER_COLUMNS}
                                value={FILTER_COLUMNS.find((opt) => opt.value === column) ?? null}
                                onChange={(option) => {
                                    const newColumn = option?.value || "product";

                                    setColumn(newColumn);

                                    if (newColumn === "product" && !["contains", "equals", "notEquals"].includes(condition)) {
                                        setCondition("contains");
                                    }
                                }}
                            />
                            <KitSelect
                                label="Condition"
                                placeholder="Select condition"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                menuShouldScrollIntoView={false}
                                styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
                                options={availableConditions}
                                value={availableConditions.find((item) => item.value === condition) ?? null}
                                onChange={(option) => setCondition(option?.value || "")}
                            />
                            <KitTextField
                                label="Filter Value"
                                placeholder="Enter value"
                                type={column === "product" ? "text" : "number"}
                                size="small"
                                height="32px"
                                placeholderFontSize={14}
                                value={filterValue}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setFilterValue(value);
                                    debouncedFilter(value);
                                }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "sorting" && (
                    <div className="mt-5">
                        <div className="mb-4 text-sm text-third-500">
                            Select how products should be displayed.
                        </div>

                        <KitSelect
                            ref={sortingRef}
                            label="Sort By"
                            placeholder="Select sorting"
                            size="small"
                            placeholderFontSize={14}
                            inputFontSize={14}
                            menuShouldScrollIntoView={false}
                            styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
                            options={SORT_OPTIONS}
                            value={SORT_OPTIONS.find((item) => item.value === sortBy) ?? null}
                            onChange={(option) => setSortBy(option?.value || "nameAsc")}
                        />
                    </div>
                )}

                {debouncedFilterValue.trim() && (
                    <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm font-semibold text-third-800">
                                Matching Products
                            </div>

                            {previewProducts.length > 0 && (
                                <div className="text-xs text-third-500">
                                    Showing {previewProducts.length} product
                                    {previewProducts.length !== 1 ? "s" : ""}
                                </div>
                            )}
                        </div>

                        <KitDataGrid
                            rows={previewProducts}
                            columns={columns}
                            hideFooter
                            disableRowSelectionOnClick
                            rowHeight={50}
                            getRowId={(row) => row.id}
                            autoHeight
                            localeText={{ noRowsLabel: "No matching products found." }}
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200! p-3 pt-6">
                <div className="relative">
                    <ShortcutBadge shortcut="Shift + R" />
                    <KitButton
                        className="w-auto"
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<KitIcon icon="tabler:rotate-2" />}
                        onClick={handleReset}
                    >
                        Reset
                    </KitButton>
                </div>
                <KitButton
                    className="w-auto"
                    variant="outlined"
                    size="small"
                    onClick={onClose}
                >
                    Cancel
                </KitButton>
            </div>
        </KitModal>
    );
}