import React from "react";

const PsychQuizPlayer = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{ fontSize: "24px", marginBottom: "10px", color: "#1f2937" }}
        >
          Психологический тест
        </h1>
        <p style={{ color: "#6b7280" }}>
          Здесь скоро появится интерфейс прохождения для студентов...
        </p>
      </div>
    </div>
  );
};

export default PsychQuizPlayer;
