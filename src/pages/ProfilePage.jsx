import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { Authenticated } from "../components/Authenticated";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Header } from "../components/Header";
import { Footer2 } from "../components/Footer";

import {
  getProfile,
  deleteAccount as deleteAccountApi,
} from "../services/Api_v1";

import { errorToast, informativeToast } from "../utils/Toasts";

import BackgroundImage from "../assets/imgs/background.png";
import WarningIcon from "../assets/svgs/warning.svg";

import "./Profile.scss";

export const ProfilePage = () => {
  const dispatch = useDispatch();

  const navigateTo = useNavigate();

  const deleteAccWarningDialogRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    emailId: "",
    phoneNo: "",
  });

  useEffect(() => {
    try {
      getProfile(dispatch)
        .then(profile => {
          setProfile({
            name: profile.name,
            username: profile.username,
            emailId: profile.email_id,
            phoneNo: profile.phone_no,
          });
        })
        .catch(error => {
          errorToast(error.message ?? "Unknown error occurred");
        });
    } catch (error) {
      errorToast(error.message ?? "Unknown error occurred");
    }
  }, []);

  async function deleteAccount(e) {
    e.preventDefault();
    e.stopPropagation();

    deleteAccWarningDialogRef.current.close();

    setIsLoading(true);
    try {
      await deleteAccountApi(dispatch);
      informativeToast("Your account was deleted");
    } catch (error) {
      errorToast(error.message ?? "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Authenticated>
      <LoadingOverlay isVisible={isLoading} />
      <div className="profile-page">
        <Header actionButtons={false} />

        <div
          className="body"
          style={{
            backgroundImage: `url(${BackgroundImage})`
          }}
        >
          <strong
            style={{
              cursor: "pointer",
              width: "100%",
              fontSize: "larger",
            }}
            onClick={() => navigateTo("/home")}
            onKeyDown={() => navigateTo("/home")}
          >
            ← Go Back
          </strong>

          <div>
            <h1>Profile Details</h1>
            <table style={{
              fontSize: "30px",
              borderCollapse: "collapse",
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
            }}>

              <tbody><tr>
                <td style={{ border: "1px solid" }}>Name</td>
                <td style={{ border: "1px solid" }}>{profile.name ?? "n/a"}</td>
              </tr>
                <tr>
                  <td style={{ border: "1px solid" }}>Username</td>
                  <td style={{ border: "1px solid" }}>{profile.username}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid" }}>Phone Number</td>
                  <td style={{ border: "1px solid" }}>{profile.phoneNo ?? "n/a"}</td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid" }}>Email</td>
                  <td style={{ border: "1px solid" }}>{profile.emailId}</td>
                </tr>
              </tbody></table>
            <br />
            <a
              className="button"
              style={{
                cursor: "pointer",
                backgroundColor: "#f44336",
                borderRadius: "5px",
                color: "white",
                padding: "14px 25px",
                textAlign: "center",
                textDecoration: "none",
                display: "inline-block",
                fontSize: "20px"
              }}
              onClick={() => deleteAccWarningDialogRef.current.showModal()}
            >
              Delete Profile
            </a>
            <p style={{ fontSize: "20px" }}>(Delete all user information and files.)</p>
          </div>
        </div>

        <Footer2 />
      </div>

      <dialog
        ref={deleteAccWarningDialogRef}
        className="delete-account-dialog"
      >
        <div className="body">
          <span className="title">
            <img
              src={WarningIcon}
              alt="Warning"
              height="30px"
            />
            Warning
          </span>
          <span className="caption">Are you sure you wish to delete your account? This action cannot be undone and you will have to register to use the <strong>MavVStream Dashboard</strong>!</span>
          <div className="dialog-actions">
            <button
              onClick={() => deleteAccWarningDialogRef.current.close()}
            >
              Cancel
            </button>
            <button
              type="critical"
              onClick={deleteAccount}
            >
              Delete my Account
            </button>
          </div>
        </div>
      </dialog>
    </Authenticated >
  );
};