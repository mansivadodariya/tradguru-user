import React from 'react';
import styles from './signup.module.scss';
import Input from '@/components/input';
import Button from '@/components/button';
import ContinueWithGoogle from '@/components/continueWithGoogle';
const LineImage = '/assets/images/line.png';
const AuthIcon = '/assets/icons/auth.svg';
const ArrowIcon = '/assets/icons/arrow.svg';
const Signup = () => {
    return (
        <div className={styles.signuppage}>
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
                            Sign Up
                        </h2>
                        <p>
                            Let’s get you all set up so you can start creating your first onboarding experience.
                        </p>
                    </div>
                    <div className={styles.spacingGrid}>
                        <div className={styles.twoCol}>
                            <Input label='First Name' placeholder=' Your first name' />
                            <Input label='Last Name' placeholder=' Your last name' />
                        </div>
                        <Input label='Email' placeholder=' johnfrans@gmail.com' />
                        <Input label='Password' placeholder=' Enter your password' />
                        <Button text="Sign up" icon={ArrowIcon} />
                    </div>
                    <div className={styles.accountText}>
                        <p>
                            Already have an account?  <a> Log in </a>
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

export default Signup;
