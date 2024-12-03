import { Article } from "@/types";
import { Button, Card, Space, Popover } from "antd";
import { useTranslation } from "react-i18next";
import { SearchTermHighlighter, DisplayArticleSection } from "@/components";
import { articleNumberFormatter } from "@/utils/helpers";
import { useAppSelector } from "@/redux/hooks";
import { RootState } from "@/redux/store";

interface ArticleCardProps {
  article: Article;
  isSearchResult?: boolean;
  openArticleModal: (article: Article) => void;
  openCitationModal: (article: Article) => void;
}

const ArticleCard = (props: ArticleCardProps) => {
  const { article, isSearchResult, openArticleModal, openCitationModal } =
    props;
  const { query, lemmatizedQuery, citationQuery } = useAppSelector(
    (state: RootState) => state.searchBar
  );
  const { t } = useTranslation();

  const getHighlightTerms = () => {
    if (isSearchResult) {
      return [...query, lemmatizedQuery, citationQuery].filter(
        Boolean
      ) as string[];
    }
    return [];
  };

  return (
    <>
      <Card
        title={
          <Popover
            content={
              article.name
                ? `${article.name}`
                : articleNumberFormatter(article.number, article.resource)
            }
          >
            <SearchTermHighlighter
              searchWords={getHighlightTerms()}
              textToHighlight={
                article.name
                  ? `${article.name}`
                  : articleNumberFormatter(article.number, article.resource)
              }
            />
          </Popover>
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
            <div className="line-clamp-1 font-semibold">
              <SearchTermHighlighter
                searchWords={getHighlightTerms()}
                textToHighlight={articleNumberFormatter(
                  article.number,
                  article.resource
                )}
              />
            </div>
          </div>
        )}
        <div className="line-clamp-3">
          <DisplayArticleSection
            openArticleModal={openArticleModal}
            selectedArticle={article}
          />
        </div>
      </Card>
    </>
  );
};

export default ArticleCard;
