"use client";
import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import styles from './button.module.scss';
import classNames from 'classnames';

export default function Button({ text, icon, light }) {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <div className={classNames(styles.button, light ? styles.light : "")} style={{ perspective: 1200 }}>
            <motion.button
                ref={ref}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ rotateX, rotateY }}
                whileHover={{
                    scale: 1.05,
                    boxShadow: "0px 15px 30px -5px rgba(11, 86, 219, 0.4)",
                    y: -5
                }}
                whileTap={{
                    scale: 0.95,
                    boxShadow: "0px 5px 15px -5px rgba(11, 86, 219, 0.4)",
                    y: 0
                }}
            >
                {
                    icon && (
                        <div className={styles.icon}>
                            <img src={icon} alt={icon} />
                        </div>
                    )
                }
                {text}
            </motion.button>
        </div>
    );
}
