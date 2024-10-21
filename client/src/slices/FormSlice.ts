import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/* eslint-disable @typescript-eslint/no-explicit-any */
const FormSlice = createSlice({
  name: "form",
  initialState: {} as any,
  reducers: {
    setFormValues: (_, action: PayloadAction<any>) => {
      return action.payload;
    },
  },
});

export const { setFormValues } = FormSlice.actions;

export const formReducer = FormSlice.reducer;
