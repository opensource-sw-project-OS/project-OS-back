// const script = document.createElement('script');
// script.src = 'https://docs.opencv.org/3.4.0/opencv.js';
const upload = document.getElementById('upload');
const preview = document.getElementById('preview');
const result = document.getElementById('result');
const categoryOutput = document.getElementById('categoryOutput');
const extracted = document.getElementById('extracted');

let imageData = null;
let proc_image = null;

upload.addEventListener('change', () => {
  const file = upload.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    imageData = reader.result;
    preview.src = imageData;
    preview.style.display = 'block';
    console.log(imageData);
  };
  reader.readAsDataURL(file);
});



const img_tag = document.querySelector('img');
const canvas= document.getElementById('temp');
const canvasOutput= document.getElementById('processedCanvas');

function imgProc() {
    console.log('cliked..');
    var Module = {
      onRuntimeInitialized() {
        console.log('OpenCV.js is ready.');
      }
    };
    Imgtag2Canvas(preview); // 이미지 태그 canvas 태그로 전환환

    let src = cv.imread(canvas);
    //let src = cv.imread(canvas1);
    let dst = new cv.Mat();
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);

    // sharping - 영역선을 강조하기 위한 필터
    let filter1 = [0,-1,0,-1,5,-1,0,-1,0];
    let filter2 = [-1,-1,-1,-1,9,-1,-1,-1,-1];
    let filter3 = [1,-2,1,-2,5,-2,1,-2,1];
    let kernel = cv.matFromArray(3, 3, cv.CV_32F, filter2);
    //cv.filter2D(dst, dst, cv.CV_8U, kernel);

    // 확장 - 얇은 선을 확장하는데 사용용
    cv.dilate(dst, dst, cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1, 1)));

    // 블러를 이용한 노이즈 필터 
    //cv.bilateralFilter(dst, dsta, 5, 75, 75);  
    cv.medianBlur(dst, dst, 3);
    //cv.GaussianBlur(dst, dst, new cv.Size(3,3), 0);

    // 이진화
    let blockSize = 11;  // 항상 홀수, 11~21 범위 추천
    let C = 3;           // 글씨가 얇으면 C를 낮게, 배경이 복잡하면 C를 높게
    cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, blockSize, C);
    //cv.threshold(dst, dst, 100, 255, cv.THRESH_BINARY);// + cv.THRESH_OTSU); 영역 전체에 threshold를 거므로 오히려 안좋음

    //dst = applyGammaCorrection(dst, 0.7);  // 어두운 영역 밝히기
    //cv.equalizeHist(dst, dst);
    let dsta = new cv.Mat();
    
    cv.imshow(canvasOutput, dst);
    //cv.imshow(canvasOutput, preproc_Image);  // 캔버스에 opencv로 출력력

    dst.delete();
    //preproc_Image.delete();  // 생성 객체 삭제제

    //recognize_image(canvasOutput);
}

// 이미지 전처리 하기 이전 이미지의 해상도 고정 및 canvas로 이미지를 가져오기 위한 작업
function Imgtag2Canvas(ctx) {
    console.log('Imgtag2Canvas..');
    const width = 500;
    const height = 500;

    canvas.width = ctx.width*2;
    canvas.height = ctx.height*2;

    canvas.getContext('2d').drawImage(preview, 0, 0,canvas.width, canvas.height);
}

function applyGammaCorrection(srcMat, gamma) {
  let dst = new cv.Mat();
  srcMat.copyTo(dst);  // dst 초기화

  let rows = dst.rows;
  let cols = dst.cols;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let pixel = srcMat.ucharPtr(y, x)[0];
      let corrected = Math.pow(pixel / 255.0, gamma) * 255.0;
      dst.ucharPtr(y, x)[0] = Math.min(255, Math.max(0, Math.round(corrected)));
    }
  }

  return dst;
}
function fixMisreadDate(originalLine) {
  const raw = originalLine.replace(/\s+/g, '');
  let candidate = raw.replace(/(\d)7(\d)/g, '$1/$2');  // 7 → / 보정만 복사본에서 수행

  // ✅ 1순위: '25/05/08' 형태 (정확히 25로 시작하는 날짜)
  const match25 = candidate.match(/25[./]\d{2}[./]\d{2}/);
  if (match25) return match25[0];

  // ✅ 2순위: 앞에 숫자가 붙은 '0025/05/08' 같은 형태 → '25/05/08' 추출
  const embedded25 = candidate.match(/\d*25[./]\d{2}[./]\d{2}/);
  if (embedded25) {
    const refined = embedded25[0].match(/25[./]\d{2}[./]\d{2}/);
    if (refined) return refined[0];
  }

  // ✅ 3순위: 일반 날짜 포맷은 가장 마지막에 시도
  const normal = candidate.match(/\d{2,4}[./]\d{2}[./]\d{2}/);
  if (normal) return normal[0];

  return null;
}
function fixSpacing(text) {
  return text.replace(/\s+/g, '');
}

function normalizeNumber(text) {
  return parseInt(text.replace(/[^\d]/g, ''), 10);
}

function analyzeReceipt(text) {
  const lines = text.split(/\r?\n/);
  const result = {
    날짜: null,
    총액: null,
    물품: []
  };

  // 1. 날짜 우선 후보 탐색 (거래일시 등 키워드가 포함된 줄 우선)
  for (const line of lines) {
    const hasDateKeyword = /(거래\s*일시|일시|날짜)/i.test(line);
    const fixed = fixMisreadDate(line);
    if (hasDateKeyword && fixed) {
      result.날짜 = fixed;
      break;
    }
  }

  // 2. 날짜가 아직 없다면 기존 방식으로 다시 탐색
  if (!result.날짜) {
    for (const line of lines) {
      const fixed = fixMisreadDate(line);  // ✅ 여기도 fixMisreadDate 사용!
      if (fixed) {
        result.날짜 = fixed;
        break;
      }
    }
  }

  // 3. 총액, 물품 추출
  for (const line of lines) {
    const noSpaceLine = fixSpacing(line);

    // 총액 추출 (단어 일부 포함만 돼도 인정)
    const hasTotalKeyword = /(금액|금맥|합계|항계|함계|합꼐|함꼐|많게|많계|총액|총금액|총금|계)/.test(noSpaceLine);
    if (!result.총액 && hasTotalKeyword) {
      const numberMatch = noSpaceLine.match(/\d[\d,.\s]*\d/);
      if (numberMatch) {
        result.총액 = normalizeNumber(numberMatch[0]);
        continue;
      }
    }

    // 물품명 추출
    const hasPrice = /[0-9]{2,}/.test(noSpaceLine);
    const hasHangul = /[가-힣]/.test(noSpaceLine);
    if (hasPrice && hasHangul) {
      const word = fixSpacing(line).replace(/[^가-힣A-Za-z]/g, '');
      if (word.length > 1 && !result.물품.includes(word)) {
        result.물품.push(word);
      }
    }
  }

  return result;
}

const { createWorker } = Tesseract;

function runOCR() {
    const result = document.getElementById('result');
    const extracted = document.getElementById('extracted');
    
    imgProc();

    Tesseract.recognize(
    canvasOutput,                                      // 추가한 부분
    'kor',	// 한글 인식 설정
    {
        //workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@v5.0.0/dist/worker.min.js',
        langPath: './kor.traineddata',//'https://tessdata.projectnaptha.com/4.0.0/',
        //corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@v5.0.0',
        logger: m => console.log(m)
    }
    ).then(({ data: { text } }) => {
    result.innerText = `📝 OCR 결과:\n\n${text}`;
    let re = analyzeReceipt(text);
    console.log(re);


    // 날짜 정규식 추출 (예: yyyy.mm.dd 또는 yyyy/mm/dd)
    const dateMatch = text.match(/\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2}/);
    const date = dateMatch ? dateMatch[0] : '날짜 미인식';

    // '합계','총액','총합계' 뒤에 나오는 숫자 추출
    const totalMatch = text.match(/(합계|총액|총합계)[^\d]*(₩?\s?\d{1,3}(,\d{3})*(원)?)/);
    const amount = totalMatch ? totalMatch[2] : '금액 미인식';

    extracted.innerText = `날짜: ${date}\n합계 금액: ${amount}`;
    }).catch(err => {
    result.innerText = `❌ 오류 발생: ${err.message}`;
    extracted.innerText = '❌ 추출 실패';
    });
}
