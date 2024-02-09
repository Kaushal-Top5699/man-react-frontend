import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Header } from "../components/Header";
import { Footer2 } from "../components/Footer";

import { isLoggedIn, register as registerApi } from "../services/Api_v1";

import { informativeToast, errorToast } from "../utils/Toasts";

import { Types } from "../constants/actionTypes";

import BackgroundImage from "../assets/imgs/background.png";

import "./Register.scss";

const FULL_NAME_MATCHER = /^.{4,}/;
const USERNAME_MATCHER = /^.{4,}$/i;
const EMAIL_MATCHER = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/;
const PASSWORD_MATCHER = /[^ ].{5,}/;
const PHONE_NUMBER_MATCHER = /^(\+\d{1,3})?\s?\(?\d{1,4}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/i;

export const RegisterPage = () => {
  const auth = useSelector(state => state.auth);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function register() {
    if (fullName.trim().length === 0)
      return errorToast("Full name cannot be empty");
    if (!FULL_NAME_MATCHER.test(fullName))
      return errorToast("Full name must be atleast 4 characters long");

    if (username.trim().length === 0)
      return errorToast("Username cannot be empty");
    if (!USERNAME_MATCHER.test(username))
      return errorToast("Username must be atleast 4 characters long");

    if (email.trim().length === 0)
      return errorToast("Email cannot be empty");
    if (!EMAIL_MATCHER.test(email))
      return errorToast("Email address is invalid");

    if (phoneNumber.length > 0 && !PHONE_NUMBER_MATCHER.test(phoneNumber))
      return errorToast("Phone number is invalid");

    if (password.trim().length === 0)
      return errorToast("Password cannot be empty");
    if (!PASSWORD_MATCHER.test(password))
      return errorToast("Password cannot begin with a whitespace and must have atleast 6 characters");

    if (confirmPassword !== password)
      return errorToast("Passwords do not match");

    registerApi(dispatch, fullName, username, email, (phoneNumber.length > 0 ? phoneNumber : null), password)
      .then(() => {
        informativeToast("Registration successful");
        navigate("/login");
      })
      .catch(error => {
        errorToast(error.message ?? "Registration failed");
      });
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
    <div className="register-page">
      <Header actionButtons={false} />

      <div
        className="body"
        style={{
          backgroundImage: `url(${BackgroundImage})`
        }}
      >
        <div className="register-form">
          <span className="caption">Enter your details to register.</span>

          <div className="field">
            <span className="required-flag">*</span>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>

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
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <input
              type="email"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
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

          <div className="field">
            <span className="required-flag">*</span>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <div className="actions">
            <div className="register-info">
              <span>Already a User ?</span>
              <span>Click <a href="/#/login">here</a> to Login.</span>
            </div>

            <button type="register" onClick={register}>Register</button>
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
