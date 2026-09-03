// Line-based diff (LCS). Returns a unified view (for a single-version detail
// screen) plus independent left/right views (for side-by-side compare) —
// each line is { no, type: 'add' | 'del' | null, code }.
export function computeDiff(oldText = "", newText = "") {
  const a = (oldText ?? "").split("\n");
  const b = (newText ?? "").split("\n");
  const n = a.length;
  const m = b.length;

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const unified = [];
  const left = [];
  const right = [];
  let i = 0;
  let j = 0;
  let unifiedNo = 1;
  let leftNo = 1;
  let rightNo = 1;

  while (i < n && j < m) {
    if (a[i] === b[j]) {
      unified.push({ no: unifiedNo++, type: null, code: a[i] });
      left.push({ no: leftNo++, type: null, code: a[i] });
      right.push({ no: rightNo++, type: null, code: b[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      unified.push({ no: unifiedNo++, type: "del", code: a[i] });
      left.push({ no: leftNo++, type: "del", code: a[i] });
      i++;
    } else {
      unified.push({ no: unifiedNo++, type: "add", code: b[j] });
      right.push({ no: rightNo++, type: "add", code: b[j] });
      j++;
    }
  }
  while (i < n) {
    unified.push({ no: unifiedNo++, type: "del", code: a[i] });
    left.push({ no: leftNo++, type: "del", code: a[i] });
    i++;
  }
  while (j < m) {
    unified.push({ no: unifiedNo++, type: "add", code: b[j] });
    right.push({ no: rightNo++, type: "add", code: b[j] });
    j++;
  }

  return { unified, left, right };
}
