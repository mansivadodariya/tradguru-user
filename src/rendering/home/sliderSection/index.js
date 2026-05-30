"use client";
import React from 'react';
import { motion } from 'framer-motion';
import styles from './sliderSection.module.scss';
const MetaIcon = '/assets/icons/Img2.svg';
const EdufinsIcon = '/assets/icons/edufins.svg';
const MatchIcon = '/assets/icons/Img1.svg';
const AsicIcon = '/assets/icons/asic.svg';
const AlgomaticIcon = '/assets/icons/algomatic.svg';

const images = [ EdufinsIcon, MetaIcon , MatchIcon,AlgomaticIcon];
// Duplicate array 4 times to ensure it covers large screens and loops seamlessly
const duplicatedImages = [...images, ...images, ...images, ...images];

export default function SliderSection() {
    return (
        <div className={styles.sliderSection}>
            <div className={styles.sliderWrapper}>
                <motion.div 
                    className={styles.sliderTrack}
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30
                    }}
                >
                    {duplicatedImages.map((img, index) => (
                        <img key={index} src={img} alt={`brand-icon-${index}`} />
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
