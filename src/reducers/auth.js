import { Types } from "../constants/actionTypes";

const initialState = {
  user: null,
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case Types.auth.LOGIN:
      return {
        ...state,
        user: action.payload.user,
      };
    case Types.auth.LOGOUT:
      return {
        ...state,
        user: null,
      };

    default:
      return initialState;
  }
};

export default reducer;
