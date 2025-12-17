import ButtonSm from '@/components/common/Buttons'
import Input from '@/components/common/Input'
import { useVerifyTotp } from '@/queries/AuthQueries'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const VerifyTotpModal = ({
  identifier,
  onClose,
  onSuccess,
}: {
  identifier: string
  onClose: () => void
  onSuccess: () => void
}) => {
  const { t } = useTranslation()
  const { mutate: verify, isPending } = useVerifyTotp()
  const [code, setCode] = useState('')
  const codeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    codeInputRef.current?.focus()
  }, [])

  const handleVerify = () => {
    verify(
      { identifier, code: Number(code) },
      {
        onSuccess: () => {
          onClose()
          onSuccess()
        },
      }
    )
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.length < 6 || isPending) return
    handleVerify()
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-fadeIn w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h2 className="mb-1 text-center text-2xl font-semibold text-gray-900">
            {t('verify_title')}
          </h2>

          <p className="mb-6 text-center text-sm text-gray-500">
            {t('verify_desc')}
          </p>

          <Input
            title={t('verification_code_label')}
            placeholder={t('verification_code_placeholder')}
            inputValue={code}
            onChange={setCode}
            name="totp-code"
            type="str"
            maxLength={6}
            required
            inputRef={codeInputRef}
          />

          <div className="mt-2 flex gap-3">
            <ButtonSm
              state="outline"
              text={t('cancel')}
              onClick={onClose}
              type="button"
              className="w-full rounded-2xl py-3"
            />
            <ButtonSm
              state="default"
              text={isPending ? t('verifying') : t('verify_button')}
              disabled={isPending || code.length < 6}
              isPending={isPending}
              onClick={handleVerify}
              type="submit"
              className="w-full rounded-2xl bg-blue-500 py-3 text-white hover:bg-blue-700"
            />
          </div>
        </form>
      </div>
    </div>
  )
}

export default VerifyTotpModal
