import { useMemo, useState } from "react";
import KitDatePicker from "../../../../../kit/components/KitDatePicker";
import KitSelect from "../../../../../kit/components/KitSelect";
import { format, isValid, startOfMonth, startOfYear, subDays, subMonths } from "date-fns";
import TenantOrgBanner from "../AdminDasboard/TenantOrgBanner";
import {
    useGetAllCategoryList,
    useGetAllCategoryPopular,
    useGetAllCategoryRevenue,
    useGetAllCategoryStats,
} from "../../../../../kit/hooks/data/category";
import PopularProductAnalysis from "./PopularProductAnalysis";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";
import CategoryRevenue from "./CategoryRevenue";
import CateogryKpiTable from "./CateogryKpiTable";
import { useNavigate } from "react-router-dom";
import { encodeCategoryKpiSlug } from "../../../../../kit/utils/categoryKpiSlug";
import { InputAdornment } from "@mui/material";
import { CalendarMonthOutlined } from "@mui/icons-material";
import KitReactDatepicker from "../../../../../kit/components/KitReactDatepicker";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";

const today = new Date();

const datePresets = [
    { label: "Last 7 days", value: "last_7_days" },
    { label: "Last 30 days", value: "last_30_days" },
    { label: "Last 60 days", value: "last_60_days" },
    { label: "Last 90 days", value: "last_90_days" },
    { label: "This month", value: "this_month" },
    { label: "Last month", value: "last_month" },
    { label: "Year to date", value: "year_to_date" },
    { label: "Last 12 months", value: "last_12_months" },
    { label: "Custom range", value: "custom" },
];

const getPresetRange = (preset) => {
    const now = new Date();
    switch (preset) {
        case "last_7_days":
            return { start: subDays(now, 6), end: now };
        case "last_30_days":
            return { start: subDays(now, 29), end: now };
        case "last_60_days":
            return { start: subDays(now, 59), end: now };
        case "last_90_days":
            return { start: subDays(now, 89), end: now };
        case "this_month":
            return { start: startOfMonth(now), end: now };
        case "last_month": {
            const lastMonth = subMonths(now, 1);
            return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
        }
        case "year_to_date":
            return { start: startOfYear(now), end: now };
        case "last_12_months":
            return { start: subDays(now, 364), end: now };
        default:
            return null;
    }
};

const formatDate = (date) => (date && isValid(date) ? format(date, "yyyy-MM-dd") : "");

export default function CategoryKPIs() {
    const navigate = useNavigate();

    const initialRange = getPresetRange("last_60_days");
    const [preset, setPreset] = useState("last_60_days");
    const [draftStart, setDraftStart] = useState(initialRange.start);
    const [draftEnd, setDraftEnd] = useState(initialRange.end);
    const [category, setCategory] = useState("");

    const queryParams = {
        startDate: formatDate(draftStart),
        endDate: formatDate(draftEnd),
        ...(category && { category: category }),
    };
    const shouldFetch = Boolean(draftStart && draftEnd);

    const { categoryList, isCategoryListLoading, isValidatingCategoryList, refreshCategoryList } =
        useGetAllCategoryList(shouldFetch);
    const { categoryPopularList, isCategoryPopularLoading, isValidatingCategoryPopular, refreshCategoryPopular } =
        useGetAllCategoryPopular(queryParams ?? undefined, shouldFetch);
    const { categoryRevenueList, isCategoryRevenueLoading, isValidatingCategoryRevenue, refreshCategoryRevenue } =
        useGetAllCategoryRevenue(queryParams ?? undefined, shouldFetch);
    const { categoryStatsList, isCategoryStatsLoading, isValidatingCategoryStats, refreshCategoryStats } =
        useGetAllCategoryStats(queryParams ?? undefined, shouldFetch);

    const isLoading =
        isCategoryListLoading || isCategoryPopularLoading || isCategoryRevenueLoading || isCategoryStatsLoading;

    const handleLabelClick = (label) => {
        const slug = encodeCategoryKpiSlug(label);

        const queryParamString = new URLSearchParams({
            startDate: queryParams.startDate,
            endDate: queryParams.endDate,
        }).toString();

        navigate(`/category-kpis/${slug}?${queryParamString}`);
    };

    const handlePresetChange = (option) => {
        const nextPreset = option?.value || "last_60_days";
        setPreset(nextPreset);
        const range = getPresetRange(nextPreset);
        if (range) {
            setDraftStart(range.start);
            setDraftEnd(range.end);
        }
    };

    const categoryOptions = useMemo(
        () =>
            categoryList?.data
                ?.filter((category) => category.categories)
                .map((category) => ({
                    label: category.categories,
                    value: category.categories,
                })) ?? [],
        [categoryList]
    );

    const handleDateRangeChange = (dates) => {
        const [start, end] = dates;
        setDraftStart(start);
        setDraftEnd(end);
        setPreset("custom");
    };

    return (
        <div className="flex min-w-0 flex-col gap-3 md:gap-4">
            <TenantOrgBanner />

            <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-app-text">Category KPIs</h2>
                <div className="grid w-full grid-cols-2 gap-2 md:w-auto md:flex md:flex-wrap md:items-end md:gap-3">
                    <div className="w-full sm:w-52">
                        <KitSelect
                            placeholder="Select Category"
                            size="small"
                            isClearable
                            placeholderFontSize={14}
                            inputFontSize={14}
                            options={categoryOptions}
                            value={categoryOptions.find((option) => String(option.value) === String(category)) ?? ""}
                            onChange={(option) => setCategory(option?.value ?? "")}
                        />
                    </div>
                    <div className="w-full sm:w-52">
                        <KitSelect
                            size="small"
                            placeholderFontSize={14}
                            inputFontSize={14}
                            options={datePresets}
                            value={datePresets.find((option) => option.value === preset)}
                            onChange={handlePresetChange}
                            isClearable={false}
                        />
                    </div>
                    <div className="col-span-2 min-w-0 md:col-span-1">
                        <KitReactDatepicker
                            selectsRange
                            selected={draftStart}
                            startDate={draftStart}
                            endDate={draftEnd}
                            onChange={handleDateRangeChange}
                            maxDate={today}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Select date range"
                            popperClassName="!z-[99999]"
                            popperPlacement="bottom-end"
                            customInput={
                                <KitTextField
                                    size="small"
                                    fullWidth
                                    placeholderFontSize={14}
                                    placeholder="Select date range"
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <CalendarMonthOutlined sx={{ fontSize: 18 }} />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            }
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex min-h-[70vh] items-center justify-center">
                    <KitLoader isLoading />
                </div>
            ) : (
                <>
                    <div className="w-full">
                        <PopularProductAnalysis
                            categoryPopularList={categoryPopularList?.data ?? []}
                            queryParams={queryParams}
                        />
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-3 md:gap-4 2xl:grid-cols-[70%_30%]">
                        <CateogryKpiTable
                            categoryStatsList={categoryStatsList?.data ?? []}
                            handleLabelClick={handleLabelClick}
                        />
                        <CategoryRevenue
                            categoryRevenueList={categoryRevenueList?.data ?? { totalRevenue: "0", data: [] }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
