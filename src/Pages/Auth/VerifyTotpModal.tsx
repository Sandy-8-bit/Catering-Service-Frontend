import { useState } from "react";
import { useVerifyTotp } from "../../Queries/AuthQueries";
import Input from "../../Components/common/Input";
import ButtonSm from "../../Components/common/Buttons";

const VerifyTotpModal = ({
  identifier,
  onClose,
  onSuccess,
}: {
  identifier: string;
  onClose: () => void;
  onSuccess: () => void;
}) => {
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
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-fadeIn">
        
        {/* Header */}
        <h2 className="text-2xl font-semibold text-gray-900 text-center mb-1">
          Two-Step Verification
        </h2>
        <p className="text-gray-500 text-center mb-6 text-sm">
          Enter the 6-digit verification code sent to your registered email / phone.
        </p>

        {/* Input */}
        <Input
          title="Verification Code"
          placeholder="Enter 6-digit code"
          inputValue={code}
          onChange={setCode}
          type="str"
          maxLength={6}
          required
        />

        {/* Verify Button */}
        <ButtonSm
          state="default"
          text={isPending ? "Verifying..." : "Verify Code"}
          disabled={isPending || code.length < 6}
          isPending={isPending}
          onClick={handleVerify}
          className="w-full mt-4 py-3 rounded-2xl text-white bg-blue-500 hover:bg-blue-700"
        />

        {/* Cancel Button */}
        <ButtonSm
          state="outline"
          text="Cancel"
          onClick={onClose}
          className="w-full mt-3 py-3 rounded-2xl"
        />
      </div>
    </div>
  );
};

export default VerifyTotpModal;
