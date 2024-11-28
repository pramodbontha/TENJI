import { ArticleCard } from "@/components";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useLazyGetArticlesCitingCaseQuery } from "@/services/CitationsApi";
import { setArticlesCitingCases } from "@/slices/ArticleSlice";
import { setCitationQuery } from "@/slices/SearchBarSlice";
import { Article, CitationsArticles } from "@/types";
import { Row, Col, Pagination, PaginationProps, Input } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface ArticlesCitingCasesProps {
  articlesCitingCases: CitationsArticles;
  caseId?: string;
  addArticleCitations: (article: Article) => void;
  openArticleModal: (article: Article) => void;
}

const ArticlesCitingCases = (props: ArticlesCitingCasesProps) => {
  const { articlesCitingCases, caseId, addArticleCitations, openArticleModal } =
    props;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [searchTerm, setSearchTerm] = useState("");

  const [getArticlesCitingCases] = useLazyGetArticlesCitingCaseQuery();

  const { articlesCitingCasesCount } = useAppSelector(
    (state) => state.articles
  );

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
    if (caseId) {
      setCurrentPage(pageNumber);
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize);
      }
      try {
        const { data: articles } = await getArticlesCitingCases({
          caseId: `${caseId}`,
          searchTerm,
          skip: (pageNumber - 1) * newPageSize,
          limit: newPageSize,
        });
        articles && dispatch(setArticlesCitingCases(articles));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSearch = async () => {
    try {
      const { data: articles } = await getArticlesCitingCases({
        caseId: `${caseId}`,
        searchTerm,
        skip: 0,
        limit: pageSize,
      });

      articles && dispatch(setArticlesCitingCases(articles));
      setCurrentPage(1);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      // Call search after the debounce delay

      caseId && handleSearch();
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
          {articlesCitingCases.total < articlesCitingCasesCount && (
            <div>
              <div className=" mt-2 ml-2">
                {`${t("found")} ${articlesCitingCases.total} ${t(
                  "articles"
                )} ${t("of")} ${articlesCitingCasesCount}`}
              </div>
            </div>
          )}
        </div>
        <div>
          {articlesCitingCasesCount > 0 && (
            <div className="mt-4 pb-4 flex justify-end pr-4">
              <Pagination
                showSizeChanger
                current={currentPage}
                pageSize={pageSize}
                total={articlesCitingCases.total}
                onChange={onChange}
                locale={{ items_per_page: t("items-per-page") }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-[560px] mb-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
        <Row gutter={[16, 16]}>
          {articlesCitingCases &&
            articlesCitingCases.articles?.length !== 0 &&
            articlesCitingCases.articles?.map((article) => (
              <Col key={article.id} span={24}>
                <ArticleCard
                  key={"aritcles-citing-cases" + article.id}
                  article={article}
                  isSearchResult={true}
                  openArticleModal={openArticleModal}
                  openCitationModal={addArticleCitations}
                />
              </Col>
            ))}
        </Row>
      </div>
    </>
  );
};

export default ArticlesCitingCases;
