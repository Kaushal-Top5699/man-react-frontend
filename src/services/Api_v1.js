import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

import { Types } from "../constants/actionTypes";

const ApiManager = axios.create({
  baseURL: "http://127.0.0.1:3001/mlndash-test",
  // baseURL: "https://mln-flask-backend-2.sbtopzzzlg.repl.co/mlndash-test",
  withCredentials: true,
});

/**
 * @param {any} dispatch
 * @param {AxiosError} error
 */
function authErrorHandler(dispatch, error) {
  if ((error.status ?? error.response?.status) === 401) {
    localStorage.removeItem("sid");
    localStorage.removeItem("username");
    Cookies.remove("session");

    if (dispatch !== null) dispatch({ type: Types.auth.LOGOUT });
  }
}

// Auth-level APIs

export const isLoggedIn = async (dispatch) => {
  try {
    const sid = localStorage.getItem("sid");
    if (sid === null) return false;

    const response = await ApiManager.get("/authtest");
    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return true;
  } catch (error) {
    localStorage.removeItem("sid");
    localStorage.removeItem("username");

    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const register = async (dispatch, name, username, email, phoneNumber, password) => {
  try {
    const response = await ApiManager.post("/register", {
      name,
      username,
      email,
      phone_number: phoneNumber,
      password,
    });

    const data = response.data;
    if (data.status !== "ok") throw new Error(data.message);
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const login = async (dispatch, username, password) => {
  try {
    const response = await ApiManager.post("/login", {
      username,
      password,
    });

    const data = response.data;
    if (data.status !== "ok") throw new Error(data.message);

    const sessionId = data.data.session_id;
    const userName = data.data.username;
    localStorage.setItem("sid", sessionId);
    localStorage.setItem("username", userName);

    return { sid: sessionId, username: userName };
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };
  }
};

export const logout = async (dispatch) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.post(
      `/logout?sid=${sid}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    if (data.status !== "ok") throw new Error(data.message);

    localStorage.removeItem("sid");
    localStorage.removeItem("username");
  } catch (error) {
    console.error(error);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const getProfile = async (dispatch) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.get(`/user-profile/${sid}`);

    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return data.data;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const deleteAccount = async (dispatch) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.post(
      `/delete?sid=${sid}`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    if (data.status !== "ok") throw new Error(data.message);

    localStorage.removeItem("sid");
    localStorage.removeItem("username");
    Cookies.remove("session");

    if (dispatch !== null) dispatch({ type: Types.auth.LOGOUT });
  } catch (error) {
    console.error(error);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

// Directory-level APIs

export const navigateToChildDir = async (dispatch, folderName) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.get(`/changedr/${folderName}/${sid}`);
    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return data.data?.cwd;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const navigateToParentDir = async (dispatch) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.get(`/back/${sid}`);
    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return data.data?.cwd;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const listDirectory = async (dispatch) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.get(`/listdr/${sid}`);
    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return {
      list: data.data.list,
      cwd: data.data.cwd,
    };
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const createDirectory = async (dispatch, folderName) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.post(`/createdr/${folderName}/${sid}`, {});
    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return true;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

// Stream-level APIs

export const createEntities = async (dispatch, entities) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.post(
      `/files/entities?sid=${sid}`,
      {
        entities,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return true;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const updateEntities = async (dispatch, entities) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.patch(
      `/files/entities?sid=${sid}`,
      {
        entities,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return true;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const createStreams = async (dispatch, streams) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.post(
      `/files/streams?sid=${sid}`,
      {
        streams,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return true;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const deleteFile = async (dispatch, fileName) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.delete(`/files/${fileName}?sid=${sid}`);
    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return true;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

// File-level APIs

export const getFileContent = async (dispatch, fileName) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.get(`/filecontent?sid=${sid}&file=${fileName}`);

    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return data.data;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const getAllStreams = async (dispatch) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.get(`/files/streams?sid=${sid}`);

    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return data.data.streams;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const getAllEnums = async (dispatch) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.get(`/files/enums?sid=${sid}`);

    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return data.data.enums;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};

export const getAllQueries = async (dispatch) => {
  try {
    const sid = localStorage.getItem("sid");
    const response = await ApiManager.get(`/files/queries?sid=${sid}`);

    const data = response.data;

    if (data.status !== "ok") throw new Error(data.message);

    return data.data.queries;
  } catch (error) {
    console.error(error.message);

    if (error instanceof AxiosError) authErrorHandler(dispatch, error);

    if (error instanceof AxiosError)
      throw {
        status: error.status,
        code: error.response?.data.code,
        message: error.response?.data.message,
      };

    throw error;
  }
};
