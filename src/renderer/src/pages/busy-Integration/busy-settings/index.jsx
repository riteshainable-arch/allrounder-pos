import { Divider, Grid, IconButton, Paper, Typography, FormControlLabel, Checkbox } from "@mui/material";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import KitShow from "../../../../../kit/components/KitShow/KitShow";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import { useGetAllBusySettings, useGetAllBusyMasters, useUpdateBusySettings } from "../../../../../kit/hooks/data/busy";
import KitSelect from "../../../../../kit/components/KitSelect";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";

const defaultValues = {
    enabled: false,
    autoPushBills: true,
    companyCode: "",
    financialYear: "",
    referencePrefix: "",
    saleType: "",
    orderSaleType: "",
    materialCenter: "",
    invoiceSeries: "",
    orderSeries: "",
    posCustomer: "",
    customerGroup: "",
    itemGroup: "",
    itemUnit: "",
    taxCategoryPattern: "",
};

export default function BusySettings() {
    const refreshRef = useRef(null);
    const saveRef = useRef(null);

    const { BusySettingsList, isBusySettingsListLoading, BusySettingsListError, refreshBusySettingsList } =
        useGetAllBusySettings();
    const { BusyMastersList, isBusyMastersListLoading, BusyMastersListError, refreshBusyMastersList } =
        useGetAllBusyMasters();
    const { update: onUpdateBusySettings, isUpdatingBusySettings } = useUpdateBusySettings();

    const { control, handleSubmit, reset, setFocus } = useForm({
        defaultValues,
    });

    useEffect(() => {
        const settings = BusySettingsList?.data;

        if (settings) {
            reset({
                ...defaultValues,
                ...settings,
                enabled: !!settings.enabled,
                autoPushBills: settings.autoPushBills !== false,
                companyCode: settings.companyCode ?? "",
                financialYear: settings.financialYear ?? "",
                referencePrefix: settings.referencePrefix ?? "",
                saleType: settings.saleType ?? "",
                orderSaleType: settings.orderSaleType ?? "",
                materialCenter: settings.materialCenter ?? "",
                invoiceSeries: settings.invoiceSeries ?? "",
                orderSeries: settings.orderSeries ?? "",
                posCustomer: settings.posCustomer ?? "",
                customerGroup: settings.customerGroup ?? "",
                itemGroup: settings.itemGroup ?? "",
                itemUnit: settings.itemUnit ?? "",
                taxCategoryPattern: settings.taxCategoryPattern ?? "",
            });
        }
    }, [BusySettingsList?.data, reset]);

    const onSubmit = async (values) => {
        try {
            const payload = {
                enabled: !!values.enabled,
                companyCode: values.companyCode,
                financialYear: values.financialYear || null,
                saleType: values.saleType,
                orderSaleType: values.orderSaleType,
                taxCategoryPattern: values.taxCategoryPattern,
                materialCenter: values.materialCenter,
                invoiceSeries: values.invoiceSeries,
                orderSeries: values.orderSeries,
                posCustomer: values.posCustomer,
                customerGroup: values.customerGroup,
                itemGroup: values.itemGroup,
                itemUnit: values.itemUnit,
                referencePrefix: values.referencePrefix,
                autoPushBills: values.autoPushBills !== false,
            };

            const res = await onUpdateBusySettings(payload);
            toast.success(res?.message || "BUSY settings saved successfully");
            refreshBusySettingsList();
        } catch (error) {
            toast.error(error?.message || "Unable to save BUSY settings");
        }
    };

    const refresh = () => {
        refreshBusySettingsList();
        refreshBusyMastersList();
    };

    const SaleTypeOptions = [
        { label: "Auto", value: "" },
        ...(BusyMastersList?.data?.saleTypes
            ?.filter((item) => item.sale_type_name)
            .map((item) => ({
                label: item.sale_type_name,
                value: item.sale_type_name,
            })) ?? []),
    ];

    const MaterialCenterOptions = [
        { label: "Auto", value: "" },
        ...(BusyMastersList?.data?.materialCenters
            ?.filter((item) => item.mc_name)
            .map((item) => ({
                label: item.mc_name,
                value: item.mc_name,
            })) ?? []),
    ];

    const InvoiceSeriesOptions = [
        { label: "BUSY default", value: "" },
        ...(BusyMastersList?.data?.voucherSeries
            ?.filter((item) => item.voucher_series_name)
            .map((item) => ({
                label: item.voucher_series_name,
                value: item.voucher_series_name,
            })) ?? []),
    ];

    const OrderSeriesOptions = [
        { label: "BUSY default", value: "" },
        ...(BusyMastersList?.data?.voucherSeries
            ?.filter((item) => item.voucher_series_name)
            .map((item) => ({
                label: item.voucher_series_name,
                value: item.voucher_series_name,
            })) ?? []),
    ];

    useEffect(() => {
        if (isBusySettingsListLoading || !BusySettingsList?.data) return;

        const timer = setTimeout(() => {
            setFocus("companyCode");
        }, 100);

        return () => clearTimeout(timer);
    }, [isBusySettingsListLoading, BusySettingsList?.data, setFocus]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            if (e.key.toLowerCase() === "s") {
                e.preventDefault();
                saveRef.current?.click();
            }

            if (e.key.toLowerCase() === "r") {
                e.preventDefault();
                refreshRef.current?.click();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const Section = ({ title, children }) => (
        <Paper variant="outlined" className="p-4! rounded-xl!">
            <Typography variant="subtitle1" fontWeight={600} className="mb-2! font-semibold!">
                {title}
            </Typography>
            {children}
        </Paper>
    );

    return (
        <div>
            <Divider className="mb-3!" />

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                    <KitHeader
                        title="BUSY Settings"
                        subtitle="Configure the BUSY company, sale types, material centre and voucher settings."
                        icon="tabler:settings"
                        countLabel="settings"
                    />

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + S" className="-top-5" />
                            <KitButton
                                ref={saveRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                loading={isBusySettingsListLoading}
                                disabled={isBusySettingsListLoading}
                                onClick={handleSubmit(onSubmit)}
                            >
                                Save settings
                            </KitButton>
                        </div>

                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={refresh}
                                disabled={isBusySettingsListLoading || isBusyMastersListLoading}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </div>

                <KitShow show={!!BusyMastersListError}>
                    <Typography color="error" variant="body2">
                        BUSY masters could not be loaded. You can still enter values manually.
                    </Typography>
                </KitShow>

                {isBusySettingsListLoading ? (
                    <div className="h-80 flex justify-center items-center">
                        <KitLoader logo={false} isLoading={true} />
                    </div>
                ) : BusySettingsListError ? (
                    <Typography color="error" variant="body2">
                        Unable to load BUSY settings.
                    </Typography>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
                        <Section title="Company">
                            <Grid container spacing={2}>
                                <div className="flex flex-col w-full">
                                    <Grid size={12}>
                                        <Controller
                                            name="enabled"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={field.value}
                                                            onChange={(e) => field.onChange(e.target.checked)}
                                                        />
                                                    }
                                                    label="Allow writing to BUSY"
                                                />
                                            )}
                                        />
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Push bills, sales orders, items and customers into the real BUSY books.
                                        </Typography>
                                    </Grid>

                                    <Grid size={12}>
                                        <Controller
                                            name="autoPushBills"
                                            control={control}
                                            render={({ field }) => (
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            size="small"
                                                            checked={field.value}
                                                            onChange={(e) => field.onChange(e.target.checked)}
                                                        />
                                                    }
                                                    label="Auto push POS bills"
                                                />
                                            )}
                                        />
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Every new POS bill is sent to BUSY in the background right after it is
                                            generated. Bills with an item that is not in BUSY are not sent; the reason
                                            shows on Push Bills.
                                        </Typography>
                                    </Grid>
                                </div>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="companyCode"
                                        control={control}
                                        render={({ field: { value, onChange, ref } }) => (
                                            <KitTextField
                                                inputRef={ref}
                                                size="small"
                                                height="32px"
                                                label="Company code"
                                                placeholderFontSize={14}
                                                value={value}
                                                onChange={onChange}
                                                helperText={"AI Zeny company code, e.g. COMP0003"}
                                                placeholder="Enter Company code"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="financialYear"
                                        control={control}
                                        render={({ field: { value, onChange, ref } }) => (
                                            <KitTextField
                                                inputRef={ref}
                                                size="small"
                                                height="32px"
                                                label="Financial year"
                                                placeholderFontSize={14}
                                                value={value}
                                                onChange={onChange}
                                                helperText="Leave blank to use each voucher's own year (April start). Four digits, e.g. 2026."
                                                placeholder="Auto"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={12}>
                                    <Controller
                                        name="referencePrefix"
                                        control={control}
                                        render={({ field: { value, onChange, ref } }) => (
                                            <KitTextField
                                                inputRef={ref}
                                                size="small"
                                                height="32px"
                                                label="Reference prefix"
                                                placeholderFontSize={14}
                                                value={value}
                                                onChange={onChange}
                                                helperText="BUSY refuses a reference it already has, so each bill is sent only once."
                                                placeholder="Enter Reference prefix"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Section>

                        <Paper variant="outlined" className="p-4! rounded-xl!">
                            <div className="mb-2! flex justify-between items-center">
                                <Typography variant="subtitle1" fontWeight={600} className="font-semibold!">
                                    Vouchers
                                </Typography>
                                <KitButton
                                    size="small"
                                    variant="text"
                                    className="w-auto"
                                    onClick={() => refreshBusyMastersList()}
                                >
                                    {isBusyMastersListLoading ? "Loading masters…" : "Reload BUSY masters"}
                                </KitButton>
                            </div>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="saleType"
                                        control={control}
                                        render={({ field }) => (
                                            <KitSelect
                                                label="Sale type (invoices)"
                                                placeholder="Select Sale type (invoices)"
                                                size="small"
                                                placeholderFontSize={14}
                                                inputFontSize={14}
                                                options={SaleTypeOptions}
                                                value={SaleTypeOptions.find((o) => o.value === field.value) ?? null}
                                                isLoading={isBusyMastersListLoading}
                                                displayValue={(selected) => selected?.label || ""}
                                                onChange={(selected) => {
                                                    const opt = selected;
                                                    field.onChange(opt?.value || "");
                                                }}
                                                helperText="Item-wise GST inclusive, e.g. Local-TaxIncl. Blank or a fixed-rate type is corrected automatically on push."
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="orderSaleType"
                                        control={control}
                                        render={({ field }) => (
                                            <KitSelect
                                                label="Sale type (sales orders)"
                                                placeholder="Select Sale type (sales orders)"
                                                size="small"
                                                placeholderFontSize={14}
                                                inputFontSize={14}
                                                options={SaleTypeOptions}
                                                value={SaleTypeOptions.find((o) => o.value === field.value) ?? null}
                                                isLoading={isBusyMastersListLoading}
                                                displayValue={(selected) => selected?.label || ""}
                                                onChange={(selected) => {
                                                    const opt = selected;
                                                    field.onChange(opt?.value || "");
                                                }}
                                                helperText="Item-wise GST exclusive, e.g. Local-ItemWise. Blank = picked automatically."
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="materialCenter"
                                        control={control}
                                        render={({ field }) => (
                                            <KitSelect
                                                label="Material centre"
                                                placeholder="Select Material centre"
                                                size="small"
                                                placeholderFontSize={14}
                                                inputFontSize={14}
                                                options={MaterialCenterOptions}
                                                value={
                                                    MaterialCenterOptions.find((o) => o.value === field.value) ?? null
                                                }
                                                displayValue={(selected) => selected?.label || ""}
                                                isLoading={isBusyMastersListLoading}
                                                onChange={(selected) => {
                                                    const opt = selected;
                                                    field.onChange(opt?.value || "");
                                                }}
                                                helperText="Blank = BUSY's Main / first material centre"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="saleType"
                                        control={control}
                                        render={({ field }) => {
                                            const pricesSentAs =
                                                /item\s*-?\s*wise/i.test(field.value || "") &&
                                                !/incl/i.test(field.value || "")
                                                    ? "GST inclusive — switched to a …-TaxIncl. type on push"
                                                    : "GST inclusive (POS rates)";

                                            return (
                                                <KitTextField
                                                    size="small"
                                                    height="32px"
                                                    label="Prices sent as"
                                                    placeholderFontSize={14}
                                                    value={pricesSentAs}
                                                    disabled
                                                    helperText="Follows the invoice sale type automatically"
                                                    className="w-full!"
                                                />
                                            );
                                        }}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="invoiceSeries"
                                        control={control}
                                        render={({ field }) => (
                                            <KitSelect
                                                label="Invoice series"
                                                placeholder="Select Invoice series"
                                                size="small"
                                                placeholderFontSize={14}
                                                inputFontSize={14}
                                                options={InvoiceSeriesOptions}
                                                value={
                                                    InvoiceSeriesOptions.find((o) => o.value === field.value) ?? null
                                                }
                                                displayValue={(selected) => selected?.label || ""}
                                                isLoading={isBusyMastersListLoading}
                                                onChange={(selected) => {
                                                    const opt = selected;
                                                    field.onChange(opt?.value || "");
                                                }}
                                                helperText="Blank = BUSY's Main / first material centre"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="orderSeries"
                                        control={control}
                                        render={({ field }) => (
                                            <KitSelect
                                                label="Sales order series"
                                                placeholder="Select Sales order series"
                                                size="small"
                                                placeholderFontSize={14}
                                                inputFontSize={14}
                                                options={OrderSeriesOptions}
                                                value={OrderSeriesOptions.find((o) => o.value === field.value) ?? null}
                                                displayValue={(selected) => selected?.label || ""}
                                                isLoading={isBusyMastersListLoading}
                                                onChange={(selected) => {
                                                    const opt = selected;
                                                    field.onChange(opt?.value || "");
                                                }}
                                                helperText="Blank = BUSY's Main / first material centre"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="posCustomer"
                                        control={control}
                                        render={({ field: { value, onChange, ref } }) => (
                                            <KitTextField
                                                inputRef={ref}
                                                size="small"
                                                height="32px"
                                                label="POS party (cash customer)"
                                                placeholderFontSize={14}
                                                value={value}
                                                onChange={onChange}
                                                helperText="BUSY account used for walk-in POS bills, e.g. Cash"
                                                placeholder="Enter POS party (cash customer)"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Controller
                                        name="customerGroup"
                                        control={control}
                                        render={({ field: { value, onChange, ref } }) => (
                                            <KitTextField
                                                inputRef={ref}
                                                size="small"
                                                height="32px"
                                                label="Customer group"
                                                placeholderFontSize={14}
                                                value={value}
                                                onChange={onChange}
                                                helperText="Parent group for new customers"
                                                placeholder="Enter Customer group"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>

                        <Section title="Items pushed to BUSY">
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="itemGroup"
                                        control={control}
                                        render={({ field: { value, onChange, ref } }) => (
                                            <KitTextField
                                                inputRef={ref}
                                                size="small"
                                                height="32px"
                                                label="Item group"
                                                placeholderFontSize={14}
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter Item group"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="itemUnit"
                                        control={control}
                                        render={({ field: { value, onChange, ref } }) => (
                                            <KitTextField
                                                inputRef={ref}
                                                size="small"
                                                height="32px"
                                                label="Main unit"
                                                placeholderFontSize={14}
                                                value={value}
                                                onChange={onChange}
                                                placeholder="Enter Main unit"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 4 }}>
                                    <Controller
                                        name="taxCategoryPattern"
                                        control={control}
                                        render={({ field: { value, onChange, ref } }) => (
                                            <KitTextField
                                                inputRef={ref}
                                                size="small"
                                                height="32px"
                                                label="Tax category pattern"
                                                placeholderFontSize={14}
                                                value={value}
                                                onChange={onChange}
                                                helperText="{rate} = item GST %. Blank = GST {rate}% (0% = Exempt)"
                                                placeholder="GST {rate}%"
                                                className="w-full!"
                                            />
                                        )}
                                    />
                                </Grid>
                            </Grid>
                        </Section>
                    </form>
                )}
            </div>
        </div>
    );
}
