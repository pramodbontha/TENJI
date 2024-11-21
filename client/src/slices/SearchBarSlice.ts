import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const searchBarSlice = createSlice({
  name: "searchBar",
  initialState: {
    query: "",
    lemmatizedQuery: "",
  },
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setLemmatizedQuery: (state, action: PayloadAction<string>) => {
      state.lemmatizedQuery = action.payload;
    },
  },
});

export const { setQuery, setLemmatizedQuery } = searchBarSlice.actions;

export const searchBarReducer = searchBarSlice.reducer;
