import { toast } from "react-toastify";

/**
 * @param {Promise<any>} promise Promise
 * @param {{ pending: string, success: string, error: string }} options
 * @returns {Promise<any>}
 */
export const promiseToast = function (
  promise,
  { pending = "Processing your request...", success = "Processing complete", error = "Processing failure" }
) {
  return toast.promise(promise, {
    pending,
    success,
    error,
  });
};

export const informativeToast = function (message, timeout = 8000) {
  return toast(message, {
    autoClose: timeout,
    theme: "light",
    type: "info",
    pauseOnFocusLoss: true,
    position: "top-right",
  });
};

export const errorToast = function (message, timeout = 10000) {
  return toast(message, {
    autoClose: timeout,
    theme: "light",
    type: "error",
    pauseOnFocusLoss: true,
    position: "top-right",
  });
};
