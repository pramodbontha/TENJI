import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const searchBarSlice = createSlice({
  name: "searchBar",
  initialState: {
    query: "",
  },
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
  },
});

export const { setQuery } = searchBarSlice.actions;

export const searchBarReducer = searchBarSlice.reducer;
