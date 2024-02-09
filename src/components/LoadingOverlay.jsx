/* eslint-disable react/prop-types */
import LoadingGif from "../assets/gifs/loading.gif";

import "./LoadingOverlay.scss";

export const LoadingOverlay = ({ isVisible = true }) => {
  if (!isVisible)
    return <></>;

  return (
    <div className="loading-overlay">
      <img
        src={LoadingGif}
        alt="Loading"
      />
    </div>
  );
};
