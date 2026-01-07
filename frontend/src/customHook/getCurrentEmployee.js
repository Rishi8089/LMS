import { useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setEmployee } from "../redux/employeeSlice.js";
import { serverUrl } from "../config.js";
import { AuthContext } from "../context/authContext.jsx";

const getCurrentEmployee = (isLoggedIn) => {
  const dispatch = useDispatch();
  const employee = useSelector((state) => state.employee.employee);
  const { isAdmin } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoggedIn || isAdmin) {
      dispatch(setEmployee(null)); // Clear employee data when not logged in or if admin
      return;
    }

    const fetchEmployee = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/employee/current-employee`,
          { withCredentials: true }
        );
        dispatch(setEmployee(result.data.employee)); // ✅ update redux state
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
  }, [dispatch, employee, isLoggedIn, isAdmin]); // ✅ add dependencies

  return employee; // ✅ always return the redux state
};

export default getCurrentEmployee;
