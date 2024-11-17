import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { Menu, MenuProps, Spin } from "antd";
import { useState } from "react";
import FilteredArticles from "./FilteredArticles";
import FilteredCases from "./FilteredCases";
import FilteredReferences from "./FilteredReferences";
import { useTranslation } from "react-i18next";
import { AppTour } from "@/components";

const { Item } = Menu;

const FilteredResultsPage = () => {
  const [selectedKey, setSelectedKey] = useState("articles");

  const { articles, articlesCount, isArticleLoading } = useAppSelector(
    (state: RootState) => state.articles
  );
  const { cases, casesCount } = useAppSelector(
    (state: RootState) => state.cases
  );
  const { references, referencesCount } = useAppSelector(
    (state: RootState) => state.references
  );

  const { t } = useTranslation();

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    setSelectedKey(e.key as string);
  };

  const contentStyle: React.CSSProperties = {
    padding: 50,
    background: "rgba(0, 0, 0, 0.1)",
    borderRadius: 4,
  };

  const content = <div style={contentStyle} />;

  return (
    <>
      <div className="flex mt-2">
        <div>
          <div className="font-semibold text-lg">{t("search-results")}</div>
          <div
            style={{ width: "250px" }}
            className=" h-44 bg-white drop-shadow-md rounded-md"
          >
            <Menu
              onClick={handleMenuClick}
              selectedKeys={[selectedKey]}
              mode="inline"
              className="mt-5 pt-5 text-center"
            >
              <Item key="articles">{`${t(
                "articles"
              )} (${articlesCount})`}</Item>
              <Item key="cases">{`${t("cases")} (${casesCount})`}</Item>
              <Item key="references">{`${t(
                "references"
              )} (${referencesCount})`}</Item>
            </Menu>
          </div>
        </div>
        <div className="flex-grow">
          {isArticleLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <Spin tip="Searching" size="large">
                {content}
              </Spin>
            </div>
          )}
          {articles.length !== 0 && selectedKey === "articles" && (
            <FilteredArticles />
          )}
          {cases.length !== 0 && selectedKey === "cases" && <FilteredCases />}
          {references.length !== 0 && selectedKey === "references" && (
            <FilteredReferences />
          )}
        </div>
      </div>
      <AppTour />
    </>
  );
};

export default FilteredResultsPage;
