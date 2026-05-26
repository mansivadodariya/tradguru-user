import React from 'react'
import styles from './lineText.module.scss';
export default function LineText({ text }) {
    return (
        <div className={styles.lineText}>
            <button aria-label={text}>
                <div className={styles.dot}></div>
                {text}
            </button>
        </div>
    )
}
