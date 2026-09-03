import { useEffect, useRef, useState } from "react";
import Button from "./Button.jsx";

/**
 * 클립보드 복사 버튼.
 *
 * navigator.clipboard 는 https 또는 localhost 에서만 쓸 수 있습니다.
 * IP 주소(http://10.23.131.39:5173)로 접속하면 없기 때문에,
 * 그때는 임시 textarea + execCommand 방식으로 대신 복사합니다.
 */
async function copyToClipboard(text) {
  // 1순위: 표준 API. 다만 문서에 포커스가 없거나 권한이 거부되면 예외가 납니다.
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // 아래 대체 방식으로 넘어갑니다.
    }
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "-1000px";
  document.body.appendChild(area);
  area.select();

  try {
    if (!document.execCommand("copy")) throw new Error("복사할 수 없습니다");
  } finally {
    document.body.removeChild(area);
  }
}

export default function CopyButton({
  text,
  label = "전체 복사",
  hint = "",
  variant = "ghost",
  size = "sm",
}) {
  const [state, setState] = useState("idle"); // idle | done | error
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleClick = async () => {
    clearTimeout(timerRef.current);
    try {
      await copyToClipboard(text ?? "");
      setState("done");
    } catch (err) {
      console.warn("[CopyButton] 복사 실패:", err.message);
      setState("error");
    }
    timerRef.current = setTimeout(() => setState("idle"), 1500);
  };

  const empty = !text;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={empty}
      title={
        empty
          ? `복사할 내용이 없습니다${hint ? ` (${hint})` : ""}`
          : `${hint ? `${hint} · ` : ""}${text.length.toLocaleString()}자 복사`
      }
    >
      {state === "done" ? "복사됨" : state === "error" ? "복사 실패" : label}
    </Button>
  );
}
