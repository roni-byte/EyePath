import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import logo from "../images/eyeLogo.png";

export default function LogoAnimation() {
  const [animateLogo, setAnimateLogo] = useState(false);
  const [hideLogo, setHideLogo] = useState(false);

  useEffect(() => {
    const moveTimer = setTimeout(() => setAnimateLogo(true), 300);
    const hideTimer = setTimeout(() => setHideLogo(true), 2500);

    return () => {
      clearTimeout(moveTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (hideLogo) return null;

  return (
    <motion.img
      src={logo}
      alt="Logo"
      className="animated-logo"
      initial={{
        x: 0,
        y: 0,
        scale: 2,
        opacity: 1,
        top: "50%",
        left: "50%",
        translateX: "-50%",
        translateY: "-50%",
        position: "absolute",
      }}
      animate={
        animateLogo
          ? {
              top: "2px",
              left: "39px",
              scale: 0.6,
              opacity: 1,
              translateX: 0,
              translateY: 0,
              position: "absolute",
            }
          : {}
      }
      transition={{
        duration: 1.8,
        ease: [0.45, 0, 0.55, 1],
      }}
    />
  );
}
