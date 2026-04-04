import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isNarrow = width < 390;
  const isShort = height < 780;
  const isCompact = isNarrow || isShort;
  const horizontalPadding = isCompact ? 12 : 16;
  const formPadding = isCompact ? 16 : 24;
  const headerTopPadding = Math.max(insets.top + 8, 40);
  const verticalGap = isShort ? 10 : 14;

  return {
    width,
    height,
    isNarrow,
    isShort,
    isCompact,
    horizontalPadding,
    formPadding,
    headerTopPadding,
    verticalGap,
  };
};
