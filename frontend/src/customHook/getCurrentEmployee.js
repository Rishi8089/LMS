import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setEmployee } from "../redux/employeeSlice.js";

const getCurrentEmployee = (isLoggedIn) => {
  const dispatch = useDispatch();
  const employee = useSelector((state) => state.employee.employee);

  useEffect(() => {
    if (!isLoggedIn) {
      dispatch(setEmployee(null)); // Clear employee data when not logged in
      return;
    }

    const fetchEmployee = async () => {
      try {
        const result = await axios.get(
          "http://localhost:8000/api/employee/current-employee",
          { withCredentials: true }
        );
        dispatch(setEmployee(result.data)); // ✅ update redux state
      } catch (error) {
        if (
          error.response &&
          (error.response.status === 401 || error.response.status === 403)
        ) {
          dispatch(setEmployee(null)); // ✅ clear state on unauthenticated
        }
      }
    };

    if (isLoggedIn && !employee) {
      fetchEmployee();
    }
  }, [dispatch, employee, isLoggedIn]); // ✅ add dependencies

  return employee; // ✅ always return the redux state
};

export default getCurrentEmployee;
