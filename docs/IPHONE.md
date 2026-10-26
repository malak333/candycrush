# Install and check Sugar Spell on iPhone

Open https://malak333.github.io/candycrush/ in Safari while online. Wait for **Ready for offline play**. Choose **Share → Add to Home Screen → Add**. Enable **Open as Web App** if offered. Repeat on every device. [Apple's Safari guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios) explains where the controls appear.

## Device acceptance

1. Launch the Home Screen icon. Confirm the game fills its app window and its title and controls are readable.
2. Tap two adjacent candies and try a swipe. Confirm the board fits and page scrolling works outside it.
3. Make a scoring match; note score and remaining moves. Close and reopen. Confirm the board and score return.
4. After **Ready for offline play**, turn on Airplane Mode. Fully close and reopen. Make a move, restart a level, and open the map.
5. Reconnect. Toggle sound after interacting with the game; check mute. Background and return; resume the pause screen.
6. When a new build is offered, finish the current move and tap **Update game**. Confirm progress remains.

Record the model, iOS version, and pass/fail results for each real device. Automated WebKit tests supplement these checks but do not prove physical installation.

## Saves and updates

Each device/browser context has separate local saves. No cloud backup is provided. Private browsing, clearing website data, uninstalling, storage pressure, or device policies may remove local data. If saving is unavailable, progress may last only until the session ends.

Updates download in the background, then wait for the player to accept them. A first installation needs all files to download successfully. If readiness does not appear, stay online, reload, and retry. An offline first visit cannot work.

If an old build remains, reconnect, close other Sugar Spell windows, and reopen. Clearing website data also removes saves; use it only as a last resort.
