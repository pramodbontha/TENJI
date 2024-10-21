import { CitationsCases, ICase } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CaseState {
  cases: ICase[];
  casesCitingArticle: CitationsCases;
  citedByCases: CitationsCases;
  citedByCasesCount: number;
  citingCases: CitationsCases;
  citingCasesCount: number;
  selectedCase: ICase | null;
  casesMenu: ICase[];
  casesCount: number;
  casesCitingArticleCount: number;
}

const initialState: CaseState = {
  cases: [],
  casesCitingArticle: {
    cases: [],
    total: 0,
  },
  citedByCases: {
    cases: [],
    total: 0,
  },
  citedByCasesCount: 0,
  citingCases: {
    cases: [],
    total: 0,
  },
  citingCasesCount: 0,
  selectedCase: null,
  casesMenu: [],
  casesCount: 0,
  casesCitingArticleCount: 0,
};

const caseSlice = createSlice({
  name: "cases",
  initialState,
  reducers: {
    setCases: (state, action: PayloadAction<ICase[]>) => {
      state.cases = action.payload;
    },
    setCaseCount: (state, action: PayloadAction<number>) => {
      state.casesCount = action.payload;
    },

    setCasesCitingArticle: (state, action: PayloadAction<CitationsCases>) => {
      state.casesCitingArticle = action.payload;
    },
    setCasesCitingArticleCount: (state, action: PayloadAction<number>) => {
      state.casesCitingArticleCount = action.payload;
    },

    setSelectedCase: (state, action: PayloadAction<ICase>) => {
      state.selectedCase = action.payload;
    },
    setCitedByCases: (state, action: PayloadAction<CitationsCases>) => {
      state.citedByCases = action.payload;
    },
    setCitedByCasesCount: (state, action: PayloadAction<number>) => {
      state.citedByCasesCount = action.payload;
    },
    setCitingCases: (state, action: PayloadAction<CitationsCases>) => {
      state.citingCases = action.payload;
    },
    setCitingCasesCount: (state, action: PayloadAction<number>) => {
      state.citingCasesCount = action.payload;
    },
    setCasesMenu: (state, action: PayloadAction<ICase[]>) => {
      state.casesMenu = action.payload;
    },
  },
});

export const {
  setCases,
  setCaseCount,
  setCasesMenu,
  setCitedByCases,
  setCitingCases,
  setSelectedCase,
  setCitedByCasesCount,
  setCitingCasesCount,
  setCasesCitingArticle,
  setCasesCitingArticleCount,
} = caseSlice.actions;

export const caseReducer = caseSlice.reducer;
