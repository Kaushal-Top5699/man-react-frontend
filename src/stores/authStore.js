import { combineReducers } from "redux";
import { configureStore } from "@reduxjs/toolkit";

import AuthReducer from "../reducers/auth";

const rootReducer = combineReducers({
  auth: AuthReducer,
});

const cs = configureStore({
  reducer: rootReducer,
});

export default cs;
