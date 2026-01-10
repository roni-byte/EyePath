import { Alert } from "@mui/material";
import { useEffect, useState } from "react";
import HeatmapResult from "./HeatmapResult";
import RunStudy from "./RunStudy";

export default function StudyViewer({
  testId,
  onBack,
  tests,
  setSelectedTestId,
}) {
  const [test, setTest] = useState(null);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRunTest, setShowRunTest] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [viewMode, setViewMode] = useState("details"); // 'details' | 'results'
  const [participants, setParticipants] = useState([]);
  const [selectedResultId, setSelectedResultId] = useState("all");
  const [aggregatedData, setAggregatedData] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:8080/api/tests/${testId}`)
      .then((res) => res.json())
      .then(setTest)
      .catch((err) => console.error(err));

    setViewMode("details");
    setShowSlideshow(false);
    setCurrentIndex(0);
  }, [testId]);

  useEffect(() => {
    if (viewMode === "results") {
      fetch(`http://localhost:8080/api/result/test/${testId}`)
        .then((res) => res.json())
        .then(setParticipants)
        .catch((err) => console.error(err));

      fetchPoints("all");
    }
  }, [viewMode, testId]);

  const fetchPoints = (resultId) => {
    const url =
      resultId === "all"
        ? `http://localhost:8080/api/point/test/${testId}`
        : `http://localhost:8080/api/result/${resultId}/points`;

    fetch(url)
      .then((res) => res.json())
      .then((points) => {
        if (!test) return;
        const mapped = test.photos.map((photo) => ({
          ...photo,
          points: points
            .filter((p) => p.photoId === photo.id)
            .map((p) => ({
              x: p.positionX,
              y: p.positionY,
              value: 1,
              timestamp: p.timestamp,
            })),
        }));
        setAggregatedData(mapped);
      });
  };

  const handleSelectParticipant = (e) => {
    const val = e.target.value;
    setSelectedResultId(val);
    fetchPoints(val);
  };

  const downloadCSV = () => {
    if (!aggregatedData || aggregatedData.length === 0) {
      alert("No data to download.");
      return;
    }

    let fileNameSuffix = "aggregated";
    if (selectedResultId !== "all") {
      const participant = participants.find((p) => p.id == selectedResultId);
      if (participant) {
        fileNameSuffix = participant.name.replace(/\s+/g, "_");
      }
    }

    const headers = ["PhotoName", "Timestamp", "X_Position", "Y_Position"];
    const rows = [];

    aggregatedData.forEach((photo) => {
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
    link.setAttribute("download", `results_${test.name}_${fileNameSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStartSlideshow = () => {
    if (test.photos && test.photos.length > 0) {
      setShowSlideshow(true);
      setCurrentIndex(0);
    }
  };

  const nextPhoto = () =>
    setCurrentIndex((prev) => (prev + 1) % test.photos.length);
  const prevPhoto = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + test.photos.length) % test.photos.length
    );

  const currentIndexInList = tests.findIndex((t) => t.id === testId);
  const nextTest = () => {
    if (currentIndexInList + 1 < tests.length)
      setSelectedTestId(tests[currentIndexInList + 1].id);
  };
  const prevTest = () => {
    if (currentIndexInList - 1 >= 0)
      setSelectedTestId(tests[currentIndexInList - 1].id);
  };

  if (!test) return <p>Loading test...</p>;

  return (
    <div className="test-viewer">
      <div style={{ marginBottom: 15 }}>
        <button
          className="back-button"
          style={{
            backgroundColor: "#444",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "10px",
          }}
          onClick={onBack}
        >
          ← Back
        </button>
        <button
          className="run-test-button"
          style={{
            backgroundColor: "#385B6F",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => setShowRunTest(true)}
        >
          Run test
        </button>
      </div>

      {showRunTest && (
        <RunStudy
          testId={testId}
          onClose={() => setShowRunTest(false)}
          onSuccess={(msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 5000);
          }}
          onFailure={(msg) => {
            setToastMessage(msg);
            setTimeout(() => setToastMessage(null), 5000);
          }}
        />
      )}

      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 9999,
          }}
        >
          <Alert severity="info">{toastMessage}</Alert>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0 }}>{test.name}</h2>

        <div
          style={{
            display: "flex",
            background: "#333",
            borderRadius: 5,
            padding: 2,
          }}
        >
          <button
            onClick={() => setViewMode("details")}
            style={{
              background: viewMode === "details" ? "#e53935" : "transparent",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: viewMode === "details" ? "bold" : "normal",
            }}
          >
            Details
          </button>
          <button
            onClick={() => setViewMode("results")}
            style={{
              background: viewMode === "results" ? "#e53935" : "transparent",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: viewMode === "results" ? "bold" : "normal",
            }}
          >
            Results
          </button>
        </div>
      </div>

      {viewMode === "details" ? (
        <div>
          {!showSlideshow ? (
            <div>
              <p>Click here to show photos slideshow</p>
              <button
                className="back-button"
                style={{ backgroundColor: "#444" }}
                onClick={handleStartSlideshow}
              >
                Photos Slideshow
              </button>
            </div>
          ) : (
            <div className="slideshow">
              <img
                src={`data:image/png;base64,${test.photos[currentIndex].base64Data}`}
                alt={test.photos[currentIndex].name}
                className="slide-image"
              />
              <div className="controls">
                <button onClick={prevPhoto}>← Previous</button>
                <button onClick={nextPhoto}>Next →</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              marginBottom: 20,
              background: "#2c2a2d",
              padding: 15,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <label style={{ fontWeight: "bold" }}>Select Participant: </label>
            <select
              value={selectedResultId}
              onChange={handleSelectParticipant}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #555",
                background: "#444",
                color: "white",
                flexGrow: 1,
                maxWidth: "300px",
              }}
            >
              <option value="all">-- All Aggregated --</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({new Date(p.atDate).toLocaleDateString()})
                </option>
              ))}
            </select>

            <button
              onClick={downloadCSV}
              disabled={!aggregatedData || aggregatedData.length === 0}
              style={{
                padding: "8px 16px",
                backgroundColor: "#385B6F",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
                opacity:
                  !aggregatedData || aggregatedData.length === 0 ? 0.6 : 1,
              }}
            >
              Download CSV
            </button>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "40px",
              alignItems: "center",
            }}
          >
            {aggregatedData.map((photo) => (
              <div
                key={photo.id}
                style={{ textAlign: "center", width: "100%" }}
              >
                <h3
                  style={{
                    borderBottom: "1px solid #444",
                    paddingBottom: 10,
                    marginBottom: 20,
                  }}
                >
                  {photo.name}
                </h3>
                <HeatmapResult
                  base64Data={photo.base64Data}
                  points={photo.points}
                />
                <p style={{ color: "#aaa" }}>
                  Points recorded: {photo.points ? photo.points.length : 0}
                </p>
              </div>
            ))}
            {aggregatedData.length === 0 && (
              <p>Loading results or no data...</p>
            )}
          </div>
        </div>
      )}
      {viewMode !== "results" && !showRunTest && tests && tests.length > 1 && (
        <div
          style={{
            marginTop: "30px",
            borderTop: "1px solid #444",
            paddingTop: "20px",
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={prevTest}
            disabled={currentIndexInList === 0}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              background: "#333",
              color: "white",
              border: "none",
              borderRadius: 4,
              opacity: currentIndexInList === 0 ? 0.5 : 1,
            }}
          >
            ← Prev Test
          </button>
          <button
            onClick={nextTest}
            disabled={currentIndexInList === tests.length - 1}
            style={{
              padding: "8px 16px",
              cursor: "pointer",
              background: "#333",
              color: "white",
              border: "none",
              borderRadius: 4,
              opacity: currentIndexInList === tests.length - 1 ? 0.5 : 1,
            }}
          >
            Next Test →
          </button>
        </div>
      )}
    </div>
  );
}
