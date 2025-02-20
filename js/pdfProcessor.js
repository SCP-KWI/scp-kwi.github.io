import { saveImage } from "./imageSaver.js";

export const processPDF = async (pdfFile) => {
  console.log("Starting PDF processing...");
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  console.log(`Number of pages: ${pdf.numPages}`);

  const cmToPoints = (cm) => cm * 35;

  const mugshotWidth = cmToPoints(2.5);
  const mugshotHeight = cmToPoints(3.95);
  const topMargin = cmToPoints(3.6);
  const leftMargin = cmToPoints(2.5);
  const rowGap = cmToPoints(1.25);
  const colGaps = [cmToPoints(4), cmToPoints(2.9), cmToPoints(2.9)];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    const pageImage = canvas.toDataURL("image/png");
    console.log(`Page ${i} rendered as image`);

    const textContent = await page.getTextContent();

    const names = extractNames(textContent);

    let stopProcessing = false;

    for (let col = 0; col < 4; col++) {
      for (let row = 0; row < 6; row++) {
        const x =
          leftMargin +
          col * mugshotWidth +
          colGaps.slice(0, col).reduce((a, b) => a + b, 0);
        const y = topMargin + row * mugshotHeight + row * rowGap;

        const mugshotCanvas = document.createElement("canvas");
        const mugshotContext = mugshotCanvas.getContext("2d");
        mugshotCanvas.width = mugshotWidth;
        mugshotCanvas.height = mugshotHeight;

        mugshotContext.drawImage(
          canvas,
          x,
          y,
          mugshotWidth,
          mugshotHeight,
          0,
          0,
          mugshotWidth,
          mugshotHeight
        );

        const imageData = mugshotContext.getImageData(
          0,
          0,
          mugshotWidth,
          mugshotHeight
        );
        const isWhite = isWhiteImage(imageData);

        if (!isWhite) {
          const name = names[col * 6 + row] || `student_${i}_${col}_${row}`;
          const mugshotImage = mugshotCanvas.toDataURL("image/png");
          const imageName = `${name}.png`;
          console.log(`Saving mugshot ${imageName}`);
          saveImage(mugshotImage, imageName);

          // Apply the class to the mugshot image element
          const imgElement = document.createElement('img');
          imgElement.src = mugshotImage;
          imgElement.classList.add('mugshot');
          imgElement.style.display = 'none'; // Ensure mugshots are hidden initially
          document.body.appendChild(imgElement);
        } else {
          console.log(`Skipping white image at col ${col}, row ${row}`);
        }
      }
    }
  }
};

const isWhiteImage = (imageData) => {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
      return false;
    }
  }
  return true;
};

const extractNames = (textContent) => {
  const names = [];
  let currentName = [];
  let startExtracting = false;
  textContent.items.forEach((item) => {
    console.log(item);
    const text = item.str.trim();
    if (text === "Telefon") {
      startExtracting = true;
      return;
    }
    if (startExtracting && text) {
      if (text.includes(" ")) {
        if (currentName.length > 0) {
          names.push(currentName);
          currentName = [];
        }
        currentName.push(text);
      } else {
        if (currentName.length > 0) {
          currentName.push(text);
          names.push(currentName.join(" "));
          currentName = [];
        } else {
          names.push(text);
        }
      }
    }
  });
  if (currentName.length > 0) {
    names.push(currentName.join(" "));
  }
  return names;
};
