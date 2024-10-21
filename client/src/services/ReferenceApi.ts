import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Reference, ReferenceFilter, ReferencesResponse } from "@/types";
import { createQueryParams } from "@/utils/QueryParams";
const apiUrl = import.meta.env.VITE_API_URL;

export const referenceApi = createApi({
  reducerPath: "referencesApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
  }),
  tagTypes: ["Reference"],
  endpoints: (build) => ({
    getReferences: build.query<Reference[], void>({
      query: () => "references/",
      providesTags: ["Reference"],
    }),
    getFilteredReferences: build.query<Reference[], string>({
      query: (searchTerm) => ({
        url: `references/section-references?searchTerm=${searchTerm}`,
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
