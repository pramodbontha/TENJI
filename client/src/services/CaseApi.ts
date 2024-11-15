import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { CaseFilter, CasesResponse, ICase } from "@/types";
import { createQueryParams } from "@/utils/QueryParams";
import { API_URL } from "@/utils/constants";

export const caseApi = createApi({
  reducerPath: "caseApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
  }),
  tagTypes: ["Case"],
  endpoints: (build) => ({
    getCases: build.query<ICase[], void>({
      query: () => "cases/top-cited",
      providesTags: ["Case"],
    }),
    getFilteredCases: build.query<CasesResponse, CaseFilter>({
      query: (caseFilter) => {
        const queryParams = createQueryParams(caseFilter);
        return {
          url: `cases/filter?${queryParams}`,
          method: "GET",
        };
      },
    }),

    getDecisionTypes: build.query<string[], void>({
      query: () => "cases/decisions-types",
    }),
  }),
});

export const {
  useGetCasesQuery,
  useLazyGetFilteredCasesQuery,
  useGetDecisionTypesQuery,
} = caseApi;
