/*********************************************
 * STEP #4 (Merged): Fetching Real Data from Google Sheets
 * for Each User and Each Category, with "Test Option" logic
 *********************************************/

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  A) GLOBAL VARIABLES & DATA STORAGE
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Instead of hardcoded placeholder arrays, we'll fetch from Sheets:
let userFlashcards = {
  user1: [], // from "Behavioral Health"
  user2: [], // from "Medical Reading"
  user3: [], // from "World Health & Disparities"
  user4: []  // from "Medical Terminology"
  // (no user5)
};

let categoryFlashcards = {
  memoryRecall: [],             // from "Memory & Recall"
  understandingApplication: [],  // from "Understanding & Application"
  buildConnections: [],          // from "Building Connections"
  testTakingSkills: []           // from "Test Taking Skills"
};

// We'll store the selected user, test option, and categories here:
let gameConfig = {
  selectedUser: "",
  testOption: "",      // "terms" or "definitions"
  cardCategories: []   // e.g. ["memoryRecall", "understandingApplication", ...]
};

// Timer variables
let timer;
let timeRemaining = 120; // 2:00
let isPaused = false;
let currentCardIndex = 0; // which of the squares (#1-4) is next

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  B) GOOGLE SHEETS FETCH HELPERS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// 1) The ID of your sheet:
const SHEET_ID = "18jJZl6N17CiQywI1AkBEqeYEzWY8TR2KHlw1saIDk8I";

// 2) Your API key (replace with your actual key or keep empty if the sheet is truly public)
const API_KEY = "AIzaSyCzvshEHYf6xDBgmuiLH9yNwJERdmYVZXA";

/**
 * Helper to fetch a range from a specific tab in your spreadsheet:
 *  - sheetId: the overall spreadsheet ID
 *  - range: something like "Behavioral Health!A:B"
 *  - apiKey: your Google API key
 */
async function fetchSheetRange(sheetId, range, apiKey) {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}?key=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error("Failed to fetch range:", range, response.status, response.statusText);
    return [];
  }
  const data = await response.json();
  return data.values || [];
}

/**
 * Loads all user flashcards and category flashcards from the correct tabs in the single Sheet.
 * We assume:
 *   - user1 => "Behavioral Health!A:B"
 *   - user2 => "Medical Reading!A:B"
 *   - user3 => "World Health & Disparities!A:B"
 *   - user4 => "Medical Terminology!A:B"
 *
 *   - memoryRecall => "Memory & Recall!A:A"
 *   - understandingApplication => "Understanding & Application!A:A"
 *   - buildConnections => "Building Connections!A:A"
 *   - testTakingSkills => "Test Taking Skills!A:A"
 */
async function loadAllSheetsData() {
  try {
    // ~~~~~ Load each user's flashcards ~~~~~
    // Instead of string "term - definition",
    // store objects { term, definition }

    // user #1: "Behavioral Health"
    let data = await fetchSheetRange(SHEET_ID, "Behavioral Health!A:B", API_KEY);
    userFlashcards.user1 = data.map(row => {
      return {
        term: row[0] || "",
        definition: row[1] || ""
      };
    });

    // user #2: "Medical Reading"
    data = await fetchSheetRange(SHEET_ID, "Medical Reading!A:B", API_KEY);
    userFlashcards.user2 = data.map(row => {
      return {
        term: row[0] || "",
        definition: row[1] || ""
      };
    });

    // user #3: "World Health & Disparities"
    data = await fetchSheetRange(SHEET_ID, "World Health & Disparities!A:B", API_KEY);
    userFlashcards.user3 = data.map(row => {
      return {
        term: row[0] || "",
        definition: row[1] || ""
      };
    });

    // user #4: "Medical Terminology"
    data = await fetchSheetRange(SHEET_ID, "Medical Terminology!A:B", API_KEY);
    userFlashcards.user4 = data.map(row => {
      return {
        term: row[0] || "",
        definition: row[1] || ""
      };
    });

    // ~~~~~ Load each category's flashcards ~~~~~
    // memoryRecall => "Memory & Recall"
    data = await fetchSheetRange(SHEET_ID, "Memory & Recall!A:A", API_KEY);
    categoryFlashcards.memoryRecall = data.map(row => {
      return row[0] || "";
    });

    // understandingApplication => "Understanding & Application"
    data = await fetchSheetRange(SHEET_ID, "Understanding & Application!A:A", API_KEY);
    categoryFlashcards.understandingApplication = data.map(row => {
      return row[0] || "";
    });

    // buildConnections => "Building Connections"
    data = await fetchSheetRange(SHEET_ID, "Building Connections!A:A", API_KEY);
    categoryFlashcards.buildConnections = data.map(row => {
      return row[0] || "";
    });

    // testTakingSkills => "Test Taking Skills"
    data = await fetchSheetRange(SHEET_ID, "Test Taking Skills!A:A", API_KEY);
    categoryFlashcards.testTakingSkills = data.map(row => {
      return row[0] || "";
    });

    console.log("All Sheets data loaded successfully!");
  } catch (error) {
    console.error("Error loading Sheets data:", error);
    alert("Unable to load data from Google Sheets. See console for details.");
  }
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  C) DOM ELEMENTS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// SCREENS
const introScreen = document.getElementById("intro-screen");
const mainPage = document.getElementById("main-page");
const gamePage = document.getElementById("game-page");

// BUTTONS
const enterButton = document.getElementById("enter-button");
const beginButton = document.getElementById("begin-button");
const goMainPageButton = document.getElementById("go-main-page-button");
const pauseButton = document.getElementById("pause-button");
const resumeButton = document.getElementById("resume-button");
const pauseMainPageButton = document.getElementById("pause-main-page-button");
const nextButton = document.getElementById("next-button");
const finishButton = document.getElementById("finish-button");
const newFlashcardButton = document.getElementById("new-flashcard-button");

// DROPDOWNS (Main Page)
const selectUserDropdown = document.getElementById("select-user");
const card1Dropdown = document.getElementById("card1-category");
const card2Dropdown = document.getElementById("card2-category");
const card3Dropdown = document.getElementById("card3-category");
const card4Dropdown = document.getElementById("card4-category");

// We'll look for "select-test-option" in the beginButton listener
// to capture "terms" or "definitions"

// GAME PAGE ELEMENTS
const square1 = document.getElementById("square1");
const square2 = document.getElementById("square2");
const square3 = document.getElementById("square3");
const square4 = document.getElementById("square4");
const centerSquare = document.getElementById("center-square");
const timerDisplay = document.getElementById("timer-display");

// PAUSE OVERLAY
const pauseOverlay = document.getElementById("pause-overlay");

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  D) EVENT LISTENERS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// 1) Enter button -> Intro to Main Page
enterButton.addEventListener("click", () => {
  switchScreen(introScreen, mainPage);
});

// 2) Begin button -> Capture user selections, go to Game Page
beginButton.addEventListener("click", async () => {
  const selectedUser = selectUserDropdown.value;
  const card1Category = card1Dropdown.value;
  const card2Category = card2Dropdown.value;
  const card3Category = card3Dropdown.value;
  const card4Category = card4Dropdown.value;

  // NEW: get the test option (Terms or Definitions) from the dropdown
  const selectTestOptionDropdown = document.getElementById("select-test-option");
  const selectedTestOption = selectTestOptionDropdown.value;

  // Validate user, testOption, and categories
  if (!selectedUser) {
    alert("Please select a user.");
    return;
  }
  if (!selectedTestOption) {
    alert("Please select 'Terms' or 'Definitions'.");
    return;
  }
  if (!card1Category || !card2Category || !card3Category || !card4Category) {
    alert("Please select a category for each card.");
    return;
  }

  // Ensure data is loaded
  await loadAllSheetsData();

  // Store in gameConfig
  gameConfig.selectedUser = selectedUser;
  gameConfig.testOption = selectedTestOption; // "terms" or "definitions"
  gameConfig.cardCategories = [
    card1Category,
    card2Category,
    card3Category,
    card4Category
  ];

  // Go to Game Page
  switchScreen(mainPage, gamePage);
  startGame();
});

// 3) "Main Page" button (bottom-right on Game Page)
goMainPageButton.addEventListener("click", () => {
  stopTimer();
  switchScreen(gamePage, mainPage);
});

// 4) Pause button -> show overlay & pause timer
pauseButton.addEventListener("click", () => {
  isPaused = true;
  pauseOverlay.classList.remove("hidden-screen");
});

// 5) Resume button -> hide overlay & resume timer
resumeButton.addEventListener("click", () => {
  isPaused = false;
  pauseOverlay.classList.add("hidden-screen");
});

// 6) "Main Page" from pause overlay
pauseMainPageButton.addEventListener("click", () => {
  stopTimer();
  pauseOverlay.classList.add("hidden-screen");
  switchScreen(gamePage, mainPage);
});

// 7) Next button -> load the next card in squares #1-4
nextButton.addEventListener("click", () => {
  if (currentCardIndex > 3) {
    // Already loaded all squares. Optionally alert user or do nothing.
    return;
  }

  const categoryKey = gameConfig.cardCategories[currentCardIndex];
  const questionArr = categoryFlashcards[categoryKey] || [];
  if (questionArr.length === 0) {
    setSquareText(currentCardIndex, "No data found for this category");
  } else {
    // pick a random question
    const randomQ = questionArr[Math.floor(Math.random() * questionArr.length)];
    setSquareText(currentCardIndex, randomQ);
  }

  currentCardIndex++;
});

// 8) Finish button -> stop timer
finishButton.addEventListener("click", () => {
  stopTimer();
});

// 9) New Flashcard button -> reset squares, load new user flashcard in center
newFlashcardButton.addEventListener("click", () => {
  resetSquares();
  loadCenterFlashcard();

  // reset timer
  stopTimer();
  timeRemaining = 120;
  updateTimerDisplay();
  startTimer();
});

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  E) HELPER FUNCTIONS
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function switchScreen(fromScreen, toScreen) {
  fromScreen.classList.remove("active-screen");
  fromScreen.classList.add("hidden-screen");
  toScreen.classList.remove("hidden-screen");
  toScreen.classList.add("active-screen");
}

// Start the Game
function startGame() {
  resetSquares();
  timeRemaining = 120;
  updateTimerDisplay();
  startTimer();
  loadCenterFlashcard();
}

function resetSquares() {
  square1.textContent = "Card #1";
  square2.textContent = "Card #2";
  square3.textContent = "Card #3";
  square4.textContent = "Card #4";
  currentCardIndex = 0;
}

function setSquareText(index, text) {
  if (index === 0) square1.textContent = text;
  if (index === 1) square2.textContent = text;
  if (index === 2) square3.textContent = text;
  if (index === 3) square4.textContent = text;
}

// Load a random flashcard in the center square (based on user selection)
function loadCenterFlashcard() {
  const userKey = gameConfig.selectedUser;
  const userArr = userFlashcards[userKey] || [];

  if (userArr.length === 0) {
    centerSquare.textContent = "No flashcard data found for this user.";
    return;
  }

  // pick a random object { term, definition }
  const randomIndex = Math.floor(Math.random() * userArr.length);
  const flashcardObj = userArr[randomIndex];

  // show only "term" or "definition" depending on testOption
  if (gameConfig.testOption === "terms") {
    centerSquare.textContent = flashcardObj.term || "No term found";
  } else {
    centerSquare.textContent = flashcardObj.definition || "No definition found";
  }
}

// Timer logic
function startTimer() {
  isPaused = false;
  timer = setInterval(() => {
    if (!isPaused) {
      timeRemaining--;
      if (timeRemaining <= 0) {
        timeRemaining = 0;
        stopTimer();
      }
      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formatted = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  timerDisplay.textContent = formatted;
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  F) OPTIONAL: LOAD DATA ONCE AT PAGE LOAD
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// If you prefer to load all data at the start (rather than on “Begin” click),
// uncomment the below:
// window.addEventListener("DOMContentLoaded", async () => {
//   await loadAllSheetsData();
//   console.log("Sheets data are ready to go!");
// });
