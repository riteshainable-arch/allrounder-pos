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
import { useCreateUser, useUpdateUser } from "../../../../../kit/hooks/data/users";
import { ROLE_OPTIONS } from "../../../../../kit/configs/general";
import { Checkbox, FormControlLabel, Switch } from "@mui/material";

export const DEFAULT_USER_ROLE = "admin";
export const USER_ROLES = ["admin", "manager", "cashier"];

export const schema = yup.object({
    firstName: yup.string().trim().required("First name is required"),
    lastName: yup.string().trim().optional(),
    email: yup.string().trim().email("Enter a valid email").required("Email is required"),
    password: yup.string().when("$isEditing", {
        is: false,
        then: (field) => field.required("Password is required").min(6, "Password must be at least 6 characters"),
        otherwise: (field) => field.optional(),
    }),
    role: yup.mixed().oneOf(USER_ROLES).required("Role is required"),
    isActive: yup.boolean().required(),
    isB2BMode: yup.boolean().required(),
    canConvertToInvoice: yup.boolean().required(),
    canConvertToConsumption: yup.boolean().required(),
});

export default function AddUpdateUserModal({ isOpen, onClose, onRefresh, selectedItem }) {
    const couponNameRef = useRef(null);

    const isEditing = Boolean(selectedItem?.id);

    const { createUser: onCreateUser, isCreatingUser } = useCreateUser();
    const { update: onUpdateUser, isUpdatingUser } = useUpdateUser(String(selectedItem?.id));

    const defaultValues = {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: DEFAULT_USER_ROLE,
        isActive: true,
        isB2BMode: false,
        canConvertToInvoice: false,
        canConvertToConsumption: false,
    };

    const {
        reset,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({
        defaultValues,
        mode: "onChange",
        resolver: yupResolver(schema),
        context: { isEditing },
    });

    const isBtnLoading = isCreatingUser || isUpdatingUser;

    const onSubmit = async (data) => {
        const payload = {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim().toLowerCase(),
            role: data.role,
            isActive: data.isActive,
            isB2BMode: data.isB2BMode,
            canConvertToInvoice: data.canConvertToInvoice,
            canConvertToConsumption: data.canConvertToConsumption,
            ...(!isEditing && { password: data.password }),
        };
        try {
            if (selectedItem) {
                await onUpdateUser(payload);
                toast.success("User updated successfully.");
            } else {
                await onCreateUser(payload);
                toast.success("User created successfully.");
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

        reset({
            firstName: selectedItem.firstName ?? "",
            lastName: selectedItem.lastName ?? "",
            email: selectedItem.email ?? "",
            password: "",
            role: selectedItem.role ?? DEFAULT_USER_ROLE,
            isActive: selectedItem.isActive !== false,
            isB2BMode: Boolean(selectedItem.isB2BMode),
            canConvertToInvoice: Boolean(selectedItem.canConvertToInvoice),
            canConvertToConsumption: Boolean(selectedItem.canConvertToConsumption),
        });
    }, [isOpen, selectedItem, reset]);

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
            title={<div className="text-base font-semibold">{isEditing ? "Update User" : "Add User"}</div>}
            titleClass="p-3! border-b!"
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                {false ? (
                    <div className="h-80 flex justify-center">
                        <KitLoader logo={false} isLoading={true} />
                    </div>
                ) : (
                    <div className="p-4 flex flex-col gap-2 md:gap-4 max-h-[78vh] overflow-y-auto  custom-scroll">
                        <div className="grid grid-cols-2 gap-2 md:gap-4 items-end">
                            <Controller
                                name="firstName"
                                control={control}
                                render={({ field: { value, onChange, ref } }) => (
                                    <KitTextField
                                        inputRef={couponNameRef}
                                        size="small"
                                        height="32px"
                                        label="First Name"
                                        placeholderFontSize={14}
                                        required
                                        value={value}
                                        onChange={onChange}
                                        error={errors.firstName && errors.firstName.message}
                                        helperText={errors.firstName && errors.firstName.message}
                                        placeholder="Enter first name"
                                        className="w-full!"
                                    />
                                )}
                            />
                            <Controller
                                name="lastName"
                                control={control}
                                render={({ field: { value, onChange, ref } }) => (
                                    <KitTextField
                                        inputRef={ref}
                                        size="small"
                                        height="32px"
                                        label="Last Name"
                                        placeholderFontSize={14}
                                        value={value}
                                        onChange={onChange}
                                        placeholder="Enter last name"
                                        className="w-full!"
                                    />
                                )}
                            />
                            <Controller
                                name="email"
                                control={control}
                                render={({ field: { value, onChange, ref } }) => (
                                    <KitTextField
                                        inputRef={ref}
                                        size="small"
                                        type="email"
                                        height="32px"
                                        label="Email"
                                        placeholderFontSize={14}
                                        required
                                        value={value}
                                        onChange={onChange}
                                        error={errors.email && errors.email.message}
                                        helperText={errors.email && errors.email.message}
                                        placeholder="Enter email address"
                                        className="w-full!"
                                    />
                                )}
                            />
                            <Controller
                                name="role"
                                control={control}
                                render={({ field }) => (
                                    <KitSelect
                                        label="Role"
                                        placeholder="Select role"
                                        size="small"
                                        placeholderFontSize={14}
                                        inputFontSize={14}
                                        required
                                        options={ROLE_OPTIONS}
                                        value={ROLE_OPTIONS.find((o) => o.value === field.value) ?? null}
                                        displayValue={(selected) => selected?.label || ""}
                                        onChange={(selected) => {
                                            const opt = selected;
                                            field.onChange(opt?.value || "");
                                        }}
                                        error={errors.role?.message}
                                        helperText={errors.role && errors.role.message}
                                        className="w-full!"
                                    />
                                )}
                            />
                            {!isEditing && (
                                <Controller
                                    name="password"
                                    control={control}
                                    render={({ field: { value, onChange, ref } }) => (
                                        <KitTextField
                                            inputRef={ref}
                                            size="small"
                                            type="password"
                                            height="32px"
                                            label="Login Password"
                                            placeholderFontSize={14}
                                            required
                                            value={value}
                                            onChange={onChange}
                                            error={errors.password && errors.password.message}
                                            helperText={errors.password && errors.password.message}
                                            placeholder="Minimum 6 characters"
                                            className="w-full!"
                                        />
                                    )}
                                />
                            )}
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        label="Allow Login"
                                        sx={{
                                            "& .MuiFormControlLabel-label": {
                                                fontSize: { xs: "13px", md: "0.875rem" },
                                            },
                                        }}
                                        control={
                                            <Switch
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                size="small"
                                            />
                                        }
                                    />
                                )}
                            />
                        </div>
                        <div className="flex flex-col gap-0">
                            <Controller
                                name="isB2BMode"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        label="B2B Mode"
                                        sx={{
                                            "& .MuiFormControlLabel-label": {
                                                fontSize: "14px",
                                            },
                                        }}
                                        control={
                                            <Checkbox
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                size="small"
                                            />
                                        }
                                    />
                                )}
                            />

                            <Controller
                                name="canConvertToInvoice"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        label="Can Convert to Invoice"
                                        sx={{
                                            "& .MuiFormControlLabel-label": {
                                                fontSize: "14px",
                                            },
                                        }}
                                        control={
                                            <Checkbox
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                size="small"
                                            />
                                        }
                                    />
                                )}
                            />

                            <Controller
                                name="canConvertToConsumption"
                                control={control}
                                render={({ field }) => (
                                    <FormControlLabel
                                        label="Can Convert to Consumption"
                                        sx={{
                                            "& .MuiFormControlLabel-label": {
                                                fontSize: "14px",
                                            },
                                        }}
                                        control={
                                            <Checkbox
                                                checked={field.value}
                                                onChange={(e) => field.onChange(e.target.checked)}
                                                size="small"
                                            />
                                        }
                                    />
                                )}
                            />
                        </div>
                    </div>
                )}
                <div className="p-3 md:p-4 flex justify-end gap-3 border-t border-gray-300">
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
                        {isEditing ? "Update User" : "Create User"}
                    </KitButton>
                </div>
            </form>
        </KitModal>
    );
}
