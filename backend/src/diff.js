// 두 텍스트를 줄 단위 LCS로 비교해서 추가/삭제된 줄 수만 셉니다.
// frontend/src/utils/diff.js 의 computeDiff 와 같은 방식(LCS)이고,
// 여기서는 목록 화면의 +N -M 배지에 필요한 합계만 계산합니다.
export function countLineDiff(oldText = "", newText = "") {
  const a = (oldText ?? "").split("\n");
  const b = (newText ?? "").split("\n");
  const n = a.length;
  const m = b.length;

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let additions = 0;
  let deletions = 0;
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      deletions++;
      i++;
    } else {
      additions++;
      j++;
    }
  }
  deletions += n - i;
  additions += m - j;

  return { additions, deletions };
}
