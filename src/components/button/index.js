"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './button.module.scss';
import classNames from 'classnames';

export default function Button({
    text,
    icon,
    href,
    light,
    outline,
    onClick,
    type = 'button',
    disabled = false,
    fullWidth = false,
}) {
    const className = classNames(
        styles.button,
        light ? styles.light : '',
        outline ? styles.outline : '',
        fullWidth ? styles.fullWidth : ''
    );

    const content = (
        <>
            <span className={styles.btnText}>{text}</span>
            {icon && (
                <div className={styles.icon}>
                    <img src={icon} alt="" />
                </div>
            )}
        </>
    );

    // Plain button for forms — 3D tilt breaks mouse clicks on submit buttons
    if (!href) {
        return (
            <div className={className}>
                <button
                    type={type}
                    disabled={disabled}
                    onClick={onClick}
                >
                    {content}
                </button>
            </div>
        );
    }

    return (
        <div className={className}>
            <Link href={href} className={styles.linkBtn}>
                <motion.span
                    className={styles.motionInner}
                    whileHover={disabled ? {} : { scale: 1.02 }}
                    whileTap={disabled ? {} : { scale: 0.98 }}
                >
                    {content}
                </motion.span>
            </Link>
        </div>
    );
}
