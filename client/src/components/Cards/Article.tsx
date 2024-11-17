import { Article } from "@/types";
import { Button, Card, Space } from "antd";
import Highlighter from "react-highlight-words";
import { useTranslation } from "react-i18next";
import DisplayArticleSection from "../DisplayArticleSection";
import { articleNumberFormatter } from "@/utils/helpers";

interface ArticleCardProps {
  article: Article;
  isSearchResult?: boolean;
  searchTerm?: string;
  openArticleModal: (article: Article) => void;
  openCitationModal: (article: Article) => void;
}

const ArticleCard = (props: ArticleCardProps) => {
  const {
    article,
    isSearchResult,
    searchTerm,
    openArticleModal,
    openCitationModal,
  } = props;
  const { t } = useTranslation();

  return (
    <>
      <Card
        title={
          <Highlighter
            highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
            searchWords={isSearchResult && searchTerm ? [searchTerm] : []}
            autoEscape={true}
            textToHighlight={
              article.name
                ? `${article.name}`
                : articleNumberFormatter(article.number)
            }
          />
        }
        className="h-44 drop-shadow-md"
        extra={
          <>
            <Space>
              <Button onClick={() => openCitationModal(article)}>
                {t("citations")}
              </Button>
              <Button onClick={() => openArticleModal(article)}>
                {t("in-the-text")}
              </Button>
            </Space>
          </>
        }
      >
        {article.name && (
          <div className="flex line-clamp-1 -mt-3">
            <div className="font-bold mr-2">{t("number")}:</div>
            <div className="line-clamp-1 ">
              <Highlighter
                highlightClassName="bg-gray-200 text-black font-bold p-1 rounded-lg"
                searchWords={isSearchResult && searchTerm ? [searchTerm] : []}
                autoEscape={true}
                textToHighlight={articleNumberFormatter(article.number)}
              />
            </div>
          </div>
        )}
        <div className="line-clamp-3">
          <DisplayArticleSection
            openArticleModal={openArticleModal}
            selectedArticle={article}
            searchTerm={isSearchResult && searchTerm ? searchTerm : ""}
          />
        </div>
      </Card>
    </>
  );
};

export default ArticleCard;
