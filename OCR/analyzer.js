// analyzer.js

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

  for (const line of lines) {
    const noSpaceLine = fixSpacing(line);

    // 1. 날짜 탐지
    if (!result.날짜) {
      const dateMatch = noSpaceLine.match(/\d{2,4}[./-]\d{2}[./-]\d{2}/);
      if (dateMatch) {
        result.날짜 = dateMatch[0];
        continue;
      }
    }

    // 2. 총액 탐지 (합계 OCR 오타 변형 포함)
    if (!result.총액 && /(합계|항계|함계|합꼐|함꼐|많게|많계)/.test(noSpaceLine)) {
      const numberMatch = noSpaceLine.match(/\d[\d,.\s]*\d/);
      if (numberMatch) {
        result.총액 = normalizeNumber(numberMatch[0]);
        continue;
      }
    }

    // 3. 물품명 탐지 (숫자 동반 줄, 공백 있는 단어)
    const hasPrice = /[0-9]{2,}/.test(noSpaceLine);
    const hasHangul = /[가-힣]/.test(noSpaceLine);
    if (hasPrice && hasHangul) {
      // 글자만 추출해서 공백 없애기
      const word = fixSpacing(line).replace(/[^가-힣A-Za-z]/g, '');
      if (word.length > 1 && !result.물품.includes(word)) {
        result.물품.push(word);
      }
    }
  }

  return result;
}

export { analyzeReceipt }
