import { useEffect } from "react";
import useFoodScanner from "./useFoodScanner";
import "./FoodScannerModal.css";

const FoodScannerModal = ({ onClose, refreshData }) => {
  const {
    videoRef, canvasRef, scanStatus, scanError, scanResults, capturedImage,
    initCamera, stopCamera, capturePhoto,  addMeal,
    setCapturedImage, setScanResults, setScanStatus
  } = useFoodScanner(refreshData);

  useEffect(() => {
    initCamera();
    return () => stopCamera();
  }, []);

  const runImageScan = async () => {
  try {
    setScanStatus("analyzing");

    // 1. Convert captured image to file/base64
    const imageBase64 = capturedImage; 
    // (usually already base64 from canvas)

    // 2. Send to backend
    const res = await fetch("https://jbfitness-backend.onrender.com/api/ai-scan/scan-food", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        image: imageBase64
      })
    });

    const data = await res.json();

    // 3. Convert backend response into UI format
    const formatted = [
      {
        name: data.food,
        calories: 0,   // you can improve later
        protein: 0
      }
    ];

    setScanResults(formatted);
    setScanStatus("done");

  } catch (err) {
    console.log(err);
    setScanStatus("error");
  }
};

  const handleAdd = async (item) => {
    const success = await addMeal(item);
    if (success) onClose();
  };

  return (
    <div className="vision-overlay">
      <div className="vision-wrapper">
        {/* MATURED CLOSE BUTTON */}
        <button className="vision-close-alt" onClick={onClose} aria-label="Close Scanner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="vision-viewport">
          {!capturedImage ? (
            <div className="camera-layer">
              <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
              <div className="focus-reticle">
                <div className="reticle-corner tl"></div>
                <div className="reticle-corner tr"></div>
                <div className="reticle-corner bl"></div>
                <div className="reticle-corner br"></div>
              </div>
            </div>
          ) : (
            <div className="preview-layer">
              <img src={capturedImage} alt="Captured" className="image-freeze" />
              {scanStatus === "analyzing" && (
                <div className="analysis-shimmer">
                  <span className="shimmer-text">AI IS ANALYZING...</span>
                </div>
              )}
            </div>
          )}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        {/* OVERLAY CONTROLS */}
        <div className="vision-controls">
          {!capturedImage ? (
            <div className="capture-row">
              <button className="shutter-trigger" onClick={capturePhoto}>
                <div className="shutter-inner"></div>
              </button>
              <p className="vision-hint">Point at your meal</p>
            </div>
          ) : (
            <div className="decision-row">
              <button 
                className="vision-btn primary" 
                onClick={runImageScan} 
                disabled={scanStatus === "analyzing"}
              >
                {scanStatus === "analyzing" ? "Analyzing..." : "Analyze Meal"}
              </button>
              <button 
                className="vision-btn ghost" 
                onClick={() => { setCapturedImage(""); setScanStatus("idle"); setScanResults([]); }}
              >
                Retake
              </button>
            </div>
          )}
        </div>

        {/* RESULTS DRAWER */}
        {scanResults.length > 0 && (
          <div className="vision-results-drawer">
            <div className="drawer-handle"></div>
            <div className="results-list">
              {scanResults.map((item, index) => (
                <div key={index} className="result-card-mini">
                  <div className="res-info">
                    <span className="res-name">{item.name}</span>
                    <span className="res-meta">{item.calories} kcal • {item.protein}g P</span>
                  </div>
                  <button className="res-add-btn" onClick={() => handleAdd(item)}>Add</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodScannerModal;