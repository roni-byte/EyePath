import EyeGestures from "eyegestures";
import { useEffect, useRef, useState } from "react";
import HeatmapResult from "./HeatmapResult";

export default function RunStudy({ testId, onClose, onSuccess, onFailure }) {
  const videoRef = useRef(null);
  const gesturesRef = useRef(null);
  const testImageRef = useRef(null);

  const prevCalRef = useRef(false);
  const showImageRef = useRef(false);
  const imgWidthRef = useRef(0);
  const imgHeightRef = useRef(0);
  const resultIdRef = useRef(null);
  const calibrationTimeoutRef = useRef(null);
  const currentIndexRef = useRef(0);
  const pointsBufferRef = useRef([]);

  const [isLoading, setIsLoading] = useState(false);

  const [test, setTest] = useState(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [participantName, setParticipantName] = useState("");
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [resultsData, setResultsData] = useState([]);

  const stopTracker = () => {
    document.body.style.cursor = "default";
    if (gesturesRef.current) {
      try {
        gesturesRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
      gesturesRef.current = null;
    }

    const video = videoRef.current || document.getElementById("video");
    if (video?.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    ["cursor", "calib_cursor", "logoDivEyeGestures"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    if (calibrationTimeoutRef.current) {
      clearTimeout(calibrationTimeoutRef.current);
      calibrationTimeoutRef.current = null;
    }
  };

  const handleCloseTest = () => {
    flushPoints();
    stopTracker();
    if (onClose) onClose();
  };

  const playSlideshowSequential = () => {
    if (!test || !test.photos || test.photos.length === 0) return;
    let index = 0;

    const showNext = () => {
      setCurrentIndex(index);
      setShowImage(true);

      setTimeout(() => {
        setShowImage(false);

        index++;

        if (index < test.photos.length) {
          setTimeout(showNext, 500);
        } else {
          flushPoints();
          setIsFinished(true);
          stopTracker();
          fetchResultsData();
          if (onSuccess) onSuccess("Test finished successfully");
        }
      }, 10000);
    };

    showNext();
  };

  const createResult = async () => {
    const payload = {
      name: participantName,
      date: new Date().toISOString(),
      testId: testId,
    };

    try {
      const response = await fetch("http://localhost:8080/api/result/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      resultIdRef.current = data.id;
      return data.id;
    } catch (err) {
      console.error("Error creating result:", err);
      if (onFailure) onFailure("Failed to create test result.");
      handleCloseTest();
    }
  };

  const savePoint = (xPos, yPos) => {
    const w = imgWidthRef.current;
    const h = imgHeightRef.current;
    if (!w || !h) return null;

    const scale = Math.min(window.innerWidth / w, window.innerHeight / h);
    const offX = (window.innerWidth - w * scale) / 2;
    const offY = (window.innerHeight - h * scale) / 2;

    const realX = (xPos - offX) / scale;
    const realY = (yPos - offY) / scale;

    const isOutside = realX < 0 || realY < 0 || realX > w || realY > h;

    const xPercent = Math.max(0, Math.min(1, realX / w));
    const yPercent = Math.max(0, Math.min(1, realY / h));

    return {
      x: xPercent,
      y: yPercent,
      isOutside: isOutside,
    };
  };

  const flushPoints = async () => {
    if (pointsBufferRef.current.length === 0) return;

    const pointsToSend = [...pointsBufferRef.current];
    pointsBufferRef.current = [];

    try {
      await fetch("http://localhost:8080/api/point/save/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pointsToSend),
      });
    } catch (error) {
      console.error("Error saving batch:", error);
    }
  };

  const handleSavePoint = ({ x, y, isOutside }) => {
    const currentPhoto = test?.photos?.[currentIndexRef.current];
    if (!currentPhoto) return;

    const pointData = {
      resultId: resultIdRef.current,
      photoId: currentPhoto.id,
      timestamp: performance.now(),
      positionX: x,
      positionY: y,
      isOutside: isOutside,
    };

    pointsBufferRef.current.push(pointData);

    const bufferSize = 50;
    if (pointsBufferRef.current.length >= bufferSize) {
      flushPoints();
    }
  };

  const fetchResultsData = async () => {
    if (!resultIdRef.current || !test) return;

    try {
      const response = await fetch(
        `http://localhost:8080/api/result/${resultIdRef.current}/points`
      );
      const points = await response.json();

      const organizedData = test.photos.map((photo) => {
        return {
          id: photo.id,
          name: photo.name,
          base64Data: photo.base64Data,
          points: points
            .filter((p) => p.photoId === photo.id)
            .map((p) => ({ x: p.positionX, y: p.positionY, value: 1 })),
        };
      });
      setResultsData(organizedData);
    } catch (error) {
      console.error("Error fetching results data:", error);
    }
  };

  const resetCalibrationTimer = () => {
    if (calibrationTimeoutRef.current) {
      clearTimeout(calibrationTimeoutRef.current);
    }

    calibrationTimeoutRef.current = setTimeout(() => {
      console.warn("Calibration timeout");
      if (onFailure) onFailure("Calibration timeout");
      handleCloseTest();
    }, 5000);
  };

  useEffect(() => {
    showImageRef.current = showImage;
  }, [showImage]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    fetch(`http://localhost:8080/api/tests/${testId}`)
      .then((res) => res.json())
      .then(setTest)
      .catch((err) => console.error(err));
  }, [testId]);

  useEffect(() => {
    if (!test || showStartScreen) return;
    let isFirstFrame = true;
    window.showError = (msg) => {
      const el = document.getElementById("error");
      if (el) {
        el.textContent = msg;
        el.hidden = false;
      }
      console.error("EyeGestures error:", msg);
    };

    const startTracker = async () => {
      const videoEl = document.getElementById("video");
      if (!videoEl) {
        console.error("Video element not found");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoEl.srcObject = stream;

        setTimeout(() => {
          try {
            const gestures = new EyeGestures("video", (point, calibration) => {
              if (isFirstFrame) {
                isFirstFrame = false;
                setIsLoading(false);
                document.body.style.cursor = "none";
              }

              if (
                prevCalRef.current === true &&
                calibration === false &&
                !isCalibrated
              ) {
                setIsCalibrated(true);
                document.body.style.cursor = "none";
                ["cursor", "calib_cursor", "logoDivEyeGestures"].forEach(
                  (id) => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = "none";
                  }
                );

                if (calibrationTimeoutRef.current) {
                  clearTimeout(calibrationTimeoutRef.current);
                  calibrationTimeoutRef.current = null;
                }
                createResult().then((id) => {
                  resultIdRef.current = id;
                  playSlideshowSequential();
                });
              }
              if (calibration === true && !isCalibrated) {
                resetCalibrationTimer();
              }

              if (showImageRef.current) {
                const [x, y] = point;
                const pointData = savePoint(x, y);

                if (pointData && resultIdRef.current) {
                  handleSavePoint(pointData);
                }
              }

              prevCalRef.current = calibration;
            });

            gesturesRef.current = gestures;
            gestures.start();
          } catch (e) {
            console.error("EyeGestures start failed:", e);
            setIsLoading(false);
          }
        }, 500);
      } catch (err) {
        console.warn("Camera error:", err);
        const msg =
          err.name === "NotAllowedError"
            ? "Camera access denied. Access to the camera is necessary for calibration and during taking test"
            : "Camera error: " + err.message;

        setIsLoading(false);
        stopTracker();
        if (onFailure) onFailure(msg);
        if (onClose) onClose();
      }
    };

    startTracker();

    return () => stopTracker();
  }, [test, showStartScreen]);

  const downloadCSV = () => {
    if (!resultsData || resultsData.length === 0) {
      alert("No data to download.");
      return;
    }

    const headers = ["PhotoName", "Timestamp", "X_Position", "Y_Position"];
    const rows = [];

    resultsData.forEach((photo) => {
      if (photo.points && photo.points.length > 0) {
        photo.points.forEach((point) => {
          rows.push([
            photo.name,
            point.timestamp || 0,
            point.x.toFixed(4),
            point.y.toFixed(4),
          ]);
        });
      }
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `study_results_${participantName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isFinished) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "#1f1d1e",
          color: "white",
          overflow: "auto",
          padding: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h1>Study results for: {participantName}</h1>
          <div>
            <button
              onClick={downloadCSV}
              style={{
                padding: "10px 20px",
                marginRight: "10px",
                background: "#385B6F",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
            <button
              onClick={handleCloseTest}
              style={{
                padding: "10px 20px",
                background: "#d9534f",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginRight: "50px",
              }}
            >
              Close
            </button>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "40px",
            alignItems: "center",
            paddingBottom: "50px",
          }}
        >
          {resultsData.length === 0 ? (
            <p>Loading heatmap data...</p>
          ) : (
            resultsData.map((photoResult) => (
              <div key={photoResult.id}>
                <h3>{photoResult.name}</h3>
                <HeatmapResult
                  base64Data={photoResult.base64Data}
                  points={photoResult.points}
                />
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        background: "#1f1d1e",
        height: "100vh",
        width: "100vw",
        color: "white",
        zIndex: 2000,
        padding: 20,
      }}
    >
      <video
        id="video"
        ref={videoRef}
        autoPlay
        playsInline
        hidden
        width="640"
        height="480"
      />

      {showStartScreen && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#1f1d1eff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            zIndex: 3000,
          }}
        >
          <h2>Enter participant name</h2>
          <input
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Name..."
            style={{ padding: "10px", fontSize: "18px" }}
          />
          <button
            onClick={() => {
              if (participantName.trim() !== "") {
                setShowStartScreen(false);
                setIsLoading(true);
              }
            }}
            disabled={!participantName.trim() || !test}
            style={{
              padding: "10px 20px",
              fontSize: "18px",
              cursor: participantName.trim() ? "pointer" : "not-allowed",
            }}
          >
            {test ? "Start test" : "Loading study data..."}
          </button>
        </div>
      )}

      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "#1f1d1e",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 4000,
          }}
        >
          <h2>Preparing configuration...</h2>
          <p>Please allow camera access if prompted.</p>
        </div>
      )}

      {showImage && test && (
        <img
          ref={testImageRef}
          src={`data:image/png;base64,${test.photos[currentIndex].base64Data}`}
          alt={test.photos[currentIndex].name}
          onLoad={(e) => {
            imgWidthRef.current = e.target.naturalWidth;
            imgHeightRef.current = e.target.naturalHeight;
          }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            objectFit: "contain",
            backgroundColor: "black",
          }}
        />
      )}

      {!isCalibrated && !showStartScreen && (
        <div style={{ position: "absolute", bottom: 20, left: 20, zIndex: 5 }}>
          Please follow the red dot (calibration)...
        </div>
      )}

      <div id="status" style={{ display: "none" }}></div>
      <div id="cursor" style={{ display: "none" }}></div>
      <div id="calib_cursor" style={{ display: "none" }}></div>
      <div id="logoDivEyeGestures" style={{ display: "none" }}></div>
      <div id="error" hidden style={{ color: "red", marginTop: "10px" }}></div>
    </div>
  );
}
