import React from 'react';
import styles from './continueWithGoogle.module.scss';
const GoogleIcon = '/assets/icons/google.svg';
const ContinueWithGoogle = () => {
    return (
        <div className={styles.continueWithGoogle}>
            <button>
                <img src={GoogleIcon} alt='GoogleIcon' />
                Continue with google
            </button>
        </div>
    );
}

export default ContinueWithGoogle;
