// store.js
import { configureStore } from '@reduxjs/toolkit';
import employeeReducer from './employeeSlice.js';

const store = configureStore({
  reducer: {
    employee: employeeReducer,
  },
});

export default store;
