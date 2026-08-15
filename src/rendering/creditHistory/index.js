'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './creditHistory.module.scss';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/toast';

import { useLanguage } from '@/context/LanguageContext';
import { getBidiProps } from '@/lib/bidi';

function getUserFromStorage() {
    try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

export default function CreditHistory({ embedMode = false }) {
    const router = useRouter();
    const { t } = useLanguage();
    const [userId, setUserId] = useState('');
    const [creditHistory, setCreditHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const user = getUserFromStorage();
        if (!user) {
            router.replace('/login');
            return;
        }
        const id = user.id || user.user_id || '';
        setUserId(id);
    }, []);

    useEffect(() => {
        if (userId) {
            fetchCreditHistory(userId);
        }
    }, [userId]);

    const fetchCreditHistory = async (id) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('credit_history')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setCreditHistory(data || []);
            setCurrentPage(1);
        } catch (err) {
            toast.error(err.message || 'Failed to load credit history.');
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateLike) => {
        const d = dateLike ? new Date(dateLike) : null;
        if (!d || Number.isNaN(d.getTime())) return '';

        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12 || 12;
        hours = String(hours).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
    };

    // Pagination calculations
    const totalPages = Math.ceil(creditHistory.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = creditHistory.slice(indexOfFirstItem, indexOfLastItem);

    return (
        <div className={styles.container}>
            {!embedMode && (
                <div className={styles.header}>
                    <h1>{t('creditHistory.title', 'Credit History')}</h1>
                    <p>{t('creditHistory.subtitle', 'Track your credit usage, deposits, and rewards')}</p>
                </div>
            )}

            <div className={styles.card}>
                <div className={styles.historyHeader}>
                    <h2>{t('creditHistory.transactionHistory', 'Transaction History')}</h2>
                    <p>{t('creditHistory.detailsDesc', 'Details of all your credit transactions')}</p>
                </div>

                {loading ? (
                    <div className={styles.centered}>
                        <div className={styles.spinner} />
                    </div>
                ) : creditHistory.length === 0 ? (
                    <div className={styles.emptyState}>
                        {t('creditHistory.noTransactions', 'No credit transactions found.')}
                    </div>
                ) : (
                    <>
                        <div className={styles.tableWrapper}>
                            <table className={styles.historyTable}>
                                <thead>
                                    <tr>
                                        <th>{t('creditHistory.dateTime', 'Date & Time')}</th>
                                        <th>{t('dashboard.type', 'Type')}</th>
                                        <th>{t('creditHistory.amount', 'Amount')}</th>
                                        <th>{t('creditHistory.description', 'Description')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((item) => (
                                        <tr key={item.id} className={styles.tableRow}>
                                            <td className={styles.dateTimeCell}>
                                                {formatDateTime(item.created_at)}
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${item.transaction_type === 'add' ? styles.badgeAdd : styles.badgeDeduct}`}>
                                                    {item.transaction_type === 'add' ? t('creditHistory.credit', 'Credit') : t('creditHistory.debit', 'Debit')}
                                                </span>
                                            </td>
                                            <td className={`${styles.amountCell} ${item.transaction_type === 'add' ? styles.amountAdd : styles.amountDeduct}`}>
                                                {item.transaction_type === 'add' ? `+${item.amount}` : `-${item.amount}`}
                                            </td>
                                            <td className={styles.descCell}>
                                                {item.description || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    type="button"
                                    className={styles.paginationButton}
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    {t('common.previous', 'Previous')}
                                </button>
                                <span className={styles.paginationInfo}>
                                    {t('common.page', 'Page')} {currentPage} {t('common.of', 'of')} {totalPages}
                                </span>
                                <button
                                    type="button"
                                    className={styles.paginationButton}
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    {t('common.next', 'Next')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
