import { useState } from "react";
import { useVerifyTotp } from "../../Queries/AuthQueries";

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
        <div className="mb-4">
          <h3 className="mb-1 text-xs font-semibold text-slate-700">Verification Code</h3>
          <div className="flex items-center rounded-xl border-2 border-slate-300 bg-white px-3 py-2.5 focus-within:border-slate-500 transition-all">
            <input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isPending || code.length < 6}
          className={`w-full py-3 rounded-2xl text-white font-medium transition 
            ${isPending || code.length < 6
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-700"
            }`}
        >
          {isPending ? "Verifying..." : "Verify Code"}
        </button>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default VerifyTotpModal;
