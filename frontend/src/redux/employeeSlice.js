import { createSlice } from '@reduxjs/toolkit';

const employeeSlice = createSlice({
  name: 'employee', // name must be a string
  initialState: {
    employee: null,
  },
  reducers: {
    setEmployee: (state, action) => {
      state.employee = action.payload;
    },
  },
});

export const { setEmployee } = employeeSlice.actions;
export default employeeSlice.reducer;
