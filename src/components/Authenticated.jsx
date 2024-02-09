import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { informativeToast } from "../utils/Toasts";

import { Types } from "../constants/actionTypes";

export const Authenticated = ({ children }) => {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  useEffect(() => {
    if (auth.user === null) {
      const sid = localStorage.getItem("sid");
      const username = localStorage.getItem("username");
      if (sid === null || username === null) {
        informativeToast("You have been logged out");
        navigate("/login");
      } else
        dispatch({ type: Types.auth.LOGIN, payload: { user: { sid, username } } });
    }
  }, [auth.user]);

  return (
    <>
      {children}
    </>
  );
};
