import { useState, useCallback, useEffect, useRef } from "react";
import "./App.css";

const STEPS = {
  inicio: {
    id: "inicio",
    texto: "¿Quieres saber de que trata esto?",
    imagen: "/img/feliz.jpg",
    si: "pregunta2",
  },
  pregunta2: {
    id: "pregunta2",
    texto: "¿Realmente quieres saber?",
    imagen: "/img/feliz2.jpg",
    si: "pregunta3",
  },
  pregunta3: {
    id: "pregunta3",
    texto: "¿Crees que esto termine bien?",
    imagen: "/img/feliz3.jpg",
    si: "finalFeliz",
  },
  // Este paso ahora funciona como el "Modo Chantaje" activado por el botón NO
  persuasion: {
    id: "persuasion",
    texto: "¡Grosero!... Mira la carita de este perrito, sé que quieres decir que sí 🥺",
    imagen: "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?q=80&w=600&auto=format&fit=crop",
    si: null, // Regresará dinámicamente al paso donde se quedó
  },
  finalFeliz: {
    id: "finalFeliz",
    texto: `El consumidor olvidará lo que dijiste,
    pero jamás olvidará lo que le has hecho sentir
    (Eric Kandel)`,    
    imagen: "/img/video.gif",     
    isCarta: true, 
    si: null,
  },
};

const MARGIN  = 20; 
const BTN_W   = 90; 
const BTN_H   = 44; 
const FLEE_R  = 200; 

function calculateEscurridizoPosition(mx, my, bx, by) {
  const dist = Math.hypot(bx - mx, by - my) || 1; 

  const dx = (bx - mx) / dist;
  const dy = (by - my) / dist;

  const forceMultiplier = FLEE_R / dist;
  const fleeDistX = dx * forceMultiplier;
  const fleeDistY = dy * forceMultiplier;

  let newLeft = bx + fleeDistX - BTN_W / 2;
  let newTop = by + fleeDistY - BTN_H / 2;

  const minX = MARGIN;
  const maxX = window.innerWidth - BTN_W - MARGIN;
  const minY = MARGIN;
  const maxY = window.innerHeight - BTN_H - MARGIN;

  const distToRincX = Math.min(Math.abs(newLeft - minX), Math.abs(newLeft - maxX));
  const distToRincY = Math.min(Math.abs(newTop - minY), Math.abs(newTop - maxY));

  if (dist < 50 && distToRincX < 10 && distToRincY < 10) {
    newLeft = minX + Math.random() * (maxX - minX);
    newTop = minY + Math.random() * (maxY - minY);
  } else {
    newLeft = Math.max(minX, Math.min(maxX, newLeft));
    newTop = Math.max(minY, Math.min(maxY, newTop));
  }

  return { left: newLeft, top: newTop };
}

export default function App() {
  const [currentId,  setCurrentId]  = useState("inicio");
  const [prevSiId,   setPrevSiId]   = useState(null); // Guarda el paso para saber a dónde avanzar al presionar Sí
  const [noPos,      setNoPos]      = useState(null); 
  const [noClicks,   setNoClicks]   = useState(0);    // Cuenta cuántas veces han logrado clickear el "No"

  const noPosRef = useRef(null);
  const isFinal      = currentId === "finalFeliz";
  const isPersuasion = currentId === "persuasion";
  const step = STEPS[currentId];

  useEffect(() => { noPosRef.current = noPos; }, [noPos]);

  useEffect(() => {
    if (isFinal) return; 

    const onMove = (e) => {
      const pos = noPosRef.current;
      if (!pos) return; 

      const mx = e.clientX; 
      const my = e.clientY; 
      const bx = pos.left + BTN_W / 2; 
      const by = pos.top  + BTN_H / 2; 
      const dist = Math.hypot(mx - bx, my - by); 

      if (dist < FLEE_R) {
        setNoPos(calculateEscurridizoPosition(mx, my, bx, by));
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [isFinal]);

  const handleNoFirstTouch = useCallback((e) => {
    if (noPos) return; 

    const rect = e.currentTarget.getBoundingClientRect();
    const bx = rect.left + rect.width / 2;
    const by = rect.top + rect.height / 2;

    const mx = e.clientX ?? e.touches?.[0]?.clientX ?? window.innerWidth / 2;
    const my = e.clientY ?? e.touches?.[0]?.clientY ?? window.innerHeight / 2;

    setNoPos(calculateEscurridizoPosition(mx, my, bx, by));
  }, [noPos]);

  const handleSi = () => {
    // Si estamos en modo persuasión/perrito, avanzamos al paso que le correspondía a la pregunta original
    const target = isPersuasion ? prevSiId : step.si;
    if (!target) return;
    
    setCurrentId(target);
    setNoPos(null);
    setNoClicks(0); // Reiniciamos el tamaño del botón para la siguiente pregunta
    setPrevSiId(null);
  };

  const handleNoClick = () => {
    // SOLO SI LOGRAN DARLE CLICK AL BOTÓN "NO":
    const nuevosClicks = noClicks + 1;
    setNoClicks(nuevosClicks);
    
    // Si no estábamos ya en persuasión, guardamos a dónde iba a mandar el "Sí" de esta pregunta
    if (!isPersuasion) {
      setPrevSiId(step.si);
    }
    
    // Cambiamos la tarjeta al perrito triste de persuasión
    setCurrentId("persuasion");
    setNoPos(null); // Reseteamos la posición fija para que vuelva a aparecer dentro de la fila
  };

  const noStyle = noPos
    ? { 
        position: "fixed", 
        left: noPos.left, 
        top: noPos.top, 
        zIndex: 9999, 
        transition: "left 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28), top 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)" 
      }
    : {};

  // 📈 El tamaño del botón SÍ crece un 40% cada vez que logran clickear el "No"
  const siScale = 1 + noClicks * 0.4;
  const siStyle = {
    transform: `scale(${siScale})`,
    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    padding: `${14 + noClicks * 3}px ${28 + noClicks * 6}px`
  };

  return (
    <div className="app-wrapper">
      <div className={`card ${step.isCarta ? "card-fullscreen" : ""}`}>

        <div className="img-container">
          <img src={step.imagen} alt="ilustración" className="step-img" key={currentId} />
        </div>

        {!step.isCarta && (
          <p className={`step-text${isPersuasion ? " persuasion-text" : ""}`} key={currentId + "t"}>
            {step.texto}
          </p>
        )}

        {!isFinal && (
          <div className="buttons-row">
            <button className="btn btn-si" style={siStyle} onClick={handleSi}>
              Sí 
            </button>

            <button
              className="btn btn-no"
              style={noStyle}
              onMouseEnter={handleNoFirstTouch}
              onTouchStart={handleNoFirstTouch}
              onClick={handleNoClick}
            >
              No
            </button>
          </div>
        )}

        {isFinal && !step.isCarta && (
          <div className="final-badge"></div>
        )}
      </div>
    </div>
  );
}