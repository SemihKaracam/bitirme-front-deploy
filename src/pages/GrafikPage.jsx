import React from "react";
import { Chart as ChartJS, defaults } from "chart.js/auto";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import "../App.css";
import revenueData from "../data/revenueData.json";
import sourceData from "../data/sourceData.json";
import { useNavigate } from "react-router-dom";
import grafik1 from "../assets/grafik1.jpg"
import grafik2 from "../assets/grafik2.jpg"
import grafik3 from "../assets/grafik3.jpg"
import grafik4 from "../assets/grafik4.jpg"
import grafik5 from "../assets/grafik5.jpg"
defaults.maintainAspectRatio = false;
defaults.responsive = true;

defaults.plugins.title.display = true;
defaults.plugins.title.align = "start";
defaults.plugins.title.font.size = 20;
defaults.plugins.title.color = "black";

const GrafikPage = () => {
  const handleNavigate = () => {
    navigate("/")
  }
  const navigate = useNavigate()

  return (
    <div className="grafik-page">
      <button onClick={handleNavigate} className="upload-btn">Test Ekranı</button>
      <h3>Modelin Performans Çıktıları</h3>
      <div className="grafik-grid-list">
        <div className="grafik-grid-element el1 shadow p-4 bg-body rounded">
          <img className="w-100 h-100" src={grafik1} alt="" />
        </div>
        <div className="grafik-grid-element el2 shadow p-4 bg-body rounded">
          <img className="w-100 h-100" src={grafik5} alt="" />
        </div>
        <div className="grafik-grid-element el3 shadow p-4 bg-body rounded">
          <img className="w-100 h-100" src={grafik4} alt="" />
        </div>
        <div className="grafik-grid-element el4 shadow p-4 bg-body rounded">
          <img className="w-100 h-100" src={grafik2} alt="" />
        </div>
        <div className="grafik-grid-element el5 shadow p-4 bg-body rounded">
          <img className="w-100 h-100" src={grafik3} alt="" />
        </div>
      </div>
    </div>
  );
};

export default GrafikPage