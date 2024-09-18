import { Loader, useTheme } from '@aws-amplify/ui-react';

export const LoaderComponent = () => {
  const { tokens } = useTheme();
  return (
    <>
      <Loader
        variation="linear"
        emptyColor={tokens.colors.black}
        filledColor={tokens.colors.green[40]}
      />
    </>
  );
};