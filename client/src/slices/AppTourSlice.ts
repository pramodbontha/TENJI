import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const appTourSlice = createSlice({
  name: "appTour",
  initialState: {
    isTourEnabled: true,
  },
  reducers: {
    setIsTourEnabled: (state, action: PayloadAction<boolean>) => {
      state.isTourEnabled = action.payload;
    },
  },
});

export const { setIsTourEnabled } = appTourSlice.actions;

export const appTourReducer = appTourSlice.reducer;
