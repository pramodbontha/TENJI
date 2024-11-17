import { Button, Select } from "antd";
import { setLanguage } from "@/slices/LanguageSlice";
import { useAppDispatch } from "@/redux/hooks";
import logo from "../assets/logo.jpeg";
import { useTranslation } from "react-i18next";
import { setIsTourEnabled } from "@/slices/AppTourSlice";

const Header = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleStartTourClick = () => {
    dispatch(setIsTourEnabled(true));
  };

  return (
    <div className="w-full pl-6 pr-6 h-18 bg-white drop-shadow-md flex items-center justify-between">
      <div className="pt-0 font-semibold text-black">
        <div className="flex">
          <img src={logo} width={"70px"} height={"70px"}></img>
          <div className="mt-5">
            Textbook Entity Network and Jurisprudence Interface
          </div>
        </div>
      </div>
      <div className="flex">
        <div className="mr-2">
          <Button type="default" onClick={handleStartTourClick}>
            {t("start-tour")}
          </Button>
        </div>
        <div className="" id="language-selector">
          <Select
            defaultValue={"de"}
            onChange={(value) => dispatch(setLanguage(value))}
            options={[
              { label: "EN", value: "en" },
              { label: "DE", value: "de" },
              { label: "PT", value: "pt-PT" },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default Header;
