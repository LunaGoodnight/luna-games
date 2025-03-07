import {
    EnumLandscapeStyle,
    EnumOrientationTypes,
    EnumPortraitStyle,
} from '../types/enum/uiTypes.ts';

export const getPositionByStyle = ({ layoutConfig, app, commonData }) => {
    const windowWidth = app.screen.width;
    const windowHeight = app.screen.height;
    const targetAspectRatio = 9 / 16;
    const screenAspectRatio = windowWidth / windowHeight;

    const landscapeTargetAspectRatio =
        commonData.content.Landscape.aspectRatioWidth /
        commonData.content.Landscape.aspectRatioHeight;

    if (screenAspectRatio > targetAspectRatio) {
        // Screen is wider than the game ratio, fit to height
        if (screenAspectRatio > commonData.content.aspectRatioThreshold) {
            if (screenAspectRatio > landscapeTargetAspectRatio) {
                return {
                    style: EnumLandscapeStyle.Train,
                    dividend: windowHeight,
                    ...layoutConfig.position[EnumOrientationTypes.Landscape][
                        EnumLandscapeStyle.Train
                        ],
                };
            } else {
                return {
                    style: EnumLandscapeStyle.Rectangle,

                    dividend: windowWidth,
                    ...layoutConfig.position[EnumOrientationTypes.Landscape][
                        EnumLandscapeStyle.Rectangle
                        ],
                };
            }
        } else {
            return {
                style: EnumPortraitStyle.Square,

                dividend: windowHeight,
                ...layoutConfig.position[EnumOrientationTypes.Portrait][
                    EnumPortraitStyle.Square
                    ],
            };
        }
    } else {
        // portrait-sword
        // Screen is taller than the game ratio, fit to width
        return {
            style: EnumPortraitStyle.Sword,

            dividend: windowWidth,
            ...layoutConfig.position[EnumOrientationTypes.Portrait][
                EnumPortraitStyle.Sword
                ],
        };
    }
};
