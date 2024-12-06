import {
  DeleteOutlined,
  FilterOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Input, Col, Row, Button, Form, Badge } from "antd";
import { FilterModal } from "@/components";
import { useState, KeyboardEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLazyGetFilteredArticlesQuery } from "@/services/ArticleApi";
import { useAppDispatch } from "@/redux/hooks";
import { setArticleCount, setArticles } from "@/slices/ArticleSlice";
import { useLazyGetFilteredCasesQuery } from "@/services/CaseApi";
import { setCaseCount, setCases } from "@/slices/CaseSlice";
import { setReferenceCount, setReferences } from "@/slices/ReferenceSlice";
import {
  setIsSearching,
  setLemmatizedQuery,
  setQuery,
} from "@/slices/SearchBarSlice";
import _ from "lodash";
import { setFormValues } from "@/slices/FormSlice";
import { useLazyGetFilteredReferencesWithQueriesQuery } from "@/services/ReferenceApi";
import { useTranslation } from "react-i18next";
import { useLazyGetLemmatizedQueryQuery } from "@/services/CommonApi";

const SearchBar = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [values, setValues] = useState<any>({});
  const [fetchFilteredArticles] = useLazyGetFilteredArticlesQuery();
  const [fetchFilteredCases] = useLazyGetFilteredCasesQuery();
  const [fetchFilteredReferences] =
    useLazyGetFilteredReferencesWithQueriesQuery();
  const [fetchLemmatizedQuery] = useLazyGetLemmatizedQueryQuery();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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

  const clearCache = () => {
    dispatch(setArticles([]));
    dispatch(setCases([]));
    dispatch(setReferences([]));
  };

  const isLongestTerm = (term: string) => {
    const specialKeywords = ["Art", "BVerfGE"];
    const threshold = specialKeywords.some((keyword) => term.includes(keyword))
      ? 6
      : 4;
    return term.split(/\s+/).length > threshold;
  };

  const getSearchTerms = (searchTerm: string) => {
    const regex =
      /BVerfGE\s?\d+(,?\s?\d+)?|Art\.?\s?\d+(?:\s?[IVXLCDM]+)?\s?(GG|Grundgesetz)?/i;
    const germanArticles = [
      "der",
      "die",
      "das",
      "den",
      "dem",
      "des",
      "ein",
      "eine",
      "einen",
      "einem",
      "eines",
      "bei",
      "und",
      "auf",
    ]; // Add more as needed
    const match = searchTerm.match(regex);

    let originalRomanArt = null; // To capture the original "Art. <number> V GG"
    const originalInput = searchTerm.trim(); // Store the original input as is

    if (match && !isLongestTerm(originalInput)) {
      const mainPart = match[0].replace(/\s+/g, " ").trim(); // Normalize spaces in the matched part

      let variations: string[] = [];
      if (/^BVerfGE/i.test(mainPart)) {
        // Handle BVerfGE variations
        const caseParts = mainPart.split(/\s+/); // Split by spaces
        const caseNumber = caseParts[1]; // First number
        const additionalNumber = caseParts[2] || ""; // Second number, if present

        variations = [
          `${caseParts[0]} ${caseNumber} ${additionalNumber}`.trim(), // "BVerfGE 18 85"
          `${caseParts[0]}${caseNumber}, ${additionalNumber}`.trim(), // "BVerfGE18, 85"
          `${caseParts[0]} ${caseNumber}, ${additionalNumber}`.trim(), // "BVerfGE 18, 85"
        ];
      } else if (/^Art/i.test(mainPart)) {
        // Normalize "Art." to ensure consistent formatting
        const normalizedMainPart = mainPart
          .replace(/^Art\.?\s?/, "Art. ") // Normalize to "Art."
          .trim();

        const artParts = normalizedMainPart.split(/\s+/); // Split by spaces
        const articleNumber = artParts[1]; // Article number
        const legalCode = artParts[artParts.length - 1]; // "GG" or "Grundgesetz"

        // Reconstruct without the Roman numeral (if present)
        variations = [`Art. ${articleNumber} ${legalCode}`.trim()];

        // Preserve the original "Art. 3 V GG" for later
        if (normalizedMainPart.match(/\s[IVXLCDM]+\sGG/i)) {
          originalRomanArt = normalizedMainPart;
        }
      }

      // Remove the matched part from the searchTerm
      const remainingPart = searchTerm.replace(match[0], "").trim();
      const remainingWords = remainingPart
        ? remainingPart
            .split(/\s+/)
            .filter((word) => !germanArticles.includes(word.toLowerCase())) // Remove German articles
        : []; // Split remaining words by spaces and exclude German articles

      // Combine results
      const result = [...variations];

      // Append original input
      result.push(originalInput);

      // Append original Roman numeral form if present
      if (originalRomanArt) {
        result.push(originalRomanArt);
      }

      // Append remaining tokens
      return [...result, ...remainingWords];
    }

    // Fallback: if no pattern is found, split the entire search term
    return [
      originalInput,
      // ...searchTerm
      //   .split(/\s+/)
      //   .filter((word) => !germanArticles.includes(word.toLowerCase())),
    ];
  };

  const handleSearch = async () => {
    try {
      dispatch(setQuery(getSearchTerms(searchTerm)));

      const lemmatizedQuery = await fetchLemmatizedQuery(searchTerm);
      lemmatizedQuery.data &&
        dispatch(setLemmatizedQuery(lemmatizedQuery.data));
      dispatch(setIsSearching(true));
      clearCache();
      navigate("/search");
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
      dispatch(setIsSearching(false));
    } catch (error) {
      console.error(error);
    }
  };

  const onSearchInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearFilters = () => {
    form.resetFields();
    setValues({});
  };

  const navigateToHomePage = () => {
    dispatch(setQuery([]));
    dispatch(setLemmatizedQuery(""));
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

  const onKeyDownHandler = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <>
      <Row gutter={6}>
        <Col span={4}>
          <div className="p-1 mr-1 drop-shadow-md flex justify-end">
            <Button
              id="home-button"
              icon={<HomeOutlined />}
              onClick={navigateToHomePage}
            />
          </div>
        </Col>
        <Col span={14}>
          <div
            id="search-input"
            className="h-auto bg-white rounded-full p-1 flex drop-shadow-md"
          >
            <Input
              placeholder={t("search")}
              value={searchTerm}
              variant="borderless"
              onChange={onSearchInputChange}
              onKeyDown={onKeyDownHandler}
            />
            <Button
              shape="circle"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              tabIndex={0}
              onKeyDown={onKeyDownHandler}
            />
          </div>
        </Col>
        <Col span={4} className="flex">
          <div id="filter-button" className="p-1 drop-shadow-md">
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
          <div id="clear-filters" className="p-1 ml-2 drop-shadow-md">
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
            {<InfoCircleOutlined />} {""}
            {t("search-examples")} {t("use-filters")}
          </div>
        </Col>
      </Row>
    </>
  );
};

export default SearchBar;
