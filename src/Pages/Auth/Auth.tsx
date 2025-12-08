import ButtonSm from '@/components/common/Buttons'
import Input from '@/components/common/Input'
import { useLogin } from '@/queries/AuthQueries'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import VerifyTotpModal from './VerifyTotpModal'

export const SignInPage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showTotp, setShowTotp] = useState(false)
  const [loginIdentifier, setLoginIdentifier] = useState('')

  const handleLogin = () => {
    login(
      { identifier, password },
      {
        onSuccess: (res) => {
          if (res.token) {
            toast.success(t('login_success'))
            navigate('/dashboard')
          } else {
            setLoginIdentifier(identifier)
            setShowTotp(true)
            toast.info(t('enter_verification_code'))
          }
        },
      }
    )
  }

  return (
    <div className="flex h-screen w-full flex-col justify-center lg:flex-row">
      {/* LEFT SECTION */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 md:px-12 lg:w-1/2">
        <div className="flex w-full max-w-[380px] flex-col gap-4">
          {/* Language Selector */}
          <div className="mb-2 flex justify-end">
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="rounded-md border px-2 py-1 text-sm"
            >
              <option value="en">English</option>
              <option value="ta">Tamil</option>
            </select>
          </div>

          {/* Welcome text */}
          <p className="text-start text-sm font-medium text-gray-500 md:text-base">
            {t('signin_subtitle')}
          </p>

          <h2 className="mt-1 text-start text-xl font-semibold text-gray-900 md:text-2xl">
            {t('welcome')} 👋
          </h2>

          {/* Username Input */}
          <Input
            title={t('username_label')}
            placeholder={t('username_placeholder')}
            inputValue={identifier}
            onChange={setIdentifier}
            type="str"
            name="email"
            required
          />

          {/* Password Input */}
          <Input
            title={t('password_label')}
            placeholder={t('password_placeholder')}
            inputValue={password}
            onChange={setPassword}
            type="str"
            name="password"
            required
          />

          {/* Sign In Button */}
          <ButtonSm
            state="default"
            text={t('signin_button')}
            type="submit"
            isPending={isPending}
            disabled={!identifier || !password || isPending}
            onClick={handleLogin}
            className="mt-2 w-full rounded-[16px] bg-blue-500 py-3 text-white hover:bg-blue-700"
          />

          {/* TOTP Modal */}
          {showTotp && (
            <VerifyTotpModal
              identifier={loginIdentifier}
              onClose={() => setShowTotp(false)}
              onSuccess={() => navigate('/dashboard')}
            />
          )}
        </div>
      </div>

      {/* RIGHT IMAGE SECTION */}
      <div className="relative hidden w-1/2 items-center justify-center lg:flex">
        <div className="absolute z-50 text-center text-[40px] leading-[45px] text-[#00b3fa] mix-blend-difference xl:text-[80px] xl:leading-[80px]">
          Reliable <br /> Fast <br /> Smart.
        </div>

        <img
          src="/Images/sign-in-image.webp"
          alt="Login Banner"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      </div>
    </div>
  )
}
