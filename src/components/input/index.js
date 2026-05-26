import React from 'react';
import styles from './input.module.scss';
const Input = ({ label, placeholder }) => {
    return (
        <div className={styles.input}>
            <label>
                {label}
            </label>
            <input type='text' placeholder={placeholder} />
        </div>
    );
}

export default Input;
