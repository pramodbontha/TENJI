import { Article, ICase } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CitationsState {
  citationsMenu: (Article | ICase)[];
}

const initialState: CitationsState = {
  citationsMenu: [],
};

const citationsSlice = createSlice({
  name: "citations",
  initialState,
  reducers: {
    setCitationsMenu: (state, action: PayloadAction<(Article | ICase)[]>) => {
      state.citationsMenu = action.payload;
    },
  },
});

export const { setCitationsMenu } = citationsSlice.actions;

export const citationsReducer = citationsSlice.reducer;
