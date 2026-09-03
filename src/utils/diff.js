// 두 텍스트를 줄 단위로 비교해서 DiffBlock 이 그릴 수 있는 형태로 만듭니다.
//   [{ type: null | "add" | "del" | "skip", no, code }]

const MAX_CELLS = 2_000_000; // LCS 계산 상한. 넘으면 통째로 교체된 것으로 처리합니다.

function toLines(value) {
  return String(value ?? "").replace(/\r\n/g, "\n").split("\n");
}

// 공통 접두/접미를 잘라낸 가운데 부분만 LCS 로 비교합니다.
// 대부분의 이력은 몇 줄만 다르기 때문에 이 방식이 훨씬 빠릅니다.
function diffMiddle(a, b, offsetA, offsetB) {
  const m = a.length;
  const n = b.length;

  if (m === 0 && n === 0) return [];

  if (m * n > MAX_CELLS) {
    return [
      ...a.map((code, i) => ({ type: "del", no: offsetA + i + 1, code })),
      ...b.map((code, i) => ({ type: "add", no: offsetB + i + 1, code })),
    ];
  }

  const lcs = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] =
        a[i] === b[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      rows.push({ type: null, no: offsetB + j + 1, code: b[j] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      rows.push({ type: "del", no: offsetA + i + 1, code: a[i] });
      i++;
    } else {
      rows.push({ type: "add", no: offsetB + j + 1, code: b[j] });
      j++;
    }
  }
  while (i < m) rows.push({ type: "del", no: offsetA + i + 1, code: a[i++] });
  while (j < n) rows.push({ type: "add", no: offsetB + j + 1, code: b[j++] });

  return rows;
}

/**
 * @param before 기준 텍스트
 * @param after  비교 대상 텍스트
 * @param context 변경 지점 위아래로 함께 보여줄 줄 수
 */
export function diffLines(before, after, context = 3) {
  const a = toLines(before);
  const b = toLines(after);

  // 앞뒤로 같은 줄은 잘라냅니다.
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;

  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const changed = diffMiddle(
    a.slice(start, endA),
    b.slice(start, endB),
    start,
    start,
  );

  if (changed.length === 0) return [];

  const rows = [];

  // 변경 지점 앞쪽 문맥
  const headFrom = Math.max(0, start - context);
  if (headFrom > 0) rows.push({ type: "skip", no: "", code: "⋮" });
  for (let k = headFrom; k < start; k++) {
    rows.push({ type: null, no: k + 1, code: b[k] });
  }

  rows.push(...changed);

  // 변경 지점 뒤쪽 문맥
  const tailTo = Math.min(b.length, endB + context);
  for (let k = endB; k < tailTo; k++) {
    rows.push({ type: null, no: k + 1, code: b[k] });
  }
  if (tailTo < b.length) rows.push({ type: "skip", no: "", code: "⋮" });

  return rows;
}

/**
 * 통합 diff 결과를 좌/우 두 칸으로 나눕니다.
 * 한쪽에만 있는 줄은 반대편에 빈 줄을 넣어 위아래 위치를 맞춥니다.
 */
export function splitDiff(lines) {
  const left = [];
  const right = [];
  const blank = { type: "empty", no: "", code: "" };

  for (const line of lines) {
    if (line.type === "del") {
      left.push(line);
      right.push(blank);
    } else if (line.type === "add") {
      left.push(blank);
      right.push(line);
    } else {
      left.push(line);
      right.push(line);
    }
  }

  return { left, right };
}

export function countChanges(lines) {
  return lines.reduce(
    (acc, line) => {
      if (line.type === "add") acc.added += 1;
      if (line.type === "del") acc.removed += 1;
      return acc;
    },
    { added: 0, removed: 0 },
  );
}
