import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import IconButton from '@mui/material/IconButton'
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import { useState } from "react";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { useSWRLogin } from "../../../../kit/hooks/data/auth";
import storage from '../../../../kit/hooks/data/services/storage'
import { Role } from "../../../../kit/configs/general";
import Logo from "../../../../../resources/allrounder_logo.png";

const DEFAULT_VALUE_LOGIN = {
  email: '',
  password: ''
}

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .test('email-or-login-id', 'Enter valid email or user ID!', (value) =>
      !value || !value.includes('@') || yup.string().email().isValidSync(value)
    )
    .required('Email / User ID is a required field!'),
  password: yup
    .string()
    // .matches(/^(?=.{8,})/, 'Must contain 8 characters')
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])/, 'Must contain one uppercase, one lowercase')
    // .matches(/^(?=.*[!@#\$%\^&\*\-])/, 'Must contain one special character like !@#$%^&*-')
    // .matches(/(?=.*\d)/, 'Must contain one number')
    .required('password is a required field'),
})

export default function Login() {
  const navigate = useNavigate();
  const [isPasswordShown, setIsPasswordShown] = useState(true)
  const [loginErrorMessage, setLoginErrorMessage] = useState('')

  const { create: onLoginAccount } = useSWRLogin()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: DEFAULT_VALUE_LOGIN,
    mode: 'all',
    resolver: yupResolver(loginSchema)
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const onSubmit = async (data) => {
    setLoginErrorMessage('')
    try {
      const loginDetail = await onLoginAccount(data)
      const role = String(loginDetail?.data?.role || "").toLowerCase()

      if (role === Role.ADMIN.toLowerCase()) {
        storage.removeItem("token")
        storage.removeItem("userData")
        toast.error("Admin access is not allowed here. Please use the separate admin portal.")
        return
      }

      storage.setItem("token", loginDetail?.data?.token)
      storage.setItem("userData", loginDetail?.data)

      if (role === Role.MANAGER) {
        navigate("/manager-collect")
        return
      }

      if (loginDetail?.data?.token) {
        navigate("/dashboard")
        return
      }
    } catch (error) {
      const message =
        typeof error === 'string'
          ? error
          : error?.message || error?.detail
      setLoginErrorMessage(
        typeof message === 'string' && message.trim()
          ? message
          : 'Unable to connect to the login server. Check your connection and try again.'
      )
    }
  };

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center bg-header-background">
      <img src={Logo} alt='logo' className="h-16" />
      {/* <div className="mb-6 flex justify-center">
        <div className="rounded-2xl bg-white p-4 shadow-md">
          <img
            src={Logo}
            alt="logo"
            className="h-16"
          />
        </div>
      </div> */}
      <div className="w-[380px] rounded-2xl bg-third-50 p-8 shadow-card">
        <h1 className="text-center text-3xl font-bold">Login</h1>

        <p className="mt-2 mb-8 text-center text-third-500">
          Sign in to continue
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {loginErrorMessage && (
            <p role="alert" className="text-sm text-red-600">
              {loginErrorMessage}
            </p>
          )}
          <Controller
            name='email'
            control={control}
            render={({ field: { value, onChange } }) => (
              <KitTextField
                autoFocus
                fullWidth
                required
                size='small'
                label='Email / User ID'
                placeholderFontSize={14}
                value={value}
                onChange={onChange}
                placeholder='Email or User ID (SVSALES01)'
                error={Boolean(errors.email)}
                helperText={errors.email?.message ? String(errors.email.message) : undefined}
              />
            )}
          />
          <Controller
            name='password'
            control={control}
            render={({ field: { value, onChange } }) => (
              <KitTextField
                fullWidth
                required
                label='Password'
                placeholder='*******'
                size='small'
                value={value}
                onChange={onChange}
                error={Boolean(errors.password)}
                helperText={errors.password?.message ? String(errors.password.message) : undefined}
                type={isPasswordShown ? 'text' : 'password'}
                endIcon={
                  <IconButton edge='end' onClick={handleClickShowPassword} onMouseDown={e => e.preventDefault()}>
                    <KitIcon icon={isPasswordShown ? 'tabler:eye-off' : 'tabler:eye'} />
                  </IconButton>
                }
              />
            )}
          />

          <KitButton
            type="submit"
            className="w-full"
            variant='contained'
          >
            Login
          </KitButton>
        </form>
      </div>
    </div>
  );
}
