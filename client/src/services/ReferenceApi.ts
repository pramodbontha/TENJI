import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Reference, ReferenceFilter, ReferencesResponse } from "@/types";
import { createQueryParams } from "@/utils/QueryParams";
import { API_URL } from "@/utils/constants";

export const referenceApi = createApi({
  reducerPath: "referencesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
  }),
  tagTypes: ["Reference"],
  endpoints: (build) => ({
    getReferences: build.query<Reference[], void>({
      query: () => "references/",
      providesTags: ["Reference"],
    }),
    getFilteredReferences: build.query<Reference[], string>({
      query: (sectionId) => ({
        url: `references/${sectionId}/section-references`,
        method: "GET",
      }),
      providesTags: ["Reference"],
    }),

    getFilteredReferencesWithQueries: build.query<
      ReferencesResponse,
      ReferenceFilter
    >({
      query: (filter) => {
        const queryParams = createQueryParams({ ...filter });
        return {
          url: `references/search?${queryParams}`,
          method: "GET",
        };
      },
    }),

    getResources: build.query<string[], void>({
      query: () => "references/resources",
    }),
  }),
});

export const {
  useGetReferencesQuery,
  useLazyGetFilteredReferencesQuery,
  useLazyGetFilteredReferencesWithQueriesQuery,
  useGetResourcesQuery,
} = referenceApi;
