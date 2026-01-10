import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Box,
  Button,
  List,
  ListItem,
  Modal,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import UploadPhotoForm from "./UploadPhotoForm";

export const handleDragEndHelper = (photos, result) => {
  if (!result.destination) return photos;
  const reordered = Array.from(photos);
  const [moved] = reordered.splice(result.source.index, 1);
  reordered.splice(result.destination.index, 0, moved);
  return reordered;
};

export default function AddStudyForm({ open, onClose, onTestAdded }) {
  const [value, setValue] = useState("");
  const [showUploadPhoto, setShowUploadPhoto] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [, setTests] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    setTests((t) => [...t, { id: Date.now(), text: value.trim() }]);
    setValue("");
  };

  const handleRemovePhoto = (index) => {
    setSelectedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectPhoto = (photo) => {
    setSelectedPhotos((prev) => [...prev, photo]);
  };

  const handleDragEnd = (result) => {
    setSelectedPhotos((prev) => handleDragEndHelper(prev, result));
  };

  const handleSaveTest = async () => {
    if (!value.trim()) return;
    const photoIds = selectedPhotos.map((p) => p.id);
    const payload = { name: value, photoIds };

    try {
      await fetch("http://localhost:8080/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setValue("");
      setSelectedPhotos([]);
      setShowUploadPhoto(false);
      if (onTestAdded) onTestAdded();
      onClose();
    } catch (error) {
      console.error("Error saving test:", error);
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="add-test-modal">
      <Paper
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          p: 4,
          width: "80%",
          height: "80vh",
          outline: "none",
          background: "#1f1d1eff",
          color: "white",
          overflowY: "auto",
        }}
      >
        <h2>Add Test</h2>
        <form onSubmit={handleAdd}>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              sx={{ color: "white" }}
              fullWidth
              label="Test name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd(e)}
              slotProps={{
                inputLabel: {
                  style: { color: "#ccc" },
                },
                input: {
                  sx: {
                    color: "white",
                    backgroundColor: "#2c2a2d",
                  },
                },
              }}
            />
          </Box>
        </form>

        {selectedPhotos.length > 0 && (
          <Box>
            <Typography sx={{ mb: 1, color: "white" }}>
              Selected Photos:
            </Typography>
            <Box sx={{ maxHeight: "50vh", overflowY: "auto", mb: 2 }}>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="photos">
                  {(provided) => (
                    <List
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        backgroundColor: "#2c2a2d",
                        borderRadius: 2,
                        p: 2,
                      }}
                    >
                      {selectedPhotos.map((photo, index) => (
                        <Draggable
                          key={photo.id}
                          draggableId={photo.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <ListItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                bgcolor: "#1f1d1eff",
                                mb: 1,
                                borderRadius: 1,
                                color: "white",
                                cursor: "grab",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                px: 2,
                              }}
                            >
                              <Box
                                component="img"
                                src={`data:image/png;base64,${photo.base64Data}`}
                                alt={photo.name}
                                sx={{
                                  width: "80px",
                                  height: "80px",
                                  borderRadius: "8px",
                                  objectFit: "contain",
                                  backgroundColor: "#2c2a2d",
                                  padding: "4px",
                                }}
                              />
                              <Typography sx={{ color: "white", fontSize: 14 }}>
                                {photo.name}
                              </Typography>

                              <Button
                                variant="contained"
                                onClick={() => handleRemovePhoto(index)}
                                sx={{
                                  mt: "auto",
                                  bgcolor: "#870404ff",
                                  "&:hover": { bgcolor: "#670909ff" },
                                }}
                              >
                                delete
                              </Button>
                            </ListItem>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </List>
                  )}
                </Droppable>
              </DragDropContext>
            </Box>
          </Box>
        )}

        <UploadPhotoForm
          open={showUploadPhoto}
          onClose={() => setShowUploadPhoto(false)}
          onSelectDatabasePhoto={handleSelectPhoto}
          onUploadSuccess={(uploadedPhoto) => {
            setSelectedPhotos((prev) => [...prev, uploadedPhoto]);
            setShowUploadPhoto(false);
          }}
        />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "200px",
          }}
        >
          <Button
            variant="contained"
            onClick={() => setShowUploadPhoto(true)}
            sx={{
              bgcolor: "#385B6F",
              "&:hover": { bgcolor: "#284352ff" },
              width: "100%",
            }}
          >
            Add photo
          </Button>

          <Button
            variant="contained"
            type="submit"
            onClick={handleSaveTest}
            sx={{
              bgcolor: "#870404ff",
              "&:hover": { bgcolor: "#670909ff" },
              width: "100%",
            }}
          >
            Save test
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
}
