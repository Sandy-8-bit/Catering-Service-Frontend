import ButtonSm from '@/components/common/Buttons'
import DropdownSelect, {
  type DropdownOption,
} from '@/components/common/DropDown'
import Input from '@/components/common/Input'
import { useLogin } from '@/queries/AuthQueries'
import { type FormEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import VerifyTotpModal from './VerifyTotpModal'

const LANGUAGE_OPTIONS: DropdownOption[] = [
  { id: 1, label: 'English' },
  { id: 2, label: 'Tamil' },
]

const LANGUAGE_CODE_LOOKUP: Record<number, string> = {
  1: 'en',
  2: 'ta',
}

const getLanguageOptionByCode = (code: string): DropdownOption => {
  const normalizedCode = code.split('-')[0]
  return (
    LANGUAGE_OPTIONS.find(
      (option) => LANGUAGE_CODE_LOOKUP[option.id] === normalizedCode
    ) || LANGUAGE_OPTIONS[0]
  )
}

export const SignInPage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { mutate: login, isPending } = useLogin()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showTotp, setShowTotp] = useState(false)
  const [loginIdentifier, setLoginIdentifier] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState<DropdownOption>(() =>
    getLanguageOptionByCode(i18n.language)
  )

  const handleLogin = () => {
    login(
      { identifier, password },
      {
        onSuccess: (res) => {
          if (res.token) {
            navigate('/dashboard')
          } else {
            setLoginIdentifier(identifier)
            setShowTotp(true)
            toast.success(t('enter_verification_code'))
          }
        },
      }
    )
  }

  useEffect(() => {
    const option = getLanguageOptionByCode(i18n.language)
    if (option.id !== selectedLanguage.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedLanguage(option)
    }
  }, [i18n.language, selectedLanguage.id])

  const handleLanguageChange = (option: DropdownOption) => {
    setSelectedLanguage(option)
    const nextLanguage = LANGUAGE_CODE_LOOKUP[option.id]
    if (nextLanguage && nextLanguage !== i18n.language) {
      i18n.changeLanguage(nextLanguage)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!identifier || !password || isPending) return
    handleLogin()
  }

  const isSubmitDisabled = !identifier || !password || isPending

  return (
    <div className="flex h-screen w-full flex-col justify-center lg:flex-row">
      {/* LEFT SECTION */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-10 md:px-12 lg:w-1/2">
        <form
          className="flex w-full max-w-[380px] flex-col gap-4"
          onSubmit={handleSubmit}
        >
          {/* Language Selector */}
          <div className="mb-2 flex justify-end">
            <DropdownSelect
              options={LANGUAGE_OPTIONS}
              selected={selectedLanguage}
              onChange={handleLanguageChange}
              className="w-full max-w-[160px]"
            />
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
          <div className="relative w-full min-w-[180px] self-stretch">
            <label
              htmlFor="password"
              className="mb-0.5 block text-xs leading-loose font-semibold text-slate-700"
            >
              {t('password_label')}
              <span className="text-red-500"> *</span>
            </label>
            <div className="parent-input-wrapper flex items-center justify-between overflow-clip rounded-xl border-2 border-[#F1F1F1] bg-white px-3 py-1.5 transition-all focus-within:border-slate-500">
              <input
                id="password"
                name="password"
                required
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('password_placeholder')}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-600 placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:text-blue-600 focus:outline-none"
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <img
                  src={
                    showPassword
                      ? '/icons/eye-off-icon.svg'
                      : '/icons/eye-icon.svg'
                  }
                  alt={showPassword ? 'Hide password' : 'Show password'}
                  className="h-5 w-5"
                />
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <ButtonSm
            state="default"
            text={t('signin_button')}
            type="submit"
            isPending={isPending}
            disabled={isSubmitDisabled}
            onClick={handleLogin}
            className="mt-2 w-full rounded-2xl bg-blue-500 py-3 text-white hover:bg-blue-700"
          />
        </form>

        {/* TOTP Modal */}
        {showTotp && (
          <VerifyTotpModal
            identifier={loginIdentifier}
            onClose={() => setShowTotp(false)}
            onSuccess={() => navigate('/dashboard')}
          />
        )}
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
