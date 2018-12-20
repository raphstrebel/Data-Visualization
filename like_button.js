'use strict';

import ResponsiveRadar from '@nivo/radar'

// make sure parent container have a defined height when using responsive component,
// otherwise height will be 0 and no chart will be rendered.
// website examples showcase many properties, you'll often use just a few of them.
render((
    <ResponsiveRadar
        data={[
  {
    "taste": "fruity",
    "chardonay": 45,
    "carmenere": 58,
    "syrah": 43
  },
  {
    "taste": "bitter",
    "chardonay": 73,
    "carmenere": 35,
    "syrah": 61
  },
  {
    "taste": "heavy",
    "chardonay": 67,
    "carmenere": 30,
    "syrah": 27
  },
  {
    "taste": "strong",
    "chardonay": 118,
    "carmenere": 94,
    "syrah": 55
  },
  {
    "taste": "sunny",
    "chardonay": 93,
    "carmenere": 38,
    "syrah": 99
  }
]}
        keys={[
            "chardonay",
            "carmenere",
            "syrah"
        ]}
        indexBy="taste"
        maxValue="auto"
        margin={{
            "top": 70,
            "right": 80,
            "bottom": 40,
            "left": 80
        }}
        curve="catmullRomClosed"
        borderWidth={2}
        borderColor="inherit"
        gridLevels={5}
        gridShape="circular"
        gridLabelOffset={36}
        enableDots={true}
        dotSize={8}
        dotColor="inherit"
        dotBorderWidth={0}
        dotBorderColor="#ffffff"
        enableDotLabel={true}
        dotLabel="value"
        dotLabelYOffset={-12}
        colors="nivo"
        colorBy="key"
        fillOpacity={0.1}
        animate={true}
        motionStiffness={90}
        motionDamping={15}
        isInteractive={true}
        legends={[
            {
                "anchor": "top-left",
                "direction": "column",
                "translateX": -50,
                "translateY": -40,
                "itemWidth": 80,
                "itemHeight": 20,
                "itemTextColor": "#999",
                "symbolSize": 12,
                "symbolShape": "circle",
                "effects": [
                    {
                        "on": "hover",
                        "style": {
                            "itemTextColor": "#000"
                        }
                    }
                ]
            }
        ]}
    />
), document.getElementById('chart'))
