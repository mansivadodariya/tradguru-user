import React from 'react';
import styles from './login.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
import ContinueWithGoogle from '@/components/continueWithGoogle';
const LineImage = '/assets/images/line.png';
const AuthIcon = '/assets/icons/auth.svg';
const ArrowIcon = '/assets/icons/arrow.svg';

const Login = () => {
    return (
        <div className={styles.loginpage}>
            <div className={styles.box}>
                <div className={styles.layer}></div>
                <div className={styles.lineimage}>
                    <img src={LineImage} alt='LineImage' />
                </div>
                <div className={styles.relative}>
                    <div className={styles.icon}>
                        <img src={AuthIcon} alt='AuthIcon' />
                    </div>
                    <div className={styles.text}>
                        <h2>
                            Log In
                        </h2>
                        <p>
                            Log in your account so you can continue building and editing your onboarding flows.
                        </p>
                    </div>
                    <div className={styles.spacingGrid}>
                        <Input label='Email' placeholder=' johnfrans@gmail.com' />
                        <Input label='Password' placeholder=' Enter your password' />
                        <Button text="Log in" icon={ArrowIcon} />
                    </div>
                    <div className={styles.accountText}>
                        <p>
                            Don’t have an account? <a>  Sign up </a>
                        </p>
                    </div>
                    <div className={styles.orText}>
                        <span>or</span>
                    </div>
                    <ContinueWithGoogle />
                </div>
            </div>
        </div>
    );
}

export default Login;
