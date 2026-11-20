import { useEffect, useMemo, useRef, useState } from "react";
import KitModal from "../../../../../kit/components/KitModal";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { useGetAllBrandsWithId } from "../../../../../kit/hooks/data/brand";
import { useGetAllCustomerList } from "../../../../../kit/hooks/data/customer";
import { useCouponDetail, useCreateCoupon, useUpdateCoupon } from "../../../../../kit/hooks/data/coupons";
import { useGetAllProducts } from "../../../../../kit/hooks/data/products";
import {
    BULK_THRESHOLD_OPTIONS,
    COUPON_DISCOUNT_OPTIONS,
    COUPON_TYPE_OPTIONS,
    CouponDiscountType,
    CouponType,
    VALID_DAYS_OPTIONS,
} from "../../../../../kit/configs/Coupon";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import KitSelect from "../../../../../kit/components/KitSelect";
import { format, parseISO } from "date-fns";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import { IconButton } from "@mui/material";
import { toast } from "react-toastify";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";

const requiredNumber = (label, min = 0) =>
    yup
        .string()
        .required(`${label} is required`)
        .test("valid-number", `${label} must be a valid number`, (value) => {
            if (!value?.trim()) return false;
            return Number.isFinite(Number(value));
        })
        .test("minimum", `${label} must be at least ${min}`, (value) => {
            if (!value?.trim()) return false;
            return Number(value) >= min;
        });

const requiredPositiveInteger = (label) =>
    yup
        .string()
        .required(`${label} is required`)
        .test("positive-integer", `${label} must be a positive whole number`, (value) => {
            if (!value?.trim()) return false;
            const number = Number(value);
            return Number.isInteger(number) && number > 0;
        });

const bulkSlabSchema = yup.object({
    thresholdType: yup.mixed().oneOf(["QUANTITY", "AMOUNT"]).required("Select a slab condition"),
    minQty: yup
        .string()
        .default("")
        .when("thresholdType", {
            is: "QUANTITY",
            then: () => requiredPositiveInteger("Minimum quantity"),
            otherwise: (schema) => schema,
        }),
    minAmount: yup
        .string()
        .default("")
        .when("thresholdType", {
            is: "AMOUNT",
            then: (schema) =>
                schema
                    .required("Minimum amount is required")
                    .test("valid-amount", "Minimum amount must be greater than 0", (value) => {
                        if (!value?.trim()) return false;
                        const amount = Number(value);
                        return Number.isFinite(amount) && amount > 0;
                    }),
            otherwise: (schema) => schema,
        }),
    discountType: yup.mixed().oneOf(Object.values(CouponDiscountType)).required("Discount type is required"),
    discountValue: yup
        .string()
        .required("Discount value is required")
        .test(
            "valid-discount",
            "Discount value must be greater than 0",
            (value) => !!value?.trim() && Number(value) > 0
        )
        .test("percentage-limit", "Percentage discount cannot exceed 100", function (value) {
            return this.parent.discountType !== CouponDiscountType.PERCENTAGE || !value?.trim() || Number(value) <= 100;
        }),
    maxDiscountAmount: yup
        .string()
        .default("")
        .test(
            "positive-max-discount",
            "Maximum discount must be greater than 0",
            (value) => !value?.trim() || Number(value) > 0
        ),
});

export const schema = yup.object({
    name: yup.string().trim().required("Coupon name is required"),
    code: yup
        .string()
        .default("")
        .when("couponType", {
            is: CouponType.ITEM,
            then: (schema) => schema.trim().required("Coupon code is required"),
            otherwise: (schema) => schema,
        }),
    couponType: yup.mixed().oneOf(Object.values(CouponType)).required("Coupon type is required"),
    discountType: yup.mixed().when("couponType", {
        is: CouponType.BULK,
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.oneOf(Object.values(CouponDiscountType)).required("Discount type is required"),
    }),
    discountValue: yup
        .string()
        .default("")
        .when("couponType", {
            is: CouponType.BULK,
            then: (schema) => schema,
            otherwise: (schema) =>
                requiredNumber("Discount value").when("discountType", {
                    is: CouponDiscountType.PERCENTAGE,
                    then: (percentageSchema) =>
                        percentageSchema.test(
                            "max-percentage",
                            "Percentage cannot exceed 100",
                            (value) => !value?.trim() || Number(value) <= 100
                        ),
                    otherwise: (flatSchema) => flatSchema,
                }),
        }),
    minBillAmount: yup.string().when("couponType", {
        is: (type) => type === CouponType.BRAND || type === CouponType.TIME_DURATION,
        then: () => requiredNumber("Minimum bill amount", 0),
        otherwise: (schema) => schema.default(""),
    }),
    maxDiscountAmount: yup
        .string()
        .default("")
        .when("couponType", {
            is: (type) => type === CouponType.ITEM || type === CouponType.CUSTOMER,
            then: () => requiredNumber("Maximum discount amount"),
            otherwise: (schema) => schema,
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
    usageLimit: yup
        .string()
        .default("")
        .when("couponType", {
            is: CouponType.ITEM,
            then: () => requiredPositiveInteger("Usage limit"),
            otherwise: (schema) => schema,
        }),
    perCustomerLimit: yup
        .string()
        .default("")
        .when("couponType", {
            is: (type) => type === CouponType.ITEM || type === CouponType.CUSTOMER,
            then: () => requiredPositiveInteger("Per customer limit"),
            otherwise: (schema) => schema,
        }),
    itemCodes: yup
        .string()
        .default("")
        .when("couponType", {
            is: (type) => type === CouponType.ITEM || type === CouponType.BULK,
            then: () =>
                yup
                    .string()
                    .required("Please select at least one item")
                    .test("at-least-one-item", "Please select at least one item", (value) =>
                        Boolean(value?.split(",").some((id) => id.trim()))
                    ),
            otherwise: (schema) => schema,
        }),
    brandIds: yup
        .string()
        .default("")
        .when("couponType", {
            is: (type) => type === CouponType.BRAND || type === CouponType.CUSTOMER,
            then: () =>
                yup
                    .string()
                    .required("Please select at least one brand")
                    .test("at-least-one-brand", "Please select at least one brand", (value) =>
                        Boolean(value?.split(",").some((id) => id.trim()))
                    ),
            otherwise: (schema) => schema,
        }),
    customerPhones: yup
        .string()
        .default("")
        .when("couponType", {
            is: CouponType.CUSTOMER,
            then: () =>
                yup
                    .string()
                    .required("Please select at least one customer")
                    .test("at-least-one-customer", "Please select at least one customer", (value) =>
                        Boolean(value?.split(",").some((phone) => phone.trim()))
                    ),
            otherwise: (schema) => schema,
        }),
    validDays: yup
        .array()
        .of(yup.string().required())
        .default([])
        .when("couponType", {
            is: CouponType.TIME_DURATION,
            then: (schema) =>
                schema
                    .min(1, "Select at least one valid day")
                    .required("Select at least one valid day")
                    .test("valid-day-values", "Select valid days", (days) =>
                        (days ?? []).every((day) => ["0", "1", "2", "3", "4", "5", "6"].includes(day))
                    ),
            otherwise: (schema) => schema,
        }),
    startTime: yup.string().when("couponType", {
        is: CouponType.TIME_DURATION,
        then: (schema) => schema.required("Start time is required"),
        otherwise: (schema) => schema.default(""),
    }),

    endTime: yup.string().when("couponType", {
        is: CouponType.TIME_DURATION,
        then: (schema) => schema.required("End time is required"),
        otherwise: (schema) => schema.default(""),
    }),
    bulkSlabs: yup.array().when("couponType", {
        is: CouponType.BULK,
        then: () =>
            yup.array().of(bulkSlabSchema).min(1, "Add at least one bulk slab").required("Add at least one bulk slab"),
        otherwise: () => yup.array().of(yup.mixed()).default([]),
    }),
});

export default function AddUpdateCouponModal({ isOpen, onClose, onRefresh, selectedItem }) {
    const couponTypeRef = useRef(null);

    const [productSearch, setProductSearch] = useState("");
    const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
    const [selectedProductOptions, setSelectedProductOptions] = useState([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
    const [selectedCustomerOptions, setSelectedCustomerOptions] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedProductSearch(productSearch.trim());
        }, 500);

        return () => clearTimeout(timer);
    }, [productSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedCustomerSearch(customerSearch.trim());
        }, 500);

        return () => clearTimeout(timer);
    }, [customerSearch]);

    const { bandsWithId, isBandsWithIdLoading } = useGetAllBrandsWithId();
    const { customerList, isCustomerListLoading } = useGetAllCustomerList({
        page: 1,
        size: 10,
        search: debouncedCustomerSearch,
    });
    const { productList, isproductListLoading } = useGetAllProducts({
        page: 1,
        size: 10,
        search: debouncedProductSearch,
        isApproved: true,
    });
    const { couponDetails, isCouponDetailsLoading } = useCouponDetail(
        Boolean(selectedItem?.id),
        String(selectedItem?.id)
    );
    const { createCoupon: onCreateCoupon, isCreatingCoupon } = useCreateCoupon();
    const { update: onUpdateCoupon, isUpdatingCoupon } = useUpdateCoupon(String(selectedItem?.id));

    const defaultValues = {
        name: "",
        code: "",
        couponType: CouponType.ITEM,
        discountType: CouponDiscountType.PERCENTAGE,
        discountValue: "",
        minBillAmount: "",
        maxDiscountAmount: "",
        validFrom: "",
        validTill: "",
        usageLimit: "",
        perCustomerLimit: "",
        itemCodes: "",
        brandIds: "",
        customerPhones: "",
        validDays: [],
        startTime: "",
        endTime: "",
        bulkSlabs: [
            {
                thresholdType: "QUANTITY",
                minQty: "",
                minAmount: "",
                discountType: CouponDiscountType.PERCENTAGE,
                discountValue: "",
                maxDiscountAmount: "",
            },
        ],
    };

    const {
        reset,
        control,
        handleSubmit,
        getValues,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        defaultValues,
        mode: "onChange",
        resolver: yupResolver(schema),
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "bulkSlabs",
    });

    const isBtnLoading = isCreatingCoupon || isUpdatingCoupon || isCouponDetailsLoading;

    const splitValues = (value) =>
        value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

    const onSubmit = async (data) => {
        const commonPayload = {
            name: data.name.trim(),
            couponType: data.couponType,
            validFrom: format(new Date(data.validFrom), "yyyy-MM-dd"),
            validTill: format(new Date(data.validTill), "yyyy-MM-dd"),
        };

        let payload;

        switch (data.couponType) {
            case CouponType.ITEM:
                payload = {
                    ...commonPayload,
                    code: data.code.trim().toUpperCase(),
                    discountType: data.discountType,
                    discountValue: Number(data.discountValue),
                    maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined,
                    itemCodes: splitValues(data.itemCodes),
                    usageLimit: data.usageLimit ? Number(data.usageLimit) : undefined,
                    perCustomerLimit: data.perCustomerLimit ? Number(data.perCustomerLimit) : undefined,
                };
                break;

            case CouponType.BRAND:
                payload = {
                    ...commonPayload,
                    discountType: data.discountType,
                    discountValue: Number(data.discountValue),
                    brandIds: splitValues(data.brandIds).map(Number),
                    minBillAmount: data.minBillAmount ? Number(data.minBillAmount) : undefined,
                };
                break;

            case CouponType.CUSTOMER:
                payload = {
                    ...commonPayload,
                    discountType: data.discountType,
                    discountValue: Number(data.discountValue),
                    maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : undefined,
                    customerPhones: splitValues(data.customerPhones),
                    customerCategories: ["Loyal"],
                    brandIds: splitValues(data.brandIds).map(Number),
                    perCustomerLimit: data.perCustomerLimit ? Number(data.perCustomerLimit) : undefined,
                };
                break;

            case CouponType.TIME_DURATION:
                payload = {
                    ...commonPayload,
                    discountType: data.discountType,
                    discountValue: Number(data.discountValue),
                    minBillAmount: data.minBillAmount ? Number(data.minBillAmount) : undefined,
                    validDays: data.validDays.map(Number),
                    startTime: data.startTime || undefined,
                    endTime: data.endTime || undefined,
                };
                break;

            case CouponType.BULK:
                payload = {
                    ...commonPayload,
                    itemCodes: splitValues(data.itemCodes),
                    bulkSlabs: data.bulkSlabs.map((slab) => ({
                        ...(slab.minQty.trim() ? { minQty: Number(slab.minQty) } : {}),
                        ...(slab.minAmount.trim() ? { minAmount: Number(slab.minAmount) } : {}),
                        discountType: slab.discountType,
                        discountValue: Number(slab.discountValue),
                        ...(slab.maxDiscountAmount.trim() ? { maxDiscountAmount: Number(slab.maxDiscountAmount) } : {}),
                    })),
                };
                break;

            case CouponType.LOYALTY:
                throw new Error("Use the loyalty conversion endpoint for loyalty coupons.");
        }
        try {
            if (selectedItem) {
                await onUpdateCoupon(payload);
                toast.success("Coupon updated successfully.");
            } else {
                await onCreateCoupon(payload);
                toast.success("Coupon created successfully.");
            }
            onClose();
            onRefresh?.();
        } catch (error) {
            toast.error(error?.message);
        }
    };

    const brandOptions = useMemo(
        () =>
            bandsWithId?.data?.map((brand) => ({
                label: brand.brandName,
                value: brand.id,
            })) ?? [],
        [bandsWithId]
    );

    const customerOptions = useMemo(
        () =>
            customerList?.data?.map((customer) => ({
                label: `${customer.phone}`,
                value: customer.phone ?? "",
            })) ?? [],
        [customerList]
    );

    const productOptions = useMemo(
        () =>
            productList?.data?.map((product) => ({
                label: product?.productName ?? "",
                value: product.productCode ?? "",
            })) ?? [],
        [productList]
    );

    useEffect(() => {
        if (!isOpen) return;

        // Reset to empty values when adding a new coupon.
        if (!selectedItem) {
            reset(defaultValues);
            return;
        }

        // Wait until the coupon detail API has returned.
        const details = couponDetails?.data;
        if (!details) return;

        reset({
            name: details.name ?? "",
            code: details.code ?? "",
            couponType: details.couponType,
            discountType: details.discountType ?? CouponDiscountType.PERCENTAGE,
            discountValue: details.discountValue != null ? String(details.discountValue) : "",
            minBillAmount: details.minBillAmount != null ? String(details.minBillAmount) : "",
            maxDiscountAmount: details.maxDiscountAmount != null ? String(details.maxDiscountAmount) : "",
            validFrom: details.validFrom
                ? format(
                      typeof details.validFrom === "string" ? parseISO(details.validFrom) : details.validFrom,
                      "yyyy-MM-dd"
                  )
                : "",

            validTill: details.validTill
                ? format(
                      typeof details.validTill === "string" ? parseISO(details.validTill) : details.validTill,
                      "yyyy-MM-dd"
                  )
                : "",
            usageLimit: details.usageLimit != null ? String(details.usageLimit) : "",
            perCustomerLimit: details.perCustomerLimit != null ? String(details.perCustomerLimit) : "",
            itemCodes: (details.itemCodes ?? []).join(","),
            brandIds: (details.brandIds ?? []).map(String).join(","),
            customerPhones: (details.customerPhones ?? []).join(","),
            validDays: (details.validDays ?? []).map(String),
            startTime: details.startTime ?? "",
            endTime: details.endTime ?? "",
            bulkSlabs: (details.bulkSlabs ?? []).map((slab) => ({
                thresholdType: slab.minAmount != null ? "AMOUNT" : "QUANTITY",
                minQty: slab.minQty != null ? String(slab.minQty) : "",
                minAmount: slab.minAmount != null ? String(slab.minAmount) : "",
                discountType: slab.discountType,
                discountValue: String(slab.discountValue ?? ""),
                maxDiscountAmount: slab.maxDiscountAmount != null ? String(slab.maxDiscountAmount) : "",
            })),
        });
    }, [isOpen, selectedItem, couponDetails, reset]);

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            couponTypeRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, [isOpen]);

    const couponType = useWatch({
        control,
        name: "couponType",
    });

    return (
        <KitModal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="md"
            title={<div className="text-base font-semibold">{selectedItem ? "Update Coupon" : "Add Coupon"}</div>}
            titleClass="p-3! border-b!"
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                {isCouponDetailsLoading ? (
                    <div className="h-80 flex justify-center">
                        <KitLoader logo={false} isLoading={true} />
                    </div>
                ) : (
                    <div className="p-4 flex flex-col gap-4 max-h-[78vh] overflow-y-auto  custom-scroll">
                        <div className="grid grid-cols-2 gap-4">
                            <Controller
                                name="couponType"
                                control={control}
                                render={({ field }) => (
                                    <KitSelect
                                        ref={couponTypeRef}
                                        label="Coupon Type"
                                        placeholder="Select Coupon Type"
                                        size="small"
                                        placeholderFontSize={14}
                                        inputFontSize={14}
                                        options={COUPON_TYPE_OPTIONS.filter(
                                            (option) => option.value !== CouponType.LOYALTY
                                        )}
                                        value={
                                            COUPON_TYPE_OPTIONS.find((option) => option.value === field.value) ?? null
                                        }
                                        displayValue={(selected) => selected?.label || ""}
                                        onChange={(selected) => {
                                            const selectedType = selected?.value;
                                            if (!selectedType) return;
                                            const currentValues = getValues();
                                            reset({
                                                ...currentValues,
                                                couponType: selectedType,
                                                itemCodes: "",
                                                brandIds: "",
                                                customerPhones: "",
                                                maxDiscountAmount: "",
                                                validDays: [],
                                                startTime: "",
                                                endTime: "",
                                                discountValue: "",
                                                bulkSlabs:
                                                    selectedType === CouponType.BULK
                                                        ? [
                                                              {
                                                                  thresholdType: "QUANTITY",
                                                                  minQty: "",
                                                                  minAmount: "",
                                                                  discountType: CouponDiscountType.PERCENTAGE,
                                                                  discountValue: "",
                                                                  maxDiscountAmount: "",
                                                              },
                                                          ]
                                                        : [],
                                            });
                                        }}
                                        error={errors.couponType?.message}
                                        disabled={Boolean(selectedItem)}
                                        className="w-full!"
                                    />
                                )}
                            />
                            <Controller
                                name="name"
                                control={control}
                                render={({ field: { value, onChange, ref } }) => (
                                    <KitTextField
                                        inputRef={ref}
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
                            {couponType === CouponType.ITEM && (
                                <Controller
                                    name="code"
                                    control={control}
                                    render={({ field: { value, onChange, ref } }) => (
                                        <KitTextField
                                            inputRef={ref}
                                            size="small"
                                            height="32px"
                                            label="Coupon Code"
                                            placeholderFontSize={14}
                                            required
                                            value={value}
                                            onChange={onChange}
                                            error={errors.code && errors.code.message}
                                            helperText={errors.code && errors.code.message}
                                            placeholder="Enter coupon code"
                                            disabled={Boolean(selectedItem)}
                                            className="w-full!"
                                        />
                                    )}
                                />
                            )}
                            {couponType !== CouponType.BULK && (
                                <>
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
                                                value={
                                                    COUPON_DISCOUNT_OPTIONS.find((o) => o.value === field.value) ?? null
                                                }
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
                                                        if (["e", "E", "+", "-", "."].includes(e.key))
                                                            e.preventDefault();
                                                    }}
                                                    className="w-full!"
                                                />
                                            </div>
                                        )}
                                    />
                                </>
                            )}
                            {(couponType === CouponType.ITEM || couponType === CouponType.CUSTOMER) && (
                                <>
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
                                                    helperText={
                                                        errors.maxDiscountAmount && errors.maxDiscountAmount.message
                                                    }
                                                    placeholder="Enter Max Discount Amount"
                                                    type="number"
                                                    onKeyDown={(e) => {
                                                        if (["e", "E", "+", "-", "."].includes(e.key))
                                                            e.preventDefault();
                                                    }}
                                                    className="w-full!"
                                                />
                                            </div>
                                        )}
                                    />

                                    <Controller
                                        name="perCustomerLimit"
                                        control={control}
                                        render={({ field: { value, onChange, ref } }) => (
                                            <div className="w-full">
                                                <KitTextField
                                                    inputRef={ref}
                                                    size="small"
                                                    height="32px"
                                                    label="Per Customer Limit"
                                                    placeholderFontSize={14}
                                                    required
                                                    value={value}
                                                    onChange={onChange}
                                                    error={errors.perCustomerLimit && errors.perCustomerLimit.message}
                                                    helperText={
                                                        errors.perCustomerLimit && errors.perCustomerLimit.message
                                                    }
                                                    placeholder="Enter Per Customer Limit"
                                                    type="number"
                                                    onKeyDown={(e) => {
                                                        if (["e", "E", "+", "-", "."].includes(e.key))
                                                            e.preventDefault();
                                                    }}
                                                    disabled={Boolean(selectedItem)}
                                                    className="w-full!"
                                                />
                                            </div>
                                        )}
                                    />
                                </>
                            )}
                            {couponType === CouponType.ITEM && (
                                <Controller
                                    name="usageLimit"
                                    control={control}
                                    render={({ field: { value, onChange, ref } }) => (
                                        <div className="w-full">
                                            <KitTextField
                                                inputRef={ref}
                                                size="small"
                                                height="32px"
                                                label="Usage Limit"
                                                placeholderFontSize={14}
                                                required
                                                value={value}
                                                onChange={onChange}
                                                error={errors.usageLimit && errors.usageLimit.message}
                                                helperText={errors.usageLimit && errors.usageLimit.message}
                                                placeholder="Enter Usage Limit"
                                                type="number"
                                                onKeyDown={(e) => {
                                                    if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                                                }}
                                                disabled={Boolean(selectedItem)}
                                                className="w-full!"
                                            />
                                        </div>
                                    )}
                                />
                            )}
                            {(couponType === CouponType.ITEM || couponType === CouponType.BULK) && (
                                <div className={couponType === CouponType.BULK ? "col-span-2" : ""}>
                                    <Controller
                                        name="itemCodes"
                                        control={control}
                                        render={({ field, fieldState }) => {
                                            const productItemCodes = field.value
                                                ? field.value
                                                      .split(",")
                                                      .map((id) => id.trim())
                                                      .filter(Boolean)
                                                : [];

                                            const selectedOptions = productItemCodes.map(
                                                (code) =>
                                                    selectedProductOptions.find(
                                                        (option) => String(option.value) === code
                                                    ) ??
                                                    productOptions.find((option) => String(option.value) === code) ?? {
                                                        label: code,
                                                        value: code,
                                                    }
                                            );

                                            const mergedOptions = [
                                                ...selectedOptions,
                                                ...productOptions.filter(
                                                    (option) => !productItemCodes.includes(String(option.value))
                                                ),
                                            ];

                                            return (
                                                <KitSelect
                                                    label="Item Codes"
                                                    placeholder="Search or select item codes"
                                                    size="small"
                                                    placeholderFontSize={14}
                                                    inputFontSize={14}
                                                    required
                                                    options={mergedOptions}
                                                    isMulti
                                                    closeMenuOnSelect={false}
                                                    isLoading={isproductListLoading}
                                                    isClearable
                                                    isDisabled={Boolean(selectedItem) || isproductListLoading}
                                                    onInputChange={(inputValue, actionMeta) => {
                                                        if (actionMeta.action === "input-change") {
                                                            setProductSearch(inputValue);
                                                        }
                                                    }}
                                                    value={selectedOptions}
                                                    onChange={(selected) => {
                                                        const options = Array.isArray(selected)
                                                            ? selected
                                                            : selected
                                                              ? [selected]
                                                              : [];

                                                        const uniqueOptions = [
                                                            ...new Map(
                                                                options.map((option) => [String(option.value), option])
                                                            ).values(),
                                                        ];
                                                        setSelectedProductOptions(uniqueOptions);
                                                        field.onChange(
                                                            uniqueOptions
                                                                .map((option) => String(option.value))
                                                                .filter(Boolean)
                                                                .join(",")
                                                        );
                                                    }}
                                                    error={!!fieldState.error}
                                                    helperText={fieldState.error?.message}
                                                />
                                            );
                                        }}
                                    />
                                </div>
                            )}
                            {(couponType === CouponType.BRAND || couponType === CouponType.TIME_DURATION) && (
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
                            )}
                            {(couponType === CouponType.BRAND || couponType === CouponType.CUSTOMER) && (
                                <Controller
                                    name="brandIds"
                                    control={control}
                                    render={({ field, fieldState }) => {
                                        const selectedBrandIds = field.value
                                            ? field.value
                                                  .split(",")
                                                  .map((id) => id.trim())
                                                  .filter(Boolean)
                                            : [];

                                        return (
                                            <KitSelect
                                                label="Brand IDs"
                                                placeholder="Select brands"
                                                size="small"
                                                placeholderFontSize={14}
                                                inputFontSize={14}
                                                required
                                                options={brandOptions}
                                                isMulti
                                                closeMenuOnSelect={false}
                                                isLoading={isBandsWithIdLoading}
                                                isClearable
                                                isDisabled={Boolean(selectedItem) || isBandsWithIdLoading}
                                                value={brandOptions.filter((option) =>
                                                    selectedBrandIds.includes(String(option.value))
                                                )}
                                                onChange={(selected) => {
                                                    const brandIds = Array.isArray(selected)
                                                        ? selected.map((option) => String(option.value)).filter(Boolean)
                                                        : selected
                                                          ? [String(selected.value)]
                                                          : [];
                                                    field.onChange(brandIds.join(","));
                                                }}
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        );
                                    }}
                                />
                            )}
                            {couponType === CouponType.CUSTOMER && (
                                <Controller
                                    name="customerPhones"
                                    control={control}
                                    render={({ field, fieldState }) => {
                                        const customerPhoneNumbers = field.value
                                            ? field.value
                                                  .split(",")
                                                  .map((phone) => phone.trim())
                                                  .filter(Boolean)
                                            : [];

                                        const selectedOptions = customerPhoneNumbers.map(
                                            (phone) =>
                                                selectedCustomerOptions.find(
                                                    (option) => String(option.value) === phone
                                                ) ??
                                                customerOptions.find((option) => String(option.value) === phone) ?? {
                                                    label: phone,
                                                    value: phone,
                                                }
                                        );

                                        const mergedOptions = [
                                            ...selectedOptions,
                                            ...customerOptions.filter(
                                                (option) => !customerPhoneNumbers.includes(String(option.value))
                                            ),
                                        ];

                                        return (
                                            <KitSelect
                                                label="Customer Phones"
                                                placeholder="Search or select customer phones"
                                                size="small"
                                                placeholderFontSize={14}
                                                inputFontSize={14}
                                                required
                                                options={mergedOptions}
                                                isMulti
                                                closeMenuOnSelect={false}
                                                isLoading={isCustomerListLoading}
                                                isClearable
                                                isDisabled={Boolean(selectedItem) || isCustomerListLoading}
                                                onInputChange={(inputValue, actionMeta) => {
                                                    if (actionMeta.action === "input-change") {
                                                        setCustomerSearch(inputValue);
                                                    }
                                                }}
                                                value={selectedOptions}
                                                onChange={(selected) => {
                                                    const options = Array.isArray(selected)
                                                        ? selected
                                                        : selected
                                                          ? [selected]
                                                          : [];

                                                    const uniqueOptions = [
                                                        ...new Map(
                                                            options.map((option) => [String(option.value), option])
                                                        ).values(),
                                                    ];
                                                    setSelectedCustomerOptions(uniqueOptions);
                                                    field.onChange(
                                                        uniqueOptions
                                                            .map((option) => String(option.value))
                                                            .filter(Boolean)
                                                            .join(",")
                                                    );
                                                }}
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        );
                                    }}
                                />
                            )}
                            {couponType === CouponType.TIME_DURATION && (
                                <>
                                    <Controller
                                        name="validDays"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <KitSelect
                                                label="Valid Days"
                                                placeholder="Select valid days"
                                                size="small"
                                                placeholderFontSize={14}
                                                inputFontSize={14}
                                                required
                                                options={VALID_DAYS_OPTIONS}
                                                isMulti
                                                closeMenuOnSelect={false}
                                                isDisabled={Boolean(selectedItem)}
                                                value={VALID_DAYS_OPTIONS.filter((option) =>
                                                    (field.value ?? []).includes(option.value)
                                                )}
                                                onChange={(selected) => {
                                                    field.onChange(
                                                        Array.isArray(selected)
                                                            ? selected.map((option) => String(option.value))
                                                            : []
                                                    );
                                                }}
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="startTime"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <KitTextField
                                                name={field.name}
                                                inputRef={field.ref}
                                                size="small"
                                                type="time"
                                                label="Start Time"
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                className="w-full"
                                                disabled={Boolean(selectedItem)}
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="endTime"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <KitTextField
                                                name={field.name}
                                                inputRef={field.ref}
                                                size="small"
                                                type="time"
                                                label="End Time"
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                onBlur={field.onBlur}
                                                className="w-full"
                                                disabled={Boolean(selectedItem)}
                                                error={!!fieldState.error}
                                                helperText={fieldState.error?.message}
                                            />
                                        )}
                                    />
                                </>
                            )}

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
                            {couponType === CouponType.BULK && (
                                <div className="col-span-2 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-base font-semibold">Bulk Discount Slabs</div>

                                        <KitButton
                                            variant="contained"
                                            className="w-auto"
                                            size="small"
                                            onClick={() =>
                                                append({
                                                    thresholdType: "QUANTITY",
                                                    minQty: "",
                                                    minAmount: "",
                                                    discountType: CouponDiscountType.PERCENTAGE,
                                                    discountValue: "",
                                                    maxDiscountAmount: "",
                                                })
                                            }
                                            startIcon={<KitIcon icon="tabler:plus" />}
                                        >
                                            Add Slab
                                        </KitButton>
                                    </div>

                                    {fields.map((slab, index) => (
                                        <div
                                            key={slab.id}
                                            className="relative grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-4 pt-5 dark:border-gray-700 dark:bg-gray-900"
                                        >
                                            <IconButton
                                                type="button"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                                aria-label={`Remove slab ${index + 1}`}
                                                title="Remove slab"
                                                size="small"
                                                className="absolute! right-3! top-2! h-6! w-6! rounded-sm! border! border-blue-600! text-blue-600! hover:border-red-200! hover:bg-red-50! hover:text-red-600! disabled:cursor-not-allowed! disabled:opacity-40! dark:border-gray-700! dark:bg-gray-800! dark:text-gray-400! dark:hover:border-red-900! dark:hover:bg-red-950! dark:hover:text-red-400!"
                                            >
                                                <KitIcon icon="tabler:x" />
                                            </IconButton>
                                            <div className="grid grid-cols-[3fr_7fr] gap-2">
                                                <Controller
                                                    name={`bulkSlabs.${index}.thresholdType`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <div>
                                                            <Controller
                                                                name={`bulkSlabs.${index}.thresholdType`}
                                                                control={control}
                                                                render={({ field }) => (
                                                                    <KitSelect
                                                                        label="Condition"
                                                                        placeholder="Select Condition"
                                                                        size="small"
                                                                        placeholderFontSize={14}
                                                                        inputFontSize={14}
                                                                        options={BULK_THRESHOLD_OPTIONS}
                                                                        value={
                                                                            BULK_THRESHOLD_OPTIONS.find(
                                                                                (o) => o.value === field.value
                                                                            ) ?? null
                                                                        }
                                                                        displayValue={(selected) =>
                                                                            selected?.label || ""
                                                                        }
                                                                        onChange={(selected) => {
                                                                            const thresholdType = selected?.value;
                                                                            if (!thresholdType) return;
                                                                            field.onChange(thresholdType);
                                                                            setValue(`bulkSlabs.${index}.minQty`, "", {
                                                                                shouldDirty: true,
                                                                                shouldValidate: true,
                                                                            });
                                                                            setValue(
                                                                                `bulkSlabs.${index}.minAmount`,
                                                                                "",
                                                                                {
                                                                                    shouldDirty: true,
                                                                                    shouldValidate: true,
                                                                                }
                                                                            );
                                                                        }}
                                                                        error={
                                                                            errors?.bulkSlabs?.[index]?.thresholdType &&
                                                                            errors.bulkSlabs[index].thresholdType
                                                                                .message
                                                                        }
                                                                        disabled={Boolean(selectedItem)}
                                                                        className="w-full!"
                                                                    />
                                                                )}
                                                            />
                                                        </div>
                                                    )}
                                                />

                                                {watch(`bulkSlabs.${index}.thresholdType`) === "AMOUNT" ? (
                                                    <Controller
                                                        name={`bulkSlabs.${index}.minAmount`}
                                                        control={control}
                                                        render={({ field: { value, onChange, ref } }) => (
                                                            <div className="w-full">
                                                                <KitTextField
                                                                    inputRef={ref}
                                                                    size="small"
                                                                    height="32px"
                                                                    label="Minimum Amount"
                                                                    placeholderFontSize={14}
                                                                    required
                                                                    value={value}
                                                                    onChange={onChange}
                                                                    placeholder="e.g. 2000"
                                                                    type="number"
                                                                    onKeyDown={(e) => {
                                                                        if (["e", "E", "+", "-", "."].includes(e.key))
                                                                            e.preventDefault();
                                                                    }}
                                                                    error={
                                                                        errors?.bulkSlabs?.[index]?.minAmount &&
                                                                        errors.bulkSlabs[index].minAmount.message
                                                                    }
                                                                    helperText={
                                                                        errors?.bulkSlabs?.[index]?.minAmount &&
                                                                        errors.bulkSlabs[index].minAmount.message
                                                                    }
                                                                    disabled={Boolean(selectedItem)}
                                                                    className="w-full!"
                                                                />
                                                            </div>
                                                        )}
                                                    />
                                                ) : (
                                                    <Controller
                                                        name={`bulkSlabs.${index}.minQty`}
                                                        control={control}
                                                        render={({ field: { value, onChange, ref } }) => (
                                                            <div className="w-full">
                                                                <KitTextField
                                                                    inputRef={ref}
                                                                    size="small"
                                                                    height="32px"
                                                                    label="Minimum Quantity"
                                                                    placeholderFontSize={14}
                                                                    required
                                                                    value={value}
                                                                    onChange={onChange}
                                                                    placeholder="e.g. 3"
                                                                    type="number"
                                                                    onKeyDown={(e) => {
                                                                        if (["e", "E", "+", "-", "."].includes(e.key))
                                                                            e.preventDefault();
                                                                    }}
                                                                    error={
                                                                        errors?.bulkSlabs?.[index]?.minQty &&
                                                                        errors.bulkSlabs[index].minQty.message
                                                                    }
                                                                    helperText={
                                                                        errors?.bulkSlabs?.[index]?.minQty &&
                                                                        errors.bulkSlabs[index].minQty.message
                                                                    }
                                                                    disabled={Boolean(selectedItem)}
                                                                    className="w-full!"
                                                                />
                                                            </div>
                                                        )}
                                                    />
                                                )}
                                            </div>

                                            <Controller
                                                name={`bulkSlabs.${index}.discountType`}
                                                control={control}
                                                render={({ field }) => (
                                                    <KitSelect
                                                        label="Discount Type"
                                                        placeholder="Select Discount Type"
                                                        size="small"
                                                        placeholderFontSize={14}
                                                        inputFontSize={14}
                                                        options={COUPON_DISCOUNT_OPTIONS}
                                                        value={
                                                            COUPON_DISCOUNT_OPTIONS.find(
                                                                (o) => o.value === field.value
                                                            ) ?? null
                                                        }
                                                        displayValue={(selected) => selected?.label || ""}
                                                        onChange={(selected) => {
                                                            const opt = selected;
                                                            field.onChange(opt?.value || "");
                                                        }}
                                                        disabled={Boolean(selectedItem)}
                                                        className="w-full!"
                                                    />
                                                )}
                                            />

                                            <Controller
                                                name={`bulkSlabs.${index}.discountValue`}
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
                                                            placeholder="Enter discount value"
                                                            type="number"
                                                            onKeyDown={(e) => {
                                                                if (["e", "E", "+", "-", "."].includes(e.key))
                                                                    e.preventDefault();
                                                            }}
                                                            error={
                                                                errors?.bulkSlabs?.[index]?.discountValue &&
                                                                errors.bulkSlabs[index].discountValue.message
                                                            }
                                                            helperText={
                                                                errors?.bulkSlabs?.[index]?.discountValue &&
                                                                errors.bulkSlabs[index].discountValue.message
                                                            }
                                                            className="w-full!"
                                                        />
                                                    </div>
                                                )}
                                            />

                                            <Controller
                                                name={`bulkSlabs.${index}.maxDiscountAmount`}
                                                control={control}
                                                render={({ field: { value, onChange, ref } }) => (
                                                    <div className="w-full">
                                                        <KitTextField
                                                            inputRef={ref}
                                                            size="small"
                                                            height="32px"
                                                            label="Maximum Discount Amount (Optional)"
                                                            placeholderFontSize={14}
                                                            value={value}
                                                            onChange={onChange}
                                                            placeholder="e.g. 150"
                                                            type="number"
                                                            onKeyDown={(e) => {
                                                                if (["e", "E", "+", "-", "."].includes(e.key))
                                                                    e.preventDefault();
                                                            }}
                                                            className="w-full!"
                                                        />
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
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
