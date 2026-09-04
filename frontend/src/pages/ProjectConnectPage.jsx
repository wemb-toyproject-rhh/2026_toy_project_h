import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button.jsx";
import styles from "./ProjectConnectPage.module.css";

export default function ProjectConnectPage() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/");
  };

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <span className={styles.brand}>RHH</span>
        <h1 className={styles.title}>프로젝트 연결</h1>
        <p className={styles.subtitle}>
          레노빗 DB 접속 정보를 입력하면 이력이 자동으로 쌓입니다
        </p>

        <label className={styles.field}>
          <span className={styles.label}>프로젝트 이름</span>
          <input type="text" className={styles.input} placeholder="예: 스마트 관제" />
        </label>

        <div className={styles.divider} />

        <div className={styles.row}>
          <label className={`${styles.field} ${styles.grow}`}>
            <span className={styles.label}>Host</span>
            <input type="text" className={styles.input} placeholder="10.23.131.39" />
          </label>
          <label className={`${styles.field} ${styles.portField}`}>
            <span className={styles.label}>Port</span>
            <input type="text" className={styles.input} placeholder="5434" />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>DB 이름</span>
          <input type="text" className={styles.input} placeholder="hjjo_local" />
        </label>

        <div className={styles.row}>
          <label className={`${styles.field} ${styles.grow}`}>
            <span className={styles.label}>계정</span>
            <input type="text" className={styles.input} placeholder="readonly_user" />
          </label>
          <label className={`${styles.field} ${styles.grow}`}>
            <span className={styles.label}>비밀번호</span>
            <input type="password" className={styles.input} placeholder="••••••••" />
          </label>
        </div>

        <Button type="submit" variant="primary" className={styles.submit}>
          프로젝트 연결
        </Button>
      </form>
    </div>
  );
}
