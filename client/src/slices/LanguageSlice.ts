import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import i18n from "@/utils/i18n";
import { RootState } from "@/redux/store";

export interface LanguageState {
  language: string;
}

const initialState: LanguageState = {
  language: "en",
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
      i18n.changeLanguage(action.payload);
    },
  },
});

export const { setLanguage } = languageSlice.actions;

export const selectLanguage = (state: RootState) => state.language.language;

export const languageReducer = languageSlice.reducer;
