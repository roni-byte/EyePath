import { Box, Modal, Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";

export default function UploadPhotoForm({
  open,
  onClose,
  onSelectDatabasePhoto,
}) {
  const [items, setItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [, setMessage] = useState("");
  const [invalidFile, setInvalidFile] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("http://localhost:8080/api/tests/photos")
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setItems(data);
        })
        .catch((error) => {
          console.error("Failed to fetch photos:", error);
        });
    }
  }, [open]);

  const handleClick = (item) => {
    if (onSelectDatabasePhoto) {
      onSelectDatabasePhoto(item);
    }
    onClose();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== "image/png") {
      setInvalidFile(true);
      event.target.value = null;
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("No file selected");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8080/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

      const photo = await response.json();
      onSelectDatabasePhoto(photo);
      setMessage("File uploaded or found in database.");
      setSelectedFile(null);
      onClose();
    } catch (error) {
      console.error("Error uploading file:", error);
      setMessage("Error uploading file");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Paper
        sx={{
          p: 4,
          width: "60%",
          height: "80vh",
          bgcolor: "#1f1d1eff",
          color: "white",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          textAlign: "center",
          overflowY: "auto",
        }}
      >
        <Typography
          component="label"
          variant="h6"
          sx={{
            cursor: "pointer",
            fontWeight: 500,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          From Device
          <input
            data-testid="file-input"
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </Typography>
        {invalidFile && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Invalid file type<br></br>
            Only PNG files are allowed
          </Typography>
        )}
        {selectedFile && previewUrl && (
          <Box>
            <Paper
              onClick={handleUpload}
              sx={{
                display: "inline-block",
                cursor: "pointer",
                textAlign: "center",
                bgcolor: "#2c2a2d",
                color: "white",
                p: 1,
                borderRadius: 2,
                "&:hover": { bgcolor: "#385B6F" },
                margin: 1,
              }}
            >
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: "200px",
                  height: "auto",
                  objectFit: "contain",
                  backgroundColor: "#3b363a",
                  borderRadius: "6px",
                  margin: "0 auto",
                }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {selectedFile.name}
              </Typography>
            </Paper>
          </Box>
        )}
        <Box
          sx={{
            width: "100%",
            height: "2px",
            backgroundColor: "#830000ff",
            opacity: 0.7,
            borderRadius: "0.5px",
            my: 2,
          }}
        />
        <Typography
          variant="h6"
          sx={{ mb: 1, fontFamily: "Roboto, sans-serif" }}
        >
          From Database
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: 2,
            backgroundColor: "#2c2a2d",
            borderRadius: 2,
            p: 2,
          }}
        >
          {items.map((photo) => (
            <Paper
              key={photo.id}
              onClick={() => handleClick(photo)}
              sx={{
                cursor: "pointer",
                textAlign: "center",
                bgcolor: "#3b363a",
                color: "white",
                p: 1,
                borderRadius: 2,
                "&:hover": { bgcolor: "#385B6F" },
              }}
            >
              <img
                src={`data:image/png;base64,${photo.base64Data}`}
                alt={photo.name}
                style={{
                  width: "100%",
                  height: "100px",
                  objectFit: "contain",
                  backgroundColor: "#2c2a2d",
                  borderRadius: "6px",
                }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {photo.name}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Paper>
    </Modal>
  );
}
