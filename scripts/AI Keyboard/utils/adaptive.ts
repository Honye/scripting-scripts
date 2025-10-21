export function getAdaptiveLayoutParams() {
    const screenWidthPt = Device.isiOSAppOnMac ? 740 : Device.screen.width;
    const minScreenWidth = 320;
    const maxScreenWidth = 450;

    function interpolateValue(currentWidth: number, minWidth: number, maxWidth: number, minValue: number, maxValue: number) {
        if (currentWidth <= minWidth) return minValue;
        if (currentWidth >= maxWidth) return maxValue;
        const ratio = (currentWidth - minWidth) / (maxWidth - minWidth);
        return minValue + ratio * (maxValue - minValue);
    }

    let spacing = interpolateValue(screenWidthPt, minScreenWidth, maxScreenWidth, 4, 7);
    let buttonFontSize = interpolateValue(screenWidthPt, minScreenWidth, maxScreenWidth, 12, 15);
    let footerFontSize = interpolateValue(screenWidthPt, minScreenWidth, maxScreenWidth, 9, 12);
    let footerHeight = interpolateValue(screenWidthPt, minScreenWidth, maxScreenWidth, 18, 24);
    let totalHeight = interpolateValue(screenWidthPt, minScreenWidth, maxScreenWidth, 220, 295);

    spacing = Math.round(spacing);
    buttonFontSize = Math.round(buttonFontSize);
    footerFontSize = Math.round(footerFontSize);
    footerHeight = Math.round(footerHeight);
    totalHeight = Math.round(totalHeight);

    const numKeyRows = 5;
    let keyHeight = (totalHeight - footerHeight - (numKeyRows + 1) * spacing) / numKeyRows;
    keyHeight = Math.round(keyHeight);

    if (keyHeight <= 0) {
        keyHeight = Math.max(buttonFontSize + 10, 35);
    }

    return {
        spacing,
        keyHeight,
        totalHeight,
        buttonFontSize,
        footerFontSize,
        footerHeight
    };
}

export const adaptiveParams = getAdaptiveLayoutParams();
