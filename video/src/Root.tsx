import React from "react";
import { Composition } from "remotion";
import { B1Title } from "./B1Title";
import { B2Flow } from "./B2Flow";
import { B3Callbacks } from "./B3Callbacks";
import { B4End } from "./B4End";

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="B1Title"
        component={B1Title}
        durationInFrames={120}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="B2Flow"
        component={B2Flow}
        durationInFrames={300}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="B3Callbacks"
        component={B3Callbacks}
        durationInFrames={240}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="B4End"
        component={B4End}
        durationInFrames={150}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
