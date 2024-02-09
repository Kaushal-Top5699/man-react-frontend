import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Header } from "../components/Header";
import { Footer2 } from "../components/Footer";

import { login as loginApi, isLoggedIn } from "../services/Api_v1";

import { errorToast, promiseToast } from "../utils/Toasts";

import { Types } from "../constants/actionTypes";

import BackgroundImage from "../assets/imgs/background.png";

import "./Login.scss";

const USERNAME_MATCHER = /.{4,}/i;
const PASSWORD_MATCHER = /[^ ].{5,}/;

export const LoginPage = () => {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function login() {
    if (username.trim().length === 0)
      return errorToast("Username cannot be empty");
    if (!USERNAME_MATCHER.test(username))
      return errorToast("Username is invalid");

    if (password.trim().length === 0)
      return errorToast("Password cannot be empty");
    if (!PASSWORD_MATCHER.test(password))
      return errorToast("Password is invalid");

    const promise = new Promise((resolve, reject) => {
      loginApi(dispatch, username, password)
        .then(user => {
          dispatch({ type: Types.auth.LOGIN, payload: { user } });
          resolve();
        })
        .catch(error => {
          errorToast(error.message);
          reject(error);
        });
    });

    promiseToast(
      promise,
      {
        pending: "Logging in...",
        success: "Logged in successfully",
        error: "Failed to login",
      },
    );
  }

  useEffect(() => {
    // Check if user is logged in
    isLoggedIn(dispatch)
      .then(loggedIn => {
        if (loggedIn) {
          const sid = localStorage.getItem("sid");
          const username = localStorage.getItem("username");
          dispatch({ type: Types.auth.LOGIN, payload: { user: { sid, username } } });
        }
      })
      .catch(error => {
        errorToast(error.message);
      });
  }, []);

  if (auth.user !== null) {
    navigate("/home");
    return <></>;
  }

  return (
    <div className="login-page">
      <Header actionButtons={false} />

      <div
        className="body"
        style={{
          backgroundImage: `url(${BackgroundImage})`
        }}
      >
        <div className="sign-in-form">
          <span className="caption">Sign in with your username</span>

          <div className="field">
            <span className="required-flag">*</span>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="field">
            <span className="required-flag">*</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="actions">
            <div className="register-info">
              <span>New User ?</span>
              <span>Click <a href="/#/register">here</a> to Register.</span>
            </div>

            <button type="login" onClick={login}>Login</button>
          </div>
        </div>
        <div className="informative">
          <span>
            <span className="name">MLN-Dashboard</span><span className="version">{"(ver 1.0)"}</span> is an interactive dashboard to <span className="highlight">generate, analyze, and visualize complex data
              sets using multilayer networks</span>. This is built as part of a CCRI NSF-funded project. Salient features are:</span>

          <div className="features">
            <div className="feature">
              <span className="bullet">☑️</span>
              <span className="description">
                <span className="feature-title">User Workspace:</span> Users can register, securely log in, and concurrently work in their independent workspace over multiple sessions.
              </span>
            </div>

            <div className="feature">
              <span className="bullet">☑️</span>
              <span className="description">
                <span className="feature-title">Applications:</span> Applications based on real-world data sets like DBLP, IMDb, Accident, and Airline have been pre-loaded. <span className="highlight-2">For security reasons, the user capability of uploading new data sets is currently disabled.</span>
              </span>
            </div>

            <div className="feature">
              <span className="bullet">☑️</span>
              <span className="description">
                <span className="feature-title">MLN Layer Generation:</span> Configuration files with specific requirements {"(e.g., selected feature, similarity metric, thresholds)"} to generate layers {"(graphs)"}.
              </span>
            </div>

            <div className="feature">
              <span className="bullet">☑️</span>
              <span className="description">
                <span className="feature-title">MLN Analysis:</span> Configuration files specify the analysis {"(community, centrality, ...)"} to be performed on the generated layers.
              </span>
            </div>

            <div className="feature">
              <span className="bullet">☑️</span>
              <span className="description">
                <span className="feature-title">Visualization:</span> Interactive visualization alternatives, such as networks and word cloud are currently supported.
              </span>
            </div>
          </div>

          <a
            className="dashboard-demo-button"
            href="https://www.youtube.com/watch?v=1IAAAPKUWDs"
            target="_blank"
            rel="noreferrer"
          >
            Dashboard Demo
          </a>
        </div>
      </div>

      <Footer2 />
    </div>
  );
};