import React from 'react'
import styles from './lineText.module.scss';
import classNames from 'classnames';
export default function LineText({ text, start }) {
    return (
        <div className={classNames(styles.lineText, start ? styles.start : "")}>
            <button aria-label={text}>
                <div className={styles.dot}></div>
                {text}
            </button>
        </div>
    )
}
