import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { createQueryParams } from "@/utils/QueryParams";
import {
  CitationsArticleFilter,
  CitationsArticles,
  CitationsCaseFilter,
  CitationsCases,
  CitationsReferences,
} from "@/types";

import { API_URL } from "@/utils/constants";

export const citationsApi = createApi({
  reducerPath: "citationsApi",
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ["Citations"],
  endpoints: (build) => ({
    // Citations cases
    getCitedByCases: build.query<CitationsCases, CitationsCaseFilter>({
      query: (citationsCaseFilter) => {
        const queryParams = createQueryParams(citationsCaseFilter);
        return {
          url: `citations/cited-by-cases?${queryParams}`,
          method: "GET",
        };
      },
    }),
    getCitedByCasesCount: build.query<number, string>({
      query: (caseId) => ({
        url: `citations/cited-by-cases-count?caseId=${caseId}`,
        method: "GET",
      }),
    }),

    getCitingCases: build.query<CitationsCases, CitationsCaseFilter>({
      query: (citationsCaseFilter) => {
        const queryParams = createQueryParams(citationsCaseFilter);
        return {
          url: `citations/citing-cases?${queryParams}`,
          method: "GET",
        };
      },
    }),
    getCitingCasesCount: build.query<number, string>({
      query: (caseId) => ({
        url: `citations/citing-cases-count?caseId=${caseId}`,
        method: "GET",
      }),
    }),

    getArticlesCitingCase: build.query<CitationsArticles, CitationsCaseFilter>({
      query: (citationsCaseFilter) => {
        const queryParams = createQueryParams(citationsCaseFilter);
        return {
          url: `citations/articles-citing-case?${queryParams}`,
          method: "GET",
        };
      },
    }),
    getArticlesCitingCaseCount: build.query<number, string>({
      query: (caseId) => ({
        url: `citations/articles-citing-case-count?caseId=${caseId}`,
        method: "GET",
      }),
    }),
    getReferencesWithGivenCase: build.query<
      CitationsReferences,
      CitationsCaseFilter
    >({
      query: (citationsCaseFilter) => {
        const queryParams = createQueryParams(citationsCaseFilter);
        return {
          url: `citations/references-with-case?${queryParams}`,
          method: "GET",
        };
      },
    }),
    getReferencesWithGivenCaseCount: build.query<number, string>({
      query: (caseId) => ({
        url: `citations/references-with-case-count?caseId=${caseId}`,
        method: "GET",
      }),
    }),

    // Citations articles
    getCitedByArticles: build.query<CitationsArticles, CitationsArticleFilter>({
      query: (citationsArticleFilter) => {
        const queryParams = createQueryParams(citationsArticleFilter);
        return {
          url: `citations/cited-by-articles?${queryParams}`,
          method: "GET",
        };
      },
    }),

    getCitedByArticlesCount: build.query<number, string>({
      query: (articleId) => ({
        url: `citations/cited-by-articles-count?articleId=${articleId}`,
        method: "GET",
      }),
    }),

    getCitingArticles: build.query<CitationsArticles, CitationsArticleFilter>({
      query: (citationsArticleFilter) => {
        const queryParams = createQueryParams(citationsArticleFilter);
        return {
          url: `citations/citing-articles?${queryParams}`,
          method: "GET",
        };
      },
    }),

    getCitingArticlesCount: build.query<number, string>({
      query: (articleId) => ({
        url: `citations/citing-articles-count?articleId=${articleId}`,
        method: "GET",
      }),
    }),

    getCasesCitingArticle: build.query<CitationsCases, CitationsArticleFilter>({
      query: (citationsArticleFilter) => {
        const queryParams = createQueryParams(citationsArticleFilter);
        return {
          url: `citations/cases-citing-article?${queryParams}`,
          method: "GET",
        };
      },
    }),

    getCasesCitingArticleCount: build.query<number, string>({
      query: (articleId) => ({
        url: `citations/cases-citing-article-count?articleId=${articleId}`,
        method: "GET",
      }),
    }),

    getReferencesWithGivenArticle: build.query<
      CitationsReferences,
      CitationsArticleFilter
    >({
      query: (citationsArticleFilter) => {
        const queryParams = createQueryParams(citationsArticleFilter);
        return {
          url: `citations/references-citing-article?${queryParams}`,
          method: "GET",
        };
      },
    }),

    getReferencesWithGivenArticleCount: build.query<number, string>({
      query: (articleId) => ({
        url: `citations/references-citing-article-count?articleId=${articleId}`,
        method: "GET",
      }),
    }),
  }),
});

// Export Citation cases API hooks
export const {
  useLazyGetCitedByCasesCountQuery,
  useLazyGetCitedByCasesQuery,
  useLazyGetCitingCasesCountQuery,
  useLazyGetCitingCasesQuery,
  useLazyGetArticlesCitingCaseQuery,
  useLazyGetArticlesCitingCaseCountQuery,
  useLazyGetReferencesWithGivenCaseQuery,
  useLazyGetReferencesWithGivenCaseCountQuery,
} = citationsApi;

// Export Citation articles API hooks

export const {
  useLazyGetCitedByArticlesCountQuery,
  useLazyGetCitedByArticlesQuery,
  useLazyGetCitingArticlesCountQuery,
  useLazyGetCitingArticlesQuery,
  useLazyGetCasesCitingArticleQuery,
  useLazyGetCasesCitingArticleCountQuery,
  useLazyGetReferencesWithGivenArticleQuery,
  useLazyGetReferencesWithGivenArticleCountQuery,
} = citationsApi;
