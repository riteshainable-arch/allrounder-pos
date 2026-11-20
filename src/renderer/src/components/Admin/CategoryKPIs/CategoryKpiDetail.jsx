import { format } from "date-fns";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";
import { useGetAllSecondaryCategoryRevenue } from "../../../../../kit/hooks/data/category";
import { decodeCategoryKpiSlug } from "../../../../../kit/utils/categoryKpiSlug";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import TenantOrgBanner from "../AdminDasboard/TenantOrgBanner";
import SecondaryCategorySalesOverview from "./CategoryKPIsDetail/SecondaryCategorySalesOverview";
import BrandShare from "./CategoryKPIsDetail/BrandShare";
import SecondaryCategoryTable from "./CategoryKPIsDetail/SecondaryCategoryTable";
import SecondaryCategoryDetails from "./CategoryKPIsDetail/SecondaryCategoryDetails";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";

export default function CategoryKpiDetail() {
    const navigate = useNavigate();
    const { categorySlug } = useParams();
    const [searchParams] = useSearchParams();
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const categoryName = decodeCategoryKpiSlug(categorySlug);

    const params = {
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        ...(categoryName ? { category: categoryName } : {}),
    };

    const { secondaryCategoryRevenue, isSecondaryCategoryRevenueLoading } = useGetAllSecondaryCategoryRevenue(
        params,
        Boolean(startDate && endDate)
    );

    return (
        <div className="flex flex-col min-w-0 gap-4">
            <TenantOrgBanner />

            <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-app-text">Category: {categoryName || ""}</h2>
                <KitButton
                    size="small"
                    variant="contained"
                    className="w-fit"
                    startIcon={<KitIcon icon="tabler:arrow-left" />}
                    onClick={() => navigate("/admin", { state: { activeModule: "Category KPIs" } })}
                >
                    Back to Category KPIs
                </KitButton>
            </div>

            {isSecondaryCategoryRevenueLoading ? (
                <div className="flex min-h-[70vh] items-center justify-center">
                    <KitLoader isLoading />
                </div>
            ) : (
                <>
                    <div className="grid min-w-0 grid-cols-1 gap-3 md:gap-4 2xl:grid-cols-[75%_25%]">
                        <SecondaryCategorySalesOverview
                            secondaryCategoryRevenue={secondaryCategoryRevenue?.data ?? {}}
                        />
                        <BrandShare secondaryCategoryRevenue={secondaryCategoryRevenue?.data ?? {}} />
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-3 md:gap-4 2xl:grid-cols-[75%_25%]">
                        <SecondaryCategoryTable
                            secondaryCategoryRevenue={secondaryCategoryRevenue?.data?.brands ?? []}
                        />
                        <SecondaryCategoryDetails secondaryCategoryRevenue={secondaryCategoryRevenue?.data ?? {}} />
                    </div>
                </>
            )}
        </div>
    );
}
