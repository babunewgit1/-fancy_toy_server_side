import React from "react";
import { Composition } from "remotion";
import { Explainer, TOTAL_FRAMES } from "./Explainer";
import { SalesChart, salesChartDefaults } from "./SalesChart";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="FancyToyExplainer"
      component={Explainer}
      durationInFrames={TOTAL_FRAMES}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="SalesChart"
      component={SalesChart}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={salesChartDefaults}
    />
  </>
);
