import { useState, useRef, useEffect } from "react";
import API from "../../api";
import { notify } from "../../components/appNotifications";

export default function useFoodScanner(onSuccess) {
  const [scanStatus, setScanStatus] = useState("idle"); // idle, captured, analyzing, done, error
  const [scanError, setScanError] = useState("");
  const [scanResults, setScanResults] = useState([]);
  const [capturedImage, setCapturedImage] = useState("");
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize Camera
  const initCamera = async () => {
    setScanError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access error", err);
      setScanError("Unable to access camera. Check permissions.");
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setCapturedImage("");
    setScanStatus("idle");
    setScanResults([]);
  };

  // Capture frame from video
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setScanError("Unable to render camera capture.");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    setScanStatus("captured");
  };

  // Send to Backend AI
  const runImageScan = async () => {
    if (!capturedImage) return;
    try {
      setScanStatus("analyzing");
      const response = await API.post("/api/nutrition/scan", { imageData: capturedImage });
      const results = response.data?.results || [];
      setScanResults(results);
      setScanStatus("done");
      if (results.length === 0) setScanError("No foods recognized.");
    } catch (err) {
      setScanStatus("error");
      setScanError(err.response?.data?.message || "Failed to analyze image.");
    }
  };

  // Save the selected result to the user's daily log
  const addMeal = async (item) => {
    const token = localStorage.getItem("token");
    try {
      await API.post("/api/meals", {
        name: `${item.name} (Camera Scan)`,
        calories: Number(item.calories || 0),
        protein: Number(item.protein || 0),
        carbs: Number(item.carbs || 0),
        fats: Number(item.fats || 0),
      }, { headers: { Authorization: `Bearer ${token}` } });

      notify(`Added ${item.name} to today.`, "success");
      onSuccess(); // Refresh dashboard data
      return true;
    } catch (error) {
      notify("Failed to add meal", "error");
      return false;
    }
  };

  return {
    videoRef, canvasRef,
    scanStatus, scanError, scanResults, capturedImage,
    initCamera, stopCamera, capturePhoto, runImageScan, addMeal,
    setCapturedImage, setScanResults, setScanStatus
  };
}