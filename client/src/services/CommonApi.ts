import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_URL } from "@/utils/constants";

export const commonApi = createApi({
  reducerPath: "commonApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
  }),
  tagTypes: ["Common"],
  endpoints: (build) => ({
    getLemmatizedQuery: build.query<string, string>({
      query: (text) => `/shared/lemmatize/?text=${text}`,
      transformResponse: (response: { lemmatizedQuery: string }) =>
        response.lemmatizedQuery,
      providesTags: ["Common"],
    }),
  }),
});

export const { useLazyGetLemmatizedQueryQuery } = commonApi;
