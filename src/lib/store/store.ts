import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./baseApi";
import githubReducer from "./githubSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      github: githubReducer,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    devTools: process.env.NODE_ENV !== "production",
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
