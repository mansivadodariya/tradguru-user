import React from 'react';
import styles from './commonSearch.module.scss';
import SearchIcon from '@/icons/searchIcon';
const CommonSearch = () => {
    const handleChange = (e) => {
        e.target.value = e.target.value.trimStart();
    };

    return (
        <div className={styles.commonSearch}>
            <input type='text' placeholder='Find something...' onChange={handleChange} />
            <div className={styles.searchIcon}>
                <SearchIcon />
            </div>
        </div>
    );
}

export default CommonSearch;
