import { ArticleModal, CitationsModal } from "@/components";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useGetArticlesQuery } from "@/services/ArticleApi";
import { setArticlesMenu, setSelectedArticle } from "@/slices/ArticleSlice";
import { Article as ArticleType } from "@/types";
import {
  CaretLeftOutlined,
  CaretRightOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Card, Button, Row, Col, Space, Spin } from "antd";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const Article = () => {
  const { data: articles, isLoading, isError } = useGetArticlesQuery();

  const [current, setCurrent] = useState(1);
  const [animate, setAnimate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [article, setArticle] = useState({} as ArticleType);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);

  const { articlesMenu } = useAppSelector((state) => state.articles);

  const dispatch = useAppDispatch();

  const { t } = useTranslation();

  const pageSize = 3;

  const handleNext = () => {
    if (articles && current < Math.ceil(articles.length / pageSize)) {
      setAnimate("animate-slide-out-left");
      setTimeout(() => {
        setCurrent(current + 1);
        setAnimate("animate-slide-in-right");
      }, 300);
    }
  };

  const handlePrev = () => {
    setAnimate("animate-slide-out-right");
    setTimeout(() => {
      setCurrent(current - 1);
      setAnimate("animate-slide-in-left");
    }, 300);
  };

  const openArticleModal = (article: ArticleType) => {
    setArticle(article);
    setIsModalOpen(true);
  };

  const openCitationModal = (article: ArticleType) => {
    setArticle(article);
    dispatch(setArticlesMenu([...articlesMenu, article]));
    dispatch(setSelectedArticle(article));
    setIsCitationModalOpen(true);
  };

  let currentPageArticles;

  if (articles) {
    currentPageArticles = articles.slice(
      (current - 1) * pageSize,
      current * pageSize
    );
  }

  // if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  return (
    <>
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
        </div>
      )}
      {articles && (
        <div className={`mt-2 p-4`} id="recommended-articles">
          <div className="font-semibold">{t("recommended-articles")}</div>
          <div className="mt-2 flex">
            <Button
              className="mt-16 mr-2"
              onClick={handlePrev}
              disabled={current === 1}
              icon={<CaretLeftOutlined />}
              type="text"
            ></Button>
            <div className="w-full overflow-hidden">
              <Row gutter={[16, 16]}>
                {articles &&
                  articles.length &&
                  currentPageArticles?.map((article) => (
                    <Col
                      key={article.id}
                      // span={8}
                      xs={24} // Full width on extra small screens
                      sm={24} // Half width on small screens
                      md={24} // One-third width on medium screens
                      lg={8}
                      className={` ${animate ? animate : ""}`}
                    >
                      <Card
                        title={`${t("article-number")}: ${article.number}`}
                        className="h-44 drop-shadow-md"
                        extra={
                          <>
                            <Space>
                              <Button
                                onClick={() => openCitationModal(article)}
                              >
                                {t("citations")}
                              </Button>
                              <Button onClick={() => openArticleModal(article)}>
                                {t("more")}
                              </Button>
                            </Space>
                          </>
                        }
                      >
                        <div className="flex line-clamp-1">
                          <div className="font-bold mr-2">{t("name")}:</div>
                          <div className="line-clamp-1 ">{article.name}</div>
                        </div>
                        <div className="line-clamp-3">{article.text}</div>
                      </Card>
                    </Col>
                  ))}
              </Row>
            </div>
            <Button
              onClick={handleNext}
              className="mt-16 ml-2"
              disabled={current === Math.ceil(articles.length / pageSize)}
              icon={<CaretRightOutlined />}
              type="text"
            ></Button>
          </div>
        </div>
      )}
      {isModalOpen && (
        <ArticleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
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

export default Article;
