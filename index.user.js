// ==UserScript==
// @name         Bulk Steam Nickname
// @namespace    https://github.com/jxtt-dev
// @version      1.0
// @description  Bulk nickname Steam friends
// @author       jxtt-dev
// @homepageURL  https://github.com/jxtt-dev/bulk_steam_nickname
// @homepage     https://github.com/jxtt-dev/bulk_steam_nickname
// @match        https://steamcommunity.com/*/friends*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    // ====== Constants & Config ======

    // SteamID regex
    const STEAM_ID_REGEX = /^\d{17}$/;
    const REQUEST_DELAY = 1500; // Delay between API requests in ms

    // UI text constants
    const UI_TEXT = {
        TITLE: 'Bulk Steam Nickname',
        SUBTITLE: 'Nicknames are set even if you aren\'t friends with the user',
        PREFIX_LABEL: 'Nickname prefix:',
        ADD_ROW: 'Add Row',
        SUBMIT_CSV: 'Submit CSV',
        APPLY: 'Apply',
        EXPORT_CSV: 'Copy as CSV',
        CLOSE: 'Close',
        CSV_PLACEHOLDER: 'Paste CSV data here (steamId,nickname)',
        LOADING: '⌛',
        SUCCESS: '✅',
        ERROR: '❌'
    };

    // Colors
    const COLORS = {
        DARK_BLUE_BORDER: '#3b4751',
        DARK_HEADER_BG: '#2a475e',
        WHITE_TEXT: '#fff',
        DARK_TABLE_BG: '#1b2838',
        LIGHT_GRAYISH_BLUE_TEXT: '#c6d4df',
        VERY_DARK_BLUE_POPUP_BG: '#171a21',
        DARK_GREEN: '#568203',
        BOX_SHADOW: 'rgba(0, 0, 0, 0.5)',
        ERROR_RED: '#e74c3c'
    };

    // ====== State Management ======

    // Nickname data with default empty item
    let nicknameData = GM_getValue('nicknameData', [{ steamId: '', nickname: '' }]);
    let popupElement = null;

    // ====== Styles ======

    // Add CSS styles
    GM_addStyle(`
        #bsn_popupButton {
            position: fixed;
            top: 60px;
            right: 20px;
            padding: 10px 15px;
            background-color: ${COLORS.DARK_GREEN};
            color: ${COLORS.WHITE_TEXT};
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1001;
            transition: background-color 0.2s;
        }
        #bsn_popupButton:hover {
            background-color: #6ca104;
        }
        #bsn_popupContainer {
            position: fixed;
            top: 110px;
            right: 20px;
            background-color: ${COLORS.VERY_DARK_BLUE_POPUP_BG};
            padding: 20px;
            border: 1px solid ${COLORS.DARK_BLUE_BORDER};
            box-shadow: 0 4px 8px ${COLORS.BOX_SHADOW};
            z-index: 1000;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            width: auto;
            max-width: 600px;
        }
        #bsn_titleText {
            margin-bottom: 10px;
            color: ${COLORS.WHITE_TEXT};
            font-size: 16px;
        }
        #bsn_subtitleText {
            margin: 0 0 5px 0;
            color: ${COLORS.WHITE_TEXT};
            width: 375px;
            font-size: 12px;
        }
        #bsn_prefixContainer {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            justify-content: space-between;
            width: 100%;
        }
        #bsn_prefixLabel {
            color: ${COLORS.WHITE_TEXT};
            margin-right: 5px;
        }
        #bsn_prefixInput {
            width: 60%;
            box-sizing: border-box;
            color: ${COLORS.LIGHT_GRAYISH_BLUE_TEXT};
            background-color: ${COLORS.DARK_HEADER_BG};
            border: none;
            padding: 5px;
            border-radius: 3px;
        }
        #bsn_table {
            border-collapse: collapse;
            width: 100%;
            max-width: 600px;
            max-height: 300px;
            overflow-y: auto;
            display: block;
            background-color: ${COLORS.DARK_TABLE_BG};
            color: ${COLORS.LIGHT_GRAYISH_BLUE_TEXT};
            border: none;
        }
        #bsn_table th {
            border-bottom: 1px solid ${COLORS.DARK_BLUE_BORDER};
            padding: 8px;
            background-color: ${COLORS.DARK_HEADER_BG};
            color: ${COLORS.WHITE_TEXT};
            position: sticky;
            top: 0;
            z-index: 1;
            text-align: left;
        }
        #bsn_table td {
            border-bottom: 1px solid ${COLORS.DARK_BLUE_BORDER};
            padding: 8px;
        }
        #bsn_rowNumCell {
            padding: 8px;
            border-bottom: 1px solid ${COLORS.DARK_BLUE_BORDER};
        }
        .bsn_rowInput {
            width: 100%;
            box-sizing: border-box;
            color: ${COLORS.LIGHT_GRAYISH_BLUE_TEXT};
            background-color: ${COLORS.VERY_DARK_BLUE_POPUP_BG};
            border: none;
            padding: 5px;
            border-radius: 3px;
        }
        .bsn_rowInput:focus {
            outline: 1px solid ${COLORS.DARK_GREEN};
        }
        .bsn_rowInput.invalid {
            outline: none;
            border: 2px solid ${COLORS.ERROR_RED};
        }
        .bsn_button {
            padding: 5px 10px;
            color: ${COLORS.WHITE_TEXT};
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .bsn_green_button {
            background-color: ${COLORS.DARK_GREEN};
        }
        .bsn_blue_button {
            background-color: ${COLORS.DARK_HEADER_BG};
        }
        .bsn_green_button:hover {
            background-color: #6ca104;
        }
        .bsn_blue_button:hover {
            background-color: #3a5f7d;
        }
        #bsn_removeUserButton {
            background-color: ${COLORS.DARK_HEADER_BG};
            color: ${COLORS.WHITE_TEXT};
            border: none;
            border-radius: 5px;
            cursor: pointer;
            display: block;
            transition: background-color 0.2s;
        }
        #bsn_removeUserButton:hover {
            background-color: #c0392b;
        }
        #bsn_addRowButton {
            margin: 10px auto 0 auto;
            padding: 3px 10px;
        }
        #bsn_errorMessageContainer {
            color: ${COLORS.ERROR_RED};
            text-align: center;
            margin: 10px 0;
            width: 100%;
            max-width: 375px;
            min-height: 20px;
        }
        #bsn_csvInputContainer {
            display: flex;
            align-items: flex-end;
            width: 100%;
            margin: 10px 0;
        }
        #bsn_csvInputArea {
            flex-grow: 1;
            margin-right: 10px;
            padding: 5px;
            background-color: ${COLORS.DARK_HEADER_BG};
            color: ${COLORS.LIGHT_GRAYISH_BLUE_TEXT};
            border: 1px solid ${COLORS.DARK_BLUE_BORDER};
            border-radius: 3px;
            resize: vertical;
        }
        #bsn_bottomButtonContainer {
            display: flex;
            justify-content: space-between;
            width: 100%;
            margin-top: 10px;
        }
        #bsn_statusContainer {
            font-size: 14px;
            text-align: center;
        }
        .bsn_spinner {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 2px solid ${COLORS.LIGHT_GRAYISH_BLUE_TEXT};
            border-radius: 50%;
            border-top-color: transparent;
            animation: bsn-spin 750ms linear infinite;
        }
        @keyframes bsn-spin {
            to {
                transform: rotate(360deg);
            }
        }
    `);

    // ====== Helper Functions ======

    /**
     * Get the session ID from the page
     * @returns {string|null} Steam session ID or null if not found
     */
    function getSessionID() {
        if (typeof unsafeWindow.g_sessionID !== 'undefined') {
            return unsafeWindow.g_sessionID;
        }
        return null;
    }

    /**
     * Show an error message in the container
     * @param {string} message - Error message to display
     */
    function showError(message) {
        const errorContainer = document.getElementById('bsn_errorMessageContainer');
        if (errorContainer) {
            errorContainer.textContent = message;
        }
    }

    /**
     * Validate a Steam ID
     * @param {string} steamId - Steam ID to validate
     * @returns {boolean} True if valid, false otherwise
     */
    function isValidSteamId(steamId) {
        return STEAM_ID_REGEX.test(steamId);
    }

    /**
     * Renumber table rows
     * @param {HTMLTableSectionElement} tbody - Table body element
     */
    function renumberRows(tbody) {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const rowNumCell = row.cells[0];
            if (rowNumCell) {
                rowNumCell.textContent = index + 1;
            }
        });
    }

    /**
     * Send request to set a Steam nickname
     * @param {string} sessionid - Steam session ID
     * @param {string} steamId - Steam ID to set nickname for
     * @param {string} nickname - Nickname to set
     * @returns {Promise<string>} Promise resolving to response text
     */
    function setSteamNickname(sessionid, steamId, nickname) {
        return new Promise((resolve, reject) => {
            const ajaxSetNicknameURL = `https://steamcommunity.com/profiles/${steamId}/ajaxsetnickname/`;

            GM_xmlhttpRequest({
                method: 'POST',
                url: ajaxSetNicknameURL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                data: `nickname=${encodeURIComponent(nickname)}&sessionid=${encodeURIComponent(sessionid)}`,
                onload: function (response) {
                    if (response.status >= 200 && response.status < 300) {
                        resolve(response.responseText);
                    } else {
                        reject(new Error(`Request failed: Status ${response.status}, Response: ${response.responseText}`));
                    }
                },
                onerror: function (error) {
                    reject(new Error(`Network error: ${JSON.stringify(error)}`));
                }
            });
        });
    }

    /**
     * Export data to CSV format
     * @param {Array<Object>} data - Array of {steamId, nickname} objects
     * @returns {string} CSV formatted string
     */
    function exportToCsv(data) {
        return data.map(item => `${item.steamId},${item.nickname}`).join('\n');
    }

    /**
     * Parse CSV input
     * @param {string} csvText - Raw CSV text
     * @returns {Object} Object with parsed data and any errors
     */
    function parseCsv(csvText) {
        const lines = csvText.split('\n');
        const parsedData = [];
        let parseErrors = [];

        lines.forEach((line, index) => {
            line = line.trim();
            if (!line) return; // Skip empty lines

            const parts = line.split(',');
            if (parts.length >= 2) {
                const steamId = parts[0].trim();
                // Join remaining parts for nickname in case nickname contains commas
                const nickname = parts.slice(1).join(',').trim();
                parsedData.push({ steamId, nickname });
            } else {
                parseErrors.push(`Line ${index + 1}: ${line}`);
            }
        });

        return {
            data: parsedData,
            errors: parseErrors
        };
    }

    /**
     * Create a button element with common styling
     * @param {string} id - Button ID
     * @param {string} text - Button text
     * @param {string} className - Additional class name
     * @returns {HTMLButtonElement} Button element
     */
    function createButton(id, text, className = 'bsn_blue_button') {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = text;
        button.classList.add('bsn_button', className);
        return button;
    }

    // ====== UI Creation Functions ======

    /**
     * Create a row in the nickname table
     * @param {HTMLTableSectionElement} tbody - Table body element
     * @param {number} rowNum - Row number
     * @param {string} steamId - Steam ID
     * @param {string} nickname - Nickname
     */
    function createTableRow(tbody, rowNum, steamId = '', nickname = '') {
        const row = document.createElement('tr');

        // Row number column
        const rowNumCell = document.createElement('td');
        rowNumCell.id = 'bsn_rowNumCell';
        rowNumCell.textContent = rowNum;

        // Steam ID column
        const steamIdCell = document.createElement('td');
        const steamIdInput = document.createElement('input');
        steamIdInput.className = 'bsn_rowInput';
        steamIdInput.type = 'text';
        steamIdInput.value = steamId;
        steamIdCell.appendChild(steamIdInput);

        // Validate the input on change
        steamIdInput.addEventListener('input', () => {
            if (steamIdInput.value && !isValidSteamId(steamIdInput.value)) {
                steamIdInput.classList.add('invalid');
            } else {
                steamIdInput.classList.remove('invalid');
            }
        });

        // Nickname column
        const nicknameCell = document.createElement('td');
        const nicknameInput = document.createElement('input');
        nicknameInput.className = 'bsn_rowInput';
        nicknameInput.type = 'text';
        nicknameInput.value = nickname;
        nicknameCell.appendChild(nicknameInput);

        // Remove button column
        const removeUserCell = document.createElement('td');
        const removeUserButton = document.createElement('button');
        removeUserButton.id = 'bsn_removeUserButton';
        removeUserButton.textContent = 'X';

        removeUserButton.addEventListener('click', () => {
            tbody.removeChild(row);
            renumberRows(tbody);

            // Update nickname data
            updateNicknameDataFromTable(tbody);
        });

        removeUserCell.appendChild(removeUserButton);

        // Append all cells to the row
        row.appendChild(rowNumCell);
        row.appendChild(steamIdCell);
        row.appendChild(nicknameCell);
        row.appendChild(removeUserCell);

        // Append row to the table body
        tbody.appendChild(row);
    }

    /**
     * Get current nickname data from table
     * @param {HTMLTableSectionElement} tbody - Table body element
     * @returns {Array<Object>} Array of {steamId, nickname} objects
     */
    function updateNicknameDataFromTable(tbody) {
        // Clear existing data
        nicknameData = [];

        // Get all rows from the table
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const steamIdInput = row.cells[1].querySelector('input');
            const nicknameInput = row.cells[2].querySelector('input');

            if (steamIdInput && nicknameInput) {
                nicknameData.push({
                    steamId: steamIdInput.value,
                    nickname: nicknameInput.value
                });
            }
        });

        // Save to GM storage
        GM_setValue('nicknameData', nicknameData);

        return nicknameData;
    }

    /**
     * Create the popup container and contents
     * @returns {HTMLDivElement} Popup container element
     */
    function createSteamTablePopup() {
        // Create container
        const popupContainer = document.createElement('div');
        popupContainer.id = 'bsn_popupContainer';

        // Create title elements
        const title = document.createElement('h3');
        title.id = 'bsn_titleText';
        title.textContent = UI_TEXT.TITLE;

        const subtitle = document.createElement('p');
        subtitle.id = 'bsn_subtitleText';
        subtitle.textContent = UI_TEXT.SUBTITLE;

        popupContainer.append(title, subtitle);

        // Create nickname prefix input
        const prefixContainer = document.createElement('div');
        prefixContainer.id = 'bsn_prefixContainer';

        const prefixLabel = document.createElement('label');
        prefixLabel.id = 'bsn_prefixLabel';
        prefixLabel.textContent = UI_TEXT.PREFIX_LABEL;

        const prefixInput = document.createElement('input');
        prefixInput.id = 'bsn_prefixInput';
        prefixInput.type = 'text';
        prefixInput.value = GM_getValue('nicknamePrefix', '');

        // Save prefix when it changes
        prefixInput.addEventListener('input', () => {
            GM_setValue('nicknamePrefix', prefixInput.value);
        });

        prefixContainer.append(prefixLabel, prefixInput);
        popupContainer.appendChild(prefixContainer);

        // Create table for nicknames
        const table = document.createElement('table');
        table.id = 'bsn_table';

        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        ['#', 'SteamID', 'Nickname', ''].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);

        // Populate table with data
        nicknameData.forEach((item, index) => {
            createTableRow(tbody, index + 1, item.steamId, item.nickname);
        });

        popupContainer.appendChild(table);

        // Create the Add Row button
        const addRowButton = createButton('bsn_addRowButton', UI_TEXT.ADD_ROW);
        addRowButton.addEventListener('click', () => {
            const rowCount = tbody.rows.length + 1;
            createTableRow(tbody, rowCount);

            // Update the data array
            updateNicknameDataFromTable(tbody);
        });
        popupContainer.appendChild(addRowButton);

        // Add error message container
        const errorMessageContainer = document.createElement('div');
        errorMessageContainer.id = 'bsn_errorMessageContainer';
        popupContainer.appendChild(errorMessageContainer);

        // Create CSV input container
        const csvInputContainer = document.createElement('div');
        csvInputContainer.id = 'bsn_csvInputContainer';

        const csvInputArea = document.createElement('textarea');
        csvInputArea.id = 'bsn_csvInputArea';
        csvInputArea.rows = 1;
        csvInputArea.placeholder = UI_TEXT.CSV_PLACEHOLDER;

        // Auto-resize textarea
        csvInputArea.addEventListener('input', function () {
            const maxHeight = 100;
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, maxHeight) + 'px';
        });

        const csvSubmitButton = createButton('bsn_csvSubmitButton', UI_TEXT.SUBMIT_CSV, 'bsn_green_button');

        csvInputContainer.append(csvInputArea, csvSubmitButton);
        popupContainer.appendChild(csvInputContainer);

        // Create bottom button container
        const bottomButtonContainer = document.createElement('div');
        bottomButtonContainer.id = 'bsn_bottomButtonContainer';

        const applyButton = createButton('bsn_applyButton', UI_TEXT.APPLY, 'bsn_green_button');
        const csvExportButton = createButton('bsn_csvExportButton', UI_TEXT.EXPORT_CSV);
        const closeButton = createButton('bsn_closeButton', UI_TEXT.CLOSE);

        bottomButtonContainer.append(applyButton, csvExportButton, closeButton);
        popupContainer.appendChild(bottomButtonContainer);

        // ====== Event Listeners ======

        // Apply button event listener
        applyButton.addEventListener('click', async () => {
            if (tbody.rows.length < 1) {
                showError('No data to apply');
                return;
            }

            // Update data from table
            updateNicknameDataFromTable(tbody);

            // Validate all Steam IDs
            const invalidRows = [];
            const steamIds = [];

            nicknameData.forEach((item, index) => {
                if (!isValidSteamId(item.steamId)) {
                    invalidRows.push(index + 1);
                }
                steamIds.push(item.steamId);
            });

            if (invalidRows.length > 0) {
                showError(`Invalid SteamIDs in row(s): ${invalidRows.join(', ')}`);
                return;
            }

            // Check for duplicates
            const duplicates = steamIds.filter((id, index) =>
                steamIds.indexOf(id) !== index && id !== '');

            if (duplicates.length > 0) {
                const duplicateRows = [];
                steamIds.forEach((id, index) => {
                    if (duplicates.includes(id)) {
                        duplicateRows.push(index + 1);
                    }
                });

                showError(`Duplicate SteamIDs in row(s): ${duplicateRows.join(', ')}`);
                return;
            }

            // Get session ID
            const sessionID = getSessionID();
            if (!sessionID) {
                showError('Session ID not found. Please reload the page.');
                return;
            }

            // Process each row
            for (let i = 0; i < tbody.rows.length; i++) {
                const row = tbody.rows[i];
                const statusCell = row.cells[3];
                const steamId = nicknameData[i].steamId;
                const nickname = nicknameData[i].nickname;

                // Skip empty Steam IDs
                if (!steamId) continue;

                // Clear cell and show loading indicator
                statusCell.innerHTML = '';
                const statusContainer = document.createElement('div');
                statusContainer.id = 'bsn_statusContainer';

                const spinner = document.createElement('div');
                spinner.className = 'bsn_spinner';
                statusContainer.appendChild(spinner);
                statusCell.appendChild(statusContainer);

                // Set Steam Nickname using AJAX request
                try {
                    const nicknamePrefix = prefixInput.value;
                    const fullNickname = `${nicknamePrefix}${nickname}`;

                    await setSteamNickname(sessionID, steamId, fullNickname);
                    statusContainer.textContent = UI_TEXT.SUCCESS;
                } catch (error) {
                    console.error('Nickname set error:', error);
                    statusContainer.textContent = UI_TEXT.ERROR;
                    statusContainer.title = error.message;
                }

                // Add delay between requests to avoid rate limiting
                if (i < tbody.rows.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
                }
            }
        });

        // CSV Export button event listener
        csvExportButton.addEventListener('click', () => {
            updateNicknameDataFromTable(tbody);
            const csvString = exportToCsv(nicknameData);

            navigator.clipboard.writeText(csvString)
                .then(() => {
                    // Show visual feedback
                    csvExportButton.textContent = 'Copied!';
                    setTimeout(() => {
                        csvExportButton.textContent = UI_TEXT.EXPORT_CSV;
                    }, 2000);
                })
                .catch(err => {
                    showError('Failed to copy: ' + err.message);
                });
        });

        // CSV Submit button event listener
        csvSubmitButton.addEventListener('click', () => {
            const csvText = csvInputArea.value.trim();
            if (!csvText) return;

            const result = parseCsv(csvText);

            if (result.errors.length > 0) {
                showError(`Some lines were invalid and skipped: ${result.errors.length} error(s)`);
                console.error('CSV parse errors:', result.errors);
            }

            if (result.data.length > 0) {
                // Replace existing data
                nicknameData = result.data;
                GM_setValue('nicknameData', nicknameData);

                // Clear and repopulate table
                tbody.innerHTML = '';
                nicknameData.forEach((item, index) => {
                    createTableRow(tbody, index + 1, item.steamId, item.nickname);
                });

                // Clear CSV input area
                csvInputArea.value = '';
                csvInputArea.style.height = 'auto';
            } else if (result.errors.length === 0) {
                showError('No valid data found in CSV input');
            }
        });

        // Close button event listener
        closeButton.addEventListener('click', () => {
            // Save current data before closing
            updateNicknameDataFromTable(tbody);

            // Remove popup
            if (popupContainer.parentNode) {
                popupContainer.parentNode.removeChild(popupContainer);
                popupElement = null;
            }
        });

        // Handle keyboard shortcuts
        popupContainer.addEventListener('keydown', (e) => {
            // Ctrl+Enter to apply changes
            if (e.ctrlKey && e.key === 'Enter') {
                applyButton.click();
                e.preventDefault();
            }

            // Escape to close popup
            if (e.key === 'Escape') {
                closeButton.click();
                e.preventDefault();
            }
        });

        return popupContainer;
    }

    // ====== Main Function ======

    function init() {
        // Create popup button
        const popupButton = createButton('bsn_popupButton', 'Bulk Nickname', 'bsn_green_button');

        // Toggle popup on button click
        popupButton.addEventListener('click', () => {
            if (popupElement && popupElement.parentNode) {
                document.body.removeChild(popupElement);
                popupElement = null;
            } else {
                popupElement = createSteamTablePopup();
                document.body.appendChild(popupElement);
            }
        });

        document.body.appendChild(popupButton);
    }

    // Run initialization
    init();
})();
