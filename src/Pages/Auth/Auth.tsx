import { useState } from "react";
import { useLogin } from "../../Queries/AuthQueries";
import VerifyTotpModal from "./VerifyTotpModal";
import { useNavigate } from "react-router-dom";
import Input from "../../Components/common/Input";
import ButtonSm from "../../Components/common/Buttons";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();
const { i18n } = useTranslation();
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
    <div className="flex h-screen w-full">
      <div className="flex w-full flex-col items-center justify-center px-8 md:w-1/2">
        <div className="flex w-[400px] flex-col gap-4">
<select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="border rounded px-2 py-1"
    >
      <option value="en">English</option>
      <option value="ta">Tamil</option>
      
    </select>
          {/* Welcome */}
          <p className="text-md font-medium text-gray-500 text-start">
            {t("signin_subtitle")}
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 text-start mt-1">
            {t("welcome")} 👋
          </h2>

          {/* Inputs */}
          <Input
            title={t("username_label")}
            placeholder={t("username_placeholder")}
            inputValue={identifier}
            onChange={setIdentifier}
            type="str"
            required
          />

          <Input
            title={t("password_label")}
            placeholder={t("password_placeholder")}
            inputValue={password}
            onChange={setPassword}
            type="str"
            required
          />

          {/* Button */}
          <ButtonSm
            state="default"
            text={t("signin_button")}
            type="submit"
            isPending={isPending}
            disabled={!identifier || !password || isPending}
            onClick={handleLogin}
            className="w-full rounded-20 bg-blue-500 py-3 text-white hover:bg-blue-700"
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

      {/* Right Image */}
      <div className="bg-primary relative hidden w-1/2 items-center justify-center lg:flex">
        <div className="absolute z-50 top-1/2 left-1/2 text-[60px] xl:text-[80px] leading-[60px] xl:leading-20 -translate-x-1/2 -translate-y-1/2 font-medium text-[#00b3fa] mix-blend-difference">
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
