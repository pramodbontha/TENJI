import { CitationsCases, ICase } from "@/types";
import { Col, Input, Pagination, PaginationProps, Row } from "antd";
import { useLazyGetCasesCitingArticleQuery } from "@/services/CitationsApi";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCasesCitingArticle } from "@/slices/CaseSlice";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CaseCard } from "@/components";
import { setCitationQuery } from "@/slices/SearchBarSlice";

interface CasesCitingArticlesProps {
  casesCitingArticle: CitationsCases;
  articleId?: string;
  addCaseCitations: (cases: ICase) => void;
  openCaseModal: (cases: ICase) => void;
}

const CasesCitingArticles = (props: CasesCitingArticlesProps) => {
  const { casesCitingArticle, articleId, addCaseCitations, openCaseModal } =
    props;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState("");

  const [getCasesCitingArticle] = useLazyGetCasesCitingArticleQuery();

  const { casesCitingArticleCount } = useAppSelector((state) => state.cases);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const debounceDelay = 500; // milliseconds

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    dispatch(setCitationQuery(e.target.value));
  };

  const onChange: PaginationProps["onChange"] = async (
    pageNumber,
    newPageSize
  ) => {
    setCurrentPage(pageNumber);
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
    try {
      const { data: cases } = await getCasesCitingArticle({
        articleId: `${articleId}`,
        skip: (pageNumber - 1) * newPageSize,
        limit: newPageSize,
      });

      cases && dispatch(setCasesCitingArticle(cases));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async () => {
    try {
      const { data: cases } = await getCasesCitingArticle({
        articleId: `${articleId}`,
        searchTerm,
        skip: 0,
        limit: pageSize,
      });

      cases && dispatch(setCasesCitingArticle(cases));
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      // Call search after the debounce delay

      articleId && handleSearch();
    }, debounceDelay);

    // Cleanup function to clear the timeout if searchTerm, currentPage, or pageSize changes again
    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  return (
    <>
      <div className="flex items-center justify-between -mt-4">
        <div className="mt-3 mb-4 flex">
          <div className=" bg-gray-200  rounded-full p-1 flex ">
            <Input
              placeholder={t("search")}
              value={searchTerm}
              variant="borderless"
              onChange={onSearchInputChange}
            />
          </div>
          {casesCitingArticle.total < casesCitingArticleCount && (
            <div>
              <div className=" mt-2 ml-2">
                {`${t("found")} ${casesCitingArticle.total} ${t("cases")} ${t(
                  "of"
                )} ${casesCitingArticleCount}`}
              </div>
            </div>
          )}
        </div>
        <div>
          {casesCitingArticleCount > 0 && (
            <div className="mt-4 pb-4 flex justify-end pr-4">
              <Pagination
                showSizeChanger
                current={currentPage}
                pageSize={pageSize}
                total={casesCitingArticle.total}
                onChange={onChange}
                locale={{ items_per_page: t("items-per-page") }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-[560px] mb-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
        <Row gutter={[16, 16]}>
          {casesCitingArticle &&
            casesCitingArticle.cases?.length !== 0 &&
            casesCitingArticle.cases?.map((cases, index) => (
              <Col key={cases.id + index} span={24}>
                <CaseCard
                  key={"cases-citing-articles" + cases.id}
                  cases={cases}
                  isSearchResult={true}
                  openCaseModal={openCaseModal}
                  openCitationModal={addCaseCitations}
                />
              </Col>
            ))}
        </Row>
      </div>
    </>
  );
};

export default CasesCitingArticles;
