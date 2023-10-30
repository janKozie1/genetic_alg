import { Global } from "@emotion/react";
import CoreProvider from "./components/organisms/CoreProvider";
import Main from "./components/organisms/Main";
import SettingsProvider from "./components/organisms/SettingsProvider";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import globalStyles from "./settings/globalStyles";
import GeneticsProvider from "./components/organisms/GeneticsProvider";

function App() {
  return (
    <>
      <Global styles={globalStyles} />
      <SettingsProvider>
        <CoreProvider>
          <GeneticsProvider>
            <Main />
          </GeneticsProvider>
        </CoreProvider>
      </SettingsProvider>
    </>
  );
}

export default App;
