<!-- SPDX-License-Identifier: Apache-2.0 -->
# Install from a release zip (Load unpacked)

This page is for installing DuelSight without the Chrome Web Store: before a store listing
exists, in a Chrome setup that cannot use the store, or to learn how to load an extension you
build yourself (**Load unpacked**), for example a [fork for another card game](make-it-yours.md).
It takes a few minutes, and a zip install does not update itself.

> TODO: screenshots. The images that were here showed another extension and were removed. Add
> DuelSight's own for each step below (download, unzip, extensions page, developer mode, load
> unpacked, choose folder, installed, pin, button, hover), then link them here.

1. Open the project's [releases page](https://github.com/ryangswe/duelsight/releases) and, under
   the newest release, download the file named `duelsight-<version>.zip`.

   *TODO: screenshot of the release's Assets.*

2. Unzip it: double-click the file on a Mac, or right-click it and choose **Extract All** on
   Windows. You get a folder named `duelsight-<version>`. Move that folder somewhere it can stay,
   for example your Documents folder. Chrome loads the extension from it each time it starts, so
   do not delete it.

   *TODO: screenshot.*

3. In Chrome, open a new tab, type `chrome://extensions` in the address bar and press Enter.

   *TODO: screenshot.*

4. Turn on **Developer mode**, the switch in the top right corner of that page.

   *TODO: screenshot.*

5. Click **Load unpacked**, the button that appears at the top left.

   *TODO: screenshot.*

6. Choose the `duelsight-<version>` folder from step 2 (the folder itself, not a file inside
   it) and click **Select**.

   *TODO: screenshot.*

7. DuelSight appears in the list. To keep its button in view, click the puzzle-piece icon to the
   right of the address bar, then the pin beside **DuelSight**.

   *TODO: screenshots.*

8. Open a Yu-Gi-Oh! video on YouTube or Twitch, point at the player and click the round
   DuelSight button in its top-right corner to turn card hovers on for that channel. Then rest
   the pointer on a card: its picture appears beside it (see [Using DuelSight](using.md)).

   *TODO: screenshots.*

Chrome may show a notice about extensions in developer mode when it starts. That is normal for
an extension installed this way; choose to keep it.

To update without losing your settings, or to remove it, see
[Updating and removing](using.md#updating-and-removing).
