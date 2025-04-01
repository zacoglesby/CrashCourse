/*********************************************
 * STEP #4: Merged Script 
 * Google Sheets + Animated Intro + Sound Button
 *********************************************/

// ~ GLOBAL DATA ~
let userFlashcards = { 
  user1: [], 
  user2: [], 
  user3: [], 
  user4: [] 
};
let categoryFlashcards = { 
  memoryRecall: [], 
  understandingApplication: [], 
  buildConnections: [], 
  testTakingSkills: [] 
};
let gameConfig = { 
  selectedUser: "", 
  testOption: "", 
  cardCategories: [] 
};

let timer;
let timeRemaining = 120;
let isPaused = false;
let currentCardIndex = 0;

// ~ Google Sheets Info ~
const SHEET_ID = "18jJZl6N17CiQywI1AkBEqeYEzWY8TR2KHlw1saIDk8I";
const API_KEY = "AIzaSyCzvshEHYf6xDBgmuiLH9yNwJERdmYVZXA";

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

// Loads all user flashcards and category flashcards
async function loadAllSheetsData() {
  try {
    let data = await fetchSheetRange(SHEET_ID, "Behavioral Health!A:B", API_KEY);
    userFlashcards.user1 = data.map(row => ({
      term: row[0] || "",
      definition: row[1] || ""
    }));

    data = await fetchSheetRange(SHEET_ID, "Medical Reading!A:B", API_KEY);
    userFlashcards.user2 = data.map(row => ({
      term: row[0] || "",
      definition: row[1] || ""
    }));

    data = await fetchSheetRange(SHEET_ID, "World Health & Disparities!A:B", API_KEY);
    userFlashcards.user3 = data.map(row => ({
      term: row[0] || "",
      definition: row[1] || ""
    }));

    data = await fetchSheetRange(SHEET_ID, "Medical Terminology!A:B", API_KEY);
    userFlashcards.user4 = data.map(row => ({
      term: row[0] || "",
      definition: row[1] || ""
    }));

    // Categories
    data = await fetchSheetRange(SHEET_ID, "Memory & Recall!A:A", API_KEY);
    categoryFlashcards.memoryRecall = data.map(row => row[0] || "");

    data = await fetchSheetRange(SHEET_ID, "Understanding & Application!A:A", API_KEY);
    categoryFlashcards.understandingApplication = data.map(row => row[0] || "");

    data = await fetchSheetRange(SHEET_ID, "Building Connections!A:A", API_KEY);
    categoryFlashcards.buildConnections = data.map(row => row[0] || "");

    data = await fetchSheetRange(SHEET_ID, "Test Taking Skills!A:A", API_KEY);
    categoryFlashcards.testTakingSkills = data.map(row => row[0] || "");

    console.log("All Sheets data loaded successfully!");
  } catch (error) {
    console.error("Error loading Sheets data:", error);
    alert("Unable to load data from Google Sheets. See console for details.");
  }
}

// ~ DOM ELEMENTS ~
const introScreen = document.getElementById("intro-screen");
const soundButton = document.getElementById("sound-button");
const introMusic = document.getElementById("intro-bg-music");
const enterButton = document.getElementById("enter-button");

// Main page
const mainPageContainer = document.getElementById("main-page-container");
const mainPage = document.getElementById("main-page");

// Game page
const gamePageContainer = document.getElementById("game-page-container");
const gamePage = document.getElementById("game-page");

// Buttons
const beginButton = document.getElementById("begin-button");
const goMainPageButton = document.getElementById("go-main-page-button");
const pauseButton = document.getElementById("pause-button");
const resumeButton = document.getElementById("resume-button");
const pauseMainPageButton = document.getElementById("pause-main-page-button");
const nextButton = document.getElementById("next-button");
const finishButton = document.getElementById("finish-button");
const newFlashcardButton = document.getElementById("new-flashcard-button");

// Dropdowns
const selectUserDropdown = document.getElementById("select-user");
const card1Dropdown = document.getElementById("card1-category");
const card2Dropdown = document.getElementById("card2-category");
const card3Dropdown = document.getElementById("card3-category");
const card4Dropdown = document.getElementById("card4-category");

// Game page elements
const square1 = document.getElementById("square1");
const square2 = document.getElementById("square2");
const square3 = document.getElementById("square3");
const square4 = document.getElementById("square4");
const centerSquare = document.getElementById("center-square");
const timerDisplay = document.getElementById("timer-display");

// Pause overlay
const pauseOverlay = document.getElementById("pause-overlay");

// ~ EVENT LISTENERS ~

// Intro Page "Sound" button => just plays introMusic once
soundButton.addEventListener("click", () => {
  introMusic.play().catch(err => console.error("Music play failed:", err));
});

// Enter button => Intro to Main Page
enterButton.addEventListener("click", () => {
  switchScreen(introScreen, mainPageContainer);
});

// Begin button => from Main Page to Game Page
beginButton.addEventListener("click", async () => {
  const selectedUser = selectUserDropdown.value;
  const card1Category = card1Dropdown.value;
  const card2Category = card2Dropdown.value;
  const card3Category = card3Dropdown.value;
  const card4Category = card4Dropdown.value;

  const selectTestOptionDropdown = document.getElementById("select-test-option");
  const selectedTestOption = selectTestOptionDropdown.value;

  // validations
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

  // load data if not loaded
  await loadAllSheetsData();

  gameConfig.selectedUser = selectedUser;
  gameConfig.testOption = selectedTestOption;
  gameConfig.cardCategories = [ card1Category, card2Category, card3Category, card4Category ];

  // Switch to Game Page container
  switchScreen(mainPageContainer, gamePageContainer);
  startGame();
});

// "Main Page" button from Game Page => stop timer, go back
goMainPageButton.addEventListener("click", () => {
  stopTimer();
  switchScreen(gamePageContainer, mainPageContainer);
});

// Pause => show overlay
pauseButton.addEventListener("click", () => {
  isPaused = true;
  pauseOverlay.classList.remove("hidden-screen");
});

// Resume => hide overlay
resumeButton.addEventListener("click", () => {
  isPaused = false;
  pauseOverlay.classList.add("hidden-screen");
});

// Pause overlay => "Main Page" => stop timer
pauseMainPageButton.addEventListener("click", () => {
  stopTimer();
  pauseOverlay.classList.add("hidden-screen");
  switchScreen(gamePageContainer, mainPageContainer);
});

// Next => load next category card (#1-4)
nextButton.addEventListener("click", () => {
  if (currentCardIndex > 3) return;

  const categoryKey = gameConfig.cardCategories[currentCardIndex];
  const questionArr = categoryFlashcards[categoryKey] || [];
  const randomQ = (questionArr.length)
    ? questionArr[Math.floor(Math.random() * questionArr.length)]
    : "No data found for this category";
  setSquareText(currentCardIndex, randomQ);
  currentCardIndex++;
});

// Finish => stop timer
finishButton.addEventListener("click", () => {
  stopTimer();
});

// New Flashcard => reset squares, load new user flashcard
newFlashcardButton.addEventListener("click", () => {
  resetSquares();
  loadCenterFlashcard();

  stopTimer();
  timeRemaining = 120;
  updateTimerDisplay();
  startTimer();
});

// ~ HELPER FUNCTIONS ~
function switchScreen(fromEl, toEl) {
  fromEl.classList.remove("active-screen");
  fromEl.classList.add("hidden-screen");

  toEl.classList.remove("hidden-screen");
  toEl.classList.add("active-screen");
}

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
  else if (index === 1) square2.textContent = text;
  else if (index === 2) square3.textContent = text;
  else if (index === 3) square4.textContent = text;
}

function loadCenterFlashcard() {
  const userKey = gameConfig.selectedUser;
  const userArr = userFlashcards[userKey] || [];
  if (userArr.length === 0) {
    centerSquare.textContent = "No flashcard data found for this user.";
    return;
  }
  const randomIndex = Math.floor(Math.random() * userArr.length);
  const flashcardObj = userArr[randomIndex];
  centerSquare.textContent = (gameConfig.testOption === "terms")
    ? (flashcardObj.term || "No term found")
    : (flashcardObj.definition || "No definition found");
}

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
  timerDisplay.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}


