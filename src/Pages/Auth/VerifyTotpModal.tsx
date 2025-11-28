import { useState } from "react";
import { useVerifyTotp } from "../../Queries/AuthQueries";
import Input from "../../Components/common/Input";
import ButtonSm from "../../Components/common/Buttons";
import { useTranslation } from "react-i18next";

const VerifyTotpModal = ({
  identifier,
  onClose,
  onSuccess,
}: {
  identifier: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { t } = useTranslation();
  const { mutate: verify, isPending } = useVerifyTotp();
  const [code, setCode] = useState("");

  const handleVerify = () => {
    verify(
      { identifier, code: Number(code) },
      {
        onSuccess: () => {
          onClose();
          onSuccess();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-100 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-fadeIn">
        
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-1">
          {t("verify_title")}
        </h2>

        <p className="text-gray-500 text-center mb-6 text-sm">
          {t("verify_desc")}
        </p>

        <Input
          title={t("verification_code_label")}
          placeholder={t("verification_code_placeholder")}
          inputValue={code}
          onChange={setCode}
          type="str"
          maxLength={6}
          required
        />

        <div className="flex  gap-3 mt-4">
          <ButtonSm
            state="default"
            text={isPending ? t("verifying") : t("verify_button")}
            disabled={isPending || code.length < 6}
            isPending={isPending}
            onClick={handleVerify}
            className="w-full py-3 rounded-2xl text-white bg-blue-500 hover:bg-blue-700"
          />

          <ButtonSm
            state="outline"
            text={t("cancel")}
            onClick={onClose}
            className="w-full py-3 rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
};

export default VerifyTotpModal;
