import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.arepasContability',
  appName: 'ArepasContability',
  webDir: 'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#cb1111ff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: false,
      splashImmersive: false,
      layoutName: "launch_screen",
      useDialog: false,
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: "#d01818ff",
    },
  },
};

export default config;
