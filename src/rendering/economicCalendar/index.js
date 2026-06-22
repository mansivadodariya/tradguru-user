"use client";
import React, { useEffect, useRef } from "react";
import styles from "./economicCalendar.module.scss";
import { useTheme } from "@/context/ThemeContext";

export default function EconomicCalendar() {
  const widgetContainerRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      isTransparent: true,
      locale: "en",
      countryFilter: "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
      importanceFilter: "-1,0,1",
      width: "100%",
      height: "640",
    });

    if (widgetContainerRef.current) {
      widgetContainerRef.current.appendChild(script);
    }

    return () => {
      if (widgetContainerRef.current) {
        widgetContainerRef.current.innerHTML = "";
      }
    };
  }, [theme]);

  return (
    <section className={styles.economicCalendar}>
      <div className={styles.header}>
        <h1>Economic Calendar</h1>
        <p>
          Track global market-moving events in real time and plan your trades around key macro releases.
        </p>
      </div>

      <div className={styles.widgetCard}>
        <div className="tradingview-widget-container" ref={widgetContainerRef}>
          <div className="tradingview-widget-container__widget" />
          <div className="tradingview-widget-copyright">
            <a href="https://www.tradingview.com/economic-calendar/" rel="noopener nofollow" target="_blank">
              Economic Calendar by TradingView
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
