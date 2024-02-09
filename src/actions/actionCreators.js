import { Types } from "../constants/actionTypes";

export const ActionCreators = {
  login: () => ({ type: Types.LOGIN, payload: {} }),
  register: () => ({ type: Types.REGISTER, payload: {} }),
  logout: () => ({ type: Types.LOGOUT, payload: {} }),
};
