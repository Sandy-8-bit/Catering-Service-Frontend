import { useState } from "react";
import { useLogin } from "../../Queries/AuthQueries";
import VerifyTotpModal from "./VerifyTotpModal";
import { useNavigate } from "react-router-dom";
import Input from "../../Components/common/Input";
import ButtonSm from "../../Components/common/Buttons";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showTotp, setShowTotp] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");

  const handleLogin = () => {
    login(
      { identifier, password },
      {
        onSuccess: (res) => {
          if (res.token) {
            toast.success(t("login_success"));
            navigate("/dashboard");
          } else {
            setLoginIdentifier(identifier);
            setShowTotp(true);
            toast.info(t("enter_verification_code"));
          }
        },
      }
    );
  };

  return (
    <div className="flex h-screen justify-center w-full flex-col lg:flex-row">

      {/* LEFT SECTION */}
      <div className="flex flex-col w-full lg:w-1/2 items-center justify-center px-6 py-10 md:px-12">
        
        <div className="w-full max-w-[380px] flex flex-col gap-4">

          {/* Language Selector */}
          <div className="flex justify-end mb-2">
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="en">English</option>
              <option value="ta">Tamil</option>
            </select>
          </div>

          {/* Welcome text */}
          <p className="text-sm md:text-base font-medium text-gray-500 text-start">
            {t("signin_subtitle")}
          </p>

          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 text-start mt-1">
            {t("welcome")} 👋
          </h2>

          {/* Username Input */}
          <Input
            title={t("username_label")}
            placeholder={t("username_placeholder")}
            inputValue={identifier}
            onChange={setIdentifier}
            type="str"
            required
          />

          {/* Password Input */}
          <Input
            title={t("password_label")}
            placeholder={t("password_placeholder")}
            inputValue={password}
            onChange={setPassword}
            type="str"
            required
          />

          {/* Sign In Button */}
          <ButtonSm
            state="default"
            text={t("signin_button")}
            type="submit"
            isPending={isPending}
            disabled={!identifier || !password || isPending}
            onClick={handleLogin}
            className="w-full rounded-[16px] bg-blue-500 py-3 text-white hover:bg-blue-700 mt-2"
          />

          {/* TOTP Modal */}
          {showTotp && (
            <VerifyTotpModal
              identifier={loginIdentifier}
              onClose={() => setShowTotp(false)}
              onSuccess={() => navigate("/dashboard")}
            />
          )}
        </div>
      </div>

      {/* RIGHT IMAGE SECTION */}
      <div className="relative hidden lg:flex w-1/2 items-center justify-center">
        <div className="absolute z-50 text-[40px] xl:text-[80px] leading-[45px] xl:leading-[80px] text-[#00b3fa] mix-blend-difference text-center">
          Reliable <br /> Fast <br /> Smart.
        </div>

        <img
          src="/Images/sign-in-image.webp"
          alt="Login Banner"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />
      </div>
    </div>
  );
};

export default LoginPage;
