import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Article, ArticleFilter, ArticlesResponse } from "@/types";
import { createQueryParams } from "@/utils/QueryParams";
import { API_URL } from "@/utils/constants";

export const articleApi = createApi({
  reducerPath: "articlesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
  }),
  tagTypes: ["Article"],
  endpoints: (build) => ({
    getArticles: build.query<Article[], void>({
      query: () => "articles/top-cited",
      providesTags: ["Article"],
    }),
    getFilteredArticles: build.query<ArticlesResponse, ArticleFilter>({
      query: ({ searchTerm, name, number, text, skip, limit }) => {
        const queryParams = createQueryParams({
          searchTerm,
          name,
          number,
          text,
          skip,
          limit,
        });
        return {
          url: `articles/filter?${queryParams}`,
          method: "GET",
        };
      },
    }),
  }),
});

export const { useGetArticlesQuery, useLazyGetFilteredArticlesQuery } =
  articleApi;
