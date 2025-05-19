# Bulk Steam Nickname Userscript

Userscript to bulk set Steam nicknames, with an optional prefix.

### Installation
1. Install TamperMonkey for your browser
    - [Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
    - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
    - [Oprea](https://addons.opera.com/en/extensions/details/tampermonkey-beta/)
1. **Chrome and Opera Only** - Enable Developer Mode in Extension Settings
    - Go to Extension Settings for your browser (Or paste `chrome://extensions/` into URL bar)
    - Enable "Developer Mode" (toggle switch on top right)
1. Automatically install using the "Install" button at this link: [https://raw.githubusercontent.com/jxtt-dev/bulk_steam_nickname/refs/heads/main/index.user.js](https://raw.githubusercontent.com/jxtt-dev/bulk_steam_nickname/refs/heads/main/index.user.js)

If automatic install does not work:
1. Copy source from [here](https://github.com/jxtt-dev/bulk_steam_nickname/blob/main/index.user.js)
1. Open Tampermonkey in your browser and click the Add Script tab (icon with a plus symbol)
1. Paste the source into the script window and hit save

Use Chrome for best results

### Usage
1. Open your account's [friend management page](https://steamcommunity.com/friends) in your browser
1. Open the popup using the green "Bulk Nickname" button on the top right of the page
1. Fill in the SteamID and the associated Nickname fields for each user
    - To clear a users nickname, leave the Nickname field blank
1. Use the "Add Row" button to add more users to the list
1. Optionally enter a prefix for all nicknames
1. Use the "Apply" button to apply Nicknames (and prefixes) to all users in the table

<img src="https://github.com/jxtt-dev/bulk_steam_nickname/blob/main/images/example.jpg" width="300">

#### Importing/Exporting CSV
- To share your nickname list with someone else, simply fill out the table and press "Copy as CSV"
- To import a nickname list, paste CSV data into the text field at the bottom of the popup and press "Submit CSV"

<img src="https://github.com/jxtt-dev/bulk_steam_nickname/blob/main/images/csv_example.gif" width="300">
