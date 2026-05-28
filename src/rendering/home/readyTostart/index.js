import React from 'react'
import styles from './readyTostart.module.scss';
import LineText from '@/components/lineText';
import Button from '@/components/button';
const ArrowIcon = '/assets/icons/arrow.svg';
const RoundImage = '/assets/images/round-vec.svg';


export default function ReadyTostart() {
    return (
        <div className={styles.readyTostart}>
            <div className='container'>
                <div className={styles.box}>
                    <LineText text="Trading Desk" />
                    <div className={styles.title}>
                        <h2>
                            Ready to put an AI in your trading desk?
                        </h2>
                        <p>
                            Verify your MT5, claim 50 credits, and start asking the Guru in under
                            five minutes.
                        </p>
                    </div>
                    <div className={styles.buttonCenter}>
                        <Button icon={ArrowIcon} text="Get Started" />
                    </div>
                       <div className={styles.round}>
                        <img src={RoundImage} alt="RoundImage" />
                    </div>
                </div>
            </div>
        </div>
    )
}
