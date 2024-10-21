import { Article, CitationsArticles } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ArticleState {
  articles: Article[];
  citedByArticles: CitationsArticles;
  citingArticles: CitationsArticles;
  articlesMenu: Article[];
  articlesCitingCases: CitationsArticles;
  selectedArticle: Article | null;
  articlesCount: number;
  citedByArticlesCount: number;
  citingArticlesCount: number;
  articlesCitingCasesCount: number;
  isArticleLoading?: boolean;
}

const initialState: ArticleState = {
  articles: [],
  citedByArticles: {
    articles: [],
    total: 0,
  },
  citingArticles: {
    articles: [],
    total: 0,
  },
  articlesMenu: [],
  articlesCitingCases: {
    articles: [],
    total: 0,
  },
  selectedArticle: null,
  articlesCount: 0,
  citedByArticlesCount: 0,
  citingArticlesCount: 0,
  articlesCitingCasesCount: 0,
  isArticleLoading: false,
};

const articleSlice = createSlice({
  name: "articles",
  initialState,
  reducers: {
    setArticles: (state, action: PayloadAction<Article[]>) => {
      state.articles = action.payload;
    },
    setArticleCount: (state, action: PayloadAction<number>) => {
      state.articlesCount = action.payload;
    },
    setCitedByArticles: (state, action: PayloadAction<CitationsArticles>) => {
      state.citedByArticles = action.payload;
    },
    setCitingArticles: (state, action: PayloadAction<CitationsArticles>) => {
      state.citingArticles = action.payload;
    },
    setArticlesMenu: (state, action: PayloadAction<Article[]>) => {
      state.articlesMenu = action.payload;
    },
    setSelectedArticle: (state, action: PayloadAction<Article>) => {
      state.selectedArticle = action.payload;
    },
    setArticlesCitingCases: (
      state,
      action: PayloadAction<CitationsArticles>
    ) => {
      state.articlesCitingCases = action.payload;
    },
    setCitedByArticlesCount: (state, action: PayloadAction<number>) => {
      state.citedByArticlesCount = action.payload;
    },
    setCitingArticlesCount: (state, action: PayloadAction<number>) => {
      state.citingArticlesCount = action.payload;
    },
    setArticlesCitingCasesCount: (state, action: PayloadAction<number>) => {
      state.articlesCitingCasesCount = action.payload;
    },
    setIsArticleLoading: (state, action: PayloadAction<boolean>) => {
      state.isArticleLoading = action.payload;
    },
  },
});

export const {
  setArticles,
  setArticleCount,
  setArticlesMenu,
  setCitedByArticles,
  setCitingArticles,
  setSelectedArticle,
  setArticlesCitingCases,
  setCitedByArticlesCount,
  setCitingArticlesCount,
  setArticlesCitingCasesCount,
  setIsArticleLoading,
} = articleSlice.actions;

export const articleReducer = articleSlice.reducer;
