import ButtonSm from '@/components/common/Buttons'
import Input from '@/components/common/Input'
import { useVerifyTotp } from '@/queries/AuthQueries'
import { useState } from 'react'
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

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-fadeIn w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
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
          type="str"
          maxLength={6}
          required
        />

        <div className="mt-4 flex gap-3">
          <ButtonSm
            state="default"
            text={isPending ? t('verifying') : t('verify_button')}
            disabled={isPending || code.length < 6}
            isPending={isPending}
            onClick={handleVerify}
            className="w-full rounded-2xl bg-blue-500 py-3 text-white hover:bg-blue-700"
          />

          <ButtonSm
            state="outline"
            text={t('cancel')}
            onClick={onClose}
            className="w-full rounded-2xl py-3"
          />
        </div>
      </div>
    </div>
  )
}

export default VerifyTotpModal
