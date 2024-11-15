import { ArticleCard, ArticleModal, CitationsModal } from "@/components";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";
import { useLazyGetFilteredArticlesQuery } from "@/services/ArticleApi";
import { setArticles, setSelectedArticle } from "@/slices/ArticleSlice";
import { setCitationsMenu } from "@/slices/CitationsSlice";
import { Article } from "@/types";
import { Col, Pagination, PaginationProps, Row } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const FilteredArticles = () => {
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [article, setArticle] = useState({} as Article);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);

  const [fetchFilteredArticles] = useLazyGetFilteredArticlesQuery();

  const { articles, articlesCount } = useAppSelector(
    (state: RootState) => state.articles
  );
  const { citationsMenu } = useAppSelector((state) => state.citations);
  const searchBar = useAppSelector((state: RootState) => state.searchBar);
  const values = useAppSelector((state: RootState) => state.form);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const openArticleModal = (article: Article) => {
    setArticle(article);
    setIsArticleModalOpen(true);
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
      const { data: filteredArticles } = await fetchFilteredArticles({
        searchTerm: searchBar.query,
        name: values.articleName,
        number: values.articleNumber,
        text: values.articleText,
        skip: (pageNumber - 1) * newPageSize,
        limit: newPageSize,
      });
      filteredArticles && dispatch(setArticles(filteredArticles.articles));
    } catch (error) {
      console.error(error);
    }
  };

  const openCitationModal = (article: Article) => {
    setArticle(article);
    // dispatch(setArticlesMenu([...articlesMenu, article]));
    dispatch(setCitationsMenu([...citationsMenu, article]));
    dispatch(setSelectedArticle(article));
    setIsCitationModalOpen(true);
  };

  return (
    <>
      <div className="pt-0 pl-4 pr-4">
        <div className="flex justify-between items-center">
          <div className="font-semibold">
            {t("articles-found")}: {articlesCount}
          </div>

          <Pagination
            showSizeChanger
            current={currentPage}
            pageSize={pageSize}
            total={articlesCount}
            onChange={onChange}
          />
        </div>
        <div className="mt-2 h-[660px] p-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
          <Row gutter={[16, 16]}>
            {articles &&
              articles?.map((article) => (
                <Col key={article.id} span={24}>
                  <ArticleCard
                    article={article}
                    isSearchResult={true}
                    searchTerm={searchBar.query}
                    openArticleModal={openArticleModal}
                    openCitationModal={openCitationModal}
                  />
                </Col>
              ))}
          </Row>
        </div>
      </div>
      <div className="mt-4 pb-4 flex justify-end pr-4">
        <Pagination
          showSizeChanger
          current={currentPage}
          pageSize={pageSize}
          total={articlesCount}
          onChange={onChange}
        />
      </div>
      {isArticleModalOpen && (
        <ArticleModal
          isOpen={isArticleModalOpen}
          onClose={() => setIsArticleModalOpen(false)}
          article={article}
        />
      )}
      {isCitationModalOpen && (
        <CitationsModal
          article={article}
          isOpen={isCitationModalOpen}
          onClose={() => setIsCitationModalOpen(false)}
        />
      )}
    </>
  );
};

export default FilteredArticles;
