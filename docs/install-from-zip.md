<!-- SPDX-License-Identifier: Apache-2.0 -->
# Install from a release zip (Load unpacked)

Most people should install Kenbunshoku from the [Chrome Web Store](https://chromewebstore.google.com/detail/kenbunshoku/gndfmgcngfebiiiioddngmifddjiiabf): one click, and Chrome keeps it
up to date. This page is for the other cases: a Chrome setup that can't use the Web Store,
trying a release before it reaches the store, or learning how to load an extension you build
yourself (**Load unpacked**), for example a [fork for another card game](make-it-yours.md). It takes a few
minutes, and a zip install does not update itself.

<img src="install/install.gif" alt="Installing Kenbunshoku from the zip, step by step" width="600">

1. Open the project's [releases page](https://github.com/ryangswe/kenbunshoku/releases) and,
   under the newest release, download the file named `kenbunshoku-<version>.zip`.

   <img src="install/step-1-download.png" alt="Download kenbunshoku-0.1.0.zip from Assets on the project's releases page." width="600">

2. Unzip it: double-click the file on a Mac, or right-click it and choose **Extract All** on
   Windows. You get a folder named `kenbunshoku-<version>`. Move that folder somewhere it can stay,
   for example your Documents folder. Chrome loads the extension from it each time it starts, so
   do not delete it.

   <img src="install/step-2-unzip.png" alt="Unzip it. Mac: double-click the zip file. Windows: right-click it, then Extract All." width="600">

3. In Chrome, open a new tab, type `chrome://extensions` in the address bar and press Enter.

   <img src="install/step-3-extensions-page.png" alt="In Chrome, type chrome://extensions in the address bar and press Enter." width="600">

4. Turn on **Developer mode**, the switch in the top right corner of that page.

   <img src="install/step-4-developer-mode.png" alt="Turn on Developer mode, the switch in the top right corner." width="600">

5. Click **Load unpacked**, the button that appears at the top left.

   <img src="install/step-5-load-unpacked.png" alt="Click Load unpacked, the button that appears at the top left." width="600">

6. Choose the `kenbunshoku-<version>` folder from step 2 (the folder itself, not a file inside
   it) and click **Select**.

   <img src="install/step-6-choose-folder.png" alt="Choose the kenbunshoku-0.1.0 folder itself (not a file inside it), then Select." width="600">

7. Kenbunshoku appears in the list. To keep its button in view, click the puzzle-piece icon to
   the right of the address bar, then the pin beside **Kenbunshoku**.

   <img src="install/step-7-installed.png" alt="Kenbunshoku now appears in your list of extensions." width="600">

   <img src="install/step-7b-pin.png" alt="To keep it in view, click the puzzle piece, then the pin beside Kenbunshoku." width="600">

8. Open a One Piece Card Game video on Twitch or YouTube, point at the player and click the round
   eye button in its top-right corner to turn card hovers on for that channel. Then rest the
   pointer on a card: its picture appears beside it (see [Using Kenbunshoku](using.md)).

   <img src="install/step-8-eye-button.png" alt="On a Twitch or YouTube video, point at the player and click the eye button." width="600">

   <img src="install/step-8b-hover.png" alt="Then rest the pointer on a card: its picture appears beside it." width="600">

Chrome may show a notice about extensions in developer mode when it starts. That is normal for
an extension installed this way; choose to keep it.

To update without losing your settings, or to remove it, see
[Updating and removing](using.md#updating-and-removing).
