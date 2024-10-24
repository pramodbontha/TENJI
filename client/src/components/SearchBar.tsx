import {
  DeleteOutlined,
  FilterOutlined,
  HomeOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Input, Col, Row, Button, Form, Badge } from "antd";
import FilterModal from "./FilterModal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLazyGetFilteredArticlesQuery } from "@/services/ArticleApi";
import { useAppDispatch } from "@/redux/hooks";
import {
  setArticleCount,
  setArticles,
  setIsArticleLoading,
} from "@/slices/ArticleSlice";
import { useLazyGetFilteredCasesQuery } from "@/services/CaseApi";
import { setCaseCount, setCases } from "@/slices/CaseSlice";
import { setReferenceCount, setReferences } from "@/slices/ReferenceSlice";
import { setQuery } from "@/slices/SearchBarSlice";
import _ from "lodash";
import { setFormValues } from "@/slices/FormSlice";
import { useLazyGetFilteredReferencesWithQueriesQuery } from "@/services/ReferenceApi";
import { useTranslation } from "react-i18next";

const SearchBar = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [values, setValues] = useState<any>({});

  const [fetchFilteredArticles, { isLoading: isArticlesLoading }] =
    useLazyGetFilteredArticlesQuery();
  const [fetchFilteredCases] = useLazyGetFilteredCasesQuery();
  const [fetchFilteredReferences] =
    useLazyGetFilteredReferencesWithQueriesQuery();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  // const handleOk = async () => {
  //   try {
  //     const { data: filteredArticles } = await fetchFilteredArticles("59");
  //     const { data: filteredCases } = await fetchFilteredCases("59");
  //     filteredArticles && dispatch(setArticles(filteredArticles));
  //     filteredCases && dispatch(setCases(filteredCases));
  //   } catch (error) {
  //     console.error(error);
  //   }
  //   navigate("/search");
  //   setIsModalOpen(false);
  // };

  dispatch(setIsArticleLoading(isArticlesLoading));

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const showFilterModal = () => {
    setIsModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFormFinish = (values: any) => {
    if (values.caseDecision && values.caseDecision.length === 0) {
      values.caseDecision = undefined;
    }
    if (values.referenceResource && values.referenceResource.length === 0) {
      values.referenceResource = undefined;
    }
    dispatch(setFormValues(values));
    setValues(values);
  };

  const handleSearch = async () => {
    try {
      dispatch(setQuery(searchTerm));
      const articleFilter = {
        searchTerm,
        name: values.articleName,
        number: values.articleNumber,
        text: values.articleText,
        skip: 0,
        limit: 10,
      };

      const caseFilter = {
        searchTerm,
        name: values.caseName,
        number: values.caseNumber,
        judgment: values.caseJudgement,
        facts: values.caseFacts,
        reasoning: values.caseReasoning,
        headnotes: values.caseHeadnotes,
        startYear: values?.caseYear && values?.caseYear[0]?.format("YYYY"),
        endYear: values?.caseYear && values?.caseYear[1]?.format("YYYY"),
        decisionType: values.caseDecision,
        skip: 0,
        limit: 10,
      };

      const referenceFilter = {
        searchTerm,
        context: values.tbContextReferences,
        text: values.referenceText,
        resources: values.referenceResource,
        refCasesArticles: values.tbRefArtCases,
        skip: 0,
        limit: 10,
      };

      const { data: filteredArticles } = await fetchFilteredArticles(
        articleFilter
      );

      const { data: filteredCases } = await fetchFilteredCases(caseFilter);
      const { data: filteredReferences } = await fetchFilteredReferences(
        referenceFilter
      );
      filteredArticles && dispatch(setArticles(filteredArticles.articles));
      filteredCases && dispatch(setCases(filteredCases.cases));
      filteredReferences &&
        dispatch(setReferences(filteredReferences.references));
      filteredArticles &&
        filteredArticles.total !== undefined &&
        dispatch(setArticleCount(filteredArticles.total));
      filteredCases &&
        filteredCases.total !== undefined &&
        dispatch(setCaseCount(filteredCases.total));
      filteredReferences &&
        filteredReferences.total !== undefined &&
        dispatch(setReferenceCount(filteredReferences.total));
    } catch (error) {
      console.error(error);
    }
    navigate("/search");
  };

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    form.resetFields();
    setValues({});
  };

  const navigateToHomePage = () => {
    dispatch(setQuery(""));
    setSearchTerm("");
    navigate("/");
  };

  const getAppliedFiltersCount = () => {
    const filteredObj = _.pickBy(
      values,
      (value) => value !== undefined && value !== false
    );
    const count = _.size(filteredObj);
    return count;
  };

  const handleReset = () => {
    form.resetFields();
    setValues({});
    setIsModalOpen(false);
  };

  return (
    <>
      <Row gutter={6}>
        <Col span={4}>
          <div className="p-1 mr-1 drop-shadow-md flex justify-end">
            <Button
              id="first-element"
              icon={<HomeOutlined />}
              onClick={navigateToHomePage}
            />
          </div>
        </Col>
        <Col span={14}>
          <div
            id="second-element"
            className="h-auto bg-white rounded-full p-1 flex drop-shadow-md"
          >
            <Input
              placeholder={t("search")}
              value={searchTerm}
              variant="borderless"
              onChange={onSearchInputChange}
            />
            <Button
              shape="circle"
              icon={<SearchOutlined />}
              onClick={handleSearch}
            />
          </div>
        </Col>
        <Col span={4} className="flex">
          <div id="third-element" className="p-1 drop-shadow-md">
            <Badge
              style={{ backgroundColor: "#6b7280" }}
              count={getAppliedFiltersCount()}
            >
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={showFilterModal}
              >
                {t("filters")}
              </Button>
            </Badge>
          </div>
          <div id="fourth-element" className="p-1 ml-2 drop-shadow-md">
            <Button icon={<DeleteOutlined />} onClick={clearFilters}>
              {t("clear-filters")}
            </Button>
          </div>
        </Col>
      </Row>

      <FilterModal
        form={form}
        isDrawerOpen={isModalOpen}
        onFormFinish={onFormFinish}
        onClose={handleCancel}
        onReset={handleReset}
      />
      <Row gutter={6}>
        <Col span={4}></Col>
        <Col span={14}>
          <div className="mt-1 pl-2 text-slate-600 font-semibold">
            *{t("use-filters")}
          </div>
        </Col>
      </Row>
    </>
  );
};

export default SearchBar;
