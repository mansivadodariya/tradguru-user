import React from 'react';
import styles from './commonSearch.module.scss';
import SearchIcon from '@/icons/searchIcon';
const CommonSearch = () => {
    return (
        <div className={styles.commonSearch}>
            <input type='text' placeholder='Find something...' />
            <div className={styles.searchIcon}>
                <SearchIcon />
            </div>
        </div>
    );
}

export default CommonSearch;
