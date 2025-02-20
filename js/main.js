import { processPDF } from "./pdfProcessor.js";

window.showMainScreen = function () {
  document.getElementById("main-screen").classList.remove("d-none");
  document.getElementById("scan-class-screen").classList.add("d-none");
  document.getElementById("train-class-screen").classList.add("d-none");
  document.getElementById("quiz-screen").classList.add("d-none");
};

window.showScanClassScreen = function () {
  document.getElementById("scan-class-screen").classList.remove("d-none");
  document.getElementById("train-class-screen").classList.add("d-none");
  document.getElementById("quiz-screen").classList.add("d-none");
};

window.showTrainClassScreen = function () {
  document.getElementById("scan-class-screen").classList.add("d-none");
  document.getElementById("train-class-screen").classList.remove("d-none");
  document.getElementById("quiz-screen").classList.add("d-none");
};

window.startQuiz = function () {
  document.getElementById("scan-class-screen").classList.add("d-none");
  document.getElementById("train-class-screen").classList.add("d-none");
  document.getElementById("quiz-screen").classList.remove("d-none");
  loadRandomImage();
};

window.checkAnswer = function () {
  const input = document.getElementById("quiz-input").value.trim();
  const correctName = currentImageName.split(" ")[0]; // Assuming first name is the first word
  const messageElement = document.getElementById("quiz-message");
  const correctNameElement = document.getElementById("correct-name");
  const nextButton = document.getElementById("next-button");
  const okButton = document.getElementById("ok-button");
  const scoreElement = document.getElementById("score");

  console.log(`Input: ${input}, Correct Name: ${correctName}`);

  const distance = levenshteinDistance(
    input.toLowerCase(),
    correctName.toLowerCase()
  );

  if (distance === 0) {
    messageElement.textContent = "Korrekt!";
    messageElement.className = "text-success";
    score++;
    markStudentAsCorrect(currentImageName);
  } else if (distance === 1) {
    const highlightedName = highlightMistakes(input, correctName);
    messageElement.textContent = "Fast";
    messageElement.className = "text-warning";
    correctNameElement.innerHTML = `Correct name: ${highlightedName}`;
    score += 0.5;
    markStudentAsCorrect(currentImageName);
  } else {
    const highlightedName = highlightMistakes(input, correctName);
    messageElement.textContent = "Falsch";
    messageElement.className = "text-danger";
    correctNameElement.innerHTML = `Correct name: ${highlightedName}`;
  }

  scoreElement.textContent = `Score: ${score}`;
  nextButton.classList.remove("d-none");
  okButton.classList.add("d-none");
  nextButton.focus();
};

window.handleKeyPress = function (event) {
  if (event.key === "Enter") {
    const okButton = document.getElementById("ok-button");
    const nextButton = document.getElementById("next-button");
    if (!okButton.classList.contains("d-none")) {
      checkAnswer();
    } else if (!nextButton.classList.contains("d-none")) {
      loadRandomImage();
    }
  }
};

let images = [];
let currentImageName = "";
let score = 0;
let remainingStudents = [];
let lastShownStudent = null;

window.processPDF = async function () {
  const fileInput = document.getElementById("pdf-file");
  if (fileInput.files.length === 0) {
    alert("Bitte wähle ein PDF aus.");
    return;
  }
  const pdfFile = fileInput.files[0];
  await processPDF(pdfFile);
  alert("PDF fertig eingelesen. Quiz startet jetzt.");
  startQuiz(); // Start the quiz immediately after processing the PDF
};

window.loadRandomImage = function () {
  if (remainingStudents.length === 0) {
    showCongratulatoryMessage();
    return;
  }

  let randomIndex;
  let image;
  do {
    randomIndex = Math.floor(Math.random() * remainingStudents.length);
    image = remainingStudents[randomIndex];
  } while (image === lastShownStudent && remainingStudents.length > 1);

  lastShownStudent = image;
  currentImageName = image.name;

  const imageContainer = document.getElementById("quiz-image-container");
  imageContainer.innerHTML = "";
  const imgElement = document.createElement("img");
  imgElement.src = image.src;
  imgElement.alt = image.name;
  imgElement.className = "quiz-image";
  imageContainer.appendChild(imgElement);

  document.getElementById("quiz-input").value = "";
  document.getElementById("quiz-message").textContent = "";
  document.getElementById("correct-name").textContent = "";
  document.getElementById("next-button").classList.add("d-none");
  document.getElementById("ok-button").classList.remove("d-none");
  document.getElementById("quiz-input").focus();
};

function markStudentAsCorrect(name) {
  remainingStudents = remainingStudents.filter(
    (student) => student.name !== name
  );
}

function showCongratulatoryMessage() {
  const quizScreen = document.getElementById("quiz-screen");
  quizScreen.innerHTML = `
        <h2>Das waren alle, toll gemacht!</h2>
        <img src="https://media.tenor.co/images/2a8c16ba3bac31f0e39648de78e14406/raw" alt="Congratulations" class="congrats-gif">
        <button class="btn btn-primary" onclick="restartQuiz()">Nochmal?</button>
    `;
}

window.restartQuiz = function () {
  remainingStudents = [...images];
  const quizScreen = document.getElementById("quiz-screen");
  quizScreen.innerHTML = `
        <h2>Quiz</h2>
        <div id="quiz-image-container"></div>
        <input type="text" id="quiz-input" class="form-control my-2" placeholder="Enter first name" onkeypress="handleKeyPress(event)">
        <button class="btn btn-primary" id="ok-button" onclick="checkAnswer()">Ok</button>
        <p id="quiz-message"></p>
        <p id="correct-name"></p>
        <button class="btn btn-secondary d-none" id="next-button" onclick="loadRandomImage()">Weiter</button>
        <p id="score" class="text-right"></p>
    `;
  startQuiz();
};

function isCorrectAnswer(input, correctName) {
  const distance = levenshteinDistance(
    input.toLowerCase(),
    correctName.toLowerCase()
  );
  return distance <= 1;
}

function highlightMistakes(input, correctName) {
  const inputLower = input.toLowerCase();
  const correctLower = correctName.toLowerCase();
  let highlightedName = "";

  const maxLength = Math.max(inputLower.length, correctLower.length);

  for (let i = 0; i < maxLength; i++) {
    if (inputLower[i] !== correctLower[i]) {
      highlightedName += `<span class="text-danger">${
        correctName[i] || ""
      }</span>`;
    } else {
      highlightedName += correctName[i] || "";
    }
  }

  console.log(`Highlighted Name: ${highlightedName}`);
  return highlightedName;
}

function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }

  console.log(`Levenshtein Distance: ${matrix[b.length][a.length]}`);
  return matrix[b.length][a.length];
}

export function addImageToQuiz(imageDataUrl, fileName) {
  const student = { src: imageDataUrl, name: fileName };
  images.push(student);
  remainingStudents.push(student);
}
