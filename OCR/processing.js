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