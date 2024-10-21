import { Select } from "antd";
import { setLanguage } from "@/slices/LanguageSlice";
import { useAppDispatch } from "@/redux/hooks";
import logo from "../assets/logo.jpeg";
const Header = () => {
  const dispatch = useAppDispatch();
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
  );
};

export default Header;
