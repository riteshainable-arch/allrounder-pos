import { useEffect, useRef } from "react";
import KitModal from "../../../../../kit/components/KitModal";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { COUPON_DISCOUNT_OPTIONS, CouponDiscountType } from "../../../../../kit/configs/Coupon";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import KitSelect from "../../../../../kit/components/KitSelect";
import { format } from "date-fns";
import { toast } from "react-toastify";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";
import {
    useCreateGlobalCoupon,
    useGlobalCouponDetail,
    useUpdateGlobalCoupon,
} from "../../../../../kit/hooks/data/globalCoupons";

export const schema = yup.object({
    name: yup.string().trim().required("Coupon name is required"),
    description: yup.string().trim().optional(),
    discountType: yup.mixed().oneOf(Object.values(CouponDiscountType)).required("Discount type is required"),
    discountValue: yup
        .string()
        .required("Discount value is required")
        .test("valid-number", "Discount value must be a valid number", (value) => {
            return !!value?.trim() && Number.isFinite(Number(value)) && Number(value) > 0;
        })
        .test("max-percentage", "Percentage cannot exceed 100", function (value) {
            return this.parent.discountType !== CouponDiscountType.PERCENTAGE || !value?.trim() || Number(value) <= 100;
        }),
    minBillAmount: yup
        .string()
        .required("Minimum bill amount is required")
        .test("valid-number", "Minimum bill amount must be a valid number", (value) => {
            return !!value?.trim() && Number.isFinite(Number(value)) && Number(value) >= 0;
        }),
    maxDiscountAmount: yup
        .string()
        .required("Maximum discount amount is required")
        .test("valid-number", "Maximum discount amount must be a valid number", (value) => {
            return !!value?.trim() && Number.isFinite(Number(value)) && Number(value) > 0;
        }),
    validFrom: yup
        .string()
        .required("Start date is required")
        .test("valid-date", "Select a valid start date", (value) => Boolean(value && !Number.isNaN(Date.parse(value)))),
    validTill: yup
        .string()
        .required("End date is required")
        .test("valid-date", "Select a valid end date", (value) => Boolean(value && !Number.isNaN(Date.parse(value))))
        .test("date-order", "End date must be on or after start date", function (value) {
            const { validFrom } = this.parent;
            if (!value || !validFrom) return true;
            return new Date(value).getTime() >= new Date(validFrom).getTime();
        }),
});

export default function AddUpdateGlobalCouponModal({ isOpen, onClose, onRefresh, selectedItem }) {
    const couponNameRef = useRef(null);

    const { globalCouponDetails, isGlobalCouponDetailsLoading } = useGlobalCouponDetail(
        Boolean(selectedItem?.id),
        String(selectedItem?.id)
    );
    const { createGlobalCoupon: onCreateGlobalCoupon, isCreatingGlobalCoupon } = useCreateGlobalCoupon();
    const { update: onUpdateGlobalCoupon, isUpdatingGlobalCoupon } = useUpdateGlobalCoupon(String(selectedItem?.id));

    const defaultValues = {
        name: "",
        description: "",
        minBillAmount: "",
        discountType: CouponDiscountType.PERCENTAGE,
        discountValue: "",
        maxDiscountAmount: "",
        validFrom: "",
        validTill: "",
    };

    const {
        reset,
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues,
        mode: "onChange",
        resolver: yupResolver(schema),
    });
    const isBtnLoading = isCreatingGlobalCoupon || isUpdatingGlobalCoupon;

    const onSubmit = async (data) => {
        const payload = {
            name: data.name.trim(),
            description: data.description,
            discountType: data.discountType,
            discountValue: Number(data.discountValue),
            minBillAmount: data.minBillAmount ? Number(data.minBillAmount) : undefined,
            maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined,
            validFrom: format(new Date(data.validFrom), "yyyy-MM-dd"),
            validTill: format(new Date(data.validTill), "yyyy-MM-dd"),
        };
        try {
            if (selectedItem) {
                await onUpdateGlobalCoupon(payload);
                toast.success("Global Coupon updated successfully.");
            } else {
                await onCreateGlobalCoupon(payload);
                toast.success("Global Coupon created successfully.");
            }
            onClose();
            onRefresh?.();
        } catch (error) {
            toast.error(error?.message);
        }
    };

    useEffect(() => {
        if (!isOpen) return;

        if (!selectedItem) {
            reset(defaultValues);
            return;
        }

        const details = globalCouponDetails?.data;
        if (!details) return;

        reset({
            name: details.name ?? "",
            description: details.description ?? "",
            discountType: details.discountType ?? CouponDiscountType.PERCENTAGE,
            discountValue: details.discountValue != null ? String(details.discountValue) : "",
            minBillAmount: details.minBillAmount != null ? String(details.minBillAmount) : "",
            maxDiscountAmount: details.maxDiscountAmount != null ? String(details.maxDiscountAmount) : "",
            validFrom: details.validFrom ? dayjs(details.validFrom).format("YYYY-MM-DD") : "",
            validTill: details.validTill ? dayjs(details.validTill).format("YYYY-MM-DD") : "",
        });
    }, [isOpen, selectedItem, globalCouponDetails, reset]);

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            couponNameRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [isOpen]);

    return (
        <KitModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="md"
            title={
                <div className="text-base font-semibold">
                    {selectedItem ? "Update Global Coupon" : "Add Global Coupon"}
                </div>
            }
            titleClass="p-3! border-b!"
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                {isGlobalCouponDetailsLoading ? (
                    <div className="h-80 flex justify-center">
                        <KitLoader logo={false} isLoading={true} />
                    </div>
                ) : (
                    <div className="p-4 flex flex-col gap-4 max-h-[78vh] overflow-y-auto  custom-scroll">
                        <div className="grid grid-cols-2 gap-4">
                            <Controller
                                name="name"
                                control={control}
                                render={({ field: { value, onChange, ref } }) => (
                                    <KitTextField
                                        inputRef={couponNameRef}
                                        size="small"
                                        height="32px"
                                        label="Coupon Name"
                                        placeholderFontSize={14}
                                        required
                                        value={value}
                                        onChange={onChange}
                                        error={errors.name && errors.name.message}
                                        helperText={errors.name && errors.name.message}
                                        placeholder="Enter coupon Name"
                                        disabled={Boolean(selectedItem)}
                                        className="w-full!"
                                    />
                                )}
                            />
                            <Controller
                                name="description"
                                control={control}
                                render={({ field: { value, onChange, ref } }) => (
                                    <KitTextField
                                        inputRef={ref}
                                        size="small"
                                        height="32px"
                                        label="Description"
                                        placeholderFontSize={14}
                                        required
                                        value={value}
                                        onChange={onChange}
                                        error={errors.description && errors.description.message}
                                        helperText={errors.description && errors.description.message}
                                        placeholder="Enter Description"
                                        disabled={Boolean(selectedItem)}
                                        className="w-full!"
                                    />
                                )}
                            />
                            <Controller
                                name="discountType"
                                control={control}
                                render={({ field }) => (
                                    <KitSelect
                                        label="Discount Type"
                                        placeholder="Select Discount Type"
                                        size="small"
                                        placeholderFontSize={14}
                                        inputFontSize={14}
                                        required
                                        options={COUPON_DISCOUNT_OPTIONS}
                                        value={COUPON_DISCOUNT_OPTIONS.find((o) => o.value === field.value) ?? null}
                                        displayValue={(selected) => selected?.label || ""}
                                        onChange={(selected) => {
                                            const opt = selected;
                                            field.onChange(opt?.value || "");
                                        }}
                                        error={errors.discountType?.message}
                                        helperText={errors.discountType && errors.discountType.message}
                                        disabled={Boolean(selectedItem)}
                                        className="w-full!"
                                    />
                                )}
                            />
                            <Controller
                                name="discountValue"
                                control={control}
                                render={({ field: { value, onChange, ref } }) => (
                                    <div className="w-full">
                                        <KitTextField
                                            inputRef={ref}
                                            size="small"
                                            height="32px"
                                            label="Discount Value"
                                            placeholderFontSize={14}
                                            required
                                            value={value}
                                            onChange={onChange}
                                            error={errors.discountValue && errors.discountValue.message}
                                            helperText={errors.discountValue && errors.discountValue.message}
                                            placeholder="Enter discount value"
                                            type="number"
                                            onKeyDown={(e) => {
                                                if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                                            }}
                                            className="w-full!"
                                        />
                                    </div>
                                )}
                            />
                            <Controller
                                name="maxDiscountAmount"
                                control={control}
                                render={({ field: { value, onChange, ref } }) => (
                                    <div className="w-full">
                                        <KitTextField
                                            inputRef={ref}
                                            size="small"
                                            height="32px"
                                            label="Max Discount Amount"
                                            placeholderFontSize={14}
                                            required
                                            value={value}
                                            onChange={onChange}
                                            error={errors.maxDiscountAmount && errors.maxDiscountAmount.message}
                                            helperText={errors.maxDiscountAmount && errors.maxDiscountAmount.message}
                                            placeholder="Enter Max Discount Amount"
                                            type="number"
                                            onKeyDown={(e) => {
                                                if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                                            }}
                                            className="w-full!"
                                        />
                                    </div>
                                )}
                            />
                            <Controller
                                name="minBillAmount"
                                control={control}
                                render={({ field: { value, onChange, ref } }) => (
                                    <div className="w-full">
                                        <KitTextField
                                            inputRef={ref}
                                            size="small"
                                            height="32px"
                                            label="Min Bill Amount"
                                            placeholderFontSize={14}
                                            required
                                            value={value}
                                            onChange={onChange}
                                            error={errors.minBillAmount && errors.minBillAmount.message}
                                            helperText={errors.minBillAmount && errors.minBillAmount.message}
                                            placeholder="Enter Min Bill Amount"
                                            type="number"
                                            onKeyDown={(e) => {
                                                if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                                            }}
                                            className="w-full!"
                                        />
                                    </div>
                                )}
                            />
                            <Controller
                                name="validFrom"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <KitTextField
                                        name={field.name}
                                        inputRef={field.ref}
                                        size="small"
                                        type="date"
                                        label="Valid From"
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        onBlur={field.onBlur}
                                        className="w-full"
                                        disabled={Boolean(selectedItem)}
                                        slotProps={{
                                            htmlInput: {
                                                min: new Date().toISOString().split("T")[0],
                                                max: watch("validTill") || undefined,
                                            },
                                        }}
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="validTill"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <KitTextField
                                        name={field.name}
                                        inputRef={field.ref}
                                        size="small"
                                        type="date"
                                        label="Valid Till"
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value)}
                                        onBlur={field.onBlur}
                                        className="w-full"
                                        disabled={Boolean(selectedItem)}
                                        slotProps={{
                                            htmlInput: {
                                                min: watch("validFrom")
                                                    ? watch("validFrom")
                                                    : new Date().toISOString().split("T")[0],
                                            },
                                        }}
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                    />
                                )}
                            />
                        </div>
                    </div>
                )}
                <div className="p-4 flex justify-end gap-3 border-t border-gray-300">
                    <KitButton
                        className="w-auto"
                        variant="outlined"
                        size="small"
                        onClick={onClose}
                        disabled={isBtnLoading}
                    >
                        Cancel
                    </KitButton>
                    <KitButton
                        type="submit"
                        variant="contained"
                        className="w-auto"
                        size="small"
                        disabled={isBtnLoading}
                        isLoading={isBtnLoading}
                    >
                        {selectedItem ? "Update" : "Save"}
                    </KitButton>
                </div>
            </form>
        </KitModal>
    );
}
