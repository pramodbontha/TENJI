import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useLazyGetCitedByArticlesQuery } from "@/services/CitationsApi";
import { setCitedByArticles } from "@/slices/ArticleSlice";
import { Article, CitationsArticles } from "@/types";
import {
  Button,
  Card,
  Col,
  Input,
  Pagination,
  PaginationProps,
  Row,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface CitedByArticlesProps {
  citedByArticles: CitationsArticles;
  articleId?: string;
  addArticleCitations: (article: Article) => void;
  openArticleModal: (article: Article) => void;
}

const CitedByArticles = (props: CitedByArticlesProps) => {
  const { citedByArticles, articleId, addArticleCitations, openArticleModal } =
    props;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [searchTerm, setSearchTerm] = useState("");

  const [getCitedByArticles] = useLazyGetCitedByArticlesQuery();
  const { citedByArticlesCount } = useAppSelector((state) => state.articles);

  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const debounceDelay = 500; // milliseconds

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    setPageSize(10);
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
        const { data: citedByArticles } = await getCitedByArticles({
          articleId: articleId,
          searchTerm,
          skip: (pageNumber - 1) * newPageSize,
          limit: newPageSize,
        });
        citedByArticles && dispatch(setCitedByArticles(citedByArticles));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSearch = async () => {
    if (articleId) {
      try {
        const { data: citedByArticles } = await getCitedByArticles({
          articleId: `${articleId}`,
          searchTerm,
          skip: 0,
          limit: 10,
        });
        citedByArticles && dispatch(setCitedByArticles(citedByArticles));
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
        </div>
        <div>
          {citedByArticlesCount > 0 && (
            <div className="mt-4 pb-4 flex justify-end pr-4">
              <Pagination
                showSizeChanger
                current={currentPage}
                pageSize={pageSize}
                total={citedByArticlesCount}
                onChange={onChange}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-[560px] mb-2 overflow-y-auto overflow-x-hidden scrollbar-rounded">
        <Row gutter={[16, 16]}>
          {citedByArticles &&
            citedByArticles.articles?.length !== 0 &&
            citedByArticles.articles?.map((article) => (
              <Col key={article.id} span={24}>
                <Card
                  title={`${t("article-number")}: ${article.number}`}
                  extra={
                    <Space>
                      <Button onClick={() => addArticleCitations(article)}>
                        {t("citations")}
                      </Button>
                      <Button onClick={() => openArticleModal(article)}>
                        {t("more")}
                      </Button>
                    </Space>
                  }
                  className="h-44 drop-shadow-md"
                >
                  {article.name && (
                    <div className="flex line-clamp-1">
                      <div className="font-bold mr-2">{t("name")}:</div>
                      <div className="line-clamp-1 ">{article.name}</div>
                    </div>
                  )}
                  <div className="flex">
                    <div className="line-clamp-3">{article.text}</div>
                  </div>
                </Card>
              </Col>
            ))}
        </Row>
      </div>
    </>
  );
};

export default CitedByArticles;
