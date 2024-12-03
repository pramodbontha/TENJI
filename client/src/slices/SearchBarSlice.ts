import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SearchBarState {
  query: string[];
  lemmatizedQuery: string;
  citationQuery: string;
  isSearching?: boolean;
}

const initialState: SearchBarState = {
  query: [],
  lemmatizedQuery: "",
  citationQuery: "",
  isSearching: false,
};

const searchBarSlice = createSlice({
  name: "searchBar",
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string[]>) => {
      state.query = action.payload;
    },
    setLemmatizedQuery: (state, action: PayloadAction<string>) => {
      state.lemmatizedQuery = action.payload;
    },
    setCitationQuery: (state, action: PayloadAction<string>) => {
      state.citationQuery = action.payload;
    },
    setIsSearching: (state, action: PayloadAction<boolean>) => {
      state.isSearching = action.payload;
    },
  },
});

export const {
  setQuery,
  setLemmatizedQuery,
  setCitationQuery,
  setIsSearching,
} = searchBarSlice.actions;

export const searchBarReducer = searchBarSlice.reducer;
