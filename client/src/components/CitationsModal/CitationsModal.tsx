import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import {
  setArticlesCitingCases,
  setArticlesCitingCasesCount,
  setArticlesMenu,
  setCitedByArticles,
  setCitedByArticlesCount,
  setCitingArticles,
  setCitingArticlesCount,
} from "@/slices/ArticleSlice";
import { Article, ICase, Reference } from "@/types";
import { Menu, MenuProps, Modal, Tabs } from "antd";
import { useEffect, useState } from "react";
import ArticleModal from "../ArticleModal";
import {
  setCasesCitingArticle,
  setCasesCitingArticleCount,
  setCasesMenu,
  setCitedByCases,
  setCitedByCasesCount,
  setCitingCases,
  setCitingCasesCount,
} from "@/slices/CaseSlice";
import CaseModal from "../CaseModal";

import {
  setArticleReferences,
  setArticleReferencesCount,
  setCaseReferences,
  setCaseReferencesCount,
} from "@/slices/ReferenceSlice";
import BookModal from "../BookModal";
import _ from "lodash";
import {
  CitedByArticles,
  CasesCitingArticles,
  ArticleReferences,
  CitingArticles,
} from "./ArticlesSection";
import {
  ArticlesCitingCases,
  CaseReferences,
  CitedByCase,
  CitingCases,
} from "./CasesSection";

import {
  useLazyGetCitedByCasesCountQuery,
  useLazyGetCitedByCasesQuery,
  useLazyGetCitingCasesCountQuery,
  useLazyGetCitingCasesQuery,
  useLazyGetArticlesCitingCaseQuery,
  useLazyGetArticlesCitingCaseCountQuery,
  useLazyGetReferencesWithGivenCaseQuery,
  useLazyGetReferencesWithGivenCaseCountQuery,
  useLazyGetCitedByArticlesCountQuery,
  useLazyGetCitedByArticlesQuery,
  useLazyGetCitingArticlesCountQuery,
  useLazyGetCitingArticlesQuery,
  useLazyGetCasesCitingArticleQuery,
  useLazyGetCasesCitingArticleCountQuery,
  useLazyGetReferencesWithGivenArticleQuery,
  useLazyGetReferencesWithGivenArticleCountQuery,
} from "@/services/CitationsApi";

import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Item } = Menu;

interface CitationsModalProps {
  article?: Article;
  cases?: ICase;
  isOpen: boolean;
  onClose: () => void;
}

const CitationsModal = (props: CitationsModalProps) => {
  const { article, cases, isOpen, onClose } = props;

  const [selectedArticleKey, setSelectedArticleKey] = useState(
    `${article?.number}` || "articles"
  );
  const [selectedArticleNumber, setSelectedArticleNumber] = useState<string>();
  const [selectedCaseKey, setSelectedCaseKey] = useState(
    cases?.number || "cases"
  );
  const [selectedCaseNumber, setSelectedCaseNumber] = useState<string>();
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isCaseModelOpen, setIsCaseModelOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedCase, setSelectedCase] = useState({} as ICase);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedReference, setSelectedReference] = useState({} as Reference);
  const [isArticleMenuClicked, setIsArticleMenuClicked] = useState(false);

  const {
    citedByArticles,
    citedByArticlesCount,
    citingArticles,
    citingArticlesCount,
    articlesMenu,
    articlesCitingCases,
    articlesCitingCasesCount,
  } = useAppSelector((state) => state.articles);

  const {
    citingCases,
    citingCasesCount,
    citedByCases,
    citedByCasesCount,
    casesCitingArticle,
    casesCitingArticleCount,
    casesMenu,
  } = useAppSelector((state) => state.cases);

  const {
    articleReferences,
    caseReferences,
    articleReferencesCount,
    caseReferencesCount,
  } = useAppSelector((state) => state.references);

  const [getCitedByArticles] = useLazyGetCitedByArticlesQuery();
  const [getArticleCitingOtherArticles] = useLazyGetCitingArticlesQuery();

  const [getCasesCitingArticle] = useLazyGetCasesCitingArticleQuery();

  const [getArticleReferences] = useLazyGetReferencesWithGivenArticleQuery();

  const [getCasesCitedByCases] = useLazyGetCitedByCasesQuery();
  const [getCasesCitingCases] = useLazyGetCitingCasesQuery();
  const [getArticlesCitingCases] = useLazyGetArticlesCitingCaseQuery();
  const [getReferencesWithCase] = useLazyGetReferencesWithGivenCaseQuery();

  // Article Citations count queries
  const [getCitedbyArticlesCount] = useLazyGetCitedByArticlesCountQuery();
  const [getCitingArticlesCount] = useLazyGetCitingArticlesCountQuery();
  const [getReferenceArticlesCount] =
    useLazyGetReferencesWithGivenArticleCountQuery();
  const [getCasesCitingArticleCount] = useLazyGetCasesCitingArticleCountQuery();

  // Case Citations count queries
  const [getCitedbyCasesCount] = useLazyGetCitedByCasesCountQuery();
  const [getCitingCasesCount] = useLazyGetCitingCasesCountQuery();
  const [getCaseReferencesCount] =
    useLazyGetReferencesWithGivenCaseCountQuery();
  const [getArticlesCitingCasesCount] =
    useLazyGetArticlesCitingCaseCountQuery();

  const dispatch = useAppDispatch();

  const { t } = useTranslation();

  useEffect(() => {
    article?.number && getArticleCitationData(article?.number.toString());
    cases?.number && getCasesCitationData(cases?.number.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getArticleCitationData = async (articleId: string) => {
    try {
      if (articleId) {
        const { data: citedByArticles } = await getCitedByArticles({
          articleId: `${articleId}`,
          skip: 0,
          limit: 10,
        });
        citedByArticles && dispatch(setCitedByArticles(citedByArticles));

        const { data: citedByArticlesCount } = await getCitedbyArticlesCount(
          articleId
        );
        citedByArticlesCount !== undefined &&
          dispatch(setCitedByArticlesCount(citedByArticlesCount));

        const { data: citingArticles } = await getArticleCitingOtherArticles({
          articleId: `${articleId}`,
          skip: 0,
          limit: 10,
        });

        citingArticles && dispatch(setCitingArticles(citingArticles));

        const { data: citingArticlesCount } = await getCitingArticlesCount(
          articleId
        );

        citingArticlesCount !== undefined &&
          dispatch(setCitingArticlesCount(citingArticlesCount));

        const { data: cases } = await getCasesCitingArticle({
          articleId: `${articleId}`,
          skip: 0,
          limit: 10,
        });

        cases && dispatch(setCasesCitingArticle(cases));

        const { data: articleCasesCount } = await getCasesCitingArticleCount(
          articleId
        );
        articleCasesCount !== undefined &&
          dispatch(setCasesCitingArticleCount(articleCasesCount));

        const { data: references } = await getArticleReferences({
          articleId: `${articleId}`,
          skip: 0,
          limit: 10,
        });

        references && dispatch(setArticleReferences(references));

        const { data: referenceArticleCount } = await getReferenceArticlesCount(
          articleId
        );

        referenceArticleCount !== undefined &&
          dispatch(setArticleReferencesCount(referenceArticleCount));
      }
      setSelectedArticleNumber(articleId);
      setIsArticleMenuClicked(true);
      setSelectedCaseKey("cases");
    } catch (error) {
      console.error(error);
    }
  };

  const getCasesCitationData = async (caseId: string) => {
    try {
      if (caseId) {
        const { data: citedByCases } = await getCasesCitedByCases({
          caseId: `${caseId}`,
          skip: 0,
          limit: 10,
        });

        citedByCases && dispatch(setCitedByCases(citedByCases));

        const { data: citedByCasesCount } = await getCitedbyCasesCount(caseId);
        citedByCasesCount !== undefined &&
          dispatch(setCitedByCasesCount(citedByCasesCount));

        const { data: citingCases } = await getCasesCitingCases({
          caseId: `${caseId}`,
          skip: 0,
          limit: 10,
        });

        citingCases && dispatch(setCitingCases(citingCases));

        const { data: citingCasesCount } = await getCitingCasesCount(caseId);
        citingCasesCount !== undefined &&
          dispatch(setCitingCasesCount(citingCasesCount));

        const { data: articles } = await getArticlesCitingCases({
          caseId: `${caseId}`,
          skip: 0,
          limit: 10,
        });

        articles && dispatch(setArticlesCitingCases(articles));

        const { data: articleCasesCount } = await getArticlesCitingCasesCount(
          caseId
        );
        articleCasesCount !== undefined &&
          dispatch(setArticlesCitingCasesCount(articleCasesCount));

        const { data: references } = await getReferencesWithCase({
          caseId: `${caseId}`,
          skip: 0,
          limit: 10,
        });

        references && dispatch(setCaseReferences(references));

        const { data: referenceCaseCount } = await getCaseReferencesCount(
          caseId
        );
        referenceCaseCount !== undefined &&
          dispatch(setCaseReferencesCount(referenceCaseCount));

        setSelectedCaseNumber(caseId);
        setIsArticleMenuClicked(false);
        setSelectedArticleKey("articles");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleArticleMenuClick: MenuProps["onClick"] = (e) => {
    setSelectedArticleKey(e.key as string);
    setSelectedArticleNumber(e.key as string);
    getArticleCitationData(e.key as string);
  };

  const handleCaseMenuClick: MenuProps["onClick"] = (e) => {
    setSelectedCaseKey(e.key as string);
    setSelectedCaseNumber(e.key as string);
    getCasesCitationData(e.key as string);
  };

  const openArticleModal = (article: Article) => {
    setSelectedArticle(article);
    setIsArticleModalOpen(true);
  };

  const addArticleCitations = (article: Article) => {
    const uniqueMenuItems = _.uniqBy([...articlesMenu, article], "number");

    dispatch(setArticlesMenu([...uniqueMenuItems]));
    getArticleCitationData(article.number.toString());
    setSelectedArticleKey(article.number.toString());
  };

  const addCaseCitations = (cases: ICase) => {
    const uniqueMenuItems = _.uniqBy([...casesMenu, cases], "number");

    dispatch(setCasesMenu([...uniqueMenuItems]));
    getCasesCitationData(cases.number.toString());
    setSelectedCaseKey(cases.number.toString());
  };

  const onModalClose = () => {
    onClose();
    dispatch(setArticlesMenu([]));
    dispatch(setCitedByArticles({ articles: [], total: 0 }));
    dispatch(setCitingArticles({ articles: [], total: 0 }));
    dispatch(setArticleReferences({ references: [], total: 0 }));
    dispatch(
      setCaseReferences({
        references: [],
        total: 0,
      })
    );
    dispatch(
      setCitedByCases({
        cases: [],
        total: 0,
      })
    );
    dispatch(
      setCitingCases({
        cases: [],
        total: 0,
      })
    );
    dispatch(setArticlesCitingCases({ articles: [], total: 0 }));
    dispatch(setCasesMenu([]));
  };

  const openCaseModal = (selectedCase: ICase) => {
    setSelectedCase(selectedCase);
    setIsCaseModelOpen(true);
  };

  const openBookModal = (reference: Reference) => {
    setSelectedReference(reference);
    setIsBookModalOpen(true);
  };

  return (
    <>
      <Modal
        title={t("citations")}
        open={isOpen}
        onOk={onModalClose}
        onCancel={onModalClose}
        width={1800}
        footer={null}
      >
        <div className="h-[700px]">
          <div className="mt-2 p-2 flex">
            <div className="w-[260px] border-slate-100">
              <div className="font-bold">{t("interaction-history")}</div>
              <div className="h-[650px] bg-slate-100 p-4">
                <div className="font-semibold">{t("articles")}</div>
                <Menu
                  onClick={handleArticleMenuClick}
                  selectedKeys={[selectedArticleKey]}
                  mode="inline"
                  className="h-[280px] overflow-y-scroll scrollbar-rounded text-center"
                >
                  {articlesMenu &&
                    articlesMenu.map((menuItem) => (
                      <Item key={menuItem.number}>{menuItem.number}</Item>
                    ))}
                </Menu>
                <div className="font-semibold mt-4">{t("cases")}</div>
                <Menu
                  onClick={handleCaseMenuClick}
                  selectedKeys={[selectedCaseKey]}
                  mode="inline"
                  className="h-[280px] overflow-y-scroll scrollbar-rounded text-center"
                >
                  {casesMenu &&
                    casesMenu.map((menuItem) => (
                      <Item key={menuItem.number}>{menuItem.number}</Item>
                    ))}
                </Menu>
              </div>
            </div>
            <div className="w-[1500px] ml-4 ">
              {isArticleMenuClicked && (
                <>
                  <div className="font-bold">{`${t(
                    "article-number"
                  )}: ${selectedArticleNumber}`}</div>
                  <div className="h-[650px]">
                    <Tabs defaultActiveKey="1" className="h-full">
                      <Tabs.TabPane
                        tab={`${t(
                          "cited-by-articles"
                        )} (${citedByArticlesCount})`}
                        key="1"
                        className="h-full"
                        icon={<ArrowDownOutlined />}
                      >
                        <div className="h-[600px] ">
                          <CitedByArticles
                            citedByArticles={citedByArticles}
                            articleId={selectedArticleNumber}
                            openArticleModal={openArticleModal}
                            addArticleCitations={addArticleCitations}
                          />
                        </div>
                      </Tabs.TabPane>
                      <Tabs.TabPane
                        tab={`${t(
                          "cited-by-cases"
                        )} (${casesCitingArticleCount})`}
                        key="2"
                        className="h-full"
                        icon={<ArrowDownOutlined />}
                      >
                        <div className="h-[600px]">
                          <CasesCitingArticles
                            casesCitingArticle={casesCitingArticle}
                            articleId={selectedArticleNumber}
                            openCaseModal={openCaseModal}
                            addCaseCitations={addCaseCitations}
                          />
                        </div>
                      </Tabs.TabPane>
                      <Tabs.TabPane
                        tab={`${t(
                          "book-references"
                        )} (${articleReferencesCount})`}
                        key="3"
                        className="h-full"
                        icon={<ArrowDownOutlined />}
                      >
                        <div className="h-[600px] ">
                          <ArticleReferences
                            articleReferences={articleReferences}
                            articleId={selectedArticleNumber}
                            openBookModal={openBookModal}
                          />
                        </div>
                      </Tabs.TabPane>
                      <Tabs.TabPane
                        tab={`${t("cited-articles")} (${citingArticlesCount})`}
                        key="4"
                        className="h-full"
                        icon={<ArrowUpOutlined />}
                      >
                        <div className="h-[600px]">
                          <CitingArticles
                            citingArticles={citingArticles}
                            openArticleModal={openArticleModal}
                            addArticleCitations={addArticleCitations}
                          />
                        </div>
                      </Tabs.TabPane>
                    </Tabs>
                  </div>
                </>
              )}
              {!isArticleMenuClicked && (
                <>
                  <div className="font-bold">{`${t(
                    "case-number"
                  )}: ${selectedCaseNumber}`}</div>
                  <div className="h-[650px]">
                    <Tabs defaultActiveKey="1" className="h-full">
                      <Tabs.TabPane
                        tab={`${t("cited-by-cases")} (${citedByCasesCount})`}
                        key="1"
                        className="h-full"
                        icon={<ArrowDownOutlined />}
                      >
                        <div className="h-[600px]">
                          <CitedByCase
                            citedByCases={citedByCases}
                            caseId={selectedCaseNumber}
                            openCaseModal={openCaseModal}
                            addCaseCitations={addCaseCitations}
                          />
                        </div>
                      </Tabs.TabPane>

                      <Tabs.TabPane
                        tab={`${t("book-references")} (${caseReferencesCount})`}
                        key="2"
                        className="h-full"
                        icon={<ArrowDownOutlined />}
                      >
                        <div className="h-[600px] ">
                          <CaseReferences
                            caseReferences={caseReferences}
                            caseId={selectedCaseNumber}
                            openBookModal={openBookModal}
                          />
                        </div>
                      </Tabs.TabPane>
                      <Tabs.TabPane
                        tab={`${t("cited-cases")} (${citingCasesCount})`}
                        key="3"
                        className="h-full"
                        icon={<ArrowUpOutlined />}
                      >
                        <div className="h-[580px] ">
                          <CitingCases
                            citingCases={citingCases}
                            caseId={selectedCaseNumber}
                            openCaseModal={openCaseModal}
                            addCaseCitations={addCaseCitations}
                          />
                        </div>
                      </Tabs.TabPane>
                      <Tabs.TabPane
                        tab={`${t(
                          "cited-articles"
                        )} (${articlesCitingCasesCount})`}
                        key="4"
                        className="h-full"
                        icon={<ArrowUpOutlined />}
                      >
                        <div className="h-[600px] ">
                          <ArticlesCitingCases
                            articlesCitingCases={articlesCitingCases}
                            caseId={selectedCaseNumber}
                            openArticleModal={openArticleModal}
                            addArticleCitations={addArticleCitations}
                          />
                        </div>
                      </Tabs.TabPane>
                    </Tabs>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
      {isArticleModalOpen && (
        <ArticleModal
          isOpen={isArticleModalOpen}
          onClose={() => setIsArticleModalOpen(false)}
          article={selectedArticle as Article}
        />
      )}
      {isCaseModelOpen && (
        <CaseModal
          cases={selectedCase}
          isOpen={isCaseModelOpen}
          onClose={() => setIsCaseModelOpen(false)}
        />
      )}
      {isBookModalOpen && (
        <BookModal
          reference={selectedReference}
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
        />
      )}
    </>
  );
};

export default CitationsModal;
