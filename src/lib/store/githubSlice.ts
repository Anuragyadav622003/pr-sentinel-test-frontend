import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Client-side GitHub connection UI state.
 * Server truth (connected, installation, repos) lives in RTK Query cache.
 */
export type GitHubUiStatus =
  | "unknown"
  | "disconnected"
  | "connecting"
  | "connected"
  | "syncing"
  | "error";

export interface GitHubSliceState {
  /** UI flow status — overridden by active install/sync operations. */
  uiStatus: GitHubUiStatus;
  /** Safe user-facing error from install/callback flows. */
  error: string | null;
  /** True after the first backend status fetch completes (success or error). */
  initialized: boolean;
  /** ISO timestamp of the last successful installation sync. */
  lastSyncedAt: string | null;
}

const initialState: GitHubSliceState = {
  uiStatus: "unknown",
  error: null,
  initialized: false,
  lastSyncedAt: null,
};

const githubSlice = createSlice({
  name: "github",
  initialState,
  reducers: {
    setConnecting(state) {
      state.uiStatus = "connecting";
      state.error = null;
    },
    setSyncing(state) {
      state.uiStatus = "syncing";
      state.error = null;
    },
    setInitialized(state, action: PayloadAction<boolean>) {
      state.initialized = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.uiStatus = "error";
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
      if (state.uiStatus === "error") {
        state.uiStatus = "unknown";
      }
    },
    setLastSyncedAt(state, action: PayloadAction<string>) {
      state.lastSyncedAt = action.payload;
    },
    resetGitHubState() {
      return initialState;
    },
  },
});

export const {
  setConnecting,
  setSyncing,
  setInitialized,
  setError,
  clearError,
  setLastSyncedAt,
  resetGitHubState,
} = githubSlice.actions;

export default githubSlice.reducer;
