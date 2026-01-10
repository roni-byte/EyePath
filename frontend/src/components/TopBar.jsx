import { AppBar, Box, Button, Toolbar } from "@mui/material";
import logo from "../images/eyeLogo.png";

export default function TopBar({ onAddTest, onViewTests }) {
  return (
    <AppBar position="static" color="inherit" className="top-bar">
      <Toolbar>
        <Button className="image-button">
          <img src={logo} alt="Logo" className="logo" />
          EyePath
        </Button>
        <Box className="separator" />
        <Button
          className="top-bar-button"
          variant="contained"
          color="primary"
          onClick={onAddTest}
        >
          Add Test
        </Button>
        <Button
          className="top-bar-button"
          variant="contained"
          color="secondary"
          onClick={onViewTests}
        >
          View Tests
        </Button>
      </Toolbar>
    </AppBar>
  );
}
