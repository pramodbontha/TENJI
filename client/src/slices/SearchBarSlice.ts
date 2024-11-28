import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const searchBarSlice = createSlice({
  name: "searchBar",
  initialState: {
    query: "",
    lemmatizedQuery: "",
    citationQuery: "",
  },
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setLemmatizedQuery: (state, action: PayloadAction<string>) => {
      state.lemmatizedQuery = action.payload;
    },
    setCitationQuery: (state, action: PayloadAction<string>) => {
      state.citationQuery = action.payload;
    },
  },
});

export const { setQuery, setLemmatizedQuery, setCitationQuery } =
  searchBarSlice.actions;

export const searchBarReducer = searchBarSlice.reducer;
