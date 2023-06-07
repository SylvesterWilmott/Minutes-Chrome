# Minutes

![Chrome Web Store](https://img.shields.io/chrome-web-store/v/cnhcpioojeefngdncobkfiigpeieombo)
![Chrome Web Store](https://img.shields.io/chrome-web-store/users/cnhcpioojeefngdncobkfiigpeieombo)

Minutes is a Chrome Extension time tracker that automatically pauses itself when you're idle.

## Installation

1. Download and uncompress zip.
2. In Chrome, go to the extensions page at `chrome://extensions/`.
3. Enable Developer Mode.
4. Choose `Load Unpacked` and select the folder.

## Build

1. `npm install` to install the necessary dependencies.
2. Update `version` in `manifest.json`.
3. `npm run build`.

To build for serapate targets:

```
npm run build chrome
```
```
npm run build edge
```

## Usage

Once installed, you can access the extension by clicking the icon in the Chrome toolbar.

- Press `New Session` or use the global shortcut `Command/Ctrl+Shift+P` to start a new session.
- Your active and idle time will be automatically tracked.
- Press `End Session` to complete your session.
- Information about past sessions can be viewed by pressing `Session Logs`