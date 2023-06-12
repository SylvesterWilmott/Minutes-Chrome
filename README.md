# Minutes

![Chrome Web Store](https://img.shields.io/chrome-web-store/v/cnhcpioojeefngdncobkfiigpeieombo)
![Chrome Web Store](https://img.shields.io/chrome-web-store/users/cnhcpioojeefngdncobkfiigpeieombo)

Minutes is a Chrome Extension time tracker that automatically pauses itself when you're idle.

## Installation

1. Download and unzip the zip file.
2. In Google Chrome, go to the extensions page by entering `chrome://extensions/` in the address bar.
3. Enable Developer Mode.
4. Click on the `Load Unpacked` button and select the folder where you unzipped the extension.

## Build

To build the project, follow these steps:

1. `npm install` to install the necessary dependencies.
2. Update `version` in `manifest.json`.
3. `npm run build`.

## Usage

Once the extension is installed, you can access it by clicking on the icon in the Chrome toolbar.

- Press `New Session` or use the global shortcut `Command/Ctrl+Shift+P` to start a new session.
- The extension will automatically track your active and idle time.
- Press `End Session` to complete your session.
- Information about past sessions can be viewed by pressing `Session Logs`
