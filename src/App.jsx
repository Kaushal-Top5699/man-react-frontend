import { HashRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Provider } from "react-redux";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";

import AuthStore from "./stores/authStore";

import "react-toastify/dist/ReactToastify.css";
import "./App.scss";

function App() {
  return (
    <>
      <Provider store={AuthStore}>
        <HashRouter>
          <Routes>
            <Route exact path="/login" Component={LoginPage} />
            <Route exact path="/register" Component={RegisterPage} />
            <Route exact path="/home" Component={DashboardPage} />
            <Route exact path="/profile" Component={ProfilePage} />
          </Routes>
        </HashRouter>
      </Provider>
      <ToastContainer />
    </>
  );
}

export default App;
