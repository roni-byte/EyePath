import { Box } from "@mui/material";
import { useEffect, useState } from "react";

import AddStudyForm from "./components/AddStudyForm";
import LogoAnimation from "./components/LogoAnimation";
import StudyList from "./components/StudyList";
import StudyViewer from "./components/StudyViewer";
import TopBar from "./components/TopBar";
import "./styles.css";

export default function App() {
  const [showAddTest, setShowAddTest] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [tests, setTests] = useState([]);

  const fetchTests = () => {
    fetch("http://localhost:8080/api/tests")
      .then((res) => res.json())
      .then(setTests)
      .catch((err) => console.error("Error fetching tests:", err));
  };

  useEffect(() => {
    fetchTests();
  }, []);

  return (
    <div>
      <LogoAnimation />

      <TopBar
        onAddTest={() => setShowAddTest(true)}
        onViewTests={() => setSelectedTestId(null)}
      />

      <Box className="line" />

      <div className="content">
        {!selectedTestId ? (
          <StudyList tests={tests} onSelectTest={setSelectedTestId} />
        ) : (
          <StudyViewer
            testId={selectedTestId}
            onBack={() => setSelectedTestId(null)}
            tests={tests}
            setSelectedTestId={setSelectedTestId}
          />
        )}
      </div>

      <AddStudyForm
        open={showAddTest}
        onClose={() => setShowAddTest(false)}
        onTestAdded={fetchTests}
      />
      <video
        id="video"
        autoPlay
        playsInline
        style={{ display: "none" }}
        width="640"
        height="480"
      />
      <div id="status" hidden>
        Initializing...
      </div>
      <div id="error" hidden style={{ color: "red", marginTop: "10px" }}></div>
    </div>
  );
}
