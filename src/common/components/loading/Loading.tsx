import styles from "./Loading.module.css";

export default function Loading() {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <span className={styles.srOnly}>Yükleniyor...</span>
    </div>
  );
}
