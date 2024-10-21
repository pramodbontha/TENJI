import { CitationsReferences, Reference } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ReferenceState {
  references: Reference[];
  articleReferences: CitationsReferences;
  caseReferences: CitationsReferences;
  referencesCount: number;
  articleReferencesCount: number;
  caseReferencesCount: number;
}

const initialState: ReferenceState = {
  references: [],
  articleReferences: {
    references: [],
    total: 0,
  },
  caseReferences: {
    references: [],
    total: 0,
  },
  referencesCount: 0,
  articleReferencesCount: 0,
  caseReferencesCount: 0,
};

const referenceSlice = createSlice({
  name: "references",
  initialState,
  reducers: {
    setReferences: (state, action: PayloadAction<Reference[]>) => {
      state.references = action.payload;
    },

    setReferenceCount: (state, action: PayloadAction<number>) => {
      state.referencesCount = action.payload;
    },

    setArticleReferences: (
      state,
      action: PayloadAction<CitationsReferences>
    ) => {
      state.articleReferences = action.payload;
    },

    setArticleReferencesCount: (state, action: PayloadAction<number>) => {
      state.articleReferencesCount = action.payload;
    },

    setCaseReferences: (state, action: PayloadAction<CitationsReferences>) => {
      state.caseReferences = action.payload;
    },

    setCaseReferencesCount: (state, action: PayloadAction<number>) => {
      state.caseReferencesCount = action.payload;
    },
  },
});

export const {
  setReferences,
  setReferenceCount,
  setArticleReferences,
  setCaseReferences,
  setArticleReferencesCount,
  setCaseReferencesCount,
} = referenceSlice.actions;

export const referenceReducer = referenceSlice.reducer;
