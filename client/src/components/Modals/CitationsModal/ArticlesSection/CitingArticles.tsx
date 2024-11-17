import { ArticleCard } from "@/components";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useLazyGetCitingArticlesQuery } from "@/services/CitationsApi";
import { setCitingArticles } from "@/slices/ArticleSlice";
import { Article, CitationsArticles } from "@/types";
import { Row, Col, Pagination, PaginationProps, Input } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface CitingArticlesProps {
  citingArticles: CitationsArticles;
  articleId?: string;
  addArticleCitations: (article: Article) => void;
  openArticleModal: (article: Article) => void;
}

const CitingArticles = (props: CitingArticlesProps) => {
  const { citingArticles, articleId, addArticleCitations, openArticleModal } =
    props;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState("");

  const { citingArticlesCount } = useAppSelector((state) => state.articles);

  const [getArticleCitingOtherArticles] = useLazyGetCitingArticlesQuery();

  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const debounceDelay = 500; // milliseconds

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const onChange: PaginationProps["onChange"] = async (
    pageNumber,
    newPageSize
  ) => {
    if (articleId) {
      setCurrentPage(pageNumber);
      if (newPageSize !== pageSize) {
        setPageSize(newPageSize);
      }
      try {
        const { data: citingArticles } = await getArticleCitingOtherArticles({
          articleId: `${articleId}`,
          searchTerm,
          skip: (pageNumber - 1) * newPageSize,
          limit: newPageSize,
        });
        citingArticles && dispatch(setCitingArticles(citingArticles));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSearch = async () => {
    if (articleId) {
      try {
        const { data: citingArticles } = await getArticleCitingOtherArticles({
          articleId: `${articleId}`,
          searchTerm,
          skip: 0,
          limit: 10,
        });
        citingArticles && dispatch(setCitingArticles(citingArticles));
        setCurrentPage(1);
      } catch (error) {
        console.error(error);
      }
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
          {citingArticles.total < citingArticlesCount && (
            <div>
              <div className=" mt-2 ml-2">
                {`${t("found")} ${citingArticles.total} ${t("articles")} ${t(
                  "of"
                )} ${citingArticlesCount}`}
              </div>
            </div>
          )}
        </div>
        <div>
          {citingArticlesCount > 0 && (
            <div className="mt-4 pb-4 flex justify-end pr-4">
              <Pagination
                showSizeChanger
                current={currentPage}
                pageSize={pageSize}
                total={citingArticles.total}
                onChange={onChange}
                locale={{ items_per_page: t("items-per-page") }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-[560px] mb-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
        <Row gutter={[16, 16]}>
          {citingArticles &&
            citingArticles.articles?.length !== 0 &&
            citingArticles.articles?.map((article) => (
              <Col key={article.id} span={24}>
                <ArticleCard
                  key={"citing-articles" + article.id}
                  article={article}
                  isSearchResult={true}
                  searchTerm={searchTerm}
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

export default CitingArticles;
