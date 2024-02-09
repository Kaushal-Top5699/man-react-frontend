import { useNavigate } from "react-router-dom";

import Logo from "../assets/imgs/mln-dive-logo-1.png";
import HelpIcon from "../assets/imgs/help_icon.png";
import FeedbackIcon from "../assets/imgs/feedback.png";
import NSFLogo from "../assets/imgs/nsf-logo.png";
import ITLabLogo from "../assets/imgs/itlab-logo.png";
import UTALogo from "../assets/imgs/uta-logo.png";

import "./Header.scss";

export const Header = ({
  actionButtons = true,
}) => {
  const navigateTo = useNavigate();

  return (
    <div className="header">
      <div className="logo-container">
        <img src={Logo} alt="Logo" />
      </div>

      <div className="logo-caption">
        <span className="title">MavVStream</span>
        <span className="caption">Generate, Analyze and Visualize Complex Data Sets</span>
      </div>

      <div className="action-buttons">
        {
          actionButtons &&
          <>
            <img src={HelpIcon} alt="Help" />
            <img src={FeedbackIcon} alt="Feedback" onClick={() => window.open("https://docs.google.com/forms/d/e/1FAIpQLSfXMgY6ffpA6qKVV5CSaJkrgPYoVLAKQG3xlaENM1nTVAIBcw/viewform", "_blank")} />
          </>
        }
      </div>

      <div className="trailing">
        <img src={NSFLogo} alt="NSF" />
        <img src={ITLabLogo} alt="IT Lab" />
        <img src={UTALogo} alt="UTA" />
        {/* <img src={UNTLogo} alt="UNT" />
        <img src={PSULogo} alt="PennState" /> */}
      </div>
    </div>
  );
};