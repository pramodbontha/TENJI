import { createApi } from "@reduxjs/toolkit/query/react";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Book } from "@/types";
const apiUrl = import.meta.env.VITE_API_URL;

export const bookApi = createApi({
  reducerPath: "booksApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
  }),
  tagTypes: ["Book"],
  endpoints: (build) => ({
    getBooks: build.query<Book[], void>({
      query: () => "books/",
      providesTags: ["Book"],
    }),
    getFilteredBooks: build.query<Book[], string>({
      query: (filter) => `books/search?searchTerm=${filter}`,
      providesTags: ["Book"],
    }),
    getPathTillParent: build.query<Book[], string>({
      query: (bookId) => `books/${bookId}`,
      providesTags: ["Book"],
    }),
    getSectionsInToc: build.query<Book[], string>({
      query: (bookId) => `books/${bookId}/sections`,
      providesTags: ["Book"],
    }),
  }),
});

export const {
  useGetBooksQuery,
  useGetSectionsInTocQuery,
  useLazyGetFilteredBooksQuery,
  useLazyGetPathTillParentQuery,
  useLazyGetSectionsInTocQuery,
} = bookApi;
